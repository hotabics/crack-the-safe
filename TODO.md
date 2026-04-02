# Crack the Safe — Development TODO

## Priority Legend
- 🔴 Critical (must have before launch)
- 🟡 Important (should have for launch)
- 🟢 Nice to have (post-launch iteration)

---

## Phase 1: Infrastructure & Security (Week 1-2)
🔴 **These must be completed before any public launch.**

### Database Setup
- [x] 🔴 Set up PostgreSQL (Supabase — project `oivjhlujewaobxxzxbdi`)
- [x] 🔴 Create all tables: users, vaults, guesses, guess_ledger, tasks, task_completions
- [x] 🔴 Add indexes on hot paths (guesses by vault_id, ledger by user_id)
- [x] 🔴 Set up database migrations (Prisma ORM with `crack_the_safe` schema)
- [x] 🔴 Seed database with initial vault and 8 tasks
- [ ] 🟡 Add connection pooling (Supabase pooler or PgBouncer)

### Server-Side Vault Code
- [x] 🔴 **Move secret code generation to server** — code in VAULT_SECRET_CODE env var
- [x] 🔴 Store vault code in env vars (Vercel env vars for production)
- [x] 🔴 Implement server-side guess evaluation in API route (never send code to client)
- [x] 🔴 Use constant-time comparison to prevent timing side-channel attacks
- [x] 🔴 Hash stored code with SHA-256 — plaintext only in memory during evaluation

### API Routes (Replace Client-Side Logic)
- [x] 🔴 `POST /api/vault/guess` — validate auth, check balance, evaluate guess, return feedback only
- [x] 🔴 `GET /api/vault/current` — return vault metadata (no code), heat level, expiry time
- [x] 🔴 `GET /api/vault/hints` — return last 50 anonymous guesses with feedback
- [x] 🔴 `GET /api/user/profile` — return guess balance, tasks, completion status
- [x] 🔴 `POST /api/tasks/:id/claim` — validate and credit guesses atomically
- [x] 🟡 `GET /api/vault/heat` — current heat meter level
- [x] 🟡 `GET /api/user/guesses` — paginated user guess history

### Rate Limiting & Anti-Abuse
- [x] 🔴 Add rate limiting on `/api/vault/guess` (max 1 guess per 10 seconds per user)
- [x] 🔴 Add global rate limiting on all API routes (60 req/min per IP via middleware)
- [x] 🔴 Wrap guess submission in a DB transaction (prevent race conditions on balance)
- [x] 🔴 Request size limits (4KB max) on all non-GET API routes
- [ ] 🟡 Add CAPTCHA (hCaptcha or Turnstile) after 3 rapid guesses
- [ ] 🟡 Device fingerprinting to detect multi-accounting
- [x] 🟡 IP-based rate limiting as secondary defense (middleware)

---

## Phase 2: Web3 Wallet Authentication (Week 2-3)

### EVM (MetaMask, Coinbase, WalletConnect)
- [x] 🔴 Install wagmi, viem, @reown/appkit (replaces RainbowKit)
- [x] 🔴 Create Web3Provider with Reown AppKit config (mainnet)
- [x] 🔴 Get WalletConnect Project ID (via Reown dashboard)
- [x] 🔴 Implement SIWE (Sign In With Ethereum) via Reown AppKit SIWE + NextAuth
- [x] 🔴 Replace fake connectWallet() with AppKit connect button

### Solana (Phantom, Solflare)
- [ ] 🟡 Install @solana/wallet-adapter-react, tweetnacl
- [ ] 🟡 Create SolanaWalletProvider
- [ ] 🟡 Implement Solana sign-in verification:
  - [ ] `POST /api/auth/verify/solana` — verify Ed25519 signature via tweetnacl
- [ ] 🟡 Build chain selector tabs (EVM / Solana) in WalletAuth component

### Session Management
- [x] 🔴 Implement session management (NextAuth JWT sessions via httpOnly cookies)
- [x] 🔴 Create `requireAuth()` middleware for protected API routes (uses getServerSession)
- [x] 🔴 `POST /api/auth/logout` — logout endpoint
- [x] 🟡 Session expiry: 7 days, auto-refresh every 24h on activity

### Multi-Wallet Support
- [ ] 🟡 `POST /api/user/link-wallet` — link additional wallets to same account (with sig verify)
- [ ] 🟡 `GET /api/user/wallets` — list all linked wallets
- [ ] 🟡 `DELETE /api/user/wallets/:id` — unlink a wallet (must keep at least one)
- [ ] 🟡 Prevent linking a wallet already owned by another user

---

## Phase 3: Real-Time Features (Week 3-4)

### WebSocket / Real-Time Hint Board
- [x] 🟡 Implement SSE endpoint (`GET /api/vault/events`) for real-time updates
- [x] 🟡 Broadcast new hints to all connected clients anonymously (via SSE polling)
- [x] 🟡 Real-time heat meter updates when someone gets closer
- [x] 🟡 "Vault Cracked" event broadcast to all users
- [x] 🟡 Client-side `useVaultEvents` hook with auto-reconnect

### Vault Lifecycle
- [x] 🟡 Implement vault rotation (Vercel Cron: daily at midnight UTC)
- [x] 🟡 Archive old vault + guesses when rotating (mark as cracked)
- [x] 🟡 Auto-generate new 6-digit code on rotation
- [ ] 🟡 If nobody cracks it, roll prize into next vault (growing pot)
- [x] 🟡 Announce new vault via SSE to all clients

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
- [x] 🔴 Move all task claiming to server (atomic transactions)
- [x] 🔴 Daily login: prevent double-claim per day (DB unique constraint)
- [x] 🔴 Streak calculation: server-side, based on lastLoginDate field
- [x] 🔴 Atomic guess crediting via guess_ledger (INSERT in transaction)

### Social Task Verification
- [ ] 🟡 Twitter/X follow verification via API (or use Galxe/Zealy integration)
- [ ] 🟡 Discord join verification via bot + OAuth
- [ ] 🟡 Referral system: unique referral codes, track conversions, credit both parties
- [ ] 🟢 Share-to-earn: verify tweet was posted before crediting guesses

### Anti-Exploit
- [x] 🔴 Server-side guess balance check (aggregate from ledger) inside transaction
- [x] 🔴 Prevent negative balances — defensive check in transaction, throws BALANCE_NEGATIVE
- [x] 🟡 Rate limit task claims (5s cooldown per user)
- [ ] 🟡 Admin dashboard to monitor suspicious claiming patterns

---

## Phase 6: Security Hardening (Ongoing)

### Authentication Security
- [x] 🔴 SIWE nonces handled by Reown AppKit + NextAuth CSRF tokens
- [x] 🔴 Never log wallet signatures or secret codes (verified — no sensitive data in logs)
- [x] 🔴 CORS: restrict to crack.scrim42.com and localhost (middleware)
- [x] 🔴 CSP headers: prevent XSS (next.config.js)
- [x] 🔴 Security headers: X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy
- [ ] 🟡 2FA for admin panel access

### API Security
- [x] 🔴 Input validation on all endpoints (zod schemas)
- [x] 🔴 SQL injection prevention (Prisma parameterized queries)
- [x] 🔴 Request size limits (4KB max on non-GET API routes)
- [ ] 🟡 API key rotation strategy for third-party services
- [ ] 🟡 Audit logging: every guess, every task claim, every admin action

### Infrastructure Security
- [x] 🔴 All secrets in environment variables (not in code)
- [x] 🔴 Separate env vars for preview vs production deployments (Vercel)
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

## Phase 8: Admin Dashboard & Backend (Week 6-7)
🟡 **Admin panel for managing users, vaults, and monitoring activity.**

### Admin Authentication
- [ ] 🔴 Add `isAdmin` field to User model (or separate AdminUser table)
- [ ] 🔴 Create admin middleware — only allow users with `isAdmin: true`
- [ ] 🔴 Admin login page at `/admin/login` (wallet-based, restricted to whitelisted addresses)
- [ ] 🟡 2FA for admin access (TOTP via authenticator app)

### Admin Dashboard UI (`/admin`)
- [ ] 🔴 Dashboard overview: total users, total guesses, active vault status, daily active users
- [ ] 🔴 Real-time stats: guesses per hour chart, new registrations chart
- [ ] 🟡 System health: DB connection status, error rate, API response times

### User Management (`/admin/users`)
- [ ] 🔴 User list with search, filter, sort (by wallet, signup date, guess count, balance)
- [ ] 🔴 User detail page: profile, guess history, task completions, ledger entries
- [ ] 🟡 Ban/suspend user (disable login + revoke guesses)
- [ ] 🟡 Manually credit/debit guesses for a user
- [ ] 🟡 Export user data as CSV

### Vault Management (`/admin/vaults`)
- [ ] 🔴 View current vault: code (hidden by default), status, stats, time remaining
- [ ] 🔴 Create new vault (set code, duration, prize amount)
- [ ] 🔴 Manually rotate vault (archive current, start new)
- [ ] 🟡 View vault history: all past vaults with winner info
- [ ] 🟡 View all guesses for a vault (with user info, anonymizable)

### Task Management (`/admin/tasks`)
- [ ] 🟡 CRUD for tasks: create, edit, enable/disable tasks
- [ ] 🟡 View task claim statistics (completion rates, most/least popular)
- [ ] 🟡 Bulk approve/deny social task claims (Twitter follow, Discord join)

### Activity & Audit Logs (`/admin/logs`)
- [ ] 🟡 Real-time activity feed: guesses, task claims, logins, vault events
- [ ] 🟡 Suspicious activity alerts: rapid guessing, multi-accounting, unusual patterns
- [ ] 🟡 Filterable audit log: by user, action type, date range
- [ ] 🟢 Export logs for compliance

### Admin API Routes
- [ ] 🔴 `GET /api/admin/stats` — dashboard overview stats
- [ ] 🔴 `GET /api/admin/users` — paginated user list with filters
- [ ] 🔴 `GET /api/admin/users/:id` — user detail with history
- [ ] 🟡 `POST /api/admin/users/:id/ban` — ban/unban user
- [ ] 🟡 `POST /api/admin/users/:id/credit` — credit/debit guesses
- [ ] 🔴 `GET /api/admin/vaults` — vault list with stats
- [ ] 🔴 `POST /api/admin/vaults` — create new vault
- [ ] 🟡 `POST /api/admin/vaults/:id/rotate` — rotate vault
- [ ] 🟡 `GET /api/admin/logs` — paginated audit logs

---

## Phase 9: Advanced Features (Post-Launch)

### Vault Rounds & Progression
- [ ] 🟢 After crack: new vault with 5-digit code + bigger prize
- [ ] 🟢 Season system: monthly leaderboards with bonus prizes
- [ ] 🟢 Near-miss consolation prizes (3/4 correct = small $BLUFF reward)
- [ ] 🟢 Vault difficulty tiers (6-digit, 5-digit, 6-digit)

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
# Database (Supabase PostgreSQL)
DATABASE_URL=                    # PostgreSQL connection string
DIRECT_URL=                      # Direct connection (for migrations)

# Web3
NEXT_PUBLIC_PROJECT_ID=          # Reown AppKit project ID

# Auth
NEXTAUTH_SECRET=                 # Min 32 chars, random
NEXTAUTH_URL=                    # App URL (e.g., https://crack.scrim42.com)

# Vault
VAULT_SECRET_CODE=               # 6-digit secret code (server-only)

# Redis (Phase 3)
REDIS_URL=                       # For rate limiting + real-time

# Monitoring (Phase 6)
SENTRY_DSN=
NEXT_PUBLIC_POSTHOG_KEY=
```

---

## Quick Wins (Can Do Today)
1. ~~Move vault code to a `.env` variable and read server-side only~~ ✅
2. ~~Add `zod` input validation on the guess endpoint~~ ✅
3. ~~Add global rate limiting~~ ✅
4. Set up Sentry for error monitoring
5. Add OpenGraph image for social sharing
