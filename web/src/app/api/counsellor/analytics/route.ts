import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";

// GET /api/counsellor/analytics
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const me = await prisma.user.findUnique({ where: { email: session.user.email.toLowerCase() }, select: { id: true, role: true } });
    if (!me || me.role !== "COUNSELLOR") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    // Get assigned students
    const assigns = (await prisma.$queryRawUnsafe(
      'SELECT "studentId" FROM "Assignment" WHERE "counsellorId" = $1',
      me.id
    )) as Array<{ studentId: string }>;
    const studentIds = assigns.map((a) => a.studentId);
    if (studentIds.length === 0) return NextResponse.json({ summary: { total: 0, NEGATIVE: 0, NEUTRAL: 0, POSITIVE: 0 }, perStudent: [] });

    // Best-effort: Prediction table may not exist
    try {
      const placeholders = studentIds.map((_, i) => `$${i + 1}`).join(",");
      const rows = (await prisma.$queryRawUnsafe(
        `SELECT "studentId","emotion", COUNT(*)::int as cnt, MAX("createdAt") as last
         FROM "Prediction"
         WHERE "studentId" IN (${placeholders})
         GROUP BY "studentId","emotion"`,
        ...studentIds
      )) as Array<{ studentId: string; emotion: string; cnt: number; last: string | null }>;

      const byStudent = new Map<string, { NEGATIVE: number; NEUTRAL: number; POSITIVE: number; lastAt?: string | null }>();
      for (const sid of studentIds) byStudent.set(sid, { NEGATIVE: 0, NEUTRAL: 0, POSITIVE: 0, lastAt: null });
      const summary = { total: 0, NEGATIVE: 0, NEUTRAL: 0, POSITIVE: 0 } as Record<string, number> & { total: number };
      for (const r of rows) {
        const bucket = byStudent.get(r.studentId)!;
        const emo = (r.emotion || '').toUpperCase();
        if (emo in bucket) (bucket as any)[emo] += r.cnt;
        summary.total += r.cnt;
        if (emo in summary) (summary as any)[emo] += r.cnt;
        // Track last timestamp
        if (!bucket.lastAt || (r.last && new Date(r.last) > new Date(bucket.lastAt))) bucket.lastAt = r.last;
      }

      // Attach basic student info
      const students = await prisma.user.findMany({ where: { id: { in: studentIds } }, select: { id: true, name: true, email: true } });
      const perStudent = students.map((s) => ({
        student: s,
        NEGATIVE: byStudent.get(s.id)!.NEGATIVE,
        NEUTRAL: byStudent.get(s.id)!.NEUTRAL,
        POSITIVE: byStudent.get(s.id)!.POSITIVE,
        lastAt: byStudent.get(s.id)!.lastAt || null,
      }));

      return NextResponse.json({ summary, perStudent });
    } catch {
      return NextResponse.json({ summary: { total: 0, NEGATIVE: 0, NEUTRAL: 0, POSITIVE: 0 }, perStudent: [] });
    }
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Internal Server Error' }, { status: 500 });
  }
}
