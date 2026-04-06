"use client";

import { useState, useEffect } from "react";

interface LeaderboardData {
  closest: Array<{ displayName: string; correctPositions: number; correctDigits: number; feedback: string }>;
  mostGuesses: Array<{ displayName: string; guessCount: number }>;
  topStreaks: Array<{ displayName: string; streakDays: number }>;
}

type Board = "closest" | "active" | "streaks";

const feedbackColor: Record<string, string> = {
  cold: "text-blue-400", warm: "text-amber-400", hot: "text-red-400", cracked: "text-green-400",
};

export function Leaderboard() {
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [board, setBoard] = useState<Board>("closest");

  useEffect(() => {
    fetch("/api/leaderboard")
      .then((r) => r.json())
      .then(setData)
      .catch(() => {});
  }, []);

  if (!data) return null;

  return (
    <div className="bg-vault-surface rounded-xl border border-vault-elevated p-4 sm:p-6">
      <h2 className="font-heading font-bold text-lg text-zinc-100 mb-3">Leaderboard</h2>

      <div className="flex bg-vault-black/50 rounded-lg p-1 gap-1 mb-4">
        {([
          ["closest", "Closest"],
          ["active", "Most Active"],
          ["streaks", "Streaks"],
        ] as const).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setBoard(id)}
            className={`flex-1 text-[11px] font-medium py-1.5 rounded-md transition-all ${
              board === id ? "bg-vault-gold text-black" : "text-vault-muted hover:text-zinc-300"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="space-y-1">
        {board === "closest" &&
          data.closest.map((e, i) => (
            <div key={i} className="flex items-center justify-between text-xs py-1.5 border-b border-vault-elevated/50 last:border-0">
              <div className="flex items-center gap-2">
                <span className={`w-5 text-center font-bold ${i < 3 ? "text-vault-gold" : "text-vault-muted"}`}>
                  {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}`}
                </span>
                <span className="text-zinc-200">{e.displayName}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-vault-gold">{e.correctPositions} pos</span>
                <span className="font-mono text-vault-muted">{e.correctDigits} dig</span>
                <span className={`font-bold uppercase text-[10px] ${feedbackColor[e.feedback]}`}>{e.feedback}</span>
              </div>
            </div>
          ))}

        {board === "active" &&
          data.mostGuesses.map((e, i) => (
            <div key={i} className="flex items-center justify-between text-xs py-1.5 border-b border-vault-elevated/50 last:border-0">
              <div className="flex items-center gap-2">
                <span className={`w-5 text-center font-bold ${i < 3 ? "text-vault-gold" : "text-vault-muted"}`}>
                  {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}`}
                </span>
                <span className="text-zinc-200">{e.displayName}</span>
              </div>
              <span className="font-mono text-vault-gold">{e.guessCount} guesses</span>
            </div>
          ))}

        {board === "streaks" &&
          data.topStreaks.map((e, i) => (
            <div key={i} className="flex items-center justify-between text-xs py-1.5 border-b border-vault-elevated/50 last:border-0">
              <div className="flex items-center gap-2">
                <span className={`w-5 text-center font-bold ${i < 3 ? "text-vault-gold" : "text-vault-muted"}`}>
                  {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}`}
                </span>
                <span className="text-zinc-200">{e.displayName}</span>
              </div>
              <span className="font-mono text-vault-gold">{e.streakDays} days</span>
            </div>
          ))}

        {((board === "closest" && data.closest.length === 0) ||
          (board === "active" && data.mostGuesses.length === 0) ||
          (board === "streaks" && data.topStreaks.length === 0)) && (
          <p className="text-vault-muted text-xs text-center py-4">No data yet — be the first!</p>
        )}
      </div>
    </div>
  );
}
