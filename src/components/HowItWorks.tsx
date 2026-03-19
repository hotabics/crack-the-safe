"use client";

const steps = [
  {
    number: "01",
    title: "Connect Wallet",
    description: "Link your MetaMask, Phantom, or any supported wallet",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="2" y="6" width="20" height="14" rx="2" />
        <path d="M22 10H2" />
        <circle cx="16" cy="14" r="2" />
      </svg>
    ),
  },
  {
    number: "02",
    title: "Complete Tasks",
    description: "Daily logins, quests, and referrals earn you guess attempts",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M9 11l3 3L22 4" />
        <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
      </svg>
    ),
  },
  {
    number: "03",
    title: "Crack the Code",
    description: "Enter 4 digits, get hot/cold feedback, win 1M $BLUFF",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="3" y="11" width="18" height="11" rx="2" />
        <path d="M7 11V7a5 5 0 0110 0v4" />
      </svg>
    ),
  },
];

export function HowItWorks() {
  return (
    <div className="bg-vault-surface rounded-xl border border-vault-elevated p-4 sm:p-6">
      <h3 className="font-heading font-semibold text-sm text-zinc-300 mb-4 uppercase tracking-wider">
        How It Works
      </h3>
      <div className="space-y-4">
        {steps.map((step) => (
          <div key={step.number} className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-vault-elevated border border-zinc-700 flex items-center justify-center text-vault-gold">
              {step.icon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-vault-gold">
                  {step.number}
                </span>
                <h4 className="text-sm font-semibold text-zinc-200">
                  {step.title}
                </h4>
              </div>
              <p className="text-xs text-vault-muted mt-0.5">
                {step.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
