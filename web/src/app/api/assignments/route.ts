import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";

// GET /api/assignments
// - If caller is STUDENT: returns their assigned counsellor's basic info
// - If caller is COUNSELLOR: returns list of assigned students' basic info
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const me = await prisma.user.findUnique({ where: { email: session.user.email.toLowerCase() }, select: { id: true, role: true } });
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    if (me.role === "STUDENT") {
      const assign = await (prisma as any).assignment?.findFirst?.({ where: { studentId: me.id }, select: { counsellorId: true } });
      if (!assign) return NextResponse.json({ counsellor: null });
      const counsellor = await prisma.user.findUnique({ where: { id: assign.counsellorId }, select: { id: true, name: true, email: true, rollNo: true, instituteName: true } });
      return NextResponse.json({ counsellor });
    }
    if (me.role === "COUNSELLOR") {
      const assigns = await (prisma as any).assignment?.findMany?.({ where: { counsellorId: me.id }, select: { studentId: true } });
      const students: any[] = [];
      for (const a of assigns || []) {
        const s = await prisma.user.findUnique({ where: { id: a.studentId }, select: { id: true, name: true, email: true, rollNo: true, instituteName: true } });
        if (s) students.push(s);
      }
      return NextResponse.json({ students });
    }
    return NextResponse.json({});
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to load assignments" }, { status: 500 });
  }
}
