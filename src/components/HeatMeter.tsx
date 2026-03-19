"use client";

import { motion } from "framer-motion";
import { useVaultStore } from "@/stores/vaultStore";

export function HeatMeter() {
  const { heatLevel, isVaultCracked } = useVaultStore();

  const percentage = isVaultCracked ? 100 : (heatLevel / 4) * 100;
  const labels = ["Cold", "Warm", "Getting Hot", "On Fire!", "CRACKED!"];
  const colors = [
    "from-zinc-700 to-zinc-600",
    "from-amber-700 to-amber-600",
    "from-amber-600 to-amber-500",
    "from-orange-500 to-red-500",
    "from-vault-gold to-vault-gold-light",
  ];

  const level = isVaultCracked ? 4 : heatLevel;

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs font-medium text-vault-muted uppercase tracking-wider">
          Heat Level
        </span>
        <span
          className={`text-xs font-bold ${
            level >= 3
              ? "text-orange-400"
              : level >= 1
                ? "text-amber-400"
                : "text-zinc-500"
          }`}
        >
          {labels[level]}
        </span>
      </div>
      <div className="h-3 bg-vault-surface rounded-full overflow-hidden border border-vault-elevated">
        <motion.div
          className={`h-full rounded-full bg-gradient-to-r ${colors[level]}`}
          initial={{ width: 0 }}
          animate={{ width: `${Math.max(percentage, 5)}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          style={{
            boxShadow:
              level >= 2
                ? `0 0 ${level * 5}px rgba(245, 158, 11, 0.5)`
                : "none",
          }}
        />
      </div>
    </div>
  );
}
