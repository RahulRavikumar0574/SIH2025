import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";

// GET /api/meetings - list current user's meetings
// - If STUDENT: meetings where studentId = me.id
// - If COUNSELLOR: meetings where counsellorId = me.id
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const email = (session.user as any)?.email as string | undefined;
    if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const me = await prisma.user.findUnique({ where: { email: email.toLowerCase() }, select: { id: true, role: true } });
    if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let meetings: any[] = [];
    if ((me as any).role === "COUNSELLOR") {
      meetings = (await prisma.$queryRawUnsafe(
        'SELECT "id","studentId","counsellorId","startTime","endTime","reason","status","createdAt" FROM "Meeting" WHERE "counsellorId" = $1 ORDER BY "startTime" ASC',
        me.id
      )) as any[];
      // Attach student info
      const cache = new Map<string, { id: string; name: string | null; email: string }>();
      for (const m of meetings) {
        const sid = m.studentId as string;
        if (!cache.has(sid)) {
          const stu = await prisma.user.findUnique({ where: { id: sid }, select: { id: true, name: true, email: true } });
          if (stu) cache.set(sid, stu);
        }
        (m as any).student = cache.get(sid) || null;
      }
    } else {
      meetings = (await prisma.$queryRawUnsafe(
        'SELECT "id","studentId","counsellorId","startTime","endTime","reason","status","createdAt" FROM "Meeting" WHERE "studentId" = $1 ORDER BY "startTime" ASC',
        me.id
      )) as any[];
    }
    return NextResponse.json({ meetings: meetings || [] });
  } catch (err: any) {
    console.error("/api/meetings GET error", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST /api/meetings - book a meeting
// body: { slotId, counsellorId, startTime, endTime, reason }
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const email = (session.user as any)?.email as string | undefined;
    if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const me = await prisma.user.findUnique({ where: { email: email.toLowerCase() }, select: { id: true, role: true } });
    if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { slotId, counsellorId, startTime, endTime, reason } = body as {
      slotId?: string;
      counsellorId?: string;
      startTime?: string;
      endTime?: string;
      reason?: string;
    };

    if (!counsellorId || !startTime || !endTime || !reason) {
      return NextResponse.json({ error: "counsellorId, startTime, endTime, reason required" }, { status: 400 });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);
    if (!(start < end)) {
      return NextResponse.json({ error: "Invalid time range" }, { status: 400 });
    }

    // Optional: enforce slot exists and is not booked
    if (slotId) {
      const rows = (await prisma.$queryRawUnsafe(
        'SELECT "id","counsellorId","startTime","endTime" FROM "Availability" WHERE "id" = $1 LIMIT 1',
        slotId
      )) as Array<{ id: string; counsellorId: string; startTime: string; endTime: string }>;
      const slot = rows?.[0];
      if (!slot || slot.counsellorId !== counsellorId) {
        return NextResponse.json({ error: "Invalid slot" }, { status: 400 });
      }
      const s = new Date(slot.startTime);
      const e = new Date(slot.endTime);
      if (s.getTime() !== start.getTime() || e.getTime() !== end.getTime()) {
        return NextResponse.json({ error: "Slot time mismatch" }, { status: 400 });
      }
    }

    // Create meeting and best-effort mark slot booked
    const id = randomUUID();
    await prisma.$executeRawUnsafe(
      'INSERT INTO "Meeting" ("id","studentId","counsellorId","startTime","endTime","reason","status") VALUES ($1,$2,$3,$4,$5,$6,$7)',
      id,
      me.id,
      counsellorId,
      start,
      end,
      reason,
      'PENDING'
    );
    if (slotId) {
      try {
        await prisma.$executeRawUnsafe(
          'UPDATE "Availability" SET "isBooked" = TRUE WHERE "id" = $1',
          slotId
        );
      } catch {}
    }

    const created = (await prisma.$queryRawUnsafe(
      'SELECT "id","studentId","counsellorId","startTime","endTime","reason","status","createdAt" FROM "Meeting" WHERE "id" = $1',
      id
    )) as any[];

    // Stub: generate meeting link and send notifications in background later
    return NextResponse.json({ success: true, meeting: created?.[0] });
  } catch (err: any) {
    console.error("/api/meetings POST error", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

