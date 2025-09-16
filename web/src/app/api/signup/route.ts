import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { z } from "zod";
import { randomUUID } from "crypto";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const schema = z.object({
      name: z.string().min(1, "Name is required").trim(),
      gender: z.enum(["MALE", "FEMALE", "OTHER"], { message: "Gender is required" }),
      instituteName: z.string().min(1, "Institute name is required").trim(),
      degree: z.string().min(1, "Degree is required").trim(),
      rollNo: z.string().min(1, "Roll number is required").trim(),
      age: z.coerce.number().int().min(15, "Age must be at least 15").max(100, "Age must be <= 100"),
      email: z.string().email("Valid email required").transform((e) => e.toLowerCase().trim()),
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
    const { name, gender, instituteName, degree, rollNo, age, email, password } = parsed.data;

    // Gmail-only hint per current spec
    const emailDomain = email.split("@")[1];
    if (!emailDomain || !emailDomain.endsWith("gmail.com")) {
      return NextResponse.json({ error: "Please use your official Gmail address" }, { status: 400 });
    }

    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, { rollNo }] },
    });
    if (existing) {
      return NextResponse.json({ error: "Email or Roll No already in use" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const created = await prisma.user.create({
      data: {
        name,
        rollNo,
        email,
        passwordHash,
        role: "STUDENT",
        gender: gender ?? null,
        instituteName: instituteName ?? null,
        degree: degree ?? null,
        age: typeof age === "number" ? age : null,
      },
      select: { id: true },
    });

    // Best-effort: assign this student to a random counsellor
    try {
      const counsellors = await prisma.user.findMany({ where: { role: "COUNSELLOR" }, select: { id: true } });
      if (counsellors.length > 0) {
        const random = counsellors[Math.floor(Math.random() * counsellors.length)];
        await (prisma as any).assignment?.create?.({
          data: { id: randomUUID(), studentId: created.id, counsellorId: random.id },
        });
      }
    } catch {}

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("/api/signup error", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
