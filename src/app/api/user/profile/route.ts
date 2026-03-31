import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function GET() {
  let userId: string;
  try {
    userId = await requireAuth();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [user, balanceAgg, guessCount, completions, allTasks] =
      await Promise.all([
        prisma.user.findUnique({ where: { id: userId } }),
        prisma.guessLedger.aggregate({
          where: { userId },
          _sum: { amount: true },
        }),
        prisma.guess.count({ where: { userId } }),
        prisma.taskCompletion.findMany({
          where: { userId },
          select: { taskId: true, claimedDate: true },
        }),
        prisma.task.findMany(),
      ]);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const today = new Date().toISOString().slice(0, 10);
    const claimedSet = new Set(
      completions.map((c) => `${c.taskId}:${c.claimedDate}`)
    );

    const tasks = allTasks.map((t) => {
      const claimedDate = t.type === "daily" ? today : "permanent";
      return {
        id: t.id,
        name: t.name,
        description: t.description,
        rewardGuesses: t.rewardGuesses,
        type: t.type,
        claimed: claimedSet.has(`${t.id}:${claimedDate}`),
      };
    });

    return NextResponse.json({
      userId: user.id,
      displayName: user.displayName,
      guessBalance: balanceAgg._sum.amount || 0,
      guessCount,
      tasks,
    });
  } catch (error) {
    console.error("Profile error:", error);
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}
