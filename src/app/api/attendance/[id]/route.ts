import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";
import { z } from "zod";

const UpdateSchema = z.object({
  status: z.enum(["present", "absent", "late", "excused", "permission"]),
  permissionNote: z.string().optional(),
  auditNote: z.string().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, session } = await requireAuth();
  if (error) return error;

  const { id } = await params;
  const body = await req.json();
  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const record = await prisma.attendanceRecord.update({
    where: { id },
    data: {
      status: parsed.data.status,
      permissionNote: parsed.data.permissionNote,
      auditNote: parsed.data.auditNote,
      recordedById: session!.user.id,
    },
    include: {
      student: { select: { firstName: true, lastName: true } },
    },
  });

  return NextResponse.json(record);
}
