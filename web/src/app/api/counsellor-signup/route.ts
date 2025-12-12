import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { z } from "zod";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const schema = z
      .object({
        name: z.string().min(1, "Name is required").trim(),
        gender: z.enum(["MALE", "FEMALE", "OTHER"], {
          message: "Gender is required",
        }),
        instituteName: z.string().min(1, "Institute name is required").trim(),
        email: z
          .string()
          .email("Valid email required")
          .transform((e) => e.toLowerCase().trim()),
        phone: z.string().min(5).max(20),
        employeeId: z.string().min(1, "Employee ID is required").trim(),
        password: z.string().min(8, "Password must be at least 8 characters"),
        confirmPassword: z
          .string()
          .min(8, "Confirm password must be at least 8 characters"),
      })
      .refine((d) => d.password === d.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"],
      });

    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return NextResponse.json({ error: first.message }, { status: 400 });
    }

    const { name, gender, instituteName, email, phone, employeeId, password } =
      parsed.data;

    // Gmail-only per spec
    const emailDomain = email.split("@")[1];
    if (!emailDomain || !emailDomain.endsWith("gmail.com")) {
      return NextResponse.json(
        { error: "Please use your official Gmail address" },
        { status: 400 }
      );
    }

    // Reuse rollNo column to store employeeId (schema requires unique rollNo)
    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, { rollNo: employeeId }] },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Email or Employee ID already in use" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const created = await prisma.user.create({
      data: {
        name,
        rollNo: employeeId,
        email,
        passwordHash,
        role: "COUNSELLOR",
        gender: gender ?? null,
        instituteName: instituteName ?? null,
      },
      select: { id: true },
    });

    // Best-effort: store phone if the column exists in the User table
    try {
      await prisma.$executeRawUnsafe(
        'UPDATE "User" SET "phone" = $1 WHERE id = $2',
        phone,
        created.id
      );
    } catch {
      // ignore if column doesn't exist
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("/api/counsellor-signup error", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
