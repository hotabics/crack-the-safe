"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useVaultStore } from "@/stores/vaultStore";
import { getFeedbackLabel, GuessResult } from "@/lib/vault-logic";

export function SafeDial() {
  const { isAuthenticated, guessBalance, isVaultCracked, isSubmitting, submitGuess } =
    useVaultStore();
  const [digits, setDigits] = useState<string[]>(["", "", "", ""]);
  const [lastResult, setLastResult] = useState<GuessResult | null>(null);
  const [isShaking, setIsShaking] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleDigitChange = useCallback(
    (index: number, value: string) => {
      if (!/^\d?$/.test(value)) return;
      const next = [...digits];
      next[index] = value;
      setDigits(next);
      if (value && index < 3) {
        inputRefs.current[index + 1]?.focus();
      }
    },
    [digits]
  );

  const handleKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent) => {
      if (e.key === "Backspace" && !digits[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
      if (e.key === "Enter") {
        handleSubmit();
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [digits]
  );

  const handleSubmit = async () => {
    const code = digits.join("");
    if (code.length !== 4 || isSubmitting) return;

    const apiResult = await submitGuess(code);
    if (apiResult) {
      const guessResult: GuessResult = {
        guess: apiResult.guess,
        correctPositions: apiResult.correctPositions,
        correctDigits: apiResult.correctDigits,
        feedback: apiResult.feedback,
        timestamp: Date.now(),
      };
      setLastResult(guessResult);
      setDigits(["", "", "", ""]);
      inputRefs.current[0]?.focus();

      if (apiResult.feedback === "cold") {
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 500);
      }
    }
  };

  const isDisabled =
    !isAuthenticated || guessBalance <= 0 || isVaultCracked;
  const isFilled = digits.every((d) => d !== "");

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Digit inputs */}
      <motion.div
        className="flex gap-3"
        animate={isShaking ? { x: [0, -8, 8, -8, 8, 0] } : {}}
        transition={{ duration: 0.4 }}
      >
        {digits.map((digit, i) => (
          <motion.input
            key={i}
            ref={(el) => {
              inputRefs.current[i] = el;
            }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleDigitChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            disabled={isDisabled || isSubmitting}
            className="w-14 h-18 sm:w-16 sm:h-20 text-center text-3xl font-mono bg-black
                       border-2 border-zinc-600 rounded-lg text-vault-gold
                       focus:border-vault-gold focus:outline-none focus:glow-gold
                       disabled:opacity-30 disabled:cursor-not-allowed
                       transition-all duration-200 placeholder:text-zinc-700"
            placeholder="_"
            whileFocus={{ scale: 1.05 }}
          />
        ))}
      </motion.div>

      {/* Submit button */}
      <motion.button
        whileHover={!isDisabled && isFilled && !isSubmitting ? { scale: 1.02 } : {}}
        whileTap={!isDisabled && isFilled && !isSubmitting ? { scale: 0.98 } : {}}
        onClick={handleSubmit}
        disabled={isDisabled || !isFilled || isSubmitting}
        className="px-8 py-3 bg-vault-gold text-black font-bold text-sm rounded-full
                   hover:bg-vault-gold-light disabled:opacity-30 disabled:cursor-not-allowed
                   transition-all duration-200"
      >
        {isSubmitting
          ? "Submitting..."
          : !isAuthenticated
            ? "Connect Wallet to Play"
            : isVaultCracked
              ? "VAULT CRACKED!"
              : guessBalance <= 0
                ? "No Guesses Left - Complete Tasks"
                : `CRACK IT (${guessBalance} left)`}
      </motion.button>

      {/* Feedback display */}
      <AnimatePresence mode="wait">
        {lastResult && (
          <motion.div
            key={lastResult.timestamp}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`mt-2 px-4 py-2 rounded-lg border text-sm font-medium ${
              lastResult.feedback === "cracked"
                ? "bg-green-500/10 border-green-500/30 text-green-400"
                : lastResult.feedback === "hot"
                  ? "bg-green-500/10 border-green-500/30 text-green-400"
                  : lastResult.feedback === "warm"
                    ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                    : "bg-red-500/10 border-red-500/30 text-red-400"
            }`}
          >
            <span className="font-mono mr-2">{lastResult.guess}</span>
            {getFeedbackLabel(lastResult)}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
