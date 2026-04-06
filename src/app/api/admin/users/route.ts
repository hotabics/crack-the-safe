import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET(req: Request) {
  try {
    await requireAdmin();
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "FORBIDDEN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "50", 10)));
  const search = url.searchParams.get("search") || "";
  const sort = url.searchParams.get("sort") || "createdAt";
  const order = url.searchParams.get("order") === "asc" ? "asc" : "desc";

  try {
    const where = search
      ? {
          OR: [
            { walletAddress: { contains: search.toLowerCase() } },
            { displayName: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { [sort]: order },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          displayName: true,
          walletAddress: true,
          isAdmin: true,
          isBanned: true,
          bluffBalance: true,
          streakDays: true,
          createdAt: true,
          _count: { select: { guesses: true, taskCompletions: true, ledgerEntries: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    // Get guess balance for each user
    const usersWithBalance = await Promise.all(
      users.map(async (u) => {
        const bal = await prisma.guessLedger.aggregate({
          where: { userId: u.id },
          _sum: { amount: true },
        });
        return {
          ...u,
          guessBalance: bal._sum.amount || 0,
          createdAt: u.createdAt.toISOString(),
        };
      })
    );

    return NextResponse.json({
      users: usersWithBalance,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Admin users error:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

// POST — ban/unban or credit/debit user
export async function POST(req: Request) {
  try {
    await requireAdmin();
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "FORBIDDEN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { action, userId, amount } = await req.json();

  try {
    if (action === "ban") {
      await prisma.user.update({ where: { id: userId }, data: { isBanned: true } });
      return NextResponse.json({ ok: true, action: "banned" });
    }

    if (action === "unban") {
      await prisma.user.update({ where: { id: userId }, data: { isBanned: false } });
      return NextResponse.json({ ok: true, action: "unbanned" });
    }

    if (action === "credit" && typeof amount === "number") {
      await prisma.guessLedger.create({
        data: { userId, amount, reason: "admin_credit" },
      });
      return NextResponse.json({ ok: true, action: "credited", amount });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Admin user action error:", error);
    return NextResponse.json({ error: "Action failed" }, { status: 500 });
  }
}
