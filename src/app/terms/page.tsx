import Link from "next/link";

export const metadata = {
  title: "How to Play — Crack the Safe",
  description: "Learn how to play Crack the Safe, earn guesses, and win 1,000,000 $BLUFF tokens.",
};

export default function TermsPage() {
  return (
    <main className="pt-20 pb-12 px-4 sm:px-6 max-w-3xl mx-auto">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-vault-gold hover:text-vault-gold-light text-sm mb-8 transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Back to Vault
      </Link>

      <h1 className="font-heading font-bold text-3xl sm:text-4xl text-zinc-100 mb-8">
        How to Play
      </h1>

      {/* The Game */}
      <section className="mb-10">
        <h2 className="font-heading font-bold text-xl text-vault-gold mb-4">The Game</h2>
        <div className="text-zinc-300 space-y-3 text-sm leading-relaxed">
          <p>
            A <strong className="text-zinc-100">4-digit secret code</strong> is locked inside the vault.
            Your goal is simple: guess the code and win <strong className="text-vault-gold">1,000,000 $BLUFF tokens</strong>.
          </p>
          <p>
            The code is generated server-side, hashed with SHA-256, and never exposed to anyone
            — not even the frontend. Every guess is evaluated on the server using constant-time
            comparison to prevent timing attacks. This is a fair game.
          </p>
          <p>
            Each vault lasts <strong className="text-zinc-100">7 days</strong>. If nobody cracks it,
            the prize rolls over to the next vault.
          </p>
        </div>
      </section>

      {/* How Guessing Works */}
      <section className="mb-10">
        <h2 className="font-heading font-bold text-xl text-vault-gold mb-4">How Guessing Works</h2>
        <div className="text-zinc-300 space-y-3 text-sm leading-relaxed">
          <p>
            Enter a 4-digit code (0000–9999). After each guess, you get feedback:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-4">
            <div className="bg-vault-surface border border-vault-elevated rounded-lg p-4 text-center">
              <div className="text-2xl mb-1">🧊</div>
              <p className="font-bold text-blue-400 text-sm">Cold</p>
              <p className="text-xs text-vault-muted mt-1">No digits match at all</p>
            </div>
            <div className="bg-vault-surface border border-vault-elevated rounded-lg p-4 text-center">
              <div className="text-2xl mb-1">🔥</div>
              <p className="font-bold text-orange-400 text-sm">Warm</p>
              <p className="text-xs text-vault-muted mt-1">Right digit(s), wrong position</p>
            </div>
            <div className="bg-vault-surface border border-vault-elevated rounded-lg p-4 text-center">
              <div className="text-2xl mb-1">💥</div>
              <p className="font-bold text-red-400 text-sm">Hot</p>
              <p className="text-xs text-vault-muted mt-1">Right digit(s) in the right spot</p>
            </div>
          </div>
          <p>
            You also see how many digits are <strong className="text-zinc-100">correct position</strong> and how many are <strong className="text-zinc-100">correct but wrong position</strong> — use this to narrow down the code.
          </p>
          <p>
            Each guess costs <strong className="text-zinc-100">1 guess attempt</strong>. When you run out, earn more through tasks below.
          </p>
        </div>
      </section>

      {/* Earning Guesses */}
      <section className="mb-10">
        <h2 className="font-heading font-bold text-xl text-vault-gold mb-4">Earning Guess Attempts</h2>
        <div className="text-zinc-300 text-sm leading-relaxed">
          <p className="mb-4">
            When you first connect your wallet, you receive <strong className="text-vault-gold">5 free guess attempts</strong>.
            After that, earn more through these tasks:
          </p>

          <div className="space-y-2">
            <h3 className="font-semibold text-zinc-100 text-sm mt-4 mb-2">Daily Tasks</h3>
            <TaskRow name="Daily Login" reward={1} description="Visit and claim once per day" />
            <TaskRow name="7-Day Streak" reward={10} description="Login 7 consecutive days — claim the bonus on day 7+" />

            <h3 className="font-semibold text-zinc-100 text-sm mt-4 mb-2">Quests (One-time)</h3>
            <TaskRow name="Follow on X" reward={2} description="Follow @CrackTheSafe on X (Twitter)" />
            <TaskRow name="Join Discord" reward={3} description="Join our Discord community" />
            <TaskRow name="Refer a Friend" reward={3} description="Share your referral link and get a friend to sign up" />
            <TaskRow name="Hold 100+ $BLUFF" reward={5} description="Verify you hold 100+ $BLUFF tokens in your wallet" />

            <h3 className="font-semibold text-zinc-100 text-sm mt-4 mb-2">Bonus</h3>
            <TaskRow name="Share Your Closest Guess" reward={2} description="Post your best attempt on X" />
            <TaskRow name="Community Milestone: 10K Attempts" reward={5} description="Unlocks when 10,000 total guesses are made globally" />
          </div>
        </div>
      </section>

      {/* Hint Board */}
      <section className="mb-10">
        <h2 className="font-heading font-bold text-xl text-vault-gold mb-4">The Hint Board</h2>
        <div className="text-zinc-300 space-y-3 text-sm leading-relaxed">
          <p>
            Every guess from every player feeds into the <strong className="text-zinc-100">public Hint Board</strong>.
            The actual guessed code is hidden (shown as &quot;????&quot;), but you can see the feedback:
            how many correct positions and correct digits each guess had.
          </p>
          <p>
            Use this to your advantage — if someone got 3 correct positions, the code is almost cracked!
          </p>
        </div>
      </section>

      {/* Heat Meter */}
      <section className="mb-10">
        <h2 className="font-heading font-bold text-xl text-vault-gold mb-4">Heat Meter</h2>
        <div className="text-zinc-300 space-y-3 text-sm leading-relaxed">
          <p>
            The Heat Meter shows how close the community has gotten to cracking the vault.
            It tracks the best guess so far — the most correct positions anyone has achieved.
          </p>
        </div>
      </section>

      {/* Security & Fairness */}
      <section className="mb-10">
        <h2 className="font-heading font-bold text-xl text-vault-gold mb-4">Security & Fairness</h2>
        <div className="text-zinc-300 space-y-3 text-sm leading-relaxed">
          <p>We take fairness seriously:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>The vault code is <strong className="text-zinc-100">never sent to the browser</strong></li>
            <li>All guesses are evaluated <strong className="text-zinc-100">server-side</strong> with constant-time comparison</li>
            <li>Guess balance is tracked atomically in the database — no double-spending</li>
            <li>Rate limiting prevents brute-force attacks (1 guess per 10 seconds)</li>
            <li>All authentication uses <strong className="text-zinc-100">SIWE (Sign In With Ethereum)</strong> — your wallet is your identity</li>
          </ul>
        </div>
      </section>

      {/* Terms of Use */}
      <section className="mb-10">
        <h2 className="font-heading font-bold text-xl text-vault-gold mb-4">Terms of Use</h2>
        <div className="text-zinc-300 space-y-3 text-sm leading-relaxed">
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>One account per wallet address. Multi-accounting may result in a ban.</li>
            <li>Automated guessing tools, bots, or scripts are prohibited.</li>
            <li>The $BLUFF prize is distributed on-chain to the winner&apos;s connected wallet.</li>
            <li>We reserve the right to modify game rules, reset vaults, or adjust prizes at any time.</li>
            <li>Play responsibly. This is a game — have fun!</li>
          </ul>
        </div>
      </section>

      <div className="text-center mt-12">
        <Link
          href="/"
          className="inline-block bg-vault-gold text-black font-bold px-6 py-3 rounded-full hover:bg-vault-gold-light transition-colors"
        >
          Start Playing
        </Link>
      </div>
    </main>
  );
}

function TaskRow({ name, reward, description }: { name: string; reward: number; description: string }) {
  return (
    <div className="flex items-center justify-between bg-vault-surface border border-vault-elevated rounded-lg px-4 py-3">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-zinc-200">{name}</p>
        <p className="text-xs text-vault-muted">{description}</p>
      </div>
      <span className="font-mono text-sm text-vault-gold font-bold ml-3 flex-shrink-0">+{reward}</span>
    </div>
  );
}
