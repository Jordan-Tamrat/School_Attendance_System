import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  const { error } = await requireAuth("admin");
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const resolved = searchParams.get("resolved") === "true";

  const exceptions = await prisma.scanException.findMany({
    where: { resolved },
    include: {
      scannedBy: { select: { fullName: true } },
      resolvedBy: { select: { fullName: true } },
    },
    orderBy: { scanTime: "desc" },
  });

  return NextResponse.json(exceptions);
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
