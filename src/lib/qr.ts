import QRCode from "qrcode";
import { randomBytes } from "crypto";

export async function generateQRCode(studentId: string): Promise<{
  qrCodeData: string;
  qrCodeImage: string;
}> {
  const token = randomBytes(8).toString("hex");
  const qrCodeData = `STU-${studentId}-${token}`;

  const qrCodeImage = await QRCode.toDataURL(qrCodeData, {
    errorCorrectionLevel: "H",
    width: 300,
    margin: 2,
  });

  return { qrCodeData, qrCodeImage };
}
