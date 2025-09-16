import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";

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
      // Find assigned counsellor; if none, auto-assign a random counsellor (best-effort)
      let assign = await (prisma as any).assignment?.findFirst?.({ where: { studentId: user.id }, select: { counsellorId: true } });
      if (!assign) {
        const pool = await prisma.user.findMany({ where: { role: "COUNSELLOR" }, select: { id: true } });
        if (pool.length > 0) {
          const pick = pool[Math.floor(Math.random() * pool.length)];
          try {
            assign = await (prisma as any).assignment?.create?.({ data: { studentId: user.id, counsellorId: pick.id } });
          } catch {}
        }
      }
      if (!assign) return NextResponse.json({ items: [] });
      let convo = await (prisma as any).conversation?.findFirst?.({ where: { studentId: user.id, counsellorId: assign.counsellorId } });
      if (!convo) {
        try {
          convo = await (prisma as any).conversation?.create?.({ data: { studentId: user.id, counsellorId: assign.counsellorId } });
        } catch {}
      }
      const counsellor = await prisma.user.findUnique({ where: { id: assign.counsellorId }, select: { id: true, name: true, email: true } });
      const last = await (prisma as any).message?.findFirst?.({ where: { conversationId: convo?.id }, orderBy: { createdAt: "desc" }, select: { text: true, createdAt: true } });
      return NextResponse.json({ items: convo ? [{ conversationId: convo.id, peer: counsellor, last }] : [] });
    } else if (user.role === "COUNSELLOR") {
      // List all students assigned to this counsellor with last message preview
      const assigns = await (prisma as any).assignment?.findMany?.({ where: { counsellorId: user.id }, select: { studentId: true } });
      const items: any[] = [];
      for (const a of assigns || []) {
        const student = await prisma.user.findUnique({ where: { id: a.studentId }, select: { id: true, name: true, email: true } });
        let convo = await (prisma as any).conversation?.findFirst?.({ where: { studentId: a.studentId, counsellorId: user.id } });
        if (!convo) {
          try {
            convo = await (prisma as any).conversation?.create?.({ data: { studentId: a.studentId, counsellorId: user.id } });
          } catch {}
        }
        const last = await (prisma as any).message?.findFirst?.({ where: { conversationId: convo?.id }, orderBy: { createdAt: "desc" }, select: { text: true, createdAt: true } });
        if (convo && student) items.push({ conversationId: convo.id, peer: student, last });
      }
      // Sort by last.createdAt desc
      items.sort((a, b) => (new Date(b.last?.createdAt || 0).getTime() - new Date(a.last?.createdAt || 0).getTime()));
      return NextResponse.json({ items });
    }
    return NextResponse.json({ items: [] });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Chat tables missing" }, { status: 500 });
  }
}
