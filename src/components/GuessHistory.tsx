"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useVaultStore } from "@/stores/vaultStore";
import { getFeedbackLabel } from "@/lib/vault-logic";

export function GuessHistory() {
  const { userGuesses, isAuthenticated } = useVaultStore();

  return (
    <div className="bg-vault-surface rounded-xl border border-vault-elevated p-4">
      <h3 className="font-heading font-semibold text-sm text-zinc-300 mb-3">
        Your History
      </h3>
      {!isAuthenticated ? (
        <p className="text-xs text-vault-muted text-center py-6">
          Connect wallet to see your history
        </p>
      ) : userGuesses.length === 0 ? (
        <p className="text-xs text-vault-muted text-center py-6">
          No guesses yet. Try your luck!
        </p>
      ) : (
        <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
          <AnimatePresence>
            {userGuesses.map((guess, i) => (
              <motion.div
                key={guess.timestamp}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex items-center justify-between px-3 py-2 rounded-lg border ${
                  guess.feedback === "cracked"
                    ? "bg-vault-gold/10 border-vault-gold/20 text-vault-gold"
                    : guess.feedback === "hot"
                      ? "bg-green-500/5 border-green-500/10"
                      : guess.feedback === "warm"
                        ? "bg-amber-500/5 border-amber-500/10"
                        : "bg-red-500/5 border-red-500/10"
                }`}
              >
                <span className="font-mono text-sm text-zinc-200 tracking-widest">
                  {guess.guess}
                </span>
                <span
                  className={`text-xs font-medium ${
                    guess.feedback === "cracked"
                      ? "text-vault-gold"
                      : guess.feedback === "hot"
                        ? "text-green-400"
                        : guess.feedback === "warm"
                          ? "text-amber-400"
                          : "text-red-400"
                  }`}
                >
                  {getFeedbackLabel(guess)}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
