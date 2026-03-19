"use client";

import { useState, useEffect } from "react";
import { useVaultStore } from "@/stores/vaultStore";

function formatTime(ms: number) {
  if (ms <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  return { days, hours, minutes, seconds };
}

function TimeUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="font-mono text-xl sm:text-2xl font-bold text-zinc-100 tabular-nums">
        {String(value).padStart(2, "0")}
      </span>
      <span className="text-[10px] uppercase tracking-wider text-vault-muted mt-0.5">
        {label}
      </span>
    </div>
  );
}

export function CountdownTimer() {
  const { vaultExpiresAt } = useVaultStore();
  const [timeLeft, setTimeLeft] = useState(vaultExpiresAt - Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(vaultExpiresAt - Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, [vaultExpiresAt]);

  const { days, hours, minutes, seconds } = formatTime(timeLeft);

  return (
    <div className="bg-vault-surface rounded-xl border border-vault-elevated p-4">
      <div className="text-center">
        <p className="text-xs text-vault-muted uppercase tracking-wider mb-3">
          Code rotates in
        </p>
        <div className="flex items-center justify-center gap-3">
          <TimeUnit value={days} label="days" />
          <span className="text-zinc-600 text-xl font-light">:</span>
          <TimeUnit value={hours} label="hrs" />
          <span className="text-zinc-600 text-xl font-light">:</span>
          <TimeUnit value={minutes} label="min" />
          <span className="text-zinc-600 text-xl font-light">:</span>
          <TimeUnit value={seconds} label="sec" />
        </div>
      </div>
    </div>
  );
}
