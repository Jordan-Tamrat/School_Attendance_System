import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";
import { z } from "zod";
import { sendAttendanceAlerts, EmailRecipient } from "@/lib/email";

const UpdateSchema = z.object({
  status: z.enum(["present", "absent", "late", "permission"]),
  permissionNote: z.string().optional(),
  auditNote: z.string().optional(),
}).refine(
  (d) => d.status !== "permission" || (d.permissionNote && d.permissionNote.trim().length > 0),
  { message: "Permission note is required when status is permission", path: ["permissionNote"] }
);

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, session } = await requireAuth("admin");
  if (error) return error;

  const { id } = await params;
  const body = await req.json();
  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const record = await prisma.attendanceRecord.update({
    where: { id },
    data: {
      status: parsed.data.status,
      entryMethod: "manual",
      permissionNote: parsed.data.permissionNote,
      auditNote: parsed.data.auditNote,
      recordedById: session!.user.id,
    },
    include: {
      student: { select: { firstName: true, lastName: true, parentEmail: true, parentName: true } },
    },
  });

  if ((parsed.data.status === "late" || parsed.data.status === "permission") && record.student.parentEmail) {
    const emailsToSend: EmailRecipient[] = [{
      parentEmail: record.student.parentEmail,
      parentName: record.student.parentName || "Parent",
      studentName: `${record.student.firstName} ${record.student.lastName}`,
      status: parsed.data.status,
      time: record.checkInTime ? new Date(record.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined,
      note: parsed.data.permissionNote,
    }];
    sendAttendanceAlerts(emailsToSend).catch(console.error);
  }

  return NextResponse.json(record);
}
