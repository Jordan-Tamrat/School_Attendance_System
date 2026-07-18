import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  const { error, session } = await requireAuth();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") ?? "daily";
  const date = searchParams.get("date") ?? new Date().toISOString().split("T")[0];
  const classId = searchParams.get("classId");
  const studentId = searchParams.get("studentId");
  const month = searchParams.get("month"); // format: "2024-11"

  // Scope: teachers only see their class
  let scopedClassId = classId;
  if (session!.user.role === "teacher") {
    const teacherClass = await prisma.class.findFirst({
      where: { teacherId: session!.user.id },
    });
    scopedClassId = teacherClass?.id ?? "none";
  }

  if (type === "daily") {
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

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
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    const presentIds = await prisma.attendanceRecord.findMany({
      where: {
        date: targetDate,
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
    return NextResponse.json(records);
  }

  if (type === "monthly" && month) {
    const [year, monthNum] = month.split("-").map(Number);
    const start = new Date(year, monthNum - 1, 1);
    const end = new Date(year, monthNum, 0);

    const records = await prisma.attendanceRecord.findMany({
      where: {
        date: { gte: start, lte: end },
        ...(scopedClassId ? { classId: scopedClassId } : {}),
      },
      include: {
        student: { select: { firstName: true, lastName: true, studentNumber: true } },
      },
      orderBy: [{ date: "asc" }, { student: { lastName: "asc" } }],
    });

    return NextResponse.json(records);
  }

  return NextResponse.json({ error: "Invalid report type" }, { status: 400 });
}
