import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { createHash, randomInt } from "crypto";

export async function GET() {
  try {
    await requireAdmin();
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "FORBIDDEN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const vaults = await prisma.vault.findMany({
      orderBy: { startsAt: "desc" },
      take: 20,
      include: {
        crackedBy: { select: { displayName: true, walletAddress: true } },
        _count: { select: { guesses: true } },
      },
    });

    return NextResponse.json({
      vaults: vaults.map((v) => ({
        id: v.id,
        codeLength: v.codeLength,
        codeHash: v.codeHash.slice(0, 12) + "...",
        startsAt: v.startsAt.toISOString(),
        expiresAt: v.expiresAt.toISOString(),
        isCracked: v.isCracked,
        crackedAt: v.crackedAt?.toISOString(),
        crackedBy: v.crackedBy
          ? { displayName: v.crackedBy.displayName, wallet: v.crackedBy.walletAddress }
          : null,
        totalGuesses: v._count.guesses,
      })),
    });
  } catch (error) {
    console.error("Admin vaults error:", error);
    return NextResponse.json({ error: "Failed to fetch vaults" }, { status: 500 });
  }
}

// POST — create new vault or rotate
export async function POST(req: Request) {
  try {
    await requireAdmin();
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "FORBIDDEN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { action, code, durationDays } = await req.json();

  try {
    if (action === "rotate") {
      // Archive current vault
      await prisma.vault.updateMany({
        where: { isCracked: false },
        data: { isCracked: true },
      });

      // Create new vault
      const newCode = code || String(randomInt(0, 1000000)).padStart(6, "0");
      const codeHash = createHash("sha256").update(newCode).digest("hex");
      const days = durationDays || 7;

      const vault = await prisma.vault.create({
        data: {
          codeLength: newCode.length,
          codeHash,
          startsAt: new Date(),
          expiresAt: new Date(Date.now() + days * 24 * 60 * 60 * 1000),
        },
      });

      return NextResponse.json({
        ok: true,
        vault: {
          id: vault.id,
          codeLength: vault.codeLength,
          expiresAt: vault.expiresAt.toISOString(),
        },
        // Only show code in response (admin only, not logged)
        code: newCode,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Admin vault action error:", error);
    return NextResponse.json({ error: "Action failed" }, { status: 500 });
  }
}
