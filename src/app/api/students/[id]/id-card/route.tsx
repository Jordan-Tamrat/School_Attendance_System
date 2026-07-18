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

function gregorianToEthiopian(gregorianYear: number): number {
  const now = new Date();
  const afterNewYear = now.getMonth() >= 8 && now.getDate() >= 11;
  return gregorianYear - (afterNewYear ? 7 : 8);
}

// Card size: 3.375" x 2.125" at 72dpi = 243 x 153pt — standard CR80 ID card
const W = 243;
const H = 153;

const HEADER_H = 36;
const FOOTER_H = 20;
const BODY_H = H - HEADER_H - FOOTER_H; // 97pt
const PADDING = 10;
const PHOTO_W = 70; // wider photo
const PHOTO_H = BODY_H - PADDING * 2; // full body height minus top/bottom padding

const styles = StyleSheet.create({
  page: {
    width: W,
    height: H,
    backgroundColor: "#ffffff",
    fontFamily: "Helvetica",
    flexDirection: "column",
  },
  header: {
    height: HEADER_H,
    backgroundColor: "#0f172a",
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: "column",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#ffffff",
  },
  headerSub: {
    fontSize: 7,
    color: "#94a3b8",
    marginTop: 2,
  },
  body: {
    height: BODY_H,
    flexDirection: "row",
    paddingHorizontal: PADDING,
    paddingVertical: PADDING,
    gap: 10,
  },
  photo: {
    width: PHOTO_W,
    height: PHOTO_H,
    borderRadius: 6,
  },
  photoPlaceholder: {
    width: PHOTO_W,
    height: PHOTO_H,
    borderRadius: 6,
    backgroundColor: "#eff6ff",
    alignItems: "center",
    justifyContent: "center",
  },
  photoInitials: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: "#1d4ed8",
  },
  info: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "center",
    gap: 4,
  },
  name: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
  },
  detail: {
    fontSize: 8,
    color: "#475569",
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
    height: FOOTER_H,
    backgroundColor: "#1d4ed8",
    paddingHorizontal: 12,
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
  const ethYear = gregorianToEthiopian(new Date().getFullYear());

  // Read photo as buffer from disk
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
      { size: [W, H], style: styles.page },

      // Header
      React.createElement(
        View,
        { style: styles.header },
        React.createElement(Text, { style: styles.headerTitle }, schoolName),
        React.createElement(Text, { style: styles.headerSub }, "Student ID Card")
      ),

      // Body
      React.createElement(
        View,
        { style: styles.body },

        // Photo — full body height
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
          React.createElement(Text, { style: styles.name }, `${student.firstName} ${student.lastName}`),
          React.createElement(Text, { style: styles.detail }, `ID: ${student.studentNumber}`),
          React.createElement(Text, { style: styles.detail }, `Grade ${student.class.grade} \u2014 Section ${student.class.section}`),
          student.parentPhone
            ? React.createElement(Text, { style: styles.detail }, student.parentPhone)
            : null,
          React.createElement(Text, { style: styles.detail }, `${ethYear}`)
        ),

        // QR — same height as photo
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
