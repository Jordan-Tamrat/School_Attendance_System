import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";
import { sendAttendanceAlerts, EmailRecipient } from "@/lib/email";
import { getInstructionalDays } from "@/lib/calendar";

export async function POST() {
  const { error, session } = await requireAuth("admin");
  if (error) return error;

  const todayStr = new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD local time
  const today = new Date(`${todayStr}T00:00:00Z`);

  // 1. Ensure it's a school day
  const days = await getInstructionalDays(today, today);
  if (days === 0) {
    return NextResponse.json({ error: "Today is not a valid school day (weekend or holiday)." }, { status: 400 });
  }

  // 2. Prevent double-sending
  const settings = await prisma.schoolSettings.findUnique({ where: { id: "default" } });
  if (settings?.lastAbsenceEmailDate === todayStr) {
    return NextResponse.json({ error: "Absence emails have already been sent today." }, { status: 400 });
  }

  // 3. Find students who have an attendance record today
  const todayRecords = await prisma.attendanceRecord.findMany({
    where: { date: today },
    select: { studentId: true },
  });
  const presentStudentIds = new Set(todayRecords.map((r) => r.studentId));

  // 4. Find all active students who are NOT in today's records
  const absentStudents = await prisma.student.findMany({
    where: {
      isActive: true,
      id: { notIn: Array.from(presentStudentIds) },
      parentEmail: { not: null },
    },
    select: {
      firstName: true,
      lastName: true,
      parentName: true,
      parentEmail: true,
    },
  });

  if (absentStudents.length === 0) {
    return NextResponse.json({ success: true, count: 0, message: "No absences found to notify." });
  }

  // 5. Build email payloads
  const emailsToSend: EmailRecipient[] = absentStudents
    .filter(s => s.parentEmail) // double check
    .map((student) => ({
      parentEmail: student.parentEmail!,
      parentName: student.parentName || "Parent",
      studentName: `${student.firstName} ${student.lastName}`,
      status: "absent",
    }));

  // 6. Update settings immediately to prevent race conditions
  await prisma.schoolSettings.update({
    where: { id: "default" },
    data: { lastAbsenceEmailDate: todayStr },
  });

  // 7. Fire off the background job
  sendAttendanceAlerts(emailsToSend).catch(console.error);

  return NextResponse.json({ success: true, count: emailsToSend.length });
}
