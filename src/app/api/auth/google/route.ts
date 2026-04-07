import { NextResponse } from "next/server";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const BASE_URL = process.env.NEXTAUTH_URL || "https://crack.scrim42.com";

export async function GET() {
  if (!GOOGLE_CLIENT_ID) {
    return NextResponse.json({ error: "Google login not configured" }, { status: 503 });
  }

  const state = crypto.randomUUID();

  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: `${BASE_URL}/api/auth/google/callback`,
    response_type: "code",
    scope: "openid email profile",
    state,
    access_type: "offline",
    prompt: "select_account",
  });

  const res = NextResponse.json({
    redirectUrl: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
  });

  res.cookies.set("google_oauth_state", state, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });

  return res;
}
