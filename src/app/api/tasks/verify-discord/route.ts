import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";

const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const CALLBACK_URL = process.env.NEXTAUTH_URL
  ? `${process.env.NEXTAUTH_URL}/api/tasks/callback-discord`
  : "https://crack.scrim42.com/api/tasks/callback-discord";

export async function GET() {
  try {
    await requireAuth();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!DISCORD_CLIENT_ID) {
    return NextResponse.json(
      { error: "Discord integration not configured. Set DISCORD_CLIENT_ID env var." },
      { status: 503 }
    );
  }

  const state = crypto.randomUUID();

  const params = new URLSearchParams({
    client_id: DISCORD_CLIENT_ID,
    redirect_uri: CALLBACK_URL,
    response_type: "code",
    scope: "identify guilds.members.read",
    state,
  });

  const res = NextResponse.json({
    redirectUrl: `https://discord.com/api/oauth2/authorize?${params.toString()}`,
  });

  res.cookies.set("discord_oauth_state", state, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });

  return res;
}
