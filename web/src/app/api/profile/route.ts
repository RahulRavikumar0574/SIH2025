import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // Select only guaranteed columns to avoid runtime errors before migrations
    const user = await prisma.user.findUnique({
      where: { email: session.user.email.toLowerCase() },
      select: {
        id: true,
        name: true,
        rollNo: true,
        email: true,
        // These may exist if migrations are applied; we’ll try to fetch them best-effort below if needed
      },
    });
    // Best-effort: try to read optional fields; ignore errors if columns are missing
    try {
      const opt = await (prisma as any).user.findUnique({
        where: { email: session.user.email.toLowerCase() },
        select: {
          gender: true,
          degree: true,
          instituteName: true,
          age: true,
          emailVerified: true,
          shareReports: true,
          profileImageUrl: true,
          phone: true,
        },
      });
      return NextResponse.json({ user: { ...user, ...(opt || {}) } });
    } catch {
      return NextResponse.json({ user });
    }
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  const { name, gender, degree, instituteName, age, shareReports, profileImageUrl, phone } = body as {
    name?: string;
    gender?: "MALE" | "FEMALE" | "OTHER" | null;
    degree?: string | null;
    instituteName?: string | null;
    age?: number | null;
    shareReports?: boolean | null;
    profileImageUrl?: string | null;
    phone?: string | null;
  };

  try {
    // 1) Always update safe/base fields
    const updated = await prisma.user.update({
      where: { email: session.user.email.toLowerCase() },
      data: {
        name: name ?? undefined,
      },
      select: {
        id: true,
        name: true,
        rollNo: true,
        email: true,
      },
    });

    // 2) Best-effort: try to update optional columns if they exist
    try {
      await (prisma as any).user.update({
        where: { email: session.user.email.toLowerCase() },
        data: {
          gender: (gender as any) ?? undefined,
          degree: degree ?? undefined,
          instituteName: instituteName ?? undefined,
          age: typeof age === "number" ? age : undefined,
          ...(typeof shareReports === "boolean" ? { shareReports } : {}),
          ...(typeof profileImageUrl === "string" ? { profileImageUrl } : {}),
          ...(typeof phone === "string" ? { phone } : {}),
        },
      });
    } catch {}

    // Re-read with best-effort optional fields
    let full = updated as any;
    try {
      const opt = await (prisma as any).user.findUnique({
        where: { email: session.user.email.toLowerCase() },
        select: {
          gender: true,
          degree: true,
          instituteName: true,
          age: true,
          emailVerified: true,
          shareReports: true,
          profileImageUrl: true,
          phone: true,
        },
      });
      full = { ...updated, ...(opt || {}) };
    } catch {}

    // Best-effort activity log (if ActivityLog table exists)
    try {
      await (prisma as any).activityLog?.create?.({
        data: {
          id: randomUUID(),
          userId: updated.id,
          action: "PROFILE_UPDATED",
          details: JSON.stringify({ name, gender, degree, instituteName, age, shareReports, profileImageUrl, phone }),
        },
      });
    } catch {}

    return NextResponse.json({ user: full });
  } catch (e) {
    return NextResponse.json({ error: "Failed to update profile" }, { status: 400 });
  }
}
