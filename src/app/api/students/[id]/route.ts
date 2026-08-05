import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";
import { z } from "zod";

const EditSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  classId: z.string().uuid(),
  dateOfBirth: z.string().optional(),
  gender: z.string().optional(),
  parentPhone: z.string()
    .regex(/^\+251[0-9]{9}$/, "Phone must be in Ethiopian format: +251 followed by 9 digits"),
  parentName: z.string().min(1, "Parent Name is required"),
  parentEmail: z.string().email("Invalid email address"),
  address: z.string().optional(),
  photoUrl: z.string().min(1, "Student photo is required"),
  isActive: z.boolean().optional(),
});

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
  const parsed = EditSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const student = await prisma.student.update({
    where: { id },
    data: {
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      classId: parsed.data.classId,
      dateOfBirth: parsed.data.dateOfBirth ? new Date(parsed.data.dateOfBirth) : null,
      gender: parsed.data.gender,
      parentPhone: parsed.data.parentPhone,
      parentName: parsed.data.parentName,
      parentEmail: parsed.data.parentEmail,
      address: parsed.data.address,
      photoUrl: parsed.data.photoUrl,
      isActive: parsed.data.isActive ?? true,
    },
    include: { class: true },
  });

  return NextResponse.json(student);
}
