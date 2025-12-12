import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = await prisma.user.findUnique({ where: { email: session.user.email.toLowerCase() }, select: { id: true, role: true, name: true } });
  if (!user) return NextResponse.json({ items: [] });

  // Best-effort queries using tables Assignment, Conversation, Message.
  try {
    if (user.role === "STUDENT") {
      // Find assigned counsellor; if none, auto-assign a random counsellor (best-effort) via SQL
      const aRows = (await prisma.$queryRawUnsafe(
        'SELECT "counsellorId" FROM "Assignment" WHERE "studentId" = $1 LIMIT 1',
        user.id
      )) as Array<{ counsellorId: string }>;
      let counsellorId = aRows?.[0]?.counsellorId;
      if (!counsellorId) {
        const pool = await prisma.user.findMany({ where: { role: "COUNSELLOR" }, select: { id: true } });
        if (pool.length > 0) {
          const pick = pool[Math.floor(Math.random() * pool.length)];
          counsellorId = pick.id;
          try {
            const aid = randomUUID();
            await prisma.$executeRawUnsafe(
              'INSERT INTO "Assignment" ("id","studentId","counsellorId") VALUES ($1,$2,$3) ON CONFLICT ("studentId") DO NOTHING',
              aid,
              user.id,
              counsellorId
            );
          } catch {}
        }
      }
      if (!counsellorId) return NextResponse.json({ items: [] });
      // Ensure conversation exists
      const cRows = (await prisma.$queryRawUnsafe(
        'SELECT "id" FROM "Conversation" WHERE "studentId" = $1 AND "counsellorId" = $2 LIMIT 1',
        user.id,
        counsellorId
      )) as Array<{ id: string }>;
      let conversationId = cRows?.[0]?.id;
      if (!conversationId) {
        try {
          conversationId = randomUUID();
          await prisma.$executeRawUnsafe(
            'INSERT INTO "Conversation" ("id","studentId","counsellorId") VALUES ($1,$2,$3) ON CONFLICT DO NOTHING',
            conversationId,
            user.id,
            counsellorId
          );
        } catch {}
      }
      const counsellor = await prisma.user.findUnique({ where: { id: counsellorId }, select: { id: true, name: true, email: true } });
      const lastRows = (await prisma.$queryRawUnsafe(
        'SELECT "text","createdAt" FROM "Message" WHERE "conversationId" = $1 ORDER BY "createdAt" DESC LIMIT 1',
        conversationId
      )) as Array<{ text: string; createdAt: string }>;
      const last = lastRows?.[0] || null;
      return NextResponse.json({ items: conversationId ? [{ conversationId, peer: counsellor, last }] : [] });
    } else if (user.role === "COUNSELLOR") {
      // List all students assigned to this counsellor with last message preview
      const assigns = (await prisma.$queryRawUnsafe(
        'SELECT "studentId" FROM "Assignment" WHERE "counsellorId" = $1',
        user.id
      )) as Array<{ studentId: string }>;
      const items: any[] = [];
      for (const a of assigns || []) {
        const student = await prisma.user.findUnique({ where: { id: a.studentId }, select: { id: true, name: true, email: true } });
        // Ensure conversation exists
        const cRows = (await prisma.$queryRawUnsafe(
          'SELECT "id" FROM "Conversation" WHERE "studentId" = $1 AND "counsellorId" = $2 LIMIT 1',
          a.studentId,
          user.id
        )) as Array<{ id: string }>;
        let conversationId = cRows?.[0]?.id;
        if (!conversationId) {
          try {
            conversationId = randomUUID();
            await prisma.$executeRawUnsafe(
              'INSERT INTO "Conversation" ("id","studentId","counsellorId") VALUES ($1,$2,$3) ON CONFLICT DO NOTHING',
              conversationId,
              a.studentId,
              user.id
            );
          } catch {}
        }
        const lastRows = (await prisma.$queryRawUnsafe(
          'SELECT "text","createdAt" FROM "Message" WHERE "conversationId" = $1 ORDER BY "createdAt" DESC LIMIT 1',
          conversationId
        )) as Array<{ text: string; createdAt: string }>;
        const last = lastRows?.[0] || null;
        if (conversationId && student) items.push({ conversationId, peer: student, last });
      }
      items.sort((a, b) => (new Date(b.last?.createdAt || 0).getTime() - new Date(a.last?.createdAt || 0).getTime()));
      return NextResponse.json({ items });
    }
    return NextResponse.json({ items: [] });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Chat tables missing" }, { status: 500 });
  }
}
