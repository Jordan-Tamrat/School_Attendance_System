import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";
import { generateQRCode } from "@/lib/qr";
import { z } from "zod";

const StudentSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  classId: z.string().uuid(),
  dateOfBirth: z.string().optional(),
  gender: z.string().optional(),
  parentPhone: z.string()
    .regex(/^\+251[0-9]{9}$/, "Phone must be in Ethiopian format: +251 followed by 9 digits"),
  parentEmail: z.string().email("Invalid email address").optional().or(z.literal("")),
  address: z.string().optional(),
  photoUrl: z.string().min(1, "Student photo is required"),
});

const EditSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  classId: z.string().uuid(),
  dateOfBirth: z.string().optional(),
  gender: z.string().optional(),
  parentPhone: z.string()
    .regex(/^\+251[0-9]{9}$/, "Phone must be in Ethiopian format: +251 followed by 9 digits"),
  parentEmail: z.string().email("Invalid email address").optional().or(z.literal("")),
  address: z.string().optional(),
  photoUrl: z.string().min(1, "Student photo is required"),
  isActive: z.boolean().optional(),
});

function gregorianToEthiopian(gregorianYear: number): number {
  // Ethiopian calendar is ~7-8 years behind Gregorian.
  // Exact offset: Ethiopian New Year falls on Sep 11 (or 12 in leap year).
  const now = new Date();
  const afterNewYear = now.getMonth() >= 8 && now.getDate() >= 11; // Sep = month 8 (0-indexed)
  return gregorianYear - (afterNewYear ? 7 : 8);
}

async function generateStudentNumber(): Promise<string> {
  const settings = await prisma.schoolSettings.findUnique({ where: { id: "default" } });
  const code = settings?.schoolCode ?? "SCH";
  const ethYear = gregorianToEthiopian(new Date().getFullYear());

  // Count all students ever registered (sequential across all years)
  const count = await prisma.student.count();
  const seq = String(count + 1).padStart(3, "0");

  return `${code}/${seq}/${ethYear}`;
}

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
  const studentNumber = await generateStudentNumber();

  const tempId = crypto.randomUUID();
  const { qrCodeData, qrCodeImage } = await generateQRCode(tempId);

  const expiresAt = new Date();
  expiresAt.setFullYear(expiresAt.getFullYear() + 3);

  const student = await prisma.student.create({
    data: {
      id: tempId,
      studentNumber,
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
      qrExpiresAt: expiresAt,
      photoUrl: data.photoUrl ?? null,
      createdById: session!.user.id,
    },
    include: { class: true },
  });

  return NextResponse.json(student, { status: 201 });
}
