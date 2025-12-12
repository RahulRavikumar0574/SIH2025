import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";

// POST /api/admin/assign-random
// Assign all unassigned STUDENTs to random COUNSELLORs (best-effort).
export async function POST() {
  // Optional: require ADMIN; comment out if you want to allow local testing without admin
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  if (!session || (role !== "ADMIN" && process.env.NODE_ENV === "production")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const counsellors = await prisma.user.findMany({ where: { role: "COUNSELLOR" }, select: { id: true } });
    if (counsellors.length === 0) return NextResponse.json({ updated: 0, message: "No counsellors found" });

    const students = (await prisma.$queryRawUnsafe(
      'SELECT u."id" FROM "User" u LEFT JOIN "Assignment" a ON a."studentId" = u."id" WHERE u."role" = $1 AND a."studentId" IS NULL',
      "STUDENT"
    )) as Array<{ id: string }>;

    let updated = 0;
    for (const s of students) {
      const pick = counsellors[Math.floor(Math.random() * counsellors.length)];
      try {
        await prisma.$executeRawUnsafe(
          'INSERT INTO "Assignment" ("id","studentId","counsellorId") VALUES ($1,$2,$3) ON CONFLICT ("studentId") DO NOTHING',
          randomUUID(),
          s.id,
          pick.id
        );
        updated++;
      } catch {
        // ignore and continue
      }
    }
    return NextResponse.json({ updated });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to assign" }, { status: 500 });
  }
}
