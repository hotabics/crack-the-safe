import { create } from "zustand";
import { GuessResult, evaluateGuess, generateVaultCode } from "@/lib/vault-logic";

interface Task {
  id: string;
  name: string;
  description: string;
  rewardGuesses: number;
  type: "daily" | "quest" | "bonus";
  claimed: boolean;
}

interface VaultState {
  // Vault
  secretCode: string;
  isVaultCracked: boolean;
  vaultStartedAt: number;
  vaultExpiresAt: number;

  // User
  isAuthenticated: boolean;
  walletAddress: string | null;
  displayName: string;
  guessBalance: number;
  bluffBalance: number;
  streakDays: number;

  // Guesses
  userGuesses: GuessResult[];
  globalHints: GuessResult[];
  heatLevel: number; // 0-4

  // Tasks
  tasks: Task[];

  // Stats
  totalAttempts: number;
  totalPlayers: number;

  // Actions
  submitGuess: (guess: string) => GuessResult | null;
  claimTask: (taskId: string) => void;
  connectWallet: (address: string) => void;
  disconnect: () => void;
  resetVault: () => void;
}

const DEFAULT_TASKS: Task[] = [
  {
    id: "daily-login",
    name: "Daily Login",
    description: "Come back every day for free guesses",
    rewardGuesses: 1,
    type: "daily",
    claimed: false,
  },
  {
    id: "streak-7",
    name: "7-Day Streak",
    description: "Login 7 days in a row for bonus guesses",
    rewardGuesses: 10,
    type: "daily",
    claimed: false,
  },
  {
    id: "follow-x",
    name: "Follow on X",
    description: "Follow @CrackTheSafe on X",
    rewardGuesses: 2,
    type: "quest",
    claimed: false,
  },
  {
    id: "join-discord",
    name: "Join Discord",
    description: "Join our Discord community",
    rewardGuesses: 3,
    type: "quest",
    claimed: false,
  },
  {
    id: "refer-friend",
    name: "Refer a Friend",
    description: "Share your referral link",
    rewardGuesses: 3,
    type: "quest",
    claimed: false,
  },
  {
    id: "hold-bluff",
    name: "Hold 100+ $BLUFF",
    description: "Verify $BLUFF tokens in your wallet",
    rewardGuesses: 5,
    type: "quest",
    claimed: false,
  },
  {
    id: "share-guess",
    name: "Share Your Closest Guess",
    description: "Post your best attempt on X",
    rewardGuesses: 2,
    type: "bonus",
    claimed: false,
  },
  {
    id: "community-10k",
    name: "Community Milestone: 10K Attempts",
    description: "Unlocks when 10,000 total guesses are made",
    rewardGuesses: 5,
    type: "bonus",
    claimed: false,
  },
];

// Simulated global hints from "other players"
function generateFakeHints(): GuessResult[] {
  const feedbacks: Array<GuessResult["feedback"]> = ["cold", "warm", "hot", "cold", "warm", "cold", "hot", "warm"];
  return feedbacks.map((feedback, i) => ({
    guess: "????",
    correctPositions: feedback === "hot" ? Math.floor(Math.random() * 2) + 1 : 0,
    correctDigits: feedback === "warm" ? Math.floor(Math.random() * 2) + 1 : 0,
    feedback,
    timestamp: Date.now() - (feedbacks.length - i) * 60000,
  }));
}

export const useVaultStore = create<VaultState>((set, get) => ({
  // Initial state
  secretCode: generateVaultCode(),
  isVaultCracked: false,
  vaultStartedAt: Date.now(),
  vaultExpiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days

  isAuthenticated: false,
  walletAddress: null,
  displayName: "",
  guessBalance: 5, // start with 5 free guesses
  bluffBalance: 0,
  streakDays: 0,

  userGuesses: [],
  globalHints: generateFakeHints(),
  heatLevel: 0,

  tasks: DEFAULT_TASKS,

  totalAttempts: 1247,
  totalPlayers: 892,

  submitGuess: (guess: string) => {
    const state = get();
    if (state.guessBalance <= 0 || state.isVaultCracked || !state.isAuthenticated) return null;

    const result = evaluateGuess(guess, state.secretCode);

    set((s) => ({
      guessBalance: s.guessBalance - 1,
      userGuesses: [result, ...s.userGuesses],
      globalHints: [
        { ...result, guess: "????" },
        ...s.globalHints.slice(0, 49),
      ],
      heatLevel: Math.max(s.heatLevel, result.correctPositions),
      totalAttempts: s.totalAttempts + 1,
      isVaultCracked: result.feedback === "cracked",
      bluffBalance: result.feedback === "cracked" ? s.bluffBalance + 1000000 : s.bluffBalance,
    }));

    return result;
  },

  claimTask: (taskId: string) => {
    set((s) => {
      const task = s.tasks.find((t) => t.id === taskId);
      if (!task || task.claimed || !s.isAuthenticated) return s;
      return {
        tasks: s.tasks.map((t) =>
          t.id === taskId ? { ...t, claimed: true } : t
        ),
        guessBalance: s.guessBalance + task.rewardGuesses,
      };
    });
  },

  connectWallet: (address: string) => {
    set({
      isAuthenticated: true,
      walletAddress: address,
      displayName: address.slice(0, 6) + "..." + address.slice(-4),
    });
  },

  disconnect: () => {
    set({
      isAuthenticated: false,
      walletAddress: null,
      displayName: "",
    });
  },

  resetVault: () => {
    set({
      secretCode: generateVaultCode(),
      isVaultCracked: false,
      vaultStartedAt: Date.now(),
      vaultExpiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
      userGuesses: [],
      heatLevel: 0,
    });
  },
}));
