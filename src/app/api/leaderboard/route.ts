import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const vault = await prisma.vault.findFirst({
      where: { isCracked: false },
      orderBy: { startsAt: "desc" },
    });

    const vaultId = vault?.id;

    // Closest guesses (most correct positions in current vault)
    const closest = vaultId
      ? await prisma.guess.findMany({
          where: { vaultId },
          orderBy: [{ correctPositions: "desc" }, { correctDigits: "desc" }, { createdAt: "asc" }],
          take: 10,
          select: {
            correctPositions: true,
            correctDigits: true,
            feedback: true,
            createdAt: true,
            user: { select: { displayName: true } },
          },
        })
      : [];

    // Most guesses (all time)
    const mostGuesses = await prisma.guess.groupBy({
      by: ["userId"],
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 10,
    });

    const mostGuessesUsers = await Promise.all(
      mostGuesses.map(async (g) => {
        const user = await prisma.user.findUnique({
          where: { id: g.userId },
          select: { displayName: true },
        });
        return { displayName: user?.displayName || "???", guessCount: g._count.id };
      })
    );

    // Longest streaks
    const topStreaks = await prisma.user.findMany({
      where: { streakDays: { gt: 0 } },
      orderBy: { streakDays: "desc" },
      take: 10,
      select: { displayName: true, streakDays: true },
    });

    return NextResponse.json({
      closest: closest.map((g) => ({
        displayName: g.user.displayName,
        correctPositions: g.correctPositions,
        correctDigits: g.correctDigits,
        feedback: g.feedback,
        createdAt: g.createdAt.toISOString(),
      })),
      mostGuesses: mostGuessesUsers,
      topStreaks,
    });
  } catch (error) {
    console.error("Leaderboard error:", error);
    return NextResponse.json({ error: "Failed to fetch leaderboard" }, { status: 500 });
  }
}
