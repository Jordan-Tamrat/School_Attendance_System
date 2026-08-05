import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";
import { z } from "zod";

const UpdateMeSchema = z.object({
  email: z.string().email(),
});

export async function GET() {
  const { error, session } = await requireAuth();
  if (error) return error;

  const user = await prisma.user.findUnique({
    where: { id: session!.user.id },
    select: { email: true, username: true, fullName: true, role: true },
  });

  return NextResponse.json(user);
}

export async function PUT(req: NextRequest) {
  const { error, session } = await requireAuth();
  if (error) return error;

  const body = await req.json();
  const parsed = UpdateMeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // Check if email is already taken by someone else
  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existing && existing.id !== session!.user.id) {
    return NextResponse.json({ error: "Email is already in use by another account" }, { status: 409 });
  }

  const updated = await prisma.user.update({
    where: { id: session!.user.id },
    data: { email: parsed.data.email },
    select: { email: true, username: true, fullName: true, role: true },
  });

  return NextResponse.json(updated);
}
