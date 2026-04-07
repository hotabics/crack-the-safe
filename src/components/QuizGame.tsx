"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useVaultStore } from "@/stores/vaultStore";

interface Question {
  id: string;
  question: string;
  options: string[];
  difficulty: string;
  category: string;
}

interface Hint {
  position: number;
  digit: string;
  earnedVia: string;
}

export function QuizGame() {
  const { isAuthenticated, codeLength } = useVaultStore();
  const [question, setQuestion] = useState<Question | null>(null);
  const [hints, setHints] = useState<Hint[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [result, setResult] = useState<{ correct: boolean; message: string; hint?: { position: number; digit: string } } | null>(null);
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // Fetch user's current hints
  const fetchHints = useCallback(async () => {
    try {
      const res = await fetch("/api/game/hints");
      if (res.ok) {
        const data = await res.json();
        setHints(data.hints || []);
      }
    } catch {}
  }, []);

  // Fetch a new question
  const fetchQuestion = useCallback(async () => {
    setLoading(true);
    setSelectedAnswer(null);
    setResult(null);
    try {
      const res = await fetch("/api/game/quiz");
      if (res.ok) {
        setQuestion(await res.json());
      } else {
        setQuestion(null);
      }
    } catch {} finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) fetchHints();
  }, [isAuthenticated, fetchHints]);

  // Cooldown timer
  useEffect(() => {
    if (cooldown > 0) {
      const t = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [cooldown]);

  const submitAnswer = async (answerIndex: number) => {
    if (!question || selectedAnswer !== null) return;
    setSelectedAnswer(answerIndex);

    try {
      const res = await fetch("/api/game/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId: question.id, answerIndex }),
      });
      const data = await res.json();
      setResult(data);

      if (data.correct && data.hint) {
        setHints((prev) => [...prev, { position: data.hint.position, digit: data.hint.digit, earnedVia: "quiz" }]);
      }

      // Cooldown before next question
      setCooldown(data.correct ? 3 : 5);
    } catch {
      setResult({ correct: false, message: "Network error" });
    }
  };

  if (!isAuthenticated) return null;

  const digits = codeLength || 6;
  const hintMap = new Map(hints.map((h) => [h.position, h.digit]));

  return (
    <div className="bg-vault-surface rounded-xl border border-vault-elevated p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-heading font-bold text-lg text-zinc-100">Hint Quest</h2>
        <span className="text-xs text-vault-muted">{hints.length}/{digits} revealed</span>
      </div>

      {/* Digit reveal display */}
      <div className="flex justify-center gap-2 mb-5">
        {Array.from({ length: digits }).map((_, i) => {
          const revealed = hintMap.get(i + 1);
          return (
            <motion.div
              key={i}
              className={`w-10 h-12 rounded-lg border-2 flex items-center justify-center font-mono text-xl font-bold ${
                revealed
                  ? "border-green-500 bg-green-500/10 text-green-400"
                  : "border-vault-elevated bg-vault-black/50 text-vault-muted"
              }`}
              animate={revealed ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 0.3 }}
            >
              {revealed || "?"}
            </motion.div>
          );
        })}
      </div>

      {/* Quiz section */}
      {!question && !loading && (
        <div className="text-center">
          <p className="text-xs text-vault-muted mb-3">
            Answer trivia questions to reveal digits of the secret code!
          </p>
          <button
            onClick={fetchQuestion}
            disabled={cooldown > 0}
            className="px-5 py-2.5 bg-vault-gold text-black text-xs font-bold rounded-full hover:bg-vault-gold-light disabled:opacity-50 transition-colors"
          >
            {cooldown > 0 ? `Next question in ${cooldown}s` : "Start Quiz"}
          </button>
        </div>
      )}

      {loading && (
        <p className="text-center text-xs text-vault-muted animate-pulse">Loading question...</p>
      )}

      {/* Question display */}
      <AnimatePresence mode="wait">
        {question && (
          <motion.div
            key={question.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                question.difficulty === "easy" ? "bg-green-500/20 text-green-400" :
                question.difficulty === "hard" ? "bg-red-500/20 text-red-400" :
                "bg-amber-500/20 text-amber-400"
              }`}>
                {question.difficulty}
              </span>
              <span className="text-[10px] text-vault-muted">{question.category}</span>
            </div>

            <p className="text-sm text-zinc-200 font-medium mb-3">{question.question}</p>

            <div className="space-y-2">
              {question.options.map((opt, i) => {
                const isSelected = selectedAnswer === i;
                const isCorrectAnswer = result && result.correct === false && i === (result as unknown as { correctIndex?: number }).correctIndex;
                const showCorrect = result && selectedAnswer !== null;

                return (
                  <button
                    key={i}
                    onClick={() => submitAnswer(i)}
                    disabled={selectedAnswer !== null}
                    className={`w-full text-left px-4 py-2.5 rounded-lg border text-xs transition-all ${
                      showCorrect && isSelected && !result?.correct
                        ? "border-red-500 bg-red-500/10 text-red-300"
                        : showCorrect && ((isSelected && result?.correct) || isCorrectAnswer)
                          ? "border-green-500 bg-green-500/10 text-green-300"
                          : isSelected
                            ? "border-vault-gold bg-vault-gold/10 text-vault-gold"
                            : "border-vault-elevated bg-vault-black/50 text-zinc-300 hover:border-zinc-500"
                    } disabled:cursor-default`}
                  >
                    <span className="font-bold mr-2 text-vault-muted">{String.fromCharCode(65 + i)}.</span>
                    {opt}
                  </button>
                );
              })}
            </div>

            {/* Result */}
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mt-3 px-4 py-2 rounded-lg text-xs font-medium ${
                  result.correct
                    ? "bg-green-500/10 border border-green-500/30 text-green-400"
                    : "bg-red-500/10 border border-red-500/30 text-red-400"
                }`}
              >
                {result.message}
              </motion.div>
            )}

            {/* Next question button */}
            {result && (
              <button
                onClick={fetchQuestion}
                disabled={cooldown > 0}
                className="mt-3 w-full py-2 bg-vault-gold text-black text-xs font-bold rounded-lg hover:bg-vault-gold-light disabled:opacity-50 transition-colors"
              >
                {cooldown > 0 ? `Next in ${cooldown}s...` : "Next Question"}
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
