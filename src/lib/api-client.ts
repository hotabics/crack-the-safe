export interface GuessResultResponse {
  guess: string;
  correctPositions: number;
  correctDigits: number;
  feedback: "cold" | "warm" | "hot" | "cracked";
  newBalance: number;
  isVaultCracked: boolean;
}

export interface VaultCurrentResponse {
  id: string;
  codeLength: number;
  startsAt: string;
  expiresAt: string;
  isCracked: boolean;
  heatLevel: number;
  totalAttempts: number;
  totalPlayers: number;
}

export interface HintItem {
  guess: string;
  correctPositions: number;
  correctDigits: number;
  feedback: string;
  createdAt: string;
}

export interface UserProfileResponse {
  userId: string;
  displayName: string;
  guessBalance: number;
  guessCount: number;
  tasks: Array<{
    id: string;
    name: string;
    description: string;
    rewardGuesses: number;
    type: string;
    claimed: boolean;
  }>;
}

export interface ConnectResponse {
  userId: string;
  displayName: string;
  guessBalance: number;
}

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) {
    throw new ApiError(res.status, data.error || "Request failed");
  }
  return data as T;
}

export const apiClient = {
  connect(displayName: string) {
    return request<ConnectResponse>("/api/auth/connect", {
      method: "POST",
      body: JSON.stringify({ displayName }),
    });
  },

  logout() {
    return request<{ ok: true }>("/api/auth/logout", { method: "POST" });
  },

  submitGuess(guess: string) {
    return request<GuessResultResponse>("/api/vault/guess", {
      method: "POST",
      body: JSON.stringify({ guess }),
    });
  },

  getVaultCurrent() {
    return request<VaultCurrentResponse>("/api/vault/current");
  },

  getHints() {
    return request<{ hints: HintItem[] }>("/api/vault/hints");
  },

  claimTask(taskId: string) {
    return request<{ newBalance: number }>(`/api/tasks/${taskId}/claim`, {
      method: "POST",
    });
  },

  getProfile() {
    return request<UserProfileResponse>("/api/user/profile");
  },
};
