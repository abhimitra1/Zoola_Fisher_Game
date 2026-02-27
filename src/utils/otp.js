const { Resend } = require("resend");
const { prisma } = require("../config/db");

const resend = new Resend(process.env.RESEND_API_KEY);

// ── Generate 6 digit OTP ─────────────────────────────
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ── Send OTP email ───────────────────────────────────
async function sendOTP(email) {
  try {
    // Delete any existing OTP for this email
    await prisma.otpCode.deleteMany({
      where: { email },
    });

    // Generate new OTP
    const code = generateOTP();

    // Save OTP to database (expires in 10 minutes)
    await prisma.otpCode.create({
      data: {
        email,
        code,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        verified: false,
      },
    });

    // Send email via Resend
    await resend.emails.send({
      from: process.env.FROM_EMAIL,
      to: email,
      subject: "🐟 Fisher Game — Your Verification Code",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 400px; margin: 0 auto;">
          <h2 style="color: #127178;">🐟 Fisher: Guardians of the Blue Tank</h2>
          <p>Your verification code is:</p>
          <h1 style="color: #53C2C8; font-size: 48px; letter-spacing: 10px;">${code}</h1>
          <p>This code expires in <strong>10 minutes</strong>.</p>
          <p>If you did not request this code, ignore this email.</p>
          <hr/>
          <p style="color: #999; font-size: 12px;">Fisher Game — Zoola Project</p>
        </div>
      `,
    });

    console.log(`📧 OTP sent to ${email}`);
    return { success: true };
  } catch (error) {
    console.error("Send OTP error:", error);
    return { success: false, error: error.message };
  }
}

// ── Verify OTP ───────────────────────────────────────
async function verifyOTP(email, code) {
  try {
    // Find OTP
    const otp = await prisma.otpCode.findFirst({
      where: { email, code, verified: false },
    });

    // OTP not found
    if (!otp) {
      return { success: false, error: "Invalid OTP code" };
    }

    // OTP expired
    if (new Date() > otp.expiresAt) {
      await prisma.otpCode.delete({ where: { id: otp.id } });
      return { success: false, error: "OTP expired, request a new one" };
    }

    // Mark as verified
    await prisma.otpCode.update({
      where: { id: otp.id },
      data: { verified: true },
    });

    return { success: true };
  } catch (error) {
    console.error("Verify OTP error:", error);
    return { success: false, error: "Failed to verify OTP" };
  }
}

module.exports = { sendOTP, verifyOTP };
