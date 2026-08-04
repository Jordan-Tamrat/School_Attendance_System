import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";

export async function GET() {
  const { error, session } = await requireAuth();
  if (error || session?.user.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const settings = await prisma.schoolSettings.findUnique({ where: { id: "default" } });
  const holidays = await prisma.holiday.findMany({ orderBy: { date: "asc" } });

  return NextResponse.json({
    academicYearStart: settings?.academicYearStart ? settings.academicYearStart.toISOString().split("T")[0] : null,
    academicYearEnd: settings?.academicYearEnd ? settings.academicYearEnd.toISOString().split("T")[0] : null,
    holidays: holidays.map(h => ({
      id: h.id,
      name: h.name,
      date: h.date.toISOString().split("T")[0]
    }))
  });
}

export async function POST(req: NextRequest) {
  const { error, session } = await requireAuth();
  if (error || session?.user.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { academicYearStart, academicYearEnd } = body;

  const start = academicYearStart ? new Date(`${academicYearStart}T00:00:00Z`) : null;
  const end = academicYearEnd ? new Date(`${academicYearEnd}T00:00:00Z`) : null;

  await prisma.schoolSettings.update({
    where: { id: "default" },
    data: {
      academicYearStart: start,
      academicYearEnd: end
    }
  });

  return NextResponse.json({ success: true });
}
