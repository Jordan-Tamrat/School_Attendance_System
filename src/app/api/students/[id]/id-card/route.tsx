import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";
import React from "react";
import { readFile } from "fs/promises";
import { join } from "path";
import {
  renderToBuffer,
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    width: 242,
    height: 153,
    backgroundColor: "#ffffff",
    fontFamily: "Helvetica",
    flexDirection: "column",
  },
  header: {
    backgroundColor: "#0f172a",
    padding: "8 12",
    flexDirection: "row",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#ffffff",
  },
  headerSub: {
    fontSize: 7,
    color: "#94a3b8",
    marginTop: 1,
  },
  body: {
    flex: 1,
    flexDirection: "row",
    padding: "10 12",
    gap: 10,
  },
  photo: {
    width: 52,
    height: 52,
    borderRadius: 6,
    objectFit: "cover",
  },
  photoPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 6,
    backgroundColor: "#eff6ff",
    alignItems: "center",
    justifyContent: "center",
  },
  photoInitials: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: "#1d4ed8",
  },
  info: {
    flex: 1,
    justifyContent: "center",
    gap: 3,
    paddingLeft: 4,
  },
  name: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
  },
  detail: {
    fontSize: 7.5,
    color: "#475569",
    marginTop: 2,
  },
  qrSection: {
    alignItems: "center",
    justifyContent: "center",
  },
  qr: {
    width: 52,
    height: 52,
  },
  footer: {
    backgroundColor: "#1d4ed8",
    padding: "4 12",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerText: {
    fontSize: 6.5,
    color: "#bfdbfe",
  },
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuth();
  if (error) return error;

  const { id } = await params;
  const [student, settings] = await Promise.all([
    prisma.student.findUnique({ where: { id }, include: { class: true } }),
    prisma.schoolSettings.findUnique({ where: { id: "default" } }),
  ]);

  if (!student) {
    return NextResponse.json({ error: "Student not found" }, { status: 404 });
  }

  const schoolName = settings?.schoolName ?? "EduAttend";
  const initials = `${student.firstName[0] ?? ""}${student.lastName[0] ?? ""}`.toUpperCase();

  // Read photo as buffer from disk — avoids HTTP fetch issues in PDF renderer
  let photoBuffer: Buffer | null = null;
  if (student.photoUrl) {
    try {
      const filePath = join(process.cwd(), "public", student.photoUrl);
      photoBuffer = await readFile(filePath);
    } catch {
      photoBuffer = null;
    }
  }

  const qrSrc = student.qrCodeImage ?? null;

  const doc = React.createElement(
    Document,
    null,
    React.createElement(
      Page,
      { size: [242, 153], style: styles.page },
      // Header
      React.createElement(
        View,
        { style: styles.header },
        React.createElement(
          View,
          null,
          React.createElement(Text, { style: styles.headerTitle }, schoolName),
          React.createElement(Text, { style: styles.headerSub }, "Student ID Card")
        )
      ),
      // Body
      React.createElement(
        View,
        { style: styles.body },
        // Photo or initials
        photoBuffer
          ? React.createElement(Image, { src: photoBuffer, style: styles.photo })
          : React.createElement(
              View,
              { style: styles.photoPlaceholder },
              React.createElement(Text, { style: styles.photoInitials }, initials)
            ),
        // Info
        React.createElement(
          View,
          { style: styles.info },
          React.createElement(
            Text,
            { style: styles.name },
            `${student.firstName} ${student.lastName}`
          ),
          React.createElement(Text, { style: styles.detail }, `ID: ${student.studentNumber}`),
          React.createElement(
            Text,
            { style: styles.detail },
            `Grade ${student.class.grade} — Section ${student.class.section}`
          ),
          student.parentPhone
            ? React.createElement(Text, { style: styles.detail }, student.parentPhone)
            : null,
          React.createElement(Text, { style: styles.detail }, student.class.academicYear)
        ),
        // QR
        qrSrc
          ? React.createElement(
              View,
              { style: styles.qrSection },
              React.createElement(Image, { src: qrSrc, style: styles.qr })
            )
          : null
      ),
      // Footer
      React.createElement(
        View,
        { style: styles.footer },
        React.createElement(Text, { style: styles.footerText }, "Authorized School ID"),
        React.createElement(Text, { style: styles.footerText }, "Not transferable")
      )
    )
  );

  const buffer = await renderToBuffer(doc);

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="id-card-${student.studentNumber}.pdf"`,
    },
  });
}
