"use client";

import { useState } from "react";
import { useVaultStore } from "@/stores/vaultStore";
import { SolanaWalletButton } from "./SolanaWallet";

type Tab = "wallet" | "email";

export function LoginOptions() {
  const { isAuthenticated, fetchProfile, onWalletConnected } = useVaultStore();
  const [tab, setTab] = useState<Tab>("wallet");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (isAuthenticated) return null;

  const handleEmailSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.ok) {
        setStep("code");
      } else {
        setError(data.error);
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  const handleCodeVerify = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json();
      if (data.ok) {
        onWalletConnected(email, data.displayName);
        setTimeout(() => fetchProfile(), 300);
      } else {
        setError(data.error);
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const res = await fetch("/api/auth/google");
      const data = await res.json();
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      } else {
        setError(data.error || "Google login not available");
      }
    } catch {
      setError("Google login not available yet");
    }
  };

  const handleAppleLogin = async () => {
    try {
      const res = await fetch("/api/auth/apple");
      const data = await res.json();
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      } else {
        setError(data.error || "Apple login not available");
      }
    } catch {
      setError("Apple login not available yet");
    }
  };

  return (
    <div className="bg-vault-surface border border-vault-elevated rounded-xl p-5 sm:p-6 max-w-sm mx-auto">
      <h3 className="text-base font-bold text-zinc-100 text-center mb-1">Connect to Play</h3>
      <p className="text-xs text-vault-muted text-center mb-4">Choose your preferred method</p>

      {/* Method tabs */}
      <div className="flex bg-vault-black/50 rounded-lg p-1 gap-1 mb-4">
        <button
          onClick={() => setTab("wallet")}
          className={`flex-1 text-xs font-medium py-2 rounded-md transition-all ${
            tab === "wallet" ? "bg-vault-gold text-black" : "text-vault-muted hover:text-zinc-300"
          }`}
        >
          Wallet
        </button>
        <button
          onClick={() => setTab("email")}
          className={`flex-1 text-xs font-medium py-2 rounded-md transition-all ${
            tab === "email" ? "bg-vault-gold text-black" : "text-vault-muted hover:text-zinc-300"
          }`}
        >
          Email / Social
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 text-xs text-red-400 mb-3">
          {error}
        </div>
      )}

      {/* Wallet tab */}
      {tab === "wallet" && (
        <div className="flex flex-col items-center gap-3">
          <appkit-button />
          <p className="text-[10px] text-vault-muted">MetaMask, Coinbase, WalletConnect</p>

          <div className="w-full border-t border-vault-elevated my-1" />

          <SolanaWalletButton />
          <p className="text-[10px] text-vault-muted">Phantom, Solflare</p>
        </div>
      )}

      {/* Email / Social tab */}
      {tab === "email" && (
        <div className="space-y-3">
          {/* Google & Apple */}
          <div className="flex gap-2">
            <button
              onClick={handleGoogleLogin}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-white text-black text-xs font-medium hover:bg-zinc-100 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google
            </button>

            <button
              onClick={handleAppleLogin}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-black text-white text-xs font-medium border border-zinc-700 hover:bg-zinc-900 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
              </svg>
              Apple
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-vault-elevated" />
            <span className="text-[10px] text-vault-muted">or with email</span>
            <div className="flex-1 h-px bg-vault-elevated" />
          </div>

          {/* Email OTP */}
          {step === "email" ? (
            <div className="space-y-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleEmailSubmit()}
                placeholder="your@email.com"
                className="w-full bg-vault-black border border-vault-elevated rounded-lg px-3 py-2.5 text-sm text-zinc-100 placeholder:text-vault-muted focus:outline-none focus:border-vault-gold"
              />
              <button
                onClick={handleEmailSubmit}
                disabled={loading || !email.includes("@")}
                className="w-full py-2.5 bg-vault-gold text-black text-xs font-bold rounded-lg hover:bg-vault-gold-light disabled:opacity-50 transition-colors"
              >
                {loading ? "Sending..." : "Send Code"}
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-vault-muted text-center">
                Enter the 6-digit code sent to <span className="text-zinc-300">{email}</span>
              </p>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                onKeyDown={(e) => e.key === "Enter" && code.length === 6 && handleCodeVerify()}
                placeholder="000000"
                maxLength={6}
                className="w-full bg-vault-black border border-vault-elevated rounded-lg px-3 py-2.5 text-sm text-zinc-100 text-center font-mono tracking-widest placeholder:text-vault-muted focus:outline-none focus:border-vault-gold"
              />
              <button
                onClick={handleCodeVerify}
                disabled={loading || code.length !== 6}
                className="w-full py-2.5 bg-vault-gold text-black text-xs font-bold rounded-lg hover:bg-vault-gold-light disabled:opacity-50 transition-colors"
              >
                {loading ? "Verifying..." : "Verify & Sign In"}
              </button>
              <button
                onClick={() => { setStep("email"); setCode(""); setError(null); }}
                className="w-full text-xs text-vault-muted hover:text-zinc-300 transition-colors"
              >
                Use different email
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
