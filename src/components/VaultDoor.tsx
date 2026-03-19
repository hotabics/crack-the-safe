"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useVaultStore } from "@/stores/vaultStore";

export function VaultDoor() {
  const { isVaultCracked, heatLevel } = useVaultStore();

  const glowIntensity = heatLevel / 4;
  const glowColor = `rgba(245, 158, 11, ${0.1 + glowIntensity * 0.4})`;

  return (
    <div className="relative flex items-center justify-center">
      {/* Ambient glow behind vault */}
      <motion.div
        className="absolute w-72 h-72 sm:w-96 sm:h-96 rounded-full blur-3xl"
        animate={{
          backgroundColor: glowColor,
          scale: isVaultCracked ? 1.5 : 1 + glowIntensity * 0.2,
        }}
        transition={{ duration: 1, ease: "easeInOut" }}
      />

      {/* Vault body */}
      <motion.div
        className="relative w-64 h-64 sm:w-80 sm:h-80 rounded-2xl border-4 border-zinc-600 overflow-hidden"
        style={{
          background:
            "linear-gradient(145deg, #27272a 0%, #18181b 50%, #0f0f10 100%)",
          boxShadow: `0 0 ${20 + heatLevel * 15}px ${glowColor}, inset 0 2px 0 rgba(255,255,255,0.05)`,
        }}
        animate={
          isVaultCracked
            ? { rotateY: -30, x: -50, opacity: 0.8 }
            : { rotateY: 0, x: 0 }
        }
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        {/* Metal texture lines */}
        <div className="absolute inset-0 opacity-10">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-full h-px bg-zinc-400"
              style={{ top: `${(i + 1) * 12}%` }}
            />
          ))}
        </div>

        {/* Vault dial */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            className="w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 border-zinc-500 flex items-center justify-center"
            style={{
              background:
                "radial-gradient(circle, #27272a 0%, #18181b 70%, #0f0f10 100%)",
              boxShadow:
                "inset 0 2px 4px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.05)",
            }}
            animate={
              isVaultCracked ? { rotate: 720 } : { rotate: 0 }
            }
            transition={{ duration: 1.5, ease: "easeOut" }}
          >
            {/* Inner dial */}
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-2 border-zinc-600 flex items-center justify-center relative">
              {/* Dial markers */}
              {Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={i}
                  className="absolute w-0.5 h-3 bg-zinc-500"
                  style={{
                    transform: `rotate(${i * 30}deg) translateY(-36px)`,
                    transformOrigin: "center center",
                  }}
                />
              ))}
              {/* Center dot */}
              <div
                className="w-4 h-4 rounded-full"
                style={{
                  background: isVaultCracked
                    ? "#22C55E"
                    : heatLevel > 0
                      ? "#F59E0B"
                      : "#3f3f46",
                  boxShadow: isVaultCracked
                    ? "0 0 10px #22C55E"
                    : heatLevel > 0
                      ? `0 0 ${heatLevel * 5}px #F59E0B`
                      : "none",
                }}
              />
            </div>
          </motion.div>
        </div>

        {/* Corner bolts */}
        {[
          "top-3 left-3",
          "top-3 right-3",
          "bottom-3 left-3",
          "bottom-3 right-3",
        ].map((pos) => (
          <div
            key={pos}
            className={`absolute ${pos} w-4 h-4 rounded-full bg-zinc-700 border border-zinc-600`}
            style={{
              boxShadow: "inset 0 1px 2px rgba(0,0,0,0.5)",
            }}
          />
        ))}

        {/* Handle bar */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 w-3 h-20 rounded-full bg-zinc-600 border border-zinc-500" />
      </motion.div>

      {/* Cracked overlay */}
      <AnimatePresence>
        {isVaultCracked && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <div className="text-center">
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-4xl sm:text-6xl font-heading font-bold text-vault-gold text-shadow-gold"
              >
                CRACKED!
              </motion.div>
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="text-xl sm:text-2xl font-mono text-vault-gold-light mt-2"
              >
                1,000,000 $BLUFF
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
