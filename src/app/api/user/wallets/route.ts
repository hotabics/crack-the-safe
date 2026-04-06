import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { verifyMessage } from "viem";
import { logAudit } from "@/lib/audit";
import { z } from "zod";

// GET — list all wallets linked to this user
export async function GET() {
  let userId: string;
  try {
    userId = await requireAuth();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { walletAddress: true },
  });

  // For now, single wallet per user. Return as array for future multi-wallet.
  return NextResponse.json({
    wallets: user?.walletAddress
      ? [{ address: user.walletAddress, isPrimary: true }]
      : [],
  });
}

const linkSchema = z.object({
  address: z.string().min(10),
  message: z.string().min(1),
  signature: z.string().min(1),
  chain: z.enum(["evm", "solana"]).default("evm"),
});

// POST — link additional wallet (with signature verification)
export async function POST(req: Request) {
  let userId: string;
  try {
    userId = await requireAuth();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = linkSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { address, message, signature, chain } = parsed.data;
  const normalizedAddress = chain === "evm" ? address.toLowerCase() : `sol:${address}`;

  try {
    // Verify ownership of the wallet
    if (chain === "evm") {
      const isValid = await verifyMessage({
        address: address as `0x${string}`,
        message,
        signature: signature as `0x${string}`,
      });
      if (!isValid) {
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    }
    // TODO: Solana signature verification for linking

    // Check if wallet is already owned by another user
    const existingUser = await prisma.user.findUnique({
      where: { walletAddress: normalizedAddress },
    });

    if (existingUser && existingUser.id !== userId) {
      return NextResponse.json({ error: "Wallet already linked to another account" }, { status: 409 });
    }

    // Update user's wallet address
    await prisma.user.update({
      where: { id: userId },
      data: { walletAddress: normalizedAddress },
    });

    logAudit("wallet_linked", { address: normalizedAddress, chain }, userId);

    return NextResponse.json({ ok: true, address: normalizedAddress });
  } catch (error) {
    console.error("Link wallet error:", error);
    return NextResponse.json({ error: "Failed to link wallet" }, { status: 500 });
  }
}

// DELETE — unlink a wallet (must keep at least one)
export async function DELETE(req: Request) {
  let userId: string;
  try {
    userId = await requireAuth();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { address } = await req.json();

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.walletAddress) {
    return NextResponse.json({ error: "No wallet to unlink" }, { status: 400 });
  }

  // Can't unlink the only wallet
  if (user.walletAddress === address) {
    return NextResponse.json({ error: "Cannot unlink your only wallet" }, { status: 400 });
  }

  return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
}
