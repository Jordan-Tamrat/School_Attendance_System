import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";
import { generateQRCode } from "@/lib/qr";
import { z } from "zod";

const StudentSchema = z.object({
  studentNumber: z.string().min(1),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  classId: z.string().uuid(),
  dateOfBirth: z.string().optional(),
  gender: z.string().optional(),
  parentPhone: z.string().optional(),
  parentEmail: z.string().email().optional().or(z.literal("")),
  address: z.string().optional(),
  photoUrl: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const { error, session } = await requireAuth();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const classId = searchParams.get("classId");
  const search = searchParams.get("search");

  const where: Record<string, unknown> = { isActive: true };
  if (classId) where.classId = classId;
  if (search) {
    where.OR = [
      { firstName: { contains: search, mode: "insensitive" } },
      { lastName: { contains: search, mode: "insensitive" } },
      { studentNumber: { contains: search, mode: "insensitive" } },
    ];
  }

  // Teachers only see their assigned class
  if (session!.user.role === "teacher") {
    const teacherClass = await prisma.class.findFirst({
      where: { teacherId: session!.user.id },
    });
    if (!teacherClass) return NextResponse.json([]);
    where.classId = teacherClass.id;
  }

  const students = await prisma.student.findMany({
    where,
    include: { class: true },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });

  return NextResponse.json(students);
}

export async function POST(req: NextRequest) {
  const { error, session } = await requireAuth("admin");
  if (error) return error;

  const body = await req.json();
  const parsed = StudentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;

  const exists = await prisma.student.findUnique({
    where: { studentNumber: data.studentNumber },
  });
  if (exists) {
    return NextResponse.json(
      { error: "Student number already exists" },
      { status: 409 }
    );
  }

  // Generate a temporary ID for QR token, then update
  const tempId = crypto.randomUUID();
  const { qrCodeData, qrCodeImage } = await generateQRCode(tempId);

  const student = await prisma.student.create({
    data: {
      id: tempId,
      studentNumber: data.studentNumber,
      firstName: data.firstName,
      lastName: data.lastName,
      classId: data.classId,
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
      gender: data.gender,
      parentPhone: data.parentPhone,
      parentEmail: data.parentEmail,
      address: data.address,
      qrCodeData,
      qrCodeImage,
      photoUrl: data.photoUrl ?? null,
      createdById: session!.user.id,
    },
    include: { class: true },
  });

  return NextResponse.json(student, { status: 201 });
}
