import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { createSessionToken, setSessionCookie } from "@/lib/jwt";
import { jwtVerify, createRemoteJWKSet } from "jose";

const APPLE_CLIENT_ID = process.env.APPLE_CLIENT_ID;

// Apple sends callback as form POST
export async function POST(req: Request) {
  const formData = await req.formData();
  const code = formData.get("code") as string;
  const idToken = formData.get("id_token") as string;
  const state = formData.get("state") as string;
  const userStr = formData.get("user") as string | null;

  const cookieStore = await cookies();
  const storedState = cookieStore.get("apple_oauth_state")?.value;
  cookieStore.delete("apple_oauth_state");

  if (!state || state !== storedState || !idToken || !APPLE_CLIENT_ID) {
    return NextResponse.redirect(new URL("/?error=apple_auth_failed", req.url));
  }

  try {
    // Verify Apple's id_token
    const JWKS = createRemoteJWKSet(new URL("https://appleid.apple.com/auth/keys"));
    const { payload } = await jwtVerify(idToken, JWKS, {
      issuer: "https://appleid.apple.com",
      audience: APPLE_CLIENT_ID,
    });

    const email = (payload.email as string)?.toLowerCase();
    if (!email) {
      return NextResponse.redirect(new URL("/?error=apple_no_email", req.url));
    }

    // Parse user info (only sent on first sign-in)
    let displayName = email.split("@")[0];
    if (userStr) {
      try {
        const userData = JSON.parse(userStr);
        if (userData.name) {
          displayName = [userData.name.firstName, userData.name.lastName].filter(Boolean).join(" ");
        }
      } catch {}
    }

    // Find or create user
    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          emailVerified: true,
          authProvider: "apple",
          displayName,
        },
      });

      await prisma.guessLedger.create({
        data: { userId: user.id, amount: 5, reason: "initial_signup" },
      });
    }

    const token = await createSessionToken(user.id, email);
    await setSessionCookie(token);

    logAudit("login", { email, provider: "apple" }, user.id);

    return NextResponse.redirect(new URL("/?login=success", req.url));
  } catch (error) {
    console.error("[Apple] Auth error:", error);
    return NextResponse.redirect(new URL("/?error=apple_error", req.url));
  }
}
