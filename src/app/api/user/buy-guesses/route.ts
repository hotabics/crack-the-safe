import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { z } from "zod";

const PACKAGES = {
  small: { guesses: 3, cost: 10, label: "3 guesses for 10 $BLUFF" },
  large: { guesses: 50, cost: 100, label: "50 guesses for 100 $BLUFF" },
} as const;

const buySchema = z.object({
  package: z.enum(["small", "large"]),
});

export async function POST(req: Request) {
  let userId: string;
  try {
    userId = await requireAuth();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = buySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const pkg = PACKAGES[parsed.data.package];

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Get current $BLUFF balance (for now tracked in-app, not on-chain)
      const user = await tx.user.findUniqueOrThrow({ where: { id: userId } });

      // Calculate BLUFF balance from ledger (using bluffBalance field or derive)
      // For now, we use a simple bluffBalance field on user
      // TODO: Move to on-chain token balance check
      const bluffBalance = user.bluffBalance ?? 0;

      if (bluffBalance < pkg.cost) {
        throw new Error("INSUFFICIENT_BLUFF");
      }

      // Debit $BLUFF
      await tx.user.update({
        where: { id: userId },
        data: { bluffBalance: { decrement: pkg.cost } },
      });

      // Credit guesses
      await tx.guessLedger.create({
        data: {
          userId,
          amount: pkg.guesses,
          reason: `buy_${parsed.data.package}`,
        },
      });

      // Get new guess balance
      const balanceAgg = await tx.guessLedger.aggregate({
        where: { userId },
        _sum: { amount: true },
      });

      return {
        newGuessBalance: balanceAgg._sum.amount || 0,
        newBluffBalance: bluffBalance - pkg.cost,
        purchased: pkg.guesses,
      };
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "";
    if (message === "INSUFFICIENT_BLUFF") {
      return NextResponse.json(
        { error: "Not enough $BLUFF tokens" },
        { status: 400 }
      );
    }
    console.error("Buy guesses error:", error);
    return NextResponse.json(
      { error: "Failed to purchase guesses" },
      { status: 500 }
    );
  }
}
