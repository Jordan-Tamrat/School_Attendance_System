import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  const { error } = await requireAuth("admin");
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const resolved = searchParams.get("resolved") === "true";

  // Auto-cleanup: Delete resolved exceptions older than 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  await prisma.scanException.deleteMany({
    where: {
      resolved: true,
      resolvedAt: { lt: sevenDaysAgo },
    },
  });

  const exceptions = await prisma.scanException.findMany({
    where: { resolved },
    include: {
      scannedBy: { select: { fullName: true } },
      resolvedBy: { select: { fullName: true } },
    },
    orderBy: { scanTime: "desc" },
  });

  // Attach student info if the qrCodeData matches a student
  const qrCodes = exceptions.map((e) => e.qrCodeData);
  const students = await prisma.student.findMany({
    where: { qrCodeData: { in: qrCodes } },
    select: { qrCodeData: true, firstName: true, lastName: true, studentNumber: true },
  });
  
  const studentMap = new Map(students.map((s) => [s.qrCodeData, s]));

  const enrichedExceptions = exceptions.map((e) => ({
    ...e,
    student: studentMap.get(e.qrCodeData) || null,
  }));

  return NextResponse.json(enrichedExceptions);
}

export async function PATCH(req: NextRequest) {
  const { error, session } = await requireAuth("admin");
  if (error) return error;

  const body = await req.json();
  const { id, notes } = body;

  const updated = await prisma.scanException.update({
    where: { id },
    data: {
      resolved: true,
      resolvedById: session!.user.id,
      resolvedAt: new Date(),
      notes,
    },
  });

  return NextResponse.json(updated);
}
