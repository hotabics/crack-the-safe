"use client";

import { motion } from "framer-motion";
import { useVaultStore } from "@/stores/vaultStore";
import Link from "next/link";

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

// Tasks that can be freely claimed by the user (no external verification needed)
const SELF_CLAIMABLE = new Set(["daily-login"]);

// Tasks that require a streak (show progress instead of claim)
const STREAK_TASKS = new Set(["streak-7"]);

// Tasks needing external verification (social, on-chain) — show as "Go" link or info
const EXTERNAL_TASKS: Record<string, string | null> = {
  "follow-x": "https://x.com/CrackTheSafe",
  "join-discord": "https://discord.gg/crackthesafe",
  "refer-friend": null,
  "hold-bluff": null,
  "share-guess": "https://x.com/intent/tweet?text=I%27m%20trying%20to%20Crack%20the%20Safe!%20🔐%20https://crack.scrim42.com",
  "community-10k": null,
};

// Fallback tasks to show when user is not authenticated
const DEFAULT_TASKS = [
  { id: "daily-login", name: "Daily Login", description: "Come back every day for free guesses", rewardGuesses: 1, type: "daily" as const, claimed: false },
  { id: "streak-7", name: "7-Day Streak", description: "Login 7 days in a row for bonus guesses", rewardGuesses: 10, type: "daily" as const, claimed: false },
  { id: "follow-x", name: "Follow on X", description: "Follow @CrackTheSafe on X", rewardGuesses: 2, type: "quest" as const, claimed: false },
  { id: "join-discord", name: "Join Discord", description: "Join our Discord community", rewardGuesses: 3, type: "quest" as const, claimed: false },
  { id: "refer-friend", name: "Refer a Friend", description: "Share your referral link", rewardGuesses: 3, type: "quest" as const, claimed: false },
  { id: "hold-bluff", name: "Hold 100+ $BLUFF", description: "Verify $BLUFF tokens in your wallet", rewardGuesses: 5, type: "quest" as const, claimed: false },
  { id: "share-guess", name: "Share Your Closest Guess", description: "Post your best attempt on X", rewardGuesses: 2, type: "bonus" as const, claimed: false },
  { id: "community-10k", name: "Community Milestone: 10K Attempts", description: "Unlocks when 10,000 total guesses are made", rewardGuesses: 5, type: "bonus" as const, claimed: false },
];

export function TaskList() {
  const { tasks, claimTask, isAuthenticated, streakDays } = useVaultStore();

  // Use fetched tasks if authenticated, otherwise show defaults
  const displayTasks = tasks.length > 0 ? tasks : DEFAULT_TASKS;

  const grouped = {
    daily: displayTasks.filter((t) => t.type === "daily"),
    quest: displayTasks.filter((t) => t.type === "quest"),
    bonus: displayTasks.filter((t) => t.type === "bonus"),
  };

  const handleClaim = async (taskId: string) => {
    await claimTask(taskId);
  };

  function renderButton(task: typeof displayTasks[number]) {
    if (task.claimed) {
      return (
        <span className="text-xs text-green-500 font-medium px-3 py-1">
          Done
        </span>
      );
    }

    if (!isAuthenticated) {
      return (
        <span className="text-xs text-vault-muted px-3 py-1">
          Connect wallet
        </span>
      );
    }

    // Self-claimable tasks (like daily login)
    if (SELF_CLAIMABLE.has(task.id)) {
      return (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => handleClaim(task.id)}
          className="text-xs font-bold px-3 py-1 rounded-full bg-vault-gold text-black
                     hover:bg-vault-gold-light transition-colors"
        >
          Claim
        </motion.button>
      );
    }

    // Streak tasks — show progress
    if (STREAK_TASKS.has(task.id)) {
      if (streakDays >= 7) {
        return (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleClaim(task.id)}
            className="text-xs font-bold px-3 py-1 rounded-full bg-vault-gold text-black
                       hover:bg-vault-gold-light transition-colors"
          >
            Claim
          </motion.button>
        );
      }
      return (
        <span className="text-xs text-vault-muted font-mono px-3 py-1">
          {streakDays}/7 days
        </span>
      );
    }

    // External tasks with links
    const externalUrl = EXTERNAL_TASKS[task.id];
    if (externalUrl) {
      return (
        <a
          href={externalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-bold px-3 py-1 rounded-full bg-vault-surface text-vault-gold
                     border border-vault-gold/30 hover:bg-vault-gold/10 transition-colors"
        >
          Go
        </a>
      );
    }

    // Tasks that need conditions met but aren't verifiable yet
    return (
      <span className="text-xs text-vault-muted px-3 py-1">
        Coming soon
      </span>
    );
  }

  return (
    <div className="bg-vault-surface rounded-xl border border-vault-elevated p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-heading font-bold text-lg text-zinc-100">
          Earn Your Guesses
        </h2>
        <Link
          href="/terms"
          className="text-xs text-vault-gold hover:text-vault-gold-light transition-colors"
        >
          How it works
        </Link>
      </div>

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
                  {renderButton(task)}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
