import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { createWalletClient, createPublicClient, http, parseEther, stringToHex, padHex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { base } from "viem/chains";
import { PRIZE_VAULT_ABI, PRIZE_VAULT_ADDRESS } from "@/lib/contracts";

const PRIZE_AMOUNT = 1_000_000;

export async function POST() {
  let userId: string;
  try {
    userId = await requireAuth();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Find vault cracked by this user
      const vault = await tx.vault.findFirst({
        where: { isCracked: true, crackedByUserId: userId },
        orderBy: { crackedAt: "desc" },
      });

      if (!vault) throw new Error("NO_PRIZE");

      // Check if already claimed
      const existingClaim = await tx.tokenTransaction.findFirst({
        where: { userId, vaultId: vault.id, type: "prize_claim" },
      });
      if (existingClaim) throw new Error("ALREADY_CLAIMED");

      // Get user's wallet address for on-chain transfer
      const user = await tx.user.findUniqueOrThrow({ where: { id: userId } });
      if (!user.walletAddress) throw new Error("NO_WALLET");

      // Try on-chain transfer via PrizeVault contract
      let txHash: string | null = null;
      const signerKey = process.env.VAULT_SIGNER_PRIVATE_KEY;

      if (signerKey) {
        try {
          const account = privateKeyToAccount(signerKey as `0x${string}`);
          const walletClient = createWalletClient({
            account,
            chain: base,
            transport: http(),
          });
          const publicClient = createPublicClient({
            chain: base,
            transport: http(),
          });

          // Convert vault ID to bytes32
          const vaultIdBytes = padHex(stringToHex(vault.id.slice(0, 31)), { size: 32 });

          const hash = await walletClient.writeContract({
            address: PRIZE_VAULT_ADDRESS,
            abi: PRIZE_VAULT_ABI,
            functionName: "claimPrize",
            args: [
              user.walletAddress as `0x${string}`,
              parseEther(String(PRIZE_AMOUNT)),
              vaultIdBytes,
            ],
          });

          // Wait for confirmation
          await publicClient.waitForTransactionReceipt({ hash, confirmations: 1 });
          txHash = hash;
        } catch (e) {
          console.error("[CLAIM] On-chain transfer failed:", e);
          // Fall back to off-chain credit
        }
      }

      // Credit off-chain $BLUFF balance
      const updatedUser = await tx.user.update({
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
          txHash,
          metadata: JSON.stringify({
            onChain: !!txHash,
            vaultCodeLength: vault.codeLength,
            crackedAt: vault.crackedAt?.toISOString(),
          }),
        },
      });

      return {
        claimed: true,
        amount: PRIZE_AMOUNT,
        newBluffBalance: updatedUser.bluffBalance,
        transactionId: txRecord.id,
        vaultId: vault.id,
        txHash,
        onChain: !!txHash,
      };
    });

    await logAudit("prize_claim", {
      amount: PRIZE_AMOUNT,
      vaultId: result.vaultId,
      txHash: result.txHash,
      onChain: result.onChain,
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
    if (msg === "NO_WALLET") {
      return NextResponse.json({ error: "No wallet linked" }, { status: 400 });
    }
    console.error("Claim prize error:", error);
    return NextResponse.json({ error: "Failed to claim prize" }, { status: 500 });
  }
}
