import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyMessage } from "viem";
import { prisma } from "@/lib/db";
import { SignJWT } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || "fallback-secret-change-me"
);

export async function POST(req: Request) {
  try {
    const { message, signature, address } = await req.json();

    if (!message || !signature || !address) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Verify nonce from cookie
    const cookieStore = await cookies();
    const storedNonce = cookieStore.get("auth_nonce")?.value;
    if (!storedNonce || !message.includes(storedNonce)) {
      return NextResponse.json({ error: "Invalid or expired nonce" }, { status: 400 });
    }

    // Clear used nonce
    cookieStore.delete("auth_nonce");

    // Verify signature using viem
    const isValid = await verifyMessage({
      address: address as `0x${string}`,
      message,
      signature: signature as `0x${string}`,
    });

    if (!isValid) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // Find or create user
    const walletAddress = address.toLowerCase();
    let user = await prisma.user.findUnique({ where: { walletAddress } });

    if (!user) {
      const shortAddr = `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`;
      user = await prisma.user.create({
        data: { walletAddress, displayName: shortAddr },
      });

      // Grant 5 initial guesses
      await prisma.guessLedger.create({
        data: { userId: user.id, amount: 5, reason: "initial_signup" },
      });

      console.log("[AUTH] New user created:", user.id);
    }

    // Create JWT session token
    const token = await new SignJWT({
      userId: user.id,
      address: walletAddress,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(JWT_SECRET);

    // Set session cookie
    const res = NextResponse.json({
      ok: true,
      userId: user.id,
      address: walletAddress,
      displayName: user.displayName,
    });

    res.cookies.set("session_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    return res;
  } catch (error) {
    console.error("[AUTH] Verify error:", error);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}

