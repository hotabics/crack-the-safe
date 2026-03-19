# Crack the Safe — Development TODO

## Priority Legend
- 🔴 Critical (must have before launch)
- 🟡 Important (should have for launch)
- 🟢 Nice to have (post-launch iteration)

---

## Phase 1: Infrastructure & Security (Week 1-2)
🔴 **These must be completed before any public launch.**

### Database Setup
- [ ] 🔴 Set up PostgreSQL (Neon or Supabase recommended for Vercel)
- [ ] 🔴 Create all tables: users, wallets, vaults, guesses, guess_ledger, tasks, task_completions, auth_nonces, token_transactions
- [ ] 🔴 Add indexes on hot paths (guesses by vault_id, ledger by user_id, wallets by address)
- [ ] 🔴 Set up database migrations (use Prisma or Drizzle ORM)
- [ ] 🟡 Add connection pooling (PgBouncer or Neon's built-in pooler)

### Server-Side Vault Code
- [ ] 🔴 **Move secret code generation to server** — currently exposed in client-side Zustand store
- [ ] 🔴 Store vault code in external secrets manager (Vercel env vars minimum, AWS SSM or HashiCorp Vault for production)
- [ ] 🔴 Implement server-side guess evaluation in API route (never send code to client)
- [ ] 🔴 Use constant-time comparison to prevent timing side-channel attacks
- [ ] 🔴 Hash stored code with salt (SHA-256) — plaintext only in memory during evaluation

### API Routes (Replace Client-Side Logic)
- [ ] 🔴 `POST /api/vault/guess` — validate auth, check balance, evaluate guess, return feedback only
- [ ] 🔴 `GET /api/vault/current` — return vault metadata (no code), heat level, expiry time
- [ ] 🔴 `GET /api/vault/hints` — return last 50 anonymous guesses with feedback
- [ ] 🔴 `GET /api/user/profile` — return guess balance, $BLUFF balance, streak
- [ ] 🔴 `POST /api/tasks/:id/claim` — validate and credit guesses atomically
- [ ] 🟡 `GET /api/vault/heat` — current heat meter level
- [ ] 🟡 `GET /api/user/guesses` — paginated user guess history

### Rate Limiting & Anti-Abuse
- [ ] 🔴 Add rate limiting on `/api/vault/guess` (max 1 guess per 10 seconds per user)
- [ ] 🔴 Add global rate limiting on all API routes (use Upstash Ratelimit or similar)
- [ ] 🔴 Wrap guess submission in a DB transaction (prevent race conditions on balance)
- [ ] 🟡 Add CAPTCHA (hCaptcha or Turnstile) after 3 rapid guesses
- [ ] 🟡 Device fingerprinting to detect multi-accounting
- [ ] 🟡 IP-based rate limiting as secondary defense

---

## Phase 2: Web3 Wallet Authentication (Week 2-3)

### EVM (MetaMask, Coinbase, WalletConnect)
- [ ] 🔴 Install wagmi, viem, @rainbow-me/rainbowkit, siwe
- [ ] 🔴 Create Web3Provider with RainbowKit config (mainnet, Base, Arbitrum, Polygon)
- [ ] 🔴 Get WalletConnect Project ID from https://cloud.walletconnect.com
- [ ] 🔴 Implement SIWE (Sign In With Ethereum) nonce flow:
  - [ ] `GET /api/auth/nonce` — generate and store one-time nonce (10min expiry)
  - [ ] `POST /api/auth/verify/evm` — verify ECDSA signature, mark nonce used, create session
- [ ] 🔴 Replace the fake `connectWallet()` in Header.tsx with real RainbowKit ConnectButton

### Solana (Phantom, Solflare)
- [ ] 🟡 Install @solana/wallet-adapter-react, tweetnacl
- [ ] 🟡 Create SolanaWalletProvider
- [ ] 🟡 Implement Solana sign-in verification:
  - [ ] `POST /api/auth/verify/solana` — verify Ed25519 signature via tweetnacl
- [ ] 🟡 Build chain selector tabs (EVM / Solana) in WalletAuth component

### Session Management
- [ ] 🔴 Install iron-session
- [ ] 🔴 Implement httpOnly secure cookie sessions (not localStorage)
- [ ] 🔴 Create `withAuth()` middleware wrapper for protected API routes
- [ ] 🔴 `POST /api/auth/logout` — destroy session
- [ ] 🟡 Session expiry: 7 days, auto-refresh on activity

### Multi-Wallet Support
- [ ] 🟡 `POST /api/user/link-wallet` — link additional wallets to same account (with sig verify)
- [ ] 🟡 `GET /api/user/wallets` — list all linked wallets
- [ ] 🟡 `DELETE /api/user/wallets/:id` — unlink a wallet (must keep at least one)
- [ ] 🟡 Prevent linking a wallet already owned by another user

---

## Phase 3: Real-Time Features (Week 3-4)

### WebSocket / Real-Time Hint Board
- [ ] 🟡 Set up Redis (Upstash recommended for serverless)
- [ ] 🟡 Implement Socket.io server or use Vercel's edge functions with SSE
- [ ] 🟡 Broadcast new hints to all connected clients anonymously
- [ ] 🟡 Real-time heat meter updates when someone gets closer
- [ ] 🟡 "Vault Cracked" event broadcast to all users
- [ ] 🟢 Alternative: Use Supabase Realtime or Pusher if Socket.io is too complex for serverless

### Vault Lifecycle
- [ ] 🟡 Implement vault rotation (cron job or Vercel Cron: reset code every 7 days)
- [ ] 🟡 Archive old vault + guesses when rotating
- [ ] 🟡 If nobody cracks it, roll prize into next vault (growing pot)
- [ ] 🟡 Announce new vault via WebSocket to all clients

---

## Phase 4: $BLUFF Token Integration (Week 4-5)

### Smart Contract
- [ ] 🟡 Deploy ERC-20 $BLUFF token contract (or use existing if already deployed)
- [ ] 🟡 Deploy PrizeVault contract to hold the 1M $BLUFF
- [ ] 🟡 Audit smart contracts (at minimum use Slither/Mythril static analysis)

### On-Chain Prize Claim
- [ ] 🟡 `POST /api/vault/claim-prize` — server-side signed transfer from vault to winner
- [ ] 🟡 Store vault signer key in KMS (not env var) for production
- [ ] 🟡 Record transaction in token_transactions table
- [ ] 🟡 Display on-chain TX link after claim

### Balance Display
- [ ] 🟡 `useBluffBalance` hook — read on-chain ERC-20 balance via wagmi useReadContract
- [ ] 🟡 Show both on-chain and off-chain $BLUFF balances in header
- [ ] 🟢 Token-gated tasks (e.g., "Hold 100+ $BLUFF" verifies on-chain balance)

---

## Phase 5: Task System Hardening (Week 3-5)

### Server-Side Task Validation
- [ ] 🔴 Move all task claiming to server (currently client-side — easily exploitable)
- [ ] 🔴 Daily login: check last_login_date, prevent double-claim per day (DB unique constraint)
- [ ] 🔴 Streak calculation: server-side, based on last_login_date field
- [ ] 🔴 Atomic guess crediting via guess_ledger (INSERT in transaction)

### Social Task Verification
- [ ] 🟡 Twitter/X follow verification via API (or use Galxe/Zealy integration)
- [ ] 🟡 Discord join verification via bot + OAuth
- [ ] 🟡 Referral system: unique referral codes, track conversions, credit both parties
- [ ] 🟢 Share-to-earn: verify tweet was posted before crediting guesses

### Anti-Exploit
- [ ] 🔴 Server-side guess balance check (SELECT SUM from ledger) inside transaction
- [ ] 🔴 Prevent negative balances with CHECK constraint on ledger
- [ ] 🟡 Rate limit task claims (max 1 claim per task per day per user)
- [ ] 🟡 Admin dashboard to monitor suspicious claiming patterns

---

## Phase 6: Security Hardening (Ongoing)

### Authentication Security
- [ ] 🔴 Nonces: single-use, 10-minute expiry, atomic mark-as-used
- [ ] 🔴 Never log wallet signatures or secret codes
- [ ] 🔴 CORS: restrict to your domain only
- [ ] 🔴 CSP headers: prevent XSS
- [ ] 🟡 2FA for admin panel access

### API Security
- [ ] 🔴 Input validation on all endpoints (zod schemas)
- [ ] 🔴 SQL injection prevention (parameterized queries only — never string concat)
- [ ] 🔴 Request size limits
- [ ] 🟡 API key rotation strategy for third-party services
- [ ] 🟡 Audit logging: every guess, every task claim, every admin action

### Infrastructure Security
- [ ] 🔴 All secrets in Vercel Environment Variables (not in code)
- [ ] 🔴 Separate env vars for preview vs production deployments
- [ ] 🟡 Enable Vercel DDoS protection
- [ ] 🟡 Set up error monitoring (Sentry)
- [ ] 🟡 Database backups: automated daily snapshots
- [ ] 🟢 Penetration testing before high-value vault launches

### Fairness & Transparency
- [ ] 🟡 Publish vault creation timestamp + hashed code (so users can verify post-crack)
- [ ] 🟡 Public audit log of all guesses (anonymous) for community verification
- [ ] 🟡 Admin cannot change code mid-round (enforced by contract or commit-reveal scheme)
- [ ] 🟢 Move to on-chain commit-reveal for full trustlessness

---

## Phase 7: UX & Polish (Week 5-6)

### Animations & Feedback
- [ ] 🟡 Vault door open animation on crack (3D CSS or Framer Motion sequence)
- [ ] 🟡 Confetti/particle effect on win
- [ ] 🟡 Number roll animation on balance changes
- [ ] 🟢 Sound effects (toggle on/off): dial click, submit, cold buzz, hot chime, crack
- [ ] 🟢 Three.js vault door (upgrade from CSS if performance allows)

### Mobile Optimization
- [ ] 🟡 Test all wallet connections in MetaMask Mobile browser
- [ ] 🟡 Test in Phantom mobile browser
- [ ] 🟡 Optimize touch targets (min 44x44px)
- [ ] 🟡 Add PWA manifest for home screen install
- [ ] 🟢 Haptic feedback on mobile (navigator.vibrate)

### Social Features
- [ ] 🟡 Share guess result to Twitter/X (pre-filled tweet with feedback)
- [ ] 🟡 Leaderboard: closest guesses, most guesses, longest streak
- [ ] 🟢 Alliance mode: pool guesses with friends, split prize
- [ ] 🟢 Sabotage cards: spend $BLUFF to post fake hints

### SEO & Analytics
- [ ] 🟡 OpenGraph meta tags with vault image for social sharing
- [ ] 🟡 Set up PostHog or Mixpanel for user analytics
- [ ] 🟡 Track funnel: visit → connect wallet → first guess → task completion → return
- [ ] 🟢 Custom domain setup on Vercel

---

## Phase 8: Advanced Features (Post-Launch)

### Vault Rounds & Progression
- [ ] 🟢 After crack: new vault with 5-digit code + bigger prize
- [ ] 🟢 Season system: monthly leaderboards with bonus prizes
- [ ] 🟢 Near-miss consolation prizes (3/4 correct = small $BLUFF reward)
- [ ] 🟢 Vault difficulty tiers (4-digit, 5-digit, 6-digit)

### Monetization
- [ ] 🟢 Buy extra guesses with $BLUFF tokens (burn mechanic)
- [ ] 🟢 Premium hint packs: purchase reveals of individual digit positions
- [ ] 🟢 NFT rewards for first-time crackers

### Community
- [ ] 🟢 Discord bot: post live hints and vault status
- [ ] 🟢 Telegram mini-app version
- [ ] 🟢 Community governance: vote on next vault parameters

---

## Environment Variables Needed

```env
# Database
DATABASE_URL=                    # PostgreSQL connection string

# Redis
REDIS_URL=                       # For rate limiting + real-time

# Web3
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=   # From cloud.walletconnect.com
NEXT_PUBLIC_RPC_MAINNET=                # Alchemy or Infura
NEXT_PUBLIC_RPC_BASE=
NEXT_PUBLIC_RPC_SOLANA=

# Auth
SESSION_SECRET=                  # Min 32 chars, random

# Vault
VAULT_SECRET_CODE=               # Or use secrets manager
VAULT_SIGNER_PRIVATE_KEY=        # For on-chain prize payouts (USE KMS IN PROD)

# Monitoring
SENTRY_DSN=
NEXT_PUBLIC_POSTHOG_KEY=
```

---

## Quick Wins (Can Do Today)
1. Move vault code to a `.env` variable and read server-side only
2. Add `zod` input validation on the guess endpoint
3. Add basic rate limiting with `@upstash/ratelimit`
4. Set up Sentry for error monitoring
5. Add OpenGraph image for social sharing
