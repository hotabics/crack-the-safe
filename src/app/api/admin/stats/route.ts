import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET() {
  try {
    await requireAdmin();
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "FORBIDDEN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      totalGuesses,
      totalBluffDistributed,
      activeVault,
      usersToday,
      guessesToday,
      usersThisWeek,
      recentGuesses,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.guess.count(),
      prisma.tokenTransaction.aggregate({ _sum: { amount: true } }),
      prisma.vault.findFirst({ where: { isCracked: false }, orderBy: { startsAt: "desc" } }),
      prisma.user.count({ where: { createdAt: { gte: todayStart } } }),
      prisma.guess.count({ where: { createdAt: { gte: todayStart } } }),
      prisma.user.count({ where: { createdAt: { gte: weekAgo } } }),
      prisma.guess.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          feedback: true,
          correctPositions: true,
          createdAt: true,
          user: { select: { displayName: true } },
        },
      }),
    ]);

    const vaultStats = activeVault
      ? await Promise.all([
          prisma.guess.count({ where: { vaultId: activeVault.id } }),
          prisma.guess.groupBy({ by: ["userId"], where: { vaultId: activeVault.id } }).then((g) => g.length),
          prisma.guess.aggregate({ where: { vaultId: activeVault.id }, _max: { correctPositions: true } }),
        ])
      : [0, 0, { _max: { correctPositions: 0 } }];

    return NextResponse.json({
      overview: {
        totalUsers,
        totalGuesses,
        totalBluffDistributed: totalBluffDistributed._sum.amount || 0,
        usersToday,
        guessesToday,
        usersThisWeek,
      },
      vault: activeVault
        ? {
            id: activeVault.id,
            codeLength: activeVault.codeLength,
            startsAt: activeVault.startsAt.toISOString(),
            expiresAt: activeVault.expiresAt.toISOString(),
            isCracked: activeVault.isCracked,
            totalAttempts: vaultStats[0] as number,
            totalPlayers: vaultStats[1] as number,
            heatLevel: (vaultStats[2] as { _max: { correctPositions: number | null } })._max.correctPositions || 0,
          }
        : null,
      recentGuesses: recentGuesses.map((g) => ({
        id: g.id,
        feedback: g.feedback,
        correctPositions: g.correctPositions,
        user: g.user.displayName,
        createdAt: g.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
