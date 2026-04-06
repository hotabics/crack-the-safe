import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { SignJWT } from "jose";
import nacl from "tweetnacl";
import bs58 from "bs58";

const JWT_SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || "fallback-secret-change-me"
);

export async function POST(req: Request) {
  try {
    const { message, signature, publicKey } = await req.json();

    if (!message || !signature || !publicKey) {
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

    // Verify Ed25519 signature
    const messageBytes = new TextEncoder().encode(message);
    const signatureBytes = bs58.decode(signature);
    const publicKeyBytes = bs58.decode(publicKey);

    const isValid = nacl.sign.detached.verify(
      messageBytes,
      signatureBytes,
      publicKeyBytes
    );

    if (!isValid) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // Find or create user by Solana address
    const walletAddress = `sol:${publicKey}`;
    let user = await prisma.user.findUnique({ where: { walletAddress } });

    if (!user) {
      const shortAddr = `${publicKey.slice(0, 4)}...${publicKey.slice(-4)}`;
      user = await prisma.user.create({
        data: { walletAddress, displayName: shortAddr },
      });

      await prisma.guessLedger.create({
        data: { userId: user.id, amount: 5, reason: "initial_signup" },
      });
    }

    // Create JWT
    const token = await new SignJWT({
      userId: user.id,
      address: walletAddress,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(JWT_SECRET);

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
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    logAudit("login", { address: walletAddress, chain: "solana" }, user.id);

    return res;
  } catch (error) {
    console.error("[AUTH] Solana verify error:", error);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
