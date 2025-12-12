import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";

// GET /api/counsellor/students - list students assigned to this counsellor
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const me = await prisma.user.findUnique({ where: { email: session.user.email.toLowerCase() }, select: { id: true, role: true } });
    if (!me || me.role !== "COUNSELLOR") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const assigns = (await prisma.$queryRawUnsafe(
      'SELECT "studentId" FROM "Assignment" WHERE "counsellorId" = $1',
      me.id
    )) as Array<{ studentId: string }>;

    const ids = assigns.map((a) => a.studentId);
    if (ids.length === 0) return NextResponse.json({ students: [] });

    const students = await prisma.user.findMany({
      where: { id: { in: ids } },
      select: { id: true, name: true, email: true, rollNo: true, instituteName: true },
    });

    return NextResponse.json({ students });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Internal Server Error' }, { status: 500 });
  }
}
