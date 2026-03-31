import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const vault = await prisma.vault.findFirst({
      where: { isCracked: false },
      orderBy: { startsAt: "desc" },
    });

    if (!vault) {
      // Try to find the most recently cracked vault
      const crackedVault = await prisma.vault.findFirst({
        orderBy: { startsAt: "desc" },
      });
      if (crackedVault) {
        const stats = await getVaultStats(crackedVault.id);
        return NextResponse.json({
          id: crackedVault.id,
          codeLength: crackedVault.codeLength,
          startsAt: crackedVault.startsAt.toISOString(),
          expiresAt: crackedVault.expiresAt.toISOString(),
          isCracked: true,
          heatLevel: stats.heatLevel,
          totalAttempts: stats.totalAttempts,
          totalPlayers: stats.totalPlayers,
        });
      }
      return NextResponse.json({ error: "No vault found" }, { status: 404 });
    }

    const stats = await getVaultStats(vault.id);

    return NextResponse.json({
      id: vault.id,
      codeLength: vault.codeLength,
      startsAt: vault.startsAt.toISOString(),
      expiresAt: vault.expiresAt.toISOString(),
      isCracked: false,
      heatLevel: stats.heatLevel,
      totalAttempts: stats.totalAttempts,
      totalPlayers: stats.totalPlayers,
    });
  } catch (error) {
    console.error("Vault current error:", error);
    return NextResponse.json({ error: "Failed to fetch vault" }, { status: 500 });
  }
}

async function getVaultStats(vaultId: string) {
  const [attemptCount, playerCount, maxHeat] = await Promise.all([
    prisma.guess.count({ where: { vaultId } }),
    prisma.guess
      .groupBy({ by: ["userId"], where: { vaultId } })
      .then((groups) => groups.length),
    prisma.guess.aggregate({
      where: { vaultId },
      _max: { correctPositions: true },
    }),
  ]);

  return {
    totalAttempts: attemptCount,
    totalPlayers: playerCount,
    heatLevel: maxHeat._max.correctPositions || 0,
  };
}
