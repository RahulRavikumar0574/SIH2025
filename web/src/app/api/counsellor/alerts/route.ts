import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";

// GET /api/counsellor/alerts
// Returns students assigned to this counsellor who currently have a NEGATIVE streak >= 3
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const me = await prisma.user.findUnique({ where: { email: session.user.email.toLowerCase() }, select: { id: true, role: true } });
    if (!me || me.role !== "COUNSELLOR") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    // Find assigned students
    const assigns = (await prisma.$queryRawUnsafe(
      'SELECT "studentId" FROM "Assignment" WHERE "counsellorId" = $1',
      me.id
    )) as Array<{ studentId: string }>;
    const studentIds = assigns.map((a) => a.studentId);
    if (studentIds.length === 0) return NextResponse.json({ items: [] });

    // Best-effort: Prediction table may not exist
    try {
      // Fetch latest predictions per student (limit 50 each)
      const items: Array<{ student: { id: string; name: string | null; email: string }, streak: number; lastAt: string | null }> = [];
      const students = await prisma.user.findMany({ where: { id: { in: studentIds } }, select: { id: true, name: true, email: true } });

      for (const s of students) {
        const rows = (await prisma.$queryRawUnsafe(
          'SELECT "emotion","createdAt" FROM "Prediction" WHERE "studentId" = $1 ORDER BY "createdAt" DESC LIMIT 50',
          s.id
        )) as Array<{ emotion: string; createdAt: string }>;

        // Compute current consecutive NEGATIVE streak (from most recent backwards)
        let streak = 0;
        for (const r of rows) {
          if ((r.emotion || '').toUpperCase() === 'NEGATIVE') streak++; else break;
        }
        const lastAt = rows[0]?.createdAt || null;
        if (streak >= 3) items.push({ student: s, streak, lastAt });
      }

      // Sort by highest streak then most recent
      items.sort((a, b) => (b.streak - a.streak) || (new Date(b.lastAt || 0).getTime() - new Date(a.lastAt || 0).getTime()));
      return NextResponse.json({ items });
    } catch {
      return NextResponse.json({ items: [] });
    }
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Internal Server Error' }, { status: 500 });
  }
}
