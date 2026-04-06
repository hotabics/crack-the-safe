"use client";

import { useState } from "react";
import { SolanaWalletButton } from "./SolanaWallet";
import { useVaultStore } from "@/stores/vaultStore";

type Chain = "evm" | "solana";

export function WalletSelector() {
  const [activeChain, setActiveChain] = useState<Chain>("evm");
  const { isAuthenticated } = useVaultStore();

  if (isAuthenticated) return null;

  return (
    <div className="bg-vault-surface border border-vault-elevated rounded-xl p-4 sm:p-6 max-w-sm mx-auto">
      <h3 className="text-sm font-bold text-zinc-100 text-center mb-3">Connect Wallet</h3>

      {/* Chain tabs */}
      <div className="flex bg-vault-black/50 rounded-lg p-1 gap-1 mb-4">
        <button
          onClick={() => setActiveChain("evm")}
          className={`flex-1 text-xs font-medium py-2 rounded-md transition-all ${
            activeChain === "evm"
              ? "bg-vault-gold text-black"
              : "text-vault-muted hover:text-zinc-300"
          }`}
        >
          EVM (ETH)
        </button>
        <button
          onClick={() => setActiveChain("solana")}
          className={`flex-1 text-xs font-medium py-2 rounded-md transition-all ${
            activeChain === "solana"
              ? "bg-[#ab9ff2] text-black"
              : "text-vault-muted hover:text-zinc-300"
          }`}
        >
          Solana
        </button>
      </div>

      {/* Chain content */}
      <div className="flex flex-col items-center gap-3">
        {activeChain === "evm" ? (
          <div className="flex flex-col items-center gap-2">
            <appkit-button />
            <p className="text-[10px] text-vault-muted">MetaMask, Coinbase, WalletConnect</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <SolanaWalletButton />
            <p className="text-[10px] text-vault-muted">Phantom, Solflare</p>
          </div>
        )}
      </div>
    </div>
  );
}
