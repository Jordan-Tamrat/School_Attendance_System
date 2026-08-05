import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email";
export async function POST(req: NextRequest) {
  try {
    const { username } = await req.json();
    if (!username) {
      return NextResponse.json({ error: "Username is required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      return NextResponse.json({ error: "No account found with this username." }, { status: 404 });
    }
    
    if (!user.email) {
      return NextResponse.json({ error: "No email address is registered for this account. Please contact the administrator." }, { status: 400 });
    }

    // Mask email for response
    const [namePart, domainPart] = user.email.split("@");
    const maskedEmail = `${namePart[0]}***@${domainPart}`;

    // Generate token
    const resetToken = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
    const resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken, resetTokenExpiry },
    });

    // Send email
    await sendPasswordResetEmail(user.email, resetToken);

    return NextResponse.json({ success: true, maskedEmail });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
