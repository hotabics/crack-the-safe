"use client";

import { useState } from "react";
import { Header } from "@/components/Header";
import { VaultDoor } from "@/components/VaultDoor";
import { SafeDial } from "@/components/SafeDial";
import { HeatMeter } from "@/components/HeatMeter";
import { HintBoard } from "@/components/HintBoard";
import { GuessHistory } from "@/components/GuessHistory";
import { CountdownTimer } from "@/components/CountdownTimer";
import { TaskList } from "@/components/TaskList";
import { HowItWorks } from "@/components/HowItWorks";
import { Stats } from "@/components/Stats";

type Tab = "hints" | "history" | "tasks";

export default function Home() {
  const [mobileTab, setMobileTab] = useState<Tab>("hints");

  return (
    <>
      <Header />
      <main className="pt-20 pb-12 px-4 sm:px-6 max-w-7xl mx-auto">
        {/* Hero section - Vault */}
        <section className="flex flex-col items-center gap-6 mb-10">
          {/* Prize label */}
          <div className="text-center">
            <h1 className="font-heading font-bold text-3xl sm:text-5xl text-zinc-100 mb-2">
              <span className="text-vault-gold text-shadow-gold">
                1,000,000
              </span>{" "}
              $BLUFF
            </h1>
            <p className="text-vault-muted text-sm">
              Locked inside. Crack the 4-digit code to win.
            </p>
          </div>

          {/* Vault visual */}
          <VaultDoor />

          {/* Dial input */}
          <SafeDial />

          {/* Heat meter */}
          <HeatMeter />

          {/* Stats */}
          <Stats />
        </section>

        {/* Desktop layout: 3 columns */}
        <section className="hidden lg:grid grid-cols-3 gap-6 mb-10">
          <div className="space-y-6">
            <HintBoard />
            <HowItWorks />
          </div>
          <div>
            <TaskList />
          </div>
          <div className="space-y-6">
            <GuessHistory />
            <CountdownTimer />
          </div>
        </section>

        {/* Tablet layout: 2 columns */}
        <section className="hidden sm:grid lg:hidden grid-cols-2 gap-6 mb-10">
          <div className="space-y-6">
            <HintBoard />
            <GuessHistory />
          </div>
          <div className="space-y-6">
            <TaskList />
            <CountdownTimer />
            <HowItWorks />
          </div>
        </section>

        {/* Mobile layout: tabbed */}
        <section className="sm:hidden">
          <CountdownTimer />

          {/* Tab bar */}
          <div className="flex bg-vault-surface rounded-lg p-1 gap-1 mt-6 mb-4 border border-vault-elevated">
            {(["hints", "history", "tasks"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setMobileTab(tab)}
                className={`flex-1 text-xs font-medium py-2 rounded-md transition-all capitalize ${
                  mobileTab === tab
                    ? "bg-vault-gold text-black"
                    : "text-vault-muted hover:text-zinc-300"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="space-y-6">
            {mobileTab === "hints" && (
              <>
                <HintBoard />
                <HowItWorks />
              </>
            )}
            {mobileTab === "history" && <GuessHistory />}
            {mobileTab === "tasks" && <TaskList />}
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-16 text-center text-xs text-vault-muted border-t border-vault-elevated pt-6">
          <p>Crack the Safe &mdash; A $BLUFF Experience</p>
          <p className="mt-1">
            The vault code is generated server-side and never exposed. Play
            fair.
          </p>
        </footer>
      </main>
    </>
  );
}
