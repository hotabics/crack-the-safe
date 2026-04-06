"use client";

import { useState, useCallback } from "react";
import { useVaultStore } from "@/stores/vaultStore";

export function SolanaWalletButton() {
  const { isAuthenticated, onWalletConnected, fetchProfile } = useVaultStore();
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connectPhantom = useCallback(async () => {
    setConnecting(true);
    setError(null);

    try {
      // Check if Phantom is installed
      const phantom = (window as unknown as { solana?: { isPhantom: boolean; connect: () => Promise<{ publicKey: { toString: () => string } }>; signMessage: (msg: Uint8Array, encoding: string) => Promise<{ signature: Uint8Array }> } }).solana;

      if (!phantom?.isPhantom) {
        setError("Phantom wallet not found. Install it from phantom.app");
        setConnecting(false);
        return;
      }

      // Connect
      const resp = await phantom.connect();
      const publicKey = resp.publicKey.toString();

      // Get nonce
      const nonceRes = await fetch("/api/auth/nonce");
      const { nonce } = await nonceRes.json();

      // Build message
      const domain = window.location.host;
      const message = [
        `${domain} wants you to sign in with your Solana account:`,
        publicKey,
        "",
        "Sign in to Crack the Safe",
        "",
        `Nonce: ${nonce}`,
        `Issued At: ${new Date().toISOString()}`,
      ].join("\n");

      // Sign
      const encodedMsg = new TextEncoder().encode(message);
      const { signature } = await phantom.signMessage(encodedMsg, "utf8");

      // Convert signature to base58
      const bs58Module = await import("bs58");
      const signatureB58 = bs58Module.default.encode(signature);

      // Verify
      const verifyRes = await fetch("/api/auth/verify-solana", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, signature: signatureB58, publicKey }),
      });

      const data = await verifyRes.json();

      if (data.ok) {
        onWalletConnected(data.address, data.displayName);
        setTimeout(() => fetchProfile(), 300);
      } else {
        setError(data.error || "Verification failed");
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Connection failed";
      setError(msg);
    } finally {
      setConnecting(false);
    }
  }, [onWalletConnected, fetchProfile]);

  if (isAuthenticated) return null;

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={connectPhantom}
        disabled={connecting}
        className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#ab9ff2] text-black
                   font-bold text-xs hover:bg-[#9b8fe2] disabled:opacity-50 transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 128 128" fill="currentColor">
          <path d="M64 0C28.7 0 0 28.7 0 64s28.7 64 64 64 64-28.7 64-64S99.3 0 64 0zm0 112c-26.5 0-48-21.5-48-48S37.5 16 64 16s48 21.5 48 48-21.5 48-48 48z"/>
        </svg>
        {connecting ? "Connecting..." : "Phantom (Solana)"}
      </button>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
