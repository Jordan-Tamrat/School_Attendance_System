import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";

interface QueuedRecord {
  id: string;
  qrCodeData: string;
  clientTimestamp: string;
}

async function resolveStatus(scanTime: Date): Promise<"present" | "late" | "early"> {
  const settings = await prisma.schoolSettings.findUnique({ where: { id: "default" } });
  if (!settings) return "present";

  const [openHour, openMin] = settings.doorOpensTime.split(":").map(Number);
  const [closeHour, closeMin] = settings.doorClosesTime.split(":").map(Number);
  
  const doorOpens = new Date(scanTime);
  doorOpens.setHours(openHour, openMin, 0, 0);

  const doorCloses = new Date(scanTime);
  doorCloses.setHours(closeHour, closeMin, 0, 0);

  if (scanTime < doorOpens) {
    return "early";
  }

  const diffMin = (scanTime.getTime() - doorCloses.getTime()) / 60000;
  return diffMin > settings.lateThresholdMin ? "late" : "present";
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

      const scanTime = new Date(record.clientTimestamp);
      const dateStr = scanTime.toLocaleDateString("en-CA"); // YYYY-MM-DD local to the scan time
      const date = new Date(`${dateStr}T00:00:00Z`);
      const status = await resolveStatus(scanTime);

      if (status === "early") {
        results.failed++;
        continue;
      }

      await prisma.attendanceRecord.upsert({
        where: { studentId_date: { studentId: student.id, date } },
        update: { syncedAt: new Date() },
        create: {
          studentId: student.id,
          classId: student.classId,
          date,
          checkInTime: scanTime,
          status,
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
