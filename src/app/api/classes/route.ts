import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";
import { z } from "zod";

const ClassSchema = z.object({
  grade: z.string().min(1),
  section: z.string().min(1),
  academicYear: z.string().min(1),
  teacherId: z.string().uuid().optional().nullable(),
});

export async function GET() {
  const { error } = await requireAuth();
  if (error) return error;

  const classes = await prisma.class.findMany({
    include: {
      teacher: { select: { id: true, fullName: true } },
      _count: { select: { students: { where: { isActive: true } } } },
    },
    orderBy: [{ grade: "asc" }, { section: "asc" }],
  });

  return NextResponse.json(classes);
}

export async function POST(req: NextRequest) {
  const { error } = await requireAuth("admin");
  if (error) return error;

  const body = await req.json();
  const parsed = ClassSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { teacherId, ...rest } = parsed.data;

  // A teacher can only be assigned to one class
  if (teacherId) {
    const existing = await prisma.class.findFirst({ where: { teacherId } });
    if (existing) {
      return NextResponse.json(
        { error: "This teacher is already assigned to another class" },
        { status: 409 }
      );
    }
  }

  const cls = await prisma.class.create({
    data: { ...rest, teacherId: teacherId ?? null },
    include: { teacher: { select: { id: true, fullName: true } } },
  });

  return NextResponse.json(cls, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const { error } = await requireAuth("admin");
  if (error) return error;

  const { id } = await req.json();

  const studentCount = await prisma.student.count({ where: { classId: id, isActive: true } });
  if (studentCount > 0) {
    return NextResponse.json(
      { error: `Cannot delete — ${studentCount} active student(s) in this class` },
      { status: 409 }
    );
  }

  await prisma.class.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
