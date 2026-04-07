import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

// GET — get a random quiz question
export async function GET() {
  try {
    await requireAuth();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get total count of active questions
    const count = await prisma.quizQuestion.count({ where: { isActive: true } });
    if (count === 0) {
      return NextResponse.json({ error: "No quiz questions available" }, { status: 404 });
    }

    // Pick random question
    const skip = Math.floor(Math.random() * count);
    const question = await prisma.quizQuestion.findFirst({
      where: { isActive: true },
      skip,
      select: {
        id: true,
        question: true,
        options: true,
        difficulty: true,
        category: true,
      },
    });

    if (!question) {
      return NextResponse.json({ error: "No questions" }, { status: 404 });
    }

    return NextResponse.json({
      id: question.id,
      question: question.question,
      options: JSON.parse(question.options),
      difficulty: question.difficulty,
      category: question.category,
    });
  } catch (error) {
    console.error("Quiz error:", error);
    return NextResponse.json({ error: "Failed to get question" }, { status: 500 });
  }
}

// POST — answer a question and potentially earn a hint
export async function POST(req: Request) {
  let userId: string;
  try {
    userId = await requireAuth();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { questionId, answerIndex } = await req.json();

  if (!questionId || typeof answerIndex !== "number") {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  try {
    const question = await prisma.quizQuestion.findUnique({
      where: { id: questionId },
    });

    if (!question) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }

    const isCorrect = answerIndex === question.correctIndex;

    if (!isCorrect) {
      return NextResponse.json({
        correct: false,
        correctIndex: question.correctIndex,
        message: "Wrong answer! Try another question.",
      });
    }

    // Correct answer — reveal a hint!
    const vault = await prisma.vault.findFirst({
      where: { isCracked: false },
      orderBy: { startsAt: "desc" },
    });

    if (!vault) {
      return NextResponse.json({
        correct: true,
        hint: null,
        message: "Correct! But no active vault right now.",
      });
    }

    // Check which digits the user hasn't unlocked yet
    const existingHints = await prisma.hintUnlock.findMany({
      where: { userId, vaultId: vault.id },
      select: { digitIndex: true },
    });

    const unlockedIndexes = new Set(existingHints.map((h) => h.digitIndex));
    const codeLength = vault.codeLength;
    const availableIndexes = Array.from({ length: codeLength }, (_, i) => i)
      .filter((i) => !unlockedIndexes.has(i));

    if (availableIndexes.length === 0) {
      return NextResponse.json({
        correct: true,
        hint: null,
        message: "Correct! But you've already unlocked all digit hints.",
      });
    }

    // Pick a random unrevealed digit position
    const digitIndex = availableIndexes[Math.floor(Math.random() * availableIndexes.length)];

    // Get the actual digit from VAULT_SECRET_CODE
    const secretCode = process.env.VAULT_SECRET_CODE;
    if (!secretCode || digitIndex >= secretCode.length) {
      return NextResponse.json({
        correct: true,
        hint: null,
        message: "Correct! Hint system temporarily unavailable.",
      });
    }

    const digitValue = secretCode[digitIndex];

    // Save hint unlock
    await prisma.hintUnlock.create({
      data: {
        userId,
        vaultId: vault.id,
        digitIndex,
        isCorrect: true,
        digitValue,
        earnedVia: "quiz",
      },
    });

    logAudit("hint_unlock", {
      digitIndex,
      earnedVia: "quiz",
      questionId,
    }, userId);

    return NextResponse.json({
      correct: true,
      hint: {
        position: digitIndex + 1, // 1-indexed for display
        digit: digitValue,
        totalUnlocked: existingHints.length + 1,
        totalDigits: codeLength,
      },
      message: `Correct! Position ${digitIndex + 1} is "${digitValue}"`,
    });
  } catch (error) {
    console.error("Quiz answer error:", error);
    return NextResponse.json({ error: "Failed to process answer" }, { status: 500 });
  }
}
