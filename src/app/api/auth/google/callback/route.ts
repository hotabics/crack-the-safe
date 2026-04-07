import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { createSessionToken, setSessionCookie } from "@/lib/jwt";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const BASE_URL = process.env.NEXTAUTH_URL || "https://crack.scrim42.com";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  const cookieStore = await cookies();
  const storedState = cookieStore.get("google_oauth_state")?.value;
  cookieStore.delete("google_oauth_state");

  if (!code || !state || state !== storedState || !GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    return NextResponse.redirect(new URL("/?error=google_auth_failed", req.url));
  }

  try {
    // Exchange code for tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: `${BASE_URL}/api/auth/google/callback`,
        grant_type: "authorization_code",
      }),
    });
    const tokens = await tokenRes.json();

    if (!tokens.access_token) {
      return NextResponse.redirect(new URL("/?error=google_token_failed", req.url));
    }

    // Get user info
    const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const profile = await userRes.json();

    if (!profile.email) {
      return NextResponse.redirect(new URL("/?error=google_no_email", req.url));
    }

    const email = profile.email.toLowerCase();

    // Find or create user
    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          emailVerified: true,
          authProvider: "google",
          displayName: profile.name || email.split("@")[0],
          avatarUrl: profile.picture || null,
        },
      });

      await prisma.guessLedger.create({
        data: { userId: user.id, amount: 5, reason: "initial_signup" },
      });
    }

    const token = await createSessionToken(user.id, email);
    await setSessionCookie(token);

    logAudit("login", { email, provider: "google" }, user.id);

    return NextResponse.redirect(new URL("/?login=success", req.url));
  } catch (error) {
    console.error("[Google] Auth error:", error);
    return NextResponse.redirect(new URL("/?error=google_error", req.url));
  }
}
