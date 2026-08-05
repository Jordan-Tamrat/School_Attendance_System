import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";
import { getInstructionalDays } from "@/lib/calendar";

export async function GET(req: NextRequest) {
  const { error, session } = await requireAuth();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") ?? "daily";
  const date = searchParams.get("date") ?? new Date().toLocaleDateString("en-CA");
  const classId = searchParams.get("classId");
  const studentId = searchParams.get("studentId");

  const scopedClassId = classId;

  if (type === "daily") {
    const targetDate = new Date(`${date}T00:00:00Z`);

    const records = await prisma.attendanceRecord.findMany({
      where: {
        date: targetDate,
        ...(scopedClassId ? { classId: scopedClassId } : {}),
      },
      include: {
        student: { select: { firstName: true, lastName: true, studentNumber: true } },
        recordedBy: { select: { fullName: true } },
      },
      orderBy: { checkInTime: "asc" },
    });

    return NextResponse.json(records);
  }

  if (type === "absent") {
    const targetDate = new Date(`${date}T00:00:00Z`);

    const presentIds = await prisma.attendanceRecord.findMany({
      where: {
        date: targetDate,
        status: { in: ["present", "late", "permission"] },
        ...(scopedClassId ? { classId: scopedClassId } : {}),
      },
      select: { studentId: true },
    });

    const presentSet = new Set(presentIds.map((r) => r.studentId));

    const allStudents = await prisma.student.findMany({
      where: {
        isActive: true,
        ...(scopedClassId ? { classId: scopedClassId } : {}),
      },
      include: { class: true },
    });

    const absent = allStudents.filter((s) => !presentSet.has(s.id));
    return NextResponse.json(absent);
  }

  if (type === "student" && studentId) {
    const records = await prisma.attendanceRecord.findMany({
      where: { studentId },
      orderBy: { date: "desc" },
      include: {
        recordedBy: { select: { fullName: true } },
      },
    });

    const settings = await prisma.schoolSettings.findUnique({ where: { id: "default" } });
    
    let totalInstructionalDays = 0;
    if (settings?.academicYearStart) {
      const endCalcDate = settings.academicYearEnd && new Date() > settings.academicYearEnd 
        ? settings.academicYearEnd 
        : new Date();
      totalInstructionalDays = await getInstructionalDays(settings.academicYearStart, endCalcDate);
    }

    const present = records.filter(r => r.status === "present").length;
    const late = records.filter(r => r.status === "late").length;
    const permission = records.filter(r => r.status === "permission").length;
    
    const validPresence = present + late + permission;
    const absent = totalInstructionalDays > 0 ? Math.max(0, totalInstructionalDays - validPresence) : 0;
    const rate = totalInstructionalDays > 0 ? Math.round((validPresence / totalInstructionalDays) * 100) : 0;

    return NextResponse.json({
      records,
      stats: { totalInstructionalDays, present, late, permission, absent, rate }
    });
  }



  return NextResponse.json({ error: "Invalid report type" }, { status: 400 });
}
