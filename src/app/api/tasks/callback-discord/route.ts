import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const DISCORD_GUILD_ID = process.env.DISCORD_GUILD_ID; // Your server ID
const CALLBACK_URL = process.env.NEXTAUTH_URL
  ? `${process.env.NEXTAUTH_URL}/api/tasks/callback-discord`
  : "https://crack.scrim42.com/api/tasks/callback-discord";

export async function GET(req: Request) {
  let userId: string;
  try {
    userId = await requireAuth();
  } catch {
    return NextResponse.redirect(new URL("/?error=unauthorized", req.url));
  }

  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  const cookieStore = await cookies();
  const storedState = cookieStore.get("discord_oauth_state")?.value;
  cookieStore.delete("discord_oauth_state");

  if (!code || !state || state !== storedState) {
    return NextResponse.redirect(new URL("/?error=discord_invalid_state", req.url));
  }

  if (!DISCORD_CLIENT_ID || !DISCORD_CLIENT_SECRET || !DISCORD_GUILD_ID) {
    return NextResponse.redirect(new URL("/?error=discord_not_configured", req.url));
  }

  try {
    // Exchange code for access token
    const tokenRes = await fetch("https://discord.com/api/v10/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: DISCORD_CLIENT_ID,
        client_secret: DISCORD_CLIENT_SECRET,
        grant_type: "authorization_code",
        code,
        redirect_uri: CALLBACK_URL,
      }),
    });

    const tokenData = await tokenRes.json();

    if (!tokenData.access_token) {
      console.error("[Discord] Token error:", tokenData);
      return NextResponse.redirect(new URL("/?error=discord_token_failed", req.url));
    }

    // Check if user is member of the guild
    const memberRes = await fetch(
      `https://discord.com/api/v10/users/@me/guilds/${DISCORD_GUILD_ID}/member`,
      { headers: { Authorization: `Bearer ${tokenData.access_token}` } }
    );

    if (memberRes.status === 404) {
      return NextResponse.redirect(new URL("/?error=discord_not_member", req.url));
    }

    if (!memberRes.ok) {
      return NextResponse.redirect(new URL("/?error=discord_check_failed", req.url));
    }

    const memberData = await memberRes.json();

    // Claim the task
    const task = await prisma.task.findUnique({ where: { id: "join-discord" } });

    if (task) {
      const existing = await prisma.taskCompletion.findUnique({
        where: { userId_taskId_claimedDate: { userId, taskId: "join-discord", claimedDate: "permanent" } },
      });

      if (!existing) {
        await prisma.$transaction(async (tx) => {
          await tx.taskCompletion.create({
            data: { userId, taskId: "join-discord", claimedDate: "permanent" },
          });
          await tx.guessLedger.create({
            data: { userId, amount: task.rewardGuesses, reason: "task_claim", taskId: "join-discord" },
          });
        });

        logAudit("task_claim", {
          taskId: "join-discord",
          discordUsername: memberData.user?.username,
          verified: true,
        }, userId);
      }
    }

    return NextResponse.redirect(new URL("/?discord=verified", req.url));
  } catch (error) {
    console.error("[Discord] Callback error:", error);
    return NextResponse.redirect(new URL("/?error=discord_error", req.url));
  }
}
