import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";

interface QueuedRecord {
  id: string;
  qrCodeData: string;
  clientTimestamp: string;
  exceptionType?: string;
  exceptionNotes?: string;
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
      // If this record was already flagged as an exception locally, just log it!
      if (record.exceptionType) {
        await prisma.scanException.create({
          data: {
            qrCodeData: record.qrCodeData,
            scannedById: session!.user.id,
            exceptionType: record.exceptionType,
            notes: record.exceptionNotes || "Logged offline",
          },
        });
        results.synced++;
        continue;
      }

      const student = await prisma.student.findUnique({
        where: { qrCodeData: record.qrCodeData },
      });

      if (!student) {
        await prisma.scanException.create({
          data: { qrCodeData: record.qrCodeData, scannedById: session!.user.id, exceptionType: "unknown_qr", notes: "Caught during offline sync" },
        });
        results.synced++; // Mark as synced so we don't retry forever
        continue;
      }
      
      if (!student.isActive) {
        await prisma.scanException.create({
          data: { qrCodeData: record.qrCodeData, scannedById: session!.user.id, exceptionType: "inactive_student", notes: "Caught during offline sync" },
        });
        results.synced++;
        continue;
      }

      const scanTime = new Date(record.clientTimestamp);
      const dateStr = scanTime.toLocaleDateString("en-CA"); // YYYY-MM-DD local to the scan time
      const date = new Date(`${dateStr}T00:00:00Z`);
      const status = await resolveStatus(scanTime);

      if (status === "early") {
        await prisma.scanException.create({
          data: {
            qrCodeData: record.qrCodeData,
            scannedById: session!.user.id,
            exceptionType: "too_early",
            notes: `Offline scan rejected: Too early at ${scanTime.toLocaleTimeString()}`,
          },
        });
        results.failed++;
        continue;
      }

      const existing = await prisma.attendanceRecord.findUnique({
        where: { studentId_date: { studentId: student.id, date } },
      });

      if (existing) {
        await prisma.scanException.create({
          data: {
            qrCodeData: record.qrCodeData,
            scannedById: session!.user.id,
            exceptionType: "duplicate_scan",
            notes: `Caught during sync: Already marked ${existing.status}`,
          },
        });
        results.synced++; // Successfully logged the exception, don't retry
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
