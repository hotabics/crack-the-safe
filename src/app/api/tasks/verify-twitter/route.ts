import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";

// Twitter OAuth 2.0 PKCE flow — redirect user to Twitter to authorize
// After auth, Twitter redirects back to /api/tasks/callback-twitter

const TWITTER_CLIENT_ID = process.env.TWITTER_CLIENT_ID;
const CALLBACK_URL = process.env.NEXTAUTH_URL
  ? `${process.env.NEXTAUTH_URL}/api/tasks/callback-twitter`
  : "https://crack.scrim42.com/api/tasks/callback-twitter";

export async function GET() {
  try {
    await requireAuth();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!TWITTER_CLIENT_ID) {
    return NextResponse.json(
      { error: "Twitter integration not configured. Set TWITTER_CLIENT_ID env var." },
      { status: 503 }
    );
  }

  // Build OAuth 2.0 authorization URL
  const state = crypto.randomUUID();
  const codeVerifier = crypto.randomUUID() + crypto.randomUUID();

  // Simple code challenge (plain method for simplicity)
  const params = new URLSearchParams({
    response_type: "code",
    client_id: TWITTER_CLIENT_ID,
    redirect_uri: CALLBACK_URL,
    scope: "users.read follows.read tweet.read",
    state,
    code_challenge: codeVerifier,
    code_challenge_method: "plain",
  });

  // Store state + code_verifier in cookie for callback
  const res = NextResponse.json({
    redirectUrl: `https://twitter.com/i/oauth2/authorize?${params.toString()}`,
  });

  res.cookies.set("twitter_oauth_state", state, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });

  res.cookies.set("twitter_code_verifier", codeVerifier, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });

  return res;
}
