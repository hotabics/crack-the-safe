import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const vault = await prisma.vault.findFirst({
      orderBy: { startsAt: "desc" },
    });

    if (!vault) {
      return NextResponse.json({ hints: [] });
    }

    const guesses = await prisma.guess.findMany({
      where: { vaultId: vault.id },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        correctPositions: true,
        correctDigits: true,
        feedback: true,
        createdAt: true,
      },
    });

    const hints = guesses.map((g) => ({
      guess: "??????",
      correctPositions: g.correctPositions,
      correctDigits: g.correctDigits,
      feedback: g.feedback,
      createdAt: g.createdAt.toISOString(),
    }));

    return NextResponse.json({ hints });
  } catch (error) {
    console.error("Hints error:", error);
    return NextResponse.json({ error: "Failed to fetch hints" }, { status: 500 });
  }
}
