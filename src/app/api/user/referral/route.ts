import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { randomBytes } from "crypto";
import { logAudit } from "@/lib/audit";

// GET — get or generate referral code for current user
export async function GET() {
  let userId: string;
  try {
    userId = await requireAuth();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    let user = await prisma.user.findUnique({
      where: { id: userId },
      select: { referralCode: true, displayName: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Generate referral code if not exists
    if (!user.referralCode) {
      const code = randomBytes(4).toString("hex"); // 8 char hex
      await prisma.user.update({
        where: { id: userId },
        data: { referralCode: code },
      });
      user = { ...user, referralCode: code };
    }

    // Count successful referrals
    const referralCount = await prisma.user.count({
      where: { referredBy: userId },
    });

    return NextResponse.json({
      referralCode: user.referralCode,
      referralUrl: `https://crack.scrim42.com/?ref=${user.referralCode}`,
      referralCount,
    });
  } catch (error) {
    console.error("Referral error:", error);
    return NextResponse.json({ error: "Failed to get referral" }, { status: 500 });
  }
}

// POST — apply a referral code (called during/after signup)
export async function POST(req: Request) {
  let userId: string;
  try {
    userId = await requireAuth();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { code } = await req.json();

    if (!code || typeof code !== "string") {
      return NextResponse.json({ error: "Referral code required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Can't apply referral if already referred
    if (user.referredBy) {
      return NextResponse.json({ error: "Already used a referral" }, { status: 409 });
    }

    // Find referrer by code
    const referrer = await prisma.user.findUnique({
      where: { referralCode: code },
    });

    if (!referrer) {
      return NextResponse.json({ error: "Invalid referral code" }, { status: 404 });
    }

    // Can't refer yourself
    if (referrer.id === userId) {
      return NextResponse.json({ error: "Cannot refer yourself" }, { status: 400 });
    }

    // Apply referral in transaction
    await prisma.$transaction(async (tx) => {
      // Mark user as referred
      await tx.user.update({
        where: { id: userId },
        data: { referredBy: referrer.id },
      });

      // Credit 3 guesses to the new user
      await tx.guessLedger.create({
        data: { userId, amount: 3, reason: "referral_bonus" },
      });

      // Credit 3 guesses to the referrer
      await tx.guessLedger.create({
        data: { userId: referrer.id, amount: 3, reason: "referral_reward" },
      });
    });

    await logAudit("referral_applied", { referrerUserId: referrer.id, code }, userId);

    return NextResponse.json({ ok: true, bonusGuesses: 3 });
  } catch (error) {
    console.error("Apply referral error:", error);
    return NextResponse.json({ error: "Failed to apply referral" }, { status: 500 });
  }
}
