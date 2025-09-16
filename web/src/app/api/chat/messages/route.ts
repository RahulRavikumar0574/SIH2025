import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";

// GET /api/chat/messages?conversationId=...
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const conversationId = searchParams.get("conversationId");
  if (!conversationId) return NextResponse.json({ items: [] });
  try {
    const items = await (prisma as any).message?.findMany?.({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
      select: { id: true, conversationId: true, senderId: true, text: true, createdAt: true },
    });
    return NextResponse.json({ items: items ?? [] });
  } catch (e) {
    return NextResponse.json({ items: [] });
  }
}

// POST { conversationId, text }
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const me = await prisma.user.findUnique({ where: { email: session.user.email.toLowerCase() }, select: { id: true, role: true } });
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { conversationId, text } = body as { conversationId?: string; text?: string };
  if (!conversationId || !text || !text.trim()) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  // Simple access check: user must be either the student or counsellor participant
  try {
    const convo = await (prisma as any).conversation?.findUnique?.({ where: { id: conversationId }, select: { id: true, studentId: true, counsellorId: true } });
    if (!convo) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (convo.studentId !== me.id && convo.counsellorId !== me.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const msg = await (prisma as any).message?.create?.({
      data: { id: randomUUID(), conversationId: convo.id, senderId: me.id, text: text.trim() },
      select: { id: true, conversationId: true, senderId: true, text: true, createdAt: true },
    });
    return NextResponse.json({ message: msg });
  } catch (e) {
    return NextResponse.json({ error: "Failed to send" }, { status: 400 });
  }
}
