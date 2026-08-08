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
  const month = searchParams.get("month");
  const classId = searchParams.get("classId");
  const studentId = searchParams.get("studentId");
  const exportCsv = searchParams.get("export") === "csv";

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


  if (type === "monthly" && month) {
    // month format: "YYYY-MM"
    const startDate = new Date(`${month}-01T00:00:00Z`);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);

    const allStudents = await prisma.student.findMany({
      where: {
        isActive: true,
        ...(scopedClassId ? { classId: scopedClassId } : {}),
      },
      include: { class: true },
    });

    const records = await prisma.attendanceRecord.findMany({
      where: {
        date: { gte: startDate, lt: endDate },
        ...(scopedClassId ? { classId: scopedClassId } : {}),
      },
    });

    if (exportCsv) {
      // Export RAW 60k records for the month
      const headers = ["Student ID", "First Name", "Last Name", "Date", "Check-In Time", "Status", "Method", "Note"];
      const studentMap = new Map(allStudents.map(s => [s.id, s]));
      
      const csvRows = [headers.join(",")];
      for (const r of records) {
        const s = studentMap.get(r.studentId);
        if (!s) continue;
        const formattedDate = new Date(r.date).toISOString().split("T")[0];
        const time = r.checkInTime ? new Date(r.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "";
        const note = r.auditNote || r.permissionNote || "";
        const row = [
          s.studentNumber, s.firstName, s.lastName, formattedDate, time,
          r.status, r.entryMethod, `"${note.replace(/"/g, '""')}"`
        ];
        csvRows.push(row.join(","));
      }
      return new NextResponse(csvRows.join("\n"), {
        headers: { "Content-Type": "text/csv", "Content-Disposition": `attachment; filename="monthly_raw_${month}.csv"` }
      });
    }

    // Otherwise, return AGGREGATED data for the UI
    const studentStats = new Map();
    for (const s of allStudents) {
      studentStats.set(s.id, {
        student: s,
        present: 0, late: 0, permission: 0, absent: 0, total: 0
      });
    }

    for (const r of records) {
      const stat = studentStats.get(r.studentId);
      if (stat) {
        if (r.status === "present") stat.present++;
        else if (r.status === "late") stat.late++;
        else if (r.status === "permission") stat.permission++;
        else if (r.status === "absent") stat.absent++;
        stat.total++;
      }
    }

    const aggregated = Array.from(studentStats.values());
    return NextResponse.json(aggregated);
  }

  return NextResponse.json({ error: "Invalid report type" }, { status: 400 });
}
