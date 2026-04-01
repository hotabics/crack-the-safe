"use client";

import { useVaultStore } from "@/stores/vaultStore";
import { useAppKitAccount } from "@reown/appkit/react";
import { useEffect } from "react";
import { useSession } from "next-auth/react";

export function Header() {
  const {
    isAuthenticated,
    guessBalance,
    bluffBalance,
    onWalletConnected,
    onWalletDisconnected,
  } = useVaultStore();

  const { address, isConnected } = useAppKitAccount();
  const { data: session } = useSession();

  // Sync AppKit wallet state with our Zustand store
  useEffect(() => {
    if (isConnected && address && session?.address) {
      onWalletConnected(
        session.address.toLowerCase(),
        `${session.address.slice(0, 6)}...${session.address.slice(-4)}`
      );
    } else if (!isConnected) {
      onWalletDisconnected();
    }
  }, [isConnected, address, session, onWalletConnected, onWalletDisconnected]);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-vault-black/80 backdrop-blur-md border-b border-vault-elevated">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-vault-gold flex items-center justify-center">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="black"
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <span className="font-heading font-bold text-lg hidden sm:block">
            Crack the Safe
          </span>
        </div>

        {/* User Info + Wallet */}
        <div className="flex items-center gap-4">
          {isAuthenticated && (
            <div className="hidden sm:flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1.5 bg-vault-surface px-3 py-1.5 rounded-full border border-vault-elevated">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#F59E0B"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 6v6l4 2" />
                </svg>
                <span className="font-mono text-vault-gold font-medium">
                  {guessBalance}
                </span>
                <span className="text-vault-muted">guesses</span>
              </div>
              <div className="flex items-center gap-1.5 bg-vault-surface px-3 py-1.5 rounded-full border border-vault-elevated">
                <span className="font-mono text-vault-gold-light font-medium">
                  {bluffBalance.toLocaleString()}
                </span>
                <span className="text-vault-muted">$BLUFF</span>
              </div>
            </div>
          )}

          {/* Reown AppKit Connect Button */}
          <appkit-button />
        </div>
      </div>
    </header>
  );
}
