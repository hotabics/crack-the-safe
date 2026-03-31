import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const displayName = body.displayName || "Player";

    const user = await prisma.user.create({
      data: { displayName },
    });

    // Grant 5 initial guesses
    await prisma.guessLedger.create({
      data: {
        userId: user.id,
        amount: 5,
        reason: "initial_signup",
      },
    });

    // Set session
    const session = await getSession();
    session.userId = user.id;
    session.createdAt = Date.now();
    await session.save();

    return NextResponse.json({
      userId: user.id,
      displayName: user.displayName,
      guessBalance: 5,
    });
  } catch (error) {
    console.error("Connect error:", error);
    return NextResponse.json({ error: "Failed to connect" }, { status: 500 });
  }
}
