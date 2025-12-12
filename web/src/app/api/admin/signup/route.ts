import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { z } from "zod";
import { randomUUID } from "crypto";

// POST /api/admin/signup
// Bootstrap rule:
// - If there is no ADMIN user in the DB yet, allow creating the first ADMIN without auth.
// - Otherwise, this endpoint should be disabled or protected behind ADMIN auth (not implemented here to keep it simple).
export async function POST(req: Request) {
  try {
    const body = await req.json();

    const schema = z.object({
      name: z.string().min(1, "Name is required"),
      email: z.string().email().transform((e) => e.toLowerCase().trim()),
      password: z.string().min(8, "Password must be at least 8 characters"),
      confirmPassword: z.string().min(8, "Confirm password must be at least 8 characters"),
    }).refine((d) => d.password === d.confirmPassword, {
      message: "Passwords do not match",
      path: ["confirmPassword"],
    });

    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return NextResponse.json({ error: first.message }, { status: 400 });
    }
    const { name, email, password } = parsed.data;

    // Bootstrap: if any ADMIN exists, deny open signup
    const existingAdmin = await prisma.user.findFirst({ where: { role: "ADMIN" }, select: { id: true } });
    if (existingAdmin) {
      return NextResponse.json({ error: "Admin signup disabled. Ask an existing admin to create accounts." }, { status: 403 });
    }

    const existing = await prisma.user.findFirst({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Email already in use" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    // rollNo is required by schema; generate a unique placeholder for admin
    const adminRoll = `ADMIN-${randomUUID().slice(0, 8)}`;
    await prisma.user.create({
      data: {
        name,
        email,
        rollNo: adminRoll,
        passwordHash,
        role: "ADMIN",
      },
    });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Internal Server Error" }, { status: 500 });
  }
}
