import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

const TWITTER_CLIENT_ID = process.env.TWITTER_CLIENT_ID;
const TWITTER_CLIENT_SECRET = process.env.TWITTER_CLIENT_SECRET;
const TARGET_USERNAME = process.env.TWITTER_TARGET_USERNAME || "CrackTheSafe";
const CALLBACK_URL = process.env.NEXTAUTH_URL
  ? `${process.env.NEXTAUTH_URL}/api/tasks/callback-twitter`
  : "https://crack.scrim42.com/api/tasks/callback-twitter";

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
  const storedState = cookieStore.get("twitter_oauth_state")?.value;
  const codeVerifier = cookieStore.get("twitter_code_verifier")?.value;

  cookieStore.delete("twitter_oauth_state");
  cookieStore.delete("twitter_code_verifier");

  if (!code || !state || state !== storedState || !codeVerifier) {
    return NextResponse.redirect(new URL("/?error=twitter_invalid_state", req.url));
  }

  if (!TWITTER_CLIENT_ID || !TWITTER_CLIENT_SECRET) {
    return NextResponse.redirect(new URL("/?error=twitter_not_configured", req.url));
  }

  try {
    // Exchange code for access token
    const tokenRes = await fetch("https://api.twitter.com/2/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${TWITTER_CLIENT_ID}:${TWITTER_CLIENT_SECRET}`).toString("base64")}`,
      },
      body: new URLSearchParams({
        code,
        grant_type: "authorization_code",
        redirect_uri: CALLBACK_URL,
        code_verifier: codeVerifier,
      }),
    });

    const tokenData = await tokenRes.json();

    if (!tokenData.access_token) {
      console.error("[Twitter] Token error:", tokenData);
      return NextResponse.redirect(new URL("/?error=twitter_token_failed", req.url));
    }

    // Get authenticated user info
    const meRes = await fetch("https://api.twitter.com/2/users/me", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const meData = await meRes.json();
    const myId = meData.data?.id;

    if (!myId) {
      return NextResponse.redirect(new URL("/?error=twitter_user_failed", req.url));
    }

    // Check if user follows the target account
    // First get target user ID
    const targetRes = await fetch(
      `https://api.twitter.com/2/users/by/username/${TARGET_USERNAME}`,
      { headers: { Authorization: `Bearer ${tokenData.access_token}` } }
    );
    const targetData = await targetRes.json();
    const targetId = targetData.data?.id;

    let isFollowing = false;

    if (targetId) {
      const followRes = await fetch(
        `https://api.twitter.com/2/users/${myId}/following?max_results=1000`,
        { headers: { Authorization: `Bearer ${tokenData.access_token}` } }
      );
      const followData = await followRes.json();
      isFollowing = followData.data?.some((u: { id: string }) => u.id === targetId) || false;
    }

    if (!isFollowing) {
      return NextResponse.redirect(new URL("/?error=twitter_not_following", req.url));
    }

    // Claim the task
    const today = new Date().toISOString().slice(0, 10);
    const task = await prisma.task.findUnique({ where: { id: "follow-x" } });

    if (task) {
      const existing = await prisma.taskCompletion.findUnique({
        where: { userId_taskId_claimedDate: { userId, taskId: "follow-x", claimedDate: "permanent" } },
      });

      if (!existing) {
        await prisma.$transaction(async (tx) => {
          await tx.taskCompletion.create({
            data: { userId, taskId: "follow-x", claimedDate: "permanent" },
          });
          await tx.guessLedger.create({
            data: { userId, amount: task.rewardGuesses, reason: "task_claim", taskId: "follow-x" },
          });
        });

        logAudit("task_claim", {
          taskId: "follow-x",
          twitterUsername: meData.data?.username,
          verified: true,
        }, userId);
      }
    }

    return NextResponse.redirect(new URL("/?twitter=verified", req.url));
  } catch (error) {
    console.error("[Twitter] Callback error:", error);
    return NextResponse.redirect(new URL("/?error=twitter_error", req.url));
  }
}
