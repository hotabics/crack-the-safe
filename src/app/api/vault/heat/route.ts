import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const vault = await prisma.vault.findFirst({
      where: { isCracked: false },
      orderBy: { startsAt: "desc" },
    });

    if (!vault) {
      return NextResponse.json({ heatLevel: 0, totalAttempts: 0, totalPlayers: 0 });
    }

    const [maxHeat, attemptCount, playerCount] = await Promise.all([
      prisma.guess.aggregate({
        where: { vaultId: vault.id },
        _max: { correctPositions: true },
      }),
      prisma.guess.count({ where: { vaultId: vault.id } }),
      prisma.guess
        .groupBy({ by: ["userId"], where: { vaultId: vault.id } })
        .then((g) => g.length),
    ]);

    return NextResponse.json({
      heatLevel: maxHeat._max.correctPositions || 0,
      totalAttempts: attemptCount,
      totalPlayers: playerCount,
      codeLength: vault.codeLength,
    });
  } catch (error) {
    console.error("Heat error:", error);
    return NextResponse.json({ error: "Failed to fetch heat" }, { status: 500 });
  }
}
