import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";
import { z } from "zod";

const SettingsSchema = z.object({
  schoolName: z.string().min(1),
  schoolCode: z.string().min(1).max(6).toUpperCase().optional(),
  doorOpensTime: z.string().regex(/^\d{2}:\d{2}$/, "Must be HH:mm format"),
  doorClosesTime: z.string().regex(/^\d{2}:\d{2}$/, "Must be HH:mm format"),
  lateThresholdMin: z.coerce.number().int().min(1).max(120),
  academicYearStart: z.string().optional().nullable(),
  academicYearEnd: z.string().optional().nullable(),
});

function deriveSchoolCode(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0].toUpperCase())
    .join("");
}

export async function GET() {
  const { error } = await requireAuth();
  if (error) return error;

  const settings = await prisma.schoolSettings.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      schoolCode: deriveSchoolCode("My School"),
    },
  });

  return NextResponse.json(settings);
}

export async function PUT(req: NextRequest) {
  const { error } = await requireAuth("admin");
  if (error) return error;

  const body = await req.json();
  const parsed = SettingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const schoolCode = parsed.data.schoolCode ?? deriveSchoolCode(parsed.data.schoolName);

  const start = parsed.data.academicYearStart ? new Date(`${parsed.data.academicYearStart}T00:00:00Z`) : null;
  const end = parsed.data.academicYearEnd ? new Date(`${parsed.data.academicYearEnd}T00:00:00Z`) : null;
  
  const updateData = {
    schoolName: parsed.data.schoolName,
    doorOpensTime: parsed.data.doorOpensTime,
    doorClosesTime: parsed.data.doorClosesTime,
    lateThresholdMin: parsed.data.lateThresholdMin,
    schoolCode,
    academicYearStart: start,
    academicYearEnd: end
  };

  const settings = await prisma.schoolSettings.upsert({
    where: { id: "default" },
    update: updateData,
    create: { id: "default", ...updateData },
  });

  return NextResponse.json(settings);
}
