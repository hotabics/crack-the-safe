"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useVaultStore } from "@/stores/vaultStore";
import { GuessResult } from "@/lib/vault-logic";

function HintRow({ hint, index }: { hint: GuessResult; index: number }) {
  const feedbackStyles = {
    cold: "text-red-400 bg-red-500/5 border-red-500/10",
    warm: "text-amber-400 bg-amber-500/5 border-amber-500/10",
    hot: "text-green-400 bg-green-500/5 border-green-500/10",
    cracked: "text-vault-gold bg-vault-gold/10 border-vault-gold/20",
  };

  const feedbackText = {
    cold: "Cold",
    warm: `Warm (${hint.correctDigits} digit${hint.correctDigits > 1 ? "s" : ""})`,
    hot: `Hot! (${hint.correctPositions} pos)`,
    cracked: "CRACKED!",
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`flex items-center justify-between px-3 py-2 rounded-lg border ${feedbackStyles[hint.feedback]}`}
    >
      <span className="font-mono text-sm text-zinc-400">{hint.guess}</span>
      <span className="text-xs font-medium">{feedbackText[hint.feedback]}</span>
    </motion.div>
  );
}

export function HintBoard() {
  const { globalHints } = useVaultStore();

  return (
    <div className="bg-vault-surface rounded-xl border border-vault-elevated p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-heading font-semibold text-sm text-zinc-300">
          Global Hint Board
        </h3>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs text-vault-muted">Live</span>
        </div>
      </div>
      <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
        <AnimatePresence>
          {globalHints.slice(0, 15).map((hint, i) => (
            <HintRow key={hint.timestamp + "-" + i} hint={hint} index={i} />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
