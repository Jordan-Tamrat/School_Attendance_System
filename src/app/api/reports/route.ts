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
    return NextResponse.json(records);
  }



  return NextResponse.json({ error: "Invalid report type" }, { status: 400 });
}
