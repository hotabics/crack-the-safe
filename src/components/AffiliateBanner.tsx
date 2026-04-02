"use client";

import { motion } from "framer-motion";

export function AffiliateBanner() {
  return (
    <motion.a
      href="https://example.com/casino-partner"
      target="_blank"
      rel="noopener noreferrer sponsored"
      className="block w-full max-w-3xl mx-auto my-6"
      whileHover={{ scale: 1.01 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <div className="relative overflow-hidden rounded-xl border border-vault-gold/30 bg-gradient-to-r from-[#1a0a2e] via-[#16213e] to-[#0f3460]">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-vault-gold/5 rounded-full blur-2xl -translate-y-8 translate-x-8" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl translate-y-6 -translate-x-6" />

        <div className="relative flex items-center gap-4 px-5 py-4 sm:px-8 sm:py-5">
          {/* Casino icon */}
          <div className="flex-shrink-0">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-gradient-to-br from-vault-gold to-amber-600 flex items-center justify-center shadow-lg shadow-vault-gold/20">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2" strokeLinecap="round">
                <rect x="2" y="4" width="20" height="16" rx="3" />
                <circle cx="8" cy="12" r="2" fill="black" />
                <circle cx="16" cy="12" r="2" fill="black" />
                <circle cx="12" cy="8" r="1.5" fill="black" />
                <circle cx="12" cy="16" r="1.5" fill="black" />
              </svg>
            </div>
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-vault-gold/70 bg-vault-gold/10 px-2 py-0.5 rounded">
                Sponsor
              </span>
            </div>
            <p className="text-sm sm:text-base font-bold text-zinc-100 truncate">
              Play & Win Big at CryptoVegas
            </p>
            <p className="text-xs text-zinc-400 truncate">
              Get 200% welcome bonus + 50 free spins on your first deposit
            </p>
          </div>

          {/* CTA */}
          <div className="flex-shrink-0 hidden sm:block">
            <div className="px-4 py-2 rounded-full bg-vault-gold text-black text-xs font-bold hover:bg-vault-gold-light transition-colors">
              Claim Bonus
            </div>
          </div>

          {/* Mobile arrow */}
          <div className="flex-shrink-0 sm:hidden text-vault-gold">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
    </motion.a>
  );
}
