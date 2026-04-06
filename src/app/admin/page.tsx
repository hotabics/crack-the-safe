"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface Stats {
  overview: {
    totalUsers: number;
    totalGuesses: number;
    totalBluffDistributed: number;
    usersToday: number;
    guessesToday: number;
    usersThisWeek: number;
  };
  vault: {
    id: string;
    codeLength: number;
    startsAt: string;
    expiresAt: string;
    isCracked: boolean;
    totalAttempts: number;
    totalPlayers: number;
    heatLevel: number;
  } | null;
  recentGuesses: Array<{
    id: string;
    feedback: string;
    correctPositions: number;
    user: string;
    createdAt: string;
  }>;
}

interface User {
  id: string;
  displayName: string;
  walletAddress: string | null;
  isAdmin: boolean;
  isBanned: boolean;
  bluffBalance: number;
  guessBalance: number;
  streakDays: number;
  createdAt: string;
  _count: { guesses: number; taskCompletions: number };
}

interface AuditLog {
  id: string;
  action: string;
  details: Record<string, unknown> | null;
  user: { displayName: string; wallet: string | null } | null;
  createdAt: string;
}

interface Vault {
  id: string;
  codeLength: number;
  codeHash: string;
  startsAt: string;
  expiresAt: string;
  isCracked: boolean;
  crackedAt: string | null;
  crackedBy: { displayName: string; wallet: string | null } | null;
  totalGuesses: number;
}

type Tab = "overview" | "users" | "vaults" | "logs";

export default function AdminDashboard() {
  const [tab, setTab] = useState<Tab>("overview");
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [vaults, setVaults] = useState<Vault[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [userSearch, setUserSearch] = useState("");

  const fetchData = useCallback(async (t: Tab) => {
    setLoading(true);
    setError(null);
    try {
      if (t === "overview") {
        const res = await fetch("/api/admin/stats");
        if (res.status === 401 || res.status === 403) { setError("Not authorized. Connect admin wallet and sign in."); return; }
        setStats(await res.json());
      } else if (t === "users") {
        const res = await fetch(`/api/admin/users?limit=50&search=${encodeURIComponent(userSearch)}`);
        if (!res.ok) { setError("Failed to load users"); return; }
        const data = await res.json();
        setUsers(data.users);
      } else if (t === "vaults") {
        const res = await fetch("/api/admin/vaults");
        if (!res.ok) { setError("Failed to load vaults"); return; }
        const data = await res.json();
        setVaults(data.vaults);
      } else if (t === "logs") {
        const res = await fetch("/api/admin/logs?limit=50");
        if (!res.ok) { setError("Failed to load logs"); return; }
        const data = await res.json();
        setLogs(data.logs);
      }
    } catch { setError("Network error"); } finally { setLoading(false); }
  }, [userSearch]);

  useEffect(() => { fetchData(tab); }, [tab, fetchData]);

  const handleUserAction = async (action: string, userId: string, amount?: number) => {
    await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, userId, amount }),
    });
    fetchData("users");
  };

  const handleRotateVault = async () => {
    if (!confirm("Archive current vault and create a new one?")) return;
    const res = await fetch("/api/admin/vaults", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "rotate" }),
    });
    const data = await res.json();
    if (data.ok) {
      alert(`New vault created! Code: ${data.code}`);
      fetchData("vaults");
    }
  };

  const feedbackColor: Record<string, string> = {
    cold: "text-blue-400", warm: "text-amber-400", hot: "text-red-400", cracked: "text-green-400",
  };

  return (
    <main className="min-h-screen bg-vault-black text-zinc-100">
      <header className="bg-vault-surface border-b border-vault-elevated px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-red-500/20 flex items-center justify-center text-red-400 text-xs font-bold">A</div>
            <h1 className="font-heading font-bold text-lg">Admin Dashboard</h1>
          </div>
          <Link href="/" className="text-xs text-vault-muted hover:text-zinc-300">Back to Game</Link>
        </div>
      </header>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-6 pt-4">
        <div className="flex gap-1 bg-vault-surface rounded-lg p-1 border border-vault-elevated w-fit">
          {(["overview", "users", "vaults", "logs"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-xs font-medium rounded-md capitalize transition-all ${
                tab === t ? "bg-vault-gold text-black" : "text-vault-muted hover:text-zinc-300"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-sm text-red-400 mb-6">{error}</div>
        )}

        {loading && <p className="text-vault-muted text-sm animate-pulse">Loading...</p>}

        {/* OVERVIEW */}
        {!loading && tab === "overview" && stats && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { label: "Total Users", value: stats.overview.totalUsers },
                { label: "Total Guesses", value: stats.overview.totalGuesses },
                { label: "Users Today", value: stats.overview.usersToday },
                { label: "Guesses Today", value: stats.overview.guessesToday },
                { label: "Users This Week", value: stats.overview.usersThisWeek },
                { label: "$BLUFF Distributed", value: stats.overview.totalBluffDistributed.toLocaleString() },
              ].map((s) => (
                <div key={s.label} className="bg-vault-surface border border-vault-elevated rounded-lg p-4">
                  <p className="text-xs text-vault-muted">{s.label}</p>
                  <p className="text-xl font-mono font-bold text-vault-gold mt-1">{s.value}</p>
                </div>
              ))}
            </div>

            {stats.vault && (
              <div className="bg-vault-surface border border-vault-elevated rounded-lg p-4">
                <h3 className="text-sm font-bold mb-3">Active Vault</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                  <div><span className="text-vault-muted">Code Length:</span> <span className="font-mono">{stats.vault.codeLength}</span></div>
                  <div><span className="text-vault-muted">Heat:</span> <span className="font-mono text-vault-gold">{stats.vault.heatLevel}/{stats.vault.codeLength}</span></div>
                  <div><span className="text-vault-muted">Attempts:</span> <span className="font-mono">{stats.vault.totalAttempts}</span></div>
                  <div><span className="text-vault-muted">Players:</span> <span className="font-mono">{stats.vault.totalPlayers}</span></div>
                  <div><span className="text-vault-muted">Expires:</span> <span className="font-mono text-xs">{new Date(stats.vault.expiresAt).toLocaleDateString()}</span></div>
                </div>
              </div>
            )}

            <div className="bg-vault-surface border border-vault-elevated rounded-lg p-4">
              <h3 className="text-sm font-bold mb-3">Recent Guesses</h3>
              <div className="space-y-1">
                {stats.recentGuesses.map((g) => (
                  <div key={g.id} className="flex items-center justify-between text-xs py-1 border-b border-vault-elevated/50 last:border-0">
                    <span className="text-vault-muted">{g.user}</span>
                    <span className={feedbackColor[g.feedback] || ""}>{g.feedback} ({g.correctPositions} pos)</span>
                    <span className="text-vault-muted">{new Date(g.createdAt).toLocaleTimeString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* USERS */}
        {!loading && tab === "users" && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Search by wallet or name..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchData("users")}
                className="flex-1 bg-vault-surface border border-vault-elevated rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder:text-vault-muted focus:outline-none focus:border-vault-gold"
              />
              <button onClick={() => fetchData("users")} className="px-4 py-2 bg-vault-gold text-black text-xs font-bold rounded-lg">Search</button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-vault-muted border-b border-vault-elevated">
                    <th className="text-left py-2 px-2">User</th>
                    <th className="text-left py-2 px-2">Wallet</th>
                    <th className="text-right py-2 px-2">Guesses</th>
                    <th className="text-right py-2 px-2">$BLUFF</th>
                    <th className="text-right py-2 px-2">Total Guesses</th>
                    <th className="text-right py-2 px-2">Streak</th>
                    <th className="text-left py-2 px-2">Status</th>
                    <th className="text-right py-2 px-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b border-vault-elevated/50 hover:bg-vault-surface/50">
                      <td className="py-2 px-2 font-medium">{u.displayName}</td>
                      <td className="py-2 px-2 font-mono text-vault-muted">{u.walletAddress?.slice(0, 10)}...</td>
                      <td className="py-2 px-2 text-right font-mono text-vault-gold">{u.guessBalance}</td>
                      <td className="py-2 px-2 text-right font-mono">{u.bluffBalance.toLocaleString()}</td>
                      <td className="py-2 px-2 text-right font-mono">{u._count.guesses}</td>
                      <td className="py-2 px-2 text-right font-mono">{u.streakDays}d</td>
                      <td className="py-2 px-2">
                        {u.isAdmin && <span className="text-vault-gold font-bold">ADMIN</span>}
                        {u.isBanned && <span className="text-red-400 font-bold">BANNED</span>}
                        {!u.isAdmin && !u.isBanned && <span className="text-green-400">Active</span>}
                      </td>
                      <td className="py-2 px-2 text-right space-x-1">
                        {!u.isAdmin && (
                          <>
                            {u.isBanned ? (
                              <button onClick={() => handleUserAction("unban", u.id)} className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-[10px]">Unban</button>
                            ) : (
                              <button onClick={() => handleUserAction("ban", u.id)} className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-[10px]">Ban</button>
                            )}
                            <button
                              onClick={() => {
                                const amt = prompt("Credit guesses (negative to debit):");
                                if (amt) handleUserAction("credit", u.id, parseInt(amt));
                              }}
                              className="px-2 py-1 bg-vault-gold/20 text-vault-gold rounded text-[10px]"
                            >Credit</button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* VAULTS */}
        {!loading && tab === "vaults" && (
          <div className="space-y-4">
            <button onClick={handleRotateVault} className="px-4 py-2 bg-vault-gold text-black text-xs font-bold rounded-lg">Rotate Vault</button>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-vault-muted border-b border-vault-elevated">
                    <th className="text-left py-2 px-2">ID</th>
                    <th className="text-left py-2 px-2">Digits</th>
                    <th className="text-left py-2 px-2">Hash</th>
                    <th className="text-left py-2 px-2">Started</th>
                    <th className="text-left py-2 px-2">Expires</th>
                    <th className="text-right py-2 px-2">Guesses</th>
                    <th className="text-left py-2 px-2">Status</th>
                    <th className="text-left py-2 px-2">Cracked By</th>
                  </tr>
                </thead>
                <tbody>
                  {vaults.map((v) => (
                    <tr key={v.id} className="border-b border-vault-elevated/50">
                      <td className="py-2 px-2 font-mono">{v.id.slice(0, 8)}...</td>
                      <td className="py-2 px-2">{v.codeLength}</td>
                      <td className="py-2 px-2 font-mono text-vault-muted">{v.codeHash}</td>
                      <td className="py-2 px-2">{new Date(v.startsAt).toLocaleDateString()}</td>
                      <td className="py-2 px-2">{new Date(v.expiresAt).toLocaleDateString()}</td>
                      <td className="py-2 px-2 text-right font-mono">{v.totalGuesses}</td>
                      <td className="py-2 px-2">
                        {v.isCracked ? (
                          <span className="text-green-400 font-bold">Cracked</span>
                        ) : new Date(v.expiresAt) < new Date() ? (
                          <span className="text-red-400">Expired</span>
                        ) : (
                          <span className="text-vault-gold">Active</span>
                        )}
                      </td>
                      <td className="py-2 px-2 text-vault-muted">{v.crackedBy?.displayName || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* LOGS */}
        {!loading && tab === "logs" && (
          <div className="space-y-2">
            {logs.map((l) => (
              <div key={l.id} className="flex items-start gap-3 bg-vault-surface border border-vault-elevated rounded-lg px-4 py-3 text-xs">
                <span className={`font-bold uppercase w-24 flex-shrink-0 ${
                  l.action === "guess" ? "text-blue-400" :
                  l.action === "login" ? "text-green-400" :
                  l.action === "prize_claim" ? "text-vault-gold" :
                  l.action === "referral_applied" ? "text-purple-400" :
                  "text-vault-muted"
                }`}>
                  {l.action}
                </span>
                <span className="text-vault-muted flex-shrink-0">{l.user?.displayName || "System"}</span>
                <span className="flex-1 text-zinc-400 truncate">
                  {l.details ? JSON.stringify(l.details) : "—"}
                </span>
                <span className="text-vault-muted flex-shrink-0">{new Date(l.createdAt).toLocaleString()}</span>
              </div>
            ))}
            {logs.length === 0 && <p className="text-vault-muted text-sm">No logs yet</p>}
          </div>
        )}
      </div>
    </main>
  );
}
