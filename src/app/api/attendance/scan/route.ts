import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";
import { z } from "zod";

const ScanSchema = z.object({
  qrCodeData: z.string().min(1),
  clientTimestamp: z.string().optional(),
});

async function resolveStatus(): Promise<"present" | "late"> {
  const settings = await prisma.schoolSettings.findUnique({ where: { id: "default" } });
  if (!settings) return "present";

  const [startHour, startMin] = settings.schoolStartTime.split(":").map(Number);
  const now = new Date();
  const schoolStart = new Date();
  schoolStart.setHours(startHour, startMin, 0, 0);

  const diffMin = (now.getTime() - schoolStart.getTime()) / 60000;
  return diffMin > settings.lateThresholdMin ? "late" : "present";
}

export async function POST(req: NextRequest) {
  const { error, session } = await requireAuth();
  if (error) return error;

  const body = await req.json();
  const parsed = ScanSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { qrCodeData, clientTimestamp } = parsed.data;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const student = await prisma.student.findUnique({
    where: { qrCodeData },
    include: { class: true },
  });

  if (!student) {
    await prisma.scanException.create({
      data: { qrCodeData, scannedById: session!.user.id, exceptionType: "unknown_qr" },
    });
    return NextResponse.json({ error: "Unknown QR code" }, { status: 404 });
  }

  if (!student.isActive) {
    await prisma.scanException.create({
      data: { qrCodeData, scannedById: session!.user.id, exceptionType: "inactive_student" },
    });
    return NextResponse.json({ error: "Inactive student" }, { status: 400 });
  }

  const existing = await prisma.attendanceRecord.findUnique({
    where: { studentId_date: { studentId: student.id, date: today } },
  });

  if (existing) {
    await prisma.scanException.create({
      data: {
        qrCodeData,
        scannedById: session!.user.id,
        exceptionType: "duplicate_scan",
        notes: `Already marked ${existing.status} at ${existing.checkInTime}`,
      },
    });
    return NextResponse.json(
      { error: "Already scanned today", existing: { status: existing.status, time: existing.checkInTime } },
      { status: 409 }
    );
  }

  const status = await resolveStatus();

  const record = await prisma.attendanceRecord.create({
    data: {
      studentId: student.id,
      classId: student.classId,
      date: today,
      checkInTime: new Date(),
      status,
      entryMethod: "scan",
      recordedById: session!.user.id,
      clientTimestamp: clientTimestamp ? new Date(clientTimestamp) : null,
      syncedAt: clientTimestamp ? new Date() : null,
    },
    include: { student: true },
  });

  return NextResponse.json({
    success: true,
    student: `${record.student.firstName} ${record.student.lastName}`,
    status,
    time: record.checkInTime,
  });
}
