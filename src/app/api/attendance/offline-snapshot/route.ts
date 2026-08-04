import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";

export async function GET() {
  const { error } = await requireAuth();
  if (error) return error;

  const todayStr = new Date().toLocaleDateString("en-CA");
  const today = new Date(`${todayStr}T00:00:00Z`);

  try {
    const settings = await prisma.schoolSettings.findUnique({ where: { id: "default" } });
    
    // Fetch all students
    const students = await prisma.student.findMany({
      select: {
        id: true,
        qrCodeData: true,
        firstName: true,
        lastName: true,
        isActive: true,
        qrExpiresAt: true,
      }
    });

    // Fetch today's attendance records to flag duplicates
    const todayRecords = await prisma.attendanceRecord.findMany({
      where: { date: today },
      select: { studentId: true, status: true }
    });

    const scannedStudentIds = new Set(todayRecords.map(r => r.studentId));

    const roster = students.map(s => ({
      qrCodeData: s.qrCodeData,
      name: `${s.firstName} ${s.lastName}`,
      isActive: s.isActive,
      qrExpiresAt: s.qrExpiresAt.toISOString(),
      hasScannedToday: scannedStudentIds.has(s.id),
    }));

    return NextResponse.json({
      settings: {
        doorOpensTime: settings?.doorOpensTime ?? "07:00",
        doorClosesTime: settings?.doorClosesTime ?? "08:00",
        lateThresholdMin: settings?.lateThresholdMin ?? 15,
      },
      roster,
    });
  } catch (err) {
    console.error("Failed to generate offline snapshot:", err);
    return NextResponse.json({ error: "Failed to generate snapshot" }, { status: 500 });
  }
}
