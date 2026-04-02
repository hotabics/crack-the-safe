import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

const PRIZE_AMOUNT = 1_000_000; // 1M $BLUFF

export async function POST() {
  let userId: string;
  try {
    userId = await requireAuth();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Find vault cracked by this user that hasn't been claimed yet
      const vault = await tx.vault.findFirst({
        where: {
          isCracked: true,
          crackedByUserId: userId,
        },
        orderBy: { crackedAt: "desc" },
      });

      if (!vault) {
        throw new Error("NO_PRIZE");
      }

      // Check if already claimed
      const existingClaim = await tx.tokenTransaction.findFirst({
        where: {
          userId,
          vaultId: vault.id,
          type: "prize_claim",
        },
      });

      if (existingClaim) {
        throw new Error("ALREADY_CLAIMED");
      }

      // Credit $BLUFF to user
      const user = await tx.user.update({
        where: { id: userId },
        data: { bluffBalance: { increment: PRIZE_AMOUNT } },
      });

      // Record transaction
      const txRecord = await tx.tokenTransaction.create({
        data: {
          userId,
          amount: PRIZE_AMOUNT,
          type: "prize_claim",
          vaultId: vault.id,
          metadata: JSON.stringify({
            vaultCodeLength: vault.codeLength,
            crackedAt: vault.crackedAt?.toISOString(),
          }),
        },
      });

      return {
        claimed: true,
        amount: PRIZE_AMOUNT,
        newBluffBalance: user.bluffBalance,
        transactionId: txRecord.id,
        vaultId: vault.id,
        // txHash will be populated when on-chain transfer is implemented
        txHash: null,
      };
    });

    await logAudit("prize_claim", {
      amount: PRIZE_AMOUNT,
      vaultId: result.vaultId,
      transactionId: result.transactionId,
    }, userId);

    return NextResponse.json(result);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "";
    if (msg === "NO_PRIZE") {
      return NextResponse.json({ error: "No prize to claim" }, { status: 404 });
    }
    if (msg === "ALREADY_CLAIMED") {
      return NextResponse.json({ error: "Prize already claimed" }, { status: 409 });
    }
    console.error("Claim prize error:", error);
    return NextResponse.json({ error: "Failed to claim prize" }, { status: 500 });
  }
}
