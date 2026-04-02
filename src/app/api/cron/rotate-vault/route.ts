import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createHash, randomInt } from "crypto";

// Vercel Cron endpoint — rotates expired vaults.
// Add to vercel.json: { "crons": [{ "path": "/api/cron/rotate-vault", "schedule": "0 0 * * *" }] }

export async function GET(req: Request) {
  // Verify cron secret (Vercel sends CRON_SECRET header)
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Find expired, uncracked vaults
    const expiredVaults = await prisma.vault.findMany({
      where: {
        isCracked: false,
        expiresAt: { lt: new Date() },
      },
    });

    let rotated = 0;

    for (const vault of expiredVaults) {
      // Mark as expired (not cracked — nobody won)
      await prisma.vault.update({
        where: { id: vault.id },
        data: { isCracked: true }, // Archive it
      });
      rotated++;
    }

    // Check if there's an active vault
    const activeVault = await prisma.vault.findFirst({
      where: { isCracked: false },
      orderBy: { startsAt: "desc" },
    });

    let newVaultId: string | null = null;

    if (!activeVault) {
      // Generate new random 6-digit code
      const newCode = String(randomInt(0, 1000000)).padStart(6, "0");
      const codeHash = createHash("sha256").update(newCode).digest("hex");

      // Store code in env for server-side evaluation
      // In production, this would be stored in a secrets manager
      // For now, we rotate the VAULT_SECRET_CODE env var manually
      // The cron just creates the vault record

      const newVault = await prisma.vault.create({
        data: {
          codeLength: 6,
          codeHash,
          startsAt: new Date(),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },
      });

      newVaultId = newVault.id;

      console.log(
        `[CRON] Created new vault ${newVault.id} (expires ${newVault.expiresAt.toISOString()}). Code hash: ${codeHash.slice(0, 8)}...`
      );
    }

    return NextResponse.json({
      rotated,
      newVaultId,
      activeVaultExists: !!activeVault || !!newVaultId,
    });
  } catch (error) {
    console.error("[CRON] Rotate vault error:", error);
    return NextResponse.json({ error: "Rotation failed" }, { status: 500 });
  }
}
