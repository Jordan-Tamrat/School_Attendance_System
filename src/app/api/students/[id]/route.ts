import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuth();
  if (error) return error;

  const { id } = await params;
  const student = await prisma.student.findUnique({
    where: { id },
    include: { class: true },
  });

  if (!student) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(student);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuth("admin");
  if (error) return error;

  const { id } = await params;
  const body = await req.json();

  const student = await prisma.student.update({
    where: { id },
    data: {
      firstName: body.firstName,
      lastName: body.lastName,
      classId: body.classId,
      parentPhone: body.parentPhone,
      parentEmail: body.parentEmail,
      address: body.address,
      isActive: body.isActive,
    },
    include: { class: true },
  });

  return NextResponse.json(student);
}
