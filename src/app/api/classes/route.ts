import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";
import { z } from "zod";

const ClassSchema = z.object({
  grade: z.string().min(1),
  section: z.string().min(1),
  academicYear: z.string().min(1),
});

export async function GET() {
  const { error } = await requireAuth();
  if (error) return error;

  const classes = await prisma.class.findMany({
    include: {
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

  const cls = await prisma.class.create({
    data: parsed.data,
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
