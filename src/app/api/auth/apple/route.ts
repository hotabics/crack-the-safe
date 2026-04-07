import { NextResponse } from "next/server";

const APPLE_CLIENT_ID = process.env.APPLE_CLIENT_ID; // Service ID
const BASE_URL = process.env.NEXTAUTH_URL || "https://crack.scrim42.com";

export async function GET() {
  if (!APPLE_CLIENT_ID) {
    return NextResponse.json({ error: "Apple login not configured" }, { status: 503 });
  }

  const state = crypto.randomUUID();

  const params = new URLSearchParams({
    client_id: APPLE_CLIENT_ID,
    redirect_uri: `${BASE_URL}/api/auth/apple/callback`,
    response_type: "code id_token",
    scope: "name email",
    response_mode: "form_post",
    state,
  });

  const res = NextResponse.json({
    redirectUrl: `https://appleid.apple.com/auth/authorize?${params.toString()}`,
  });

  res.cookies.set("apple_oauth_state", state, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });

  return res;
}
