import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { createSessionToken, setSessionCookie } from "@/lib/jwt";
import { createHash, randomBytes } from "crypto";
import { z } from "zod";

// Simple email OTP flow (no external email service needed for MVP)
// POST with email → generates 6-digit code stored in DB
// POST with email + code → verifies and creates session

const emailSchema = z.object({
  email: z.string().email("Invalid email"),
  code: z.string().optional(),
});

// In-memory OTP store (replace with Redis in production)
const otpStore = new Map<string, { code: string; expiresAt: number }>();

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = emailSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { email, code } = parsed.data;
  const normalizedEmail = email.toLowerCase().trim();

  // Step 2: Verify code
  if (code) {
    const stored = otpStore.get(normalizedEmail);
    if (!stored || Date.now() > stored.expiresAt) {
      otpStore.delete(normalizedEmail);
      return NextResponse.json({ error: "Code expired. Request a new one." }, { status: 400 });
    }

    if (stored.code !== code) {
      return NextResponse.json({ error: "Invalid code" }, { status: 401 });
    }

    otpStore.delete(normalizedEmail);

    // Find or create user by email
    let user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    if (!user) {
      const displayName = normalizedEmail.split("@")[0];
      user = await prisma.user.create({
        data: {
          email: normalizedEmail,
          emailVerified: true,
          authProvider: "email",
          displayName,
        },
      });

      await prisma.guessLedger.create({
        data: { userId: user.id, amount: 5, reason: "initial_signup" },
      });
    } else if (!user.emailVerified) {
      await prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: true },
      });
    }

    const token = await createSessionToken(user.id, normalizedEmail);
    await setSessionCookie(token);

    logAudit("login", { email: normalizedEmail, provider: "email" }, user.id);

    return NextResponse.json({
      ok: true,
      userId: user.id,
      displayName: user.displayName,
    });
  }

  // Step 1: Send OTP code
  const otp = String(Math.floor(100000 + Math.random() * 900000)); // 6-digit
  otpStore.set(normalizedEmail, {
    code: otp,
    expiresAt: Date.now() + 10 * 60 * 1000, // 10 min
  });

  // Clean old entries
  if (otpStore.size > 10000) {
    const now = Date.now();
    otpStore.forEach((v, k) => { if (now > v.expiresAt) otpStore.delete(k); });
  }

  // In production, send via email service (Resend, SendGrid, etc.)
  // For MVP, return the code in response (visible in dev tools)
  // TODO: Integrate actual email sending
  console.log(`[EMAIL OTP] ${normalizedEmail}: ${otp}`);

  return NextResponse.json({
    ok: true,
    message: "Verification code sent to your email",
    // Remove this line in production — only for testing:
    _devCode: process.env.NODE_ENV !== "production" ? otp : undefined,
  });
}
