import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const SENDER_EMAIL = "Attendance Alerts <info@eduattend.tech>";

export interface EmailRecipient {
  parentEmail: string;
  parentName: string;
  studentName: string;
  status: "absent" | "late" | "permission";
  time?: string;
  note?: string;
}

export async function sendAttendanceAlerts(recipients: EmailRecipient[]) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("RESEND_API_KEY is not set. Skipping email alerts.");
    return;
  }

  // Filter out any recipients missing email
  const validRecipients = recipients.filter(r => r.parentEmail);
  if (validRecipients.length === 0) return;

  // Map to Resend batch objects
  const emails = validRecipients.map(r => {
    let subject = "";
    let html = "";

    if (r.status === "absent") {
      subject = `⚠️ Absence Alert: ${r.studentName}`;
      html = `<p>Dear ${r.parentName},</p>
              <p>This is an automated notification. Your child, <strong>${r.studentName}</strong>, was marked <strong>Absent</strong> for today.</p>
              <p>If you believe this is an error, please contact the school administration.</p>`;
    } else if (r.status === "late") {
      subject = `🕒 Late Arrival: ${r.studentName}`;
      html = `<p>Dear ${r.parentName},</p>
              <p>This is to inform you that your child, <strong>${r.studentName}</strong>, arrived <strong>Late</strong> to school today.</p>
              <p>They checked in at ${r.time}. Please ensure they arrive on time.</p>`;
    } else if (r.status === "permission") {
      subject = `✅ Excused Absence/Permission: ${r.studentName}`;
      html = `<p>Dear ${r.parentName},</p>
              <p>Your child, <strong>${r.studentName}</strong>, has been granted <strong>Permission</strong> (Excused) for today.</p>
              <p><strong>Note from Administration:</strong> ${r.note || "N/A"}</p>`;
    }

    return {
      from: SENDER_EMAIL,
      to: [r.parentEmail],
      subject,
      html,
    };
  });

  // Resend batch limits to 100 per request
  const CHUNK_SIZE = 100;
  for (let i = 0; i < emails.length; i += CHUNK_SIZE) {
    const chunk = emails.slice(i, i + CHUNK_SIZE);
    try {
      await resend.batch.send(chunk);
      console.log(`Sent batch of ${chunk.length} emails successfully.`);
    } catch (error) {
      console.error("Failed to send batch emails via Resend:", error);
    }
  }
}

export async function sendPasswordResetEmail(email: string, token: string) {
  if (!process.env.RESEND_API_KEY) return;
  const resetLink = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`;
  
  await resend.emails.send({
    from: SENDER_EMAIL,
    to: email,
    subject: "EduAttend - Password Reset Request",
    html: `<p>Hello,</p>
           <p>We received a request to reset your password for EduAttend.</p>
           <p>Click the link below to set a new password. This link will expire in 15 minutes.</p>
           <p><a href="${resetLink}">Reset Password</a></p>
           <p>If you did not request this, please ignore this email.</p>`,
  }).catch(console.error);
}

export async function sendWelcomeEmail(email: string, name: string, tempPass: string) {
  if (!process.env.RESEND_API_KEY) return;
  const loginLink = `${process.env.NEXTAUTH_URL}/login`;
  
  await resend.emails.send({
    from: SENDER_EMAIL,
    to: email,
    subject: "Welcome to EduAttend",
    html: `<p>Hello ${name},</p>
           <p>An administrator has created an EduAttend staff account for you.</p>
           <p><strong>Your Temporary Password:</strong> ${tempPass}</p>
           <p>Please log in and we recommend you change this password immediately via the 'Forgot Password' link.</p>
           <p><a href="${loginLink}">Log In to EduAttend</a></p>`,
  }).catch(console.error);
}
