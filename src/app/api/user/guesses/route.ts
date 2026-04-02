import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function GET(req: Request) {
  let userId: string;
  try {
    userId = await requireAuth();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
  const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get("limit") || "20", 10)));
  const offset = (page - 1) * limit;

  try {
    const [guesses, total] = await Promise.all([
      prisma.guess.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        skip: offset,
        take: limit,
        select: {
          id: true,
          guess: true,
          correctPositions: true,
          correctDigits: true,
          feedback: true,
          createdAt: true,
        },
      }),
      prisma.guess.count({ where: { userId } }),
    ]);

    return NextResponse.json({
      guesses: guesses.map((g) => ({
        ...g,
        createdAt: g.createdAt.toISOString(),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("User guesses error:", error);
    return NextResponse.json({ error: "Failed to fetch guesses" }, { status: 500 });
  }
}
