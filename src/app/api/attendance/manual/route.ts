import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";
import { z } from "zod";

const ManualSchema = z.object({
  studentId: z.string().uuid(),
  status: z.enum(["present", "absent", "late", "excused", "permission"]),
  auditNote: z.string().min(5, "Audit note is required for manual entry"),
  permissionNote: z.string().optional(),
  date: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const { error, session } = await requireAuth();
  if (error) return error;

  const body = await req.json();
  const parsed = ManualSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { studentId, status, auditNote, permissionNote, date } = parsed.data;

  const targetDate = date ? new Date(date) : new Date();
  targetDate.setHours(0, 0, 0, 0);

  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student || !student.isActive) {
    return NextResponse.json({ error: "Student not found" }, { status: 404 });
  }

  const record = await prisma.attendanceRecord.upsert({
    where: { studentId_date: { studentId, date: targetDate } },
    update: {
      status,
      entryMethod: "manual",
      recordedById: session!.user.id,
      auditNote,
      permissionNote,
      checkInTime: new Date(),
    },
    create: {
      studentId,
      classId: student.classId,
      date: targetDate,
      checkInTime: new Date(),
      status,
      entryMethod: "manual",
      recordedById: session!.user.id,
      auditNote,
      permissionNote,
    },
    include: { student: true },
  });

  return NextResponse.json(record);
}
