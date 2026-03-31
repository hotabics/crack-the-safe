"use client";

import { motion } from "framer-motion";
import { useVaultStore } from "@/stores/vaultStore";

const typeIcons = {
  daily: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  ),
  quest: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  ),
  bonus: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2L2 7l10 5 10-5-10-5z" />
      <path d="M2 17l10 5 10-5" />
      <path d="M2 12l10 5 10-5" />
    </svg>
  ),
};

const typeLabels = { daily: "Daily", quest: "Quests", bonus: "Bonus" };

export function TaskList() {
  const { tasks, claimTask, isAuthenticated } = useVaultStore();

  const grouped = {
    daily: tasks.filter((t) => t.type === "daily"),
    quest: tasks.filter((t) => t.type === "quest"),
    bonus: tasks.filter((t) => t.type === "bonus"),
  };

  const handleClaim = async (taskId: string) => {
    await claimTask(taskId);
  };

  return (
    <div className="bg-vault-surface rounded-xl border border-vault-elevated p-4 sm:p-6">
      <h2 className="font-heading font-bold text-lg text-zinc-100 mb-4">
        Earn Your Guesses
      </h2>

      {(["daily", "quest", "bonus"] as const).map((type) => (
        <div key={type} className="mb-4 last:mb-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-vault-gold">{typeIcons[type]}</span>
            <h3 className="text-xs font-semibold text-vault-muted uppercase tracking-wider">
              {typeLabels[type]}
            </h3>
          </div>
          <div className="space-y-1.5">
            {grouped[type].map((task) => (
              <div
                key={task.id}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg border transition-colors ${
                  task.claimed
                    ? "bg-vault-elevated/50 border-vault-elevated opacity-50"
                    : "bg-vault-black/50 border-vault-elevated hover:border-zinc-600"
                }`}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-200 truncate">
                    {task.name}
                  </p>
                  <p className="text-xs text-vault-muted truncate">
                    {task.description}
                  </p>
                </div>
                <div className="flex items-center gap-3 ml-3 flex-shrink-0">
                  <span className="font-mono text-xs text-vault-gold font-medium">
                    +{task.rewardGuesses}
                  </span>
                  {task.claimed ? (
                    <span className="text-xs text-green-500 font-medium px-3 py-1">
                      Done
                    </span>
                  ) : (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleClaim(task.id)}
                      disabled={!isAuthenticated}
                      className="text-xs font-bold px-3 py-1 rounded-full bg-vault-gold text-black
                                 hover:bg-vault-gold-light disabled:opacity-30 disabled:cursor-not-allowed
                                 transition-colors"
                    >
                      Claim
                    </motion.button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
