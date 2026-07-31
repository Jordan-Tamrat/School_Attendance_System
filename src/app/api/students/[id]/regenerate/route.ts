import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";
import { generateQRCode } from "@/lib/qr";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuth("admin");
  if (error) return error;

  const { id } = await params;
  
  const existingStudent = await prisma.student.findUnique({ where: { id } });
  if (!existingStudent) {
    return NextResponse.json({ error: "Student not found" }, { status: 404 });
  }

  // Generate new QR data using the existing student ID as the seed
  const { qrCodeData, qrCodeImage } = await generateQRCode(id);
  
  // Set new expiration (3 years from now)
  const expiresAt = new Date();
  expiresAt.setFullYear(expiresAt.getFullYear() + 3);

  const student = await prisma.student.update({
    where: { id },
    data: {
      qrCodeData,
      qrCodeImage,
      qrExpiresAt: expiresAt,
    },
    include: { class: true },
  });

  return NextResponse.json(student);
}
