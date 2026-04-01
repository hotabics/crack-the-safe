import { create } from "zustand";
import { GuessResult, getFeedbackLabel } from "@/lib/vault-logic";
import {
  apiClient,
  HintItem,
  GuessResultResponse,
} from "@/lib/api-client";

// Re-export for components that import from here
export type { GuessResult } from "@/lib/vault-logic";
export { getFeedbackLabel } from "@/lib/vault-logic";

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
  isVaultCracked: boolean;
  vaultStartedAt: number;
  vaultExpiresAt: number;
  codeLength: number;

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
  heatLevel: number;

  // Tasks
  tasks: Task[];

  // Stats
  totalAttempts: number;
  totalPlayers: number;

  // Loading states
  isLoading: boolean;
  isSubmitting: boolean;
  isConnecting: boolean;

  // Actions
  submitGuess: (guess: string) => Promise<GuessResultResponse | null>;
  claimTask: (taskId: string) => Promise<void>;
  buyGuesses: (packageType: "small" | "large") => Promise<boolean>;
  onWalletConnected: (walletAddress: string, displayName: string) => void;
  onWalletDisconnected: () => void;
  disconnect: () => Promise<void>;
  fetchVaultState: () => Promise<void>;
  fetchProfile: () => Promise<void>;
  fetchHints: () => Promise<void>;
}

function hintToGuessResult(hint: HintItem): GuessResult {
  return {
    guess: hint.guess,
    correctPositions: hint.correctPositions,
    correctDigits: hint.correctDigits,
    feedback: hint.feedback as GuessResult["feedback"],
    timestamp: new Date(hint.createdAt).getTime(),
  };
}

export const useVaultStore = create<VaultState>((set, get) => ({
  // Initial state
  isVaultCracked: false,
  vaultStartedAt: Date.now(),
  vaultExpiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
  codeLength: 4,

  isAuthenticated: false,
  walletAddress: null,
  displayName: "",
  guessBalance: 0,
  bluffBalance: 0,
  streakDays: 0,

  userGuesses: [],
  globalHints: [],
  heatLevel: 0,

  tasks: [],

  totalAttempts: 0,
  totalPlayers: 0,

  isLoading: false,
  isSubmitting: false,
  isConnecting: false,

  submitGuess: async (guess: string) => {
    const state = get();
    if (state.isSubmitting || state.guessBalance <= 0 || state.isVaultCracked || !state.isAuthenticated) return null;

    set({ isSubmitting: true });
    try {
      const result = await apiClient.submitGuess(guess);

      const guessResult: GuessResult = {
        guess: result.guess,
        correctPositions: result.correctPositions,
        correctDigits: result.correctDigits,
        feedback: result.feedback,
        timestamp: Date.now(),
      };

      set((s) => ({
        guessBalance: result.newBalance,
        userGuesses: [guessResult, ...s.userGuesses],
        globalHints: [
          { ...guessResult, guess: "??????" },
          ...s.globalHints.slice(0, 49),
        ],
        heatLevel: Math.max(s.heatLevel, result.correctPositions),
        totalAttempts: s.totalAttempts + 1,
        isVaultCracked: result.isVaultCracked,
        bluffBalance: result.isVaultCracked ? s.bluffBalance + 1_000_000 : s.bluffBalance,
      }));

      return result;
    } catch (error) {
      console.error("Submit guess failed:", error);
      return null;
    } finally {
      set({ isSubmitting: false });
    }
  },

  claimTask: async (taskId: string) => {
    const state = get();
    if (!state.isAuthenticated) return;

    try {
      const result = await apiClient.claimTask(taskId);

      set((s) => ({
        tasks: s.tasks.map((t) =>
          t.id === taskId ? { ...t, claimed: true } : t
        ),
        guessBalance: result.newBalance,
      }));
    } catch (error) {
      console.error("Claim task failed:", error);
    }
  },

  buyGuesses: async (packageType: "small" | "large") => {
    const state = get();
    if (!state.isAuthenticated) return false;

    try {
      const result = await apiClient.buyGuesses(packageType);
      set({
        guessBalance: result.newGuessBalance,
        bluffBalance: result.newBluffBalance,
      });
      return true;
    } catch (error) {
      console.error("Buy guesses failed:", error);
      return false;
    }
  },

  // Called by Header when AppKit + NextAuth session is established
  onWalletConnected: (walletAddress: string, displayName: string) => {
    const state = get();
    // Prevent re-triggering if already connected with same address
    if (state.isAuthenticated && state.walletAddress === walletAddress) return;

    set({
      isAuthenticated: true,
      walletAddress,
      displayName,
      isConnecting: false,
    });

    // Fetch full profile (tasks, balance, etc.)
    get().fetchProfile();
  },

  // Called when wallet disconnects
  onWalletDisconnected: () => {
    set({
      isAuthenticated: false,
      walletAddress: null,
      displayName: "",
      guessBalance: 0,
      bluffBalance: 0,
      userGuesses: [],
      tasks: [],
    });
  },

  disconnect: async () => {
    try {
      await apiClient.logout();
    } catch {
      // Ignore logout errors
    }
    get().onWalletDisconnected();
  },

  fetchVaultState: async () => {
    set({ isLoading: true });
    try {
      const vault = await apiClient.getVaultCurrent();
      set({
        isVaultCracked: vault.isCracked,
        vaultStartedAt: new Date(vault.startsAt).getTime(),
        vaultExpiresAt: new Date(vault.expiresAt).getTime(),
        codeLength: vault.codeLength,
        heatLevel: vault.heatLevel,
        totalAttempts: vault.totalAttempts,
        totalPlayers: vault.totalPlayers,
      });
    } catch (error) {
      console.error("Fetch vault state failed:", error);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchProfile: async () => {
    try {
      const profile = await apiClient.getProfile();
      set({
        isAuthenticated: true,
        displayName: profile.displayName,
        guessBalance: profile.guessBalance,
        bluffBalance: profile.bluffBalance,
        streakDays: profile.streakDays,
        tasks: profile.tasks.map((t) => ({
          ...t,
          type: t.type as Task["type"],
        })),
      });
    } catch {
      // Not authenticated or error — leave state as-is
    }
  },

  fetchHints: async () => {
    try {
      const data = await apiClient.getHints();
      set({
        globalHints: data.hints.map(hintToGuessResult),
      });
    } catch (error) {
      console.error("Fetch hints failed:", error);
    }
  },
}));
