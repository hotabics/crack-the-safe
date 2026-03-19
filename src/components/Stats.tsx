"use client";

import { useVaultStore } from "@/stores/vaultStore";

export function Stats() {
  const { totalAttempts, totalPlayers } = useVaultStore();

  return (
    <p className="text-center text-sm text-vault-muted">
      <span className="font-mono text-zinc-400">
        {totalAttempts.toLocaleString()}
      </span>{" "}
      attempts made &middot;{" "}
      <span className="font-mono text-zinc-400">
        {totalPlayers.toLocaleString()}
      </span>{" "}
      players hunting
    </p>
  );
}
