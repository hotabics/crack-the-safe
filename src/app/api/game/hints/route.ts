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
    const vault = await prisma.vault.findFirst({
      where: { isCracked: false },
      orderBy: { startsAt: "desc" },
    });

    if (!vault) {
      return NextResponse.json({ hints: [], codeLength: 6 });
    }

    const hints = await prisma.hintUnlock.findMany({
      where: { userId, vaultId: vault.id },
      orderBy: { digitIndex: "asc" },
      select: {
        digitIndex: true,
        digitValue: true,
        earnedVia: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      hints: hints.map((h) => ({
        position: h.digitIndex + 1,
        digit: h.digitValue,
        earnedVia: h.earnedVia,
      })),
      codeLength: vault.codeLength,
      totalUnlocked: hints.length,
    });
  } catch (error) {
    console.error("Hints error:", error);
    return NextResponse.json({ error: "Failed to fetch hints" }, { status: 500 });
  }
}
