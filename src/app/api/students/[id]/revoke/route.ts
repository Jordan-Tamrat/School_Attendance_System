import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";
import { z } from "zod";

const RevokeSchema = z.object({
  reason: z.enum(["lost", "left"]),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuth("admin");
  if (error) return error;

  const { id } = await params;
  const body = await req.json();
  const parsed = RevokeSchema.safeParse(body);
  
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { reason } = parsed.data;

  // Set the expiration date to now to immediately invalidate it
  const updateData: any = { qrExpiresAt: new Date() };

  // If the student left the school, we also deactivate them
  if (reason === "left") {
    updateData.isActive = false;
  }

  const student = await prisma.student.update({
    where: { id },
    data: updateData,
    include: { class: true },
  });

  return NextResponse.json(student);
}
