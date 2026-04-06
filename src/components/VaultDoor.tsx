"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useVaultStore } from "@/stores/vaultStore";
import { useEffect, useRef } from "react";
import confetti from "canvas-confetti";

export function VaultDoor() {
  const { isVaultCracked, heatLevel, codeLength } = useVaultStore();
  const confettiFired = useRef(false);

  const maxHeat = codeLength || 6;
  const glowIntensity = heatLevel / maxHeat;
  const glowColor = `rgba(245, 158, 11, ${0.1 + glowIntensity * 0.4})`;

  // Fire confetti when vault is cracked
  useEffect(() => {
    if (isVaultCracked && !confettiFired.current) {
      confettiFired.current = true;

      // Initial burst
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.5 },
        colors: ["#F59E0B", "#FFD700", "#FFA500", "#FF6347", "#22C55E"],
      });

      // Gold coin rain
      setTimeout(() => {
        confetti({
          particleCount: 80,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ["#F59E0B", "#FFD700", "#DAA520"],
        });
        confetti({
          particleCount: 80,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ["#F59E0B", "#FFD700", "#DAA520"],
        });
      }, 500);

      // Extra sparkle
      setTimeout(() => {
        confetti({
          particleCount: 50,
          spread: 120,
          origin: { y: 0.3 },
          colors: ["#FFFFFF", "#F59E0B", "#22C55E"],
          shapes: ["circle"],
          scalar: 0.8,
        });
      }, 1200);
    }
  }, [isVaultCracked]);

  return (
    <div className="relative flex items-center justify-center">
      {/* Ambient glow behind vault */}
      <motion.div
        className="absolute w-72 h-72 sm:w-96 sm:h-96 rounded-full blur-3xl"
        animate={{
          backgroundColor: isVaultCracked
            ? "rgba(34, 197, 94, 0.3)"
            : glowColor,
          scale: isVaultCracked ? 1.8 : 1 + glowIntensity * 0.2,
        }}
        transition={{ duration: 1, ease: "easeInOut" }}
      />

      {/* Vault body */}
      <motion.div
        className="relative w-64 h-64 sm:w-80 sm:h-80 rounded-2xl border-4 overflow-hidden"
        style={{
          background:
            "linear-gradient(145deg, #27272a 0%, #18181b 50%, #0f0f10 100%)",
          boxShadow: isVaultCracked
            ? "0 0 60px rgba(34, 197, 94, 0.4), inset 0 2px 0 rgba(255,255,255,0.05)"
            : `0 0 ${20 + heatLevel * 15}px ${glowColor}, inset 0 2px 0 rgba(255,255,255,0.05)`,
          borderColor: isVaultCracked ? "#22C55E" : "#52525b",
        }}
        animate={
          isVaultCracked
            ? {
                rotateY: [-5, 5, -3, 3, 0, -30],
                x: [0, -5, 5, -3, 3, -60],
                transition: { duration: 1.2, times: [0, 0.1, 0.2, 0.3, 0.4, 1] },
              }
            : { rotateY: 0, x: 0 }
        }
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
              isVaultCracked
                ? { rotate: [0, -20, 720], transition: { duration: 1.5, ease: "easeOut" } }
                : { rotate: 0 }
            }
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
              <motion.div
                className="w-4 h-4 rounded-full"
                animate={{
                  backgroundColor: isVaultCracked
                    ? "#22C55E"
                    : heatLevel > 0
                      ? "#F59E0B"
                      : "#3f3f46",
                  boxShadow: isVaultCracked
                    ? "0 0 15px #22C55E, 0 0 30px #22C55E"
                    : heatLevel > 0
                      ? `0 0 ${heatLevel * 5}px #F59E0B`
                      : "none",
                }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </motion.div>
        </div>

        {/* Corner bolts */}
        {["top-3 left-3", "top-3 right-3", "bottom-3 left-3", "bottom-3 right-3"].map((pos) => (
          <div
            key={pos}
            className={`absolute ${pos} w-4 h-4 rounded-full bg-zinc-700 border border-zinc-600`}
            style={{ boxShadow: "inset 0 1px 2px rgba(0,0,0,0.5)" }}
          />
        ))}

        {/* Handle bar */}
        <motion.div
          className="absolute right-4 top-1/2 -translate-y-1/2 w-3 h-20 rounded-full bg-zinc-600 border border-zinc-500"
          animate={
            isVaultCracked
              ? { rotate: 90, originX: 0.5, originY: 0.5 }
              : { rotate: 0 }
          }
          transition={{ duration: 0.5, delay: 0.3 }}
        />

        {/* Light beam from inside when cracked */}
        <AnimatePresence>
          {isVaultCracked && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.6, 0.3] }}
              transition={{ duration: 2, times: [0, 0.3, 1] }}
              className="absolute inset-0"
              style={{
                background: "radial-gradient(circle at 70% 50%, rgba(245,158,11,0.4) 0%, transparent 60%)",
              }}
            />
          )}
        </AnimatePresence>
      </motion.div>

      {/* Cracked overlay text */}
      <AnimatePresence>
        {isVaultCracked && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.8 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
          >
            <div className="text-center">
              <motion.div
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1.0, type: "spring" }}
                className="text-4xl sm:text-6xl font-heading font-bold text-vault-gold"
                style={{ textShadow: "0 0 30px rgba(245,158,11,0.6), 0 0 60px rgba(245,158,11,0.3)" }}
              >
                CRACKED!
              </motion.div>
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1.3, type: "spring" }}
                className="text-xl sm:text-2xl font-mono text-vault-gold-light mt-2"
              >
                1,000,000 $BLUFF
              </motion.div>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 1.6, type: "spring", stiffness: 300 }}
                className="mt-4 inline-block px-6 py-2 bg-green-500 text-black font-bold text-sm rounded-full"
              >
                YOU WIN!
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
