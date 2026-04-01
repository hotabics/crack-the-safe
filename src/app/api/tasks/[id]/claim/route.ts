import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

/** Calculate streak: if lastLoginDate was yesterday, increment; if today, keep; otherwise reset to 1 */
function calculateStreak(lastLoginDate: string | null, currentStreak: number, today: string): number {
  if (!lastLoginDate) return 1;
  if (lastLoginDate === today) return currentStreak;

  const last = new Date(lastLoginDate + "T00:00:00Z");
  const now = new Date(today + "T00:00:00Z");
  const diffDays = Math.round((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));

  return diffDays === 1 ? currentStreak + 1 : 1;
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  let userId: string;
  try {
    userId = await requireAuth();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: taskId } = await params;
  const today = new Date().toISOString().slice(0, 10);

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Verify task exists
      const task = await tx.task.findUnique({ where: { id: taskId } });
      if (!task) throw new Error("TASK_NOT_FOUND");

      // Check if already claimed today (for daily) or ever (for non-daily)
      const claimedDate = task.type === "daily" ? today : "permanent";
      const existing = await tx.taskCompletion.findUnique({
        where: {
          userId_taskId_claimedDate: { userId, taskId, claimedDate },
        },
      });
      if (existing) throw new Error("ALREADY_CLAIMED");

      // For daily-login task, update streak
      let streakDays: number | undefined;
      if (taskId === "daily-login") {
        const user = await tx.user.findUniqueOrThrow({ where: { id: userId } });
        streakDays = calculateStreak(user.lastLoginDate, user.streakDays, today);
        await tx.user.update({
          where: { id: userId },
          data: { lastLoginDate: today, streakDays },
        });
      }

      // For streak-7 task, verify the user actually has 7+ day streak
      if (taskId === "streak-7") {
        const user = await tx.user.findUniqueOrThrow({ where: { id: userId } });
        // Check if daily-login was claimed today (streak is current)
        if (user.lastLoginDate !== today || user.streakDays < 7) {
          throw new Error("STREAK_NOT_MET");
        }
      }

      // Insert completion
      await tx.taskCompletion.create({
        data: { userId, taskId, claimedDate },
      });

      // Credit guesses
      await tx.guessLedger.create({
        data: {
          userId,
          amount: task.rewardGuesses,
          reason: "task_claim",
          taskId,
        },
      });

      // Check balance won't go negative (defensive check)
      const balanceAgg = await tx.guessLedger.aggregate({
        where: { userId },
        _sum: { amount: true },
      });
      const newBalance = balanceAgg._sum.amount || 0;
      if (newBalance < 0) throw new Error("BALANCE_NEGATIVE");

      return { newBalance, streakDays };
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "";
    if (message === "TASK_NOT_FOUND") {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }
    if (message === "ALREADY_CLAIMED") {
      return NextResponse.json({ error: "Task already claimed" }, { status: 409 });
    }
    if (message === "STREAK_NOT_MET") {
      return NextResponse.json({ error: "7-day streak requirement not met" }, { status: 400 });
    }
    console.error("Task claim error:", error);
    return NextResponse.json({ error: "Failed to claim task" }, { status: 500 });
  }
}
