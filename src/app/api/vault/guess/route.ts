import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { evaluateGuessServer } from "@/lib/vault-server";
import { guessSchema } from "@/lib/validations";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  let userId: string;
  try {
    userId = await requireAuth();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limit
  const rl = checkRateLimit(userId);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many guesses", retryAfterMs: rl.retryAfterMs },
      { status: 429 }
    );
  }

  // Validate input
  const body = await req.json();
  const parsed = guessSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  try {
    // Use a transaction to atomically check balance + insert guess + debit
    const result = await prisma.$transaction(async (tx) => {
      // Get current balance
      const balanceAgg = await tx.guessLedger.aggregate({
        where: { userId },
        _sum: { amount: true },
      });
      const balance = balanceAgg._sum.amount || 0;

      if (balance <= 0) {
        throw new Error("NO_BALANCE");
      }

      // Get active vault
      const vault = await tx.vault.findFirst({
        where: { isCracked: false },
        orderBy: { startsAt: "desc" },
      });

      if (!vault) {
        throw new Error("NO_ACTIVE_VAULT");
      }

      // Evaluate guess server-side
      const evaluation = evaluateGuessServer(parsed.data.guess);

      // Insert guess record
      await tx.guess.create({
        data: {
          vaultId: vault.id,
          userId,
          guess: parsed.data.guess,
          correctPositions: evaluation.correctPositions,
          correctDigits: evaluation.correctDigits,
          feedback: evaluation.feedback,
        },
      });

      // Debit 1 guess
      await tx.guessLedger.create({
        data: {
          userId,
          amount: -1,
          reason: "guess",
        },
      });

      // If cracked, mark vault
      if (evaluation.feedback === "cracked") {
        await tx.vault.update({
          where: { id: vault.id },
          data: {
            isCracked: true,
            crackedByUserId: userId,
            crackedAt: new Date(),
          },
        });
      }

      return {
        guess: parsed.data.guess,
        correctPositions: evaluation.correctPositions,
        correctDigits: evaluation.correctDigits,
        feedback: evaluation.feedback,
        newBalance: balance - 1,
        isVaultCracked: evaluation.feedback === "cracked",
      };
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "";
    if (message === "NO_BALANCE") {
      return NextResponse.json({ error: "No guesses remaining" }, { status: 400 });
    }
    if (message === "NO_ACTIVE_VAULT") {
      return NextResponse.json({ error: "No active vault" }, { status: 400 });
    }
    console.error("Guess error:", error);
    return NextResponse.json({ error: "Failed to submit guess" }, { status: 500 });
  }
}
