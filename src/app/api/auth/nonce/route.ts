import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { cookies } from "next/headers";

export async function GET() {
  const nonce = randomBytes(16).toString("hex");

  // Store nonce in httpOnly cookie (10 min expiry)
  const cookieStore = await cookies();
  cookieStore.set("auth_nonce", nonce, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 600, // 10 minutes
    path: "/",
  });

  return NextResponse.json({ nonce });
}
