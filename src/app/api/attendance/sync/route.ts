import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";

interface QueuedRecord {
  id: string;
  qrCodeData: string;
  clientTimestamp: string;
  status?: string;
  entryMethod?: string;
  auditNote?: string;
}

export async function POST(req: NextRequest) {
  const { error, session } = await requireAuth();
  if (error) return error;

  const { records }: { records: QueuedRecord[] } = await req.json();
  if (!Array.isArray(records) || records.length === 0) {
    return NextResponse.json({ synced: 0 });
  }

  const results = { synced: 0, failed: 0, errors: [] as string[] };

  for (const record of records) {
    try {
      const student = await prisma.student.findUnique({
        where: { qrCodeData: record.qrCodeData },
      });

      if (!student || !student.isActive) {
        results.failed++;
        continue;
      }

      const date = new Date(record.clientTimestamp);
      date.setHours(0, 0, 0, 0);

      await prisma.attendanceRecord.upsert({
        where: { studentId_date: { studentId: student.id, date } },
        update: { syncedAt: new Date() },
        create: {
          studentId: student.id,
          classId: student.classId,
          date,
          checkInTime: new Date(record.clientTimestamp),
          status: "present",
          entryMethod: "scan",
          recordedById: session!.user.id,
          clientTimestamp: new Date(record.clientTimestamp),
          syncedAt: new Date(),
        },
      });

      results.synced++;
    } catch {
      results.failed++;
    }
  }

  return NextResponse.json(results);
}
