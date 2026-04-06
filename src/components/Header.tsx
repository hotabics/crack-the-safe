"use client";

import { useVaultStore } from "@/stores/vaultStore";
import { useAppKitAccount } from "@reown/appkit/react";
import { useEffect, useRef, useState, useCallback } from "react";
import { useWalletClient } from "wagmi";
import { useBluffBalance } from "@/hooks/useBluffBalance";
import Link from "next/link";

export function Header() {
  const {
    isAuthenticated,
    guessBalance,
    bluffBalance,
    onWalletConnected,
    onWalletDisconnected,
    fetchProfile,
  } = useVaultStore();

  const { address, isConnected } = useAppKitAccount();
  const { data: walletClient } = useWalletClient();
  const { balance: onChainBluff } = useBluffBalance(address);
  const siweAttempted = useRef(false);
  const [signingIn, setSigningIn] = useState(false);

  const doSignIn = useCallback(async () => {
    if (!address || !walletClient || signingIn) return;
    siweAttempted.current = true;
    setSigningIn(true);

    try {
      // 1. Get nonce from server
      const nonceRes = await fetch("/api/auth/nonce");
      const { nonce } = await nonceRes.json();
      if (!nonce) throw new Error("No nonce");

      // 2. Build EIP-4361 message
      const domain = window.location.host;
      const uri = window.location.origin;
      const message = [
        `${domain} wants you to sign in with your Ethereum account:`,
        address,
        "",
        "Sign in to Crack the Safe",
        "",
        `URI: ${uri}`,
        `Version: 1`,
        `Chain ID: 1`,
        `Nonce: ${nonce}`,
        `Issued At: ${new Date().toISOString()}`,
      ].join("\n");

      // 3. Request signature from wallet
      const signature = await walletClient.signMessage({ message });

      // 4. Verify on server
      const verifyRes = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, signature, address }),
      });

      const data = await verifyRes.json();

      if (data.ok) {
        onWalletConnected(
          data.address,
          data.displayName
        );
        // Fetch full profile after short delay for cookie to set
        setTimeout(() => fetchProfile(), 300);
      } else {
        console.error("[Auth] Verify failed:", data.error);
        siweAttempted.current = false;
      }
    } catch (e) {
      console.error("[Auth] Sign-in error:", e);
      siweAttempted.current = false;
    } finally {
      setSigningIn(false);
    }
  }, [address, walletClient, signingIn, onWalletConnected, fetchProfile]);

  // Auto-trigger sign-in when wallet and walletClient are both ready
  useEffect(() => {
    if (
      isConnected &&
      address &&
      walletClient &&
      !isAuthenticated &&
      !siweAttempted.current &&
      !signingIn
    ) {
      doSignIn();
    }
    if (!isConnected) {
      siweAttempted.current = false;
      if (isAuthenticated) {
        onWalletDisconnected();
      }
    }
  }, [isConnected, address, walletClient, isAuthenticated, signingIn, doSignIn, onWalletDisconnected]);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-vault-black/80 backdrop-blur-md border-b border-vault-elevated">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-vault-gold flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2.5" strokeLinecap="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <span className="font-heading font-bold text-lg hidden sm:block">Crack the Safe</span>
        </Link>

        {/* User Info + Wallet */}
        <div className="flex items-center gap-3">
          {isAuthenticated && (
            <div className="hidden sm:flex items-center gap-3 text-sm">
              <div className="flex items-center gap-1.5 bg-vault-surface px-3 py-1.5 rounded-full border border-vault-elevated">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
                </svg>
                <span className="font-mono text-vault-gold font-medium">{guessBalance}</span>
                <span className="text-vault-muted">guesses</span>
              </div>
              <div className="flex items-center gap-1.5 bg-vault-surface px-3 py-1.5 rounded-full border border-vault-elevated">
                <span className="font-mono text-vault-gold-light font-medium">
                  {onChainBluff > 0
                    ? Math.floor(onChainBluff).toLocaleString()
                    : bluffBalance.toLocaleString()}
                </span>
                <span className="text-vault-muted">$BLUFF</span>
                {onChainBluff > 0 && bluffBalance > 0 && (
                  <span className="text-vault-muted text-[10px]" title="In-game balance">
                    +{bluffBalance.toLocaleString()}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Manual sign-in button */}
          {isConnected && !isAuthenticated && !signingIn && (
            <button
              onClick={() => { siweAttempted.current = false; doSignIn(); }}
              className="text-xs font-bold px-3 py-1.5 rounded-full bg-vault-gold text-black hover:bg-vault-gold-light transition-colors"
            >
              Sign In
            </button>
          )}
          {signingIn && (
            <span className="text-xs text-vault-gold animate-pulse">Signing...</span>
          )}

          <Link href="/terms" className="text-xs text-vault-muted hover:text-zinc-300 transition-colors hidden sm:block">
            How to Play
          </Link>

          <appkit-button />
        </div>
      </div>
    </header>
  );
}
