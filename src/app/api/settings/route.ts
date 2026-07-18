import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";
import { z } from "zod";

const SettingsSchema = z.object({
  schoolName: z.string().min(1),
  schoolStartTime: z.string().regex(/^\d{2}:\d{2}$/, "Must be HH:mm format"),
  lateThresholdMin: z.coerce.number().int().min(1).max(120),
});

export async function GET() {
  const { error } = await requireAuth();
  if (error) return error;

  const settings = await prisma.schoolSettings.upsert({
    where: { id: "default" },
    update: {},
    create: { id: "default" },
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

  const settings = await prisma.schoolSettings.upsert({
    where: { id: "default" },
    update: parsed.data,
    create: { id: "default", ...parsed.data },
  });

  return NextResponse.json(settings);
}
