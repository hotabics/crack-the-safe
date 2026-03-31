import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

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

      // Return new balance
      const balanceAgg = await tx.guessLedger.aggregate({
        where: { userId },
        _sum: { amount: true },
      });

      return { newBalance: balanceAgg._sum.amount || 0 };
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
    console.error("Task claim error:", error);
    return NextResponse.json({ error: "Failed to claim task" }, { status: 500 });
  }
}
