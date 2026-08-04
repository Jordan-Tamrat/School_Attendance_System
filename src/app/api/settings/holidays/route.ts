import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";

export async function GET() {
  const { error, session } = await requireAuth();
  if (error || session?.user.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const holidays = await prisma.holiday.findMany({ orderBy: { date: "asc" } });
  return NextResponse.json(holidays);
}

export async function POST(req: NextRequest) {
  const { error, session } = await requireAuth();
  if (error || session?.user.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, date } = body;

  if (!name || !date) return NextResponse.json({ error: "Missing name or date" }, { status: 400 });

  const checkDate = new Date(`${date}T00:00:00Z`);

  try {
    const holiday = await prisma.holiday.create({
      data: { name, date: checkDate }
    });
    return NextResponse.json(holiday);
  } catch (e) {
    return NextResponse.json({ error: "Date already exists or invalid" }, { status: 400 });
  }
}
