import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";

// GET /api/availability?counsellorId=...&from=ISO&to=ISO
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const counsellorId = searchParams.get("counsellorId");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    if (!counsellorId) {
      return NextResponse.json({ error: "counsellorId is required" }, { status: 400 });
    }

    const fromDate = from ? new Date(from) : undefined;
    const toDate = to ? new Date(to) : undefined;

    const where: any = { counsellorId, isBooked: false };
    if (fromDate || toDate) {
      where.startTime = {};
      if (fromDate) where.startTime.gte = fromDate;
      if (toDate) where.startTime.lte = toDate;
    }

    const slots = await prisma.availability.findMany({
      where,
      orderBy: { startTime: "asc" },
    });

    return NextResponse.json({ slots });
  } catch (err: any) {
    console.error("/api/availability GET error", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST /api/availability - create or upsert counsellor slots
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (session.user as any)?.id as string | undefined;
    const role = (session.user as any)?.role as string | undefined;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (role !== "COUNSELLOR") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const { slots } = body as { slots?: Array<{ startTime: string; endTime: string }>; };
    if (!Array.isArray(slots) || slots.length === 0) {
      return NextResponse.json({ error: "slots array required" }, { status: 400 });
    }

    // Create slots; simple createMany, no overlap validation for now
    const data = slots.map((s) => ({
      id: randomUUID(),
      counsellorId: userId,
      startTime: new Date(s.startTime),
      endTime: new Date(s.endTime),
    }));

    await prisma.availability.createMany({ data });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("/api/availability POST error", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

