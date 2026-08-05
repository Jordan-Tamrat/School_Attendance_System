import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";
import { sendWelcomeEmail } from "@/lib/email";
import bcrypt from "bcryptjs";
import { z } from "zod";

const UserSchema = z.object({
  username: z.string().min(3),
  fullName: z.string().min(2),
  role: z.enum(["admin", "teacher"]),
  email: z.string().email(),
  password: z.string().min(8),
});

export async function GET() {
  const { error } = await requireAuth("admin");
  if (error) return error;

  const users = await prisma.user.findMany({
    select: { id: true, username: true, fullName: true, role: true, email: true, isActive: true, lastLogin: true, createdAt: true },
    orderBy: [{ role: "asc" }, { fullName: "asc" }],
  });

  return NextResponse.json(users);
}

export async function POST(req: NextRequest) {
  const { error } = await requireAuth("admin");
  if (error) return error;

  const body = await req.json();
  const parsed = UserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const exists = await prisma.user.findUnique({ where: { username: parsed.data.username } });
  if (exists) {
    return NextResponse.json({ error: "Username already taken" }, { status: 409 });
  }

  const existsEmail = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existsEmail) {
    return NextResponse.json({ error: "Email already taken" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  const user = await prisma.user.create({
    data: {
      username: parsed.data.username,
      fullName: parsed.data.fullName,
      role: parsed.data.role,
      email: parsed.data.email,
      passwordHash,
    },
    select: { id: true, username: true, fullName: true, role: true, email: true, isActive: true, createdAt: true },
  });

  sendWelcomeEmail(parsed.data.email, parsed.data.fullName, parsed.data.password).catch(console.error);

  return NextResponse.json(user, { status: 201 });
}
