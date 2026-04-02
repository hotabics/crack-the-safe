# Crack the Safe — Development TODO

## Priority Legend
- 🔴 Critical (must have before launch)
- 🟡 Important (should have for launch)
- 🟢 Nice to have (post-launch iteration)

---

## Phase 1: Infrastructure & Security ✅
🔴 **Completed.**

### Database Setup
- [x] 🔴 Set up PostgreSQL (Supabase — project `oivjhlujewaobxxzxbdi`)
- [x] 🔴 Create all tables: users, vaults, guesses, guess_ledger, tasks, task_completions
- [x] 🔴 Add indexes on hot paths (guesses by vault_id, ledger by user_id)
- [x] 🔴 Set up database schema (Prisma ORM with `crack_the_safe` schema)
- [x] 🔴 Seed database with initial vault and 10 tasks
- [ ] 🟡 Add connection pooling (Supabase pooler or PgBouncer)

### Server-Side Vault Code
- [x] 🔴 Move secret code to server (VAULT_SECRET_CODE env var)
- [x] 🔴 Server-side guess evaluation (never send code to client)
- [x] 🔴 Constant-time comparison to prevent timing attacks
- [x] 🔴 Hash stored code with SHA-256

### API Routes
- [x] 🔴 `POST /api/vault/guess` — validate auth, check balance, evaluate, return feedback
- [x] 🔴 `GET /api/vault/current` — vault metadata, heat level, expiry
- [x] 🔴 `GET /api/vault/hints` — last 50 anonymous guesses
- [x] 🔴 `GET /api/user/profile` — balance, $BLUFF, tasks, streak
- [x] 🔴 `POST /api/tasks/:id/claim` — atomic task claiming
- [x] 🟡 `GET /api/vault/heat` — heat meter level + stats
- [x] 🟡 `GET /api/user/guesses` — paginated user guess history
- [x] 🟡 `POST /api/user/buy-guesses` — buy guesses with $BLUFF (3 for 10, 50 for 100)

### Rate Limiting & Anti-Abuse
- [x] 🔴 Rate limit on guess (10s per user) + global (60 req/min per IP)
- [x] 🔴 DB transaction for guess submission (no race conditions)
- [x] 🔴 Request size limits (4KB max)
- [x] 🟡 Task claim rate limiting (5s cooldown)
- [ ] 🟡 Add CAPTCHA after rapid guesses
- [ ] 🟡 Device fingerprinting for multi-accounting

---

## Phase 2: Web3 Wallet Authentication ✅

### EVM Wallets
- [x] 🔴 Reown AppKit with wagmi/viem (MetaMask, Coinbase, WalletConnect)
- [x] 🔴 Custom SIWE auth flow: nonce → sign → verify → JWT session
- [x] 🔴 `GET /api/auth/nonce` + `POST /api/auth/verify` (standalone, no NextAuth dependency)
- [x] 🔴 JWT session in httpOnly cookie (7-day expiry, jose library)

### Solana
- [ ] 🟡 @solana/wallet-adapter-react + tweetnacl
- [ ] 🟡 `POST /api/auth/verify/solana` — Ed25519 signature verification
- [ ] 🟡 Chain selector tabs (EVM / Solana)

### Multi-Wallet Support
- [ ] 🟡 Link/unlink additional wallets
- [ ] 🟡 Prevent cross-user wallet linking

---

## Phase 3: Real-Time Features ✅

### Real-Time Hint Board
- [x] 🟡 `GET /api/vault/events` — SSE endpoint with auto-reconnect
- [x] 🟡 Real-time hints broadcast (anonymous, every 3s poll)
- [x] 🟡 Real-time heat meter updates
- [x] 🟡 "Vault Cracked" event broadcast
- [x] 🟡 `useVaultEvents` client hook with auto-reconnect

### Vault Lifecycle
- [x] 🟡 Vercel Cron vault rotation (daily at midnight UTC)
- [x] 🟡 Archive expired vaults, auto-generate new 6-digit code
- [ ] 🟡 Growing pot: roll prize into next vault if uncracked

---

## Phase 4: $BLUFF Token Integration (Week 4-5)

### Smart Contract
- [ ] 🟡 Deploy ERC-20 $BLUFF token contract
- [ ] 🟡 Deploy PrizeVault contract to hold the 1M $BLUFF
- [ ] 🟡 Audit smart contracts (Slither/Mythril static analysis)

### On-Chain Prize Claim
- [ ] 🟡 `POST /api/vault/claim-prize` — server-side signed transfer to winner
- [ ] 🟡 Record transaction in token_transactions table
- [ ] 🟡 Display on-chain TX link after claim

### Balance Display
- [ ] 🟡 Show both on-chain and off-chain $BLUFF balances in header
- [ ] 🟢 Token-gated tasks (Hold 100+ $BLUFF)

---

## Phase 5: Task System Hardening

### Server-Side Task Validation
- [x] 🔴 All task claiming server-side with atomic transactions
- [x] 🔴 Daily login: prevent double-claim (DB unique constraint)
- [x] 🔴 Streak calculation server-side
- [x] 🔴 Atomic guess crediting via guess_ledger

### Social Task Verification
- [ ] 🟡 Twitter/X follow verification
- [ ] 🟡 Discord join verification via bot + OAuth
- [ ] 🟡 Referral system: unique codes, track conversions

### Anti-Exploit
- [x] 🔴 Server-side balance check in transaction
- [x] 🟡 Rate limit task claims
- [ ] 🟡 Admin dashboard for suspicious patterns

---

## Phase 6: Security Hardening

- [x] 🔴 CORS restriction (middleware)
- [x] 🔴 CSP headers (next.config.js)
- [x] 🔴 Security headers (X-Frame-Options, etc.)
- [x] 🔴 Input validation (zod)
- [x] 🔴 No secrets in code
- [ ] 🟡 Audit logging
- [ ] 🟡 Error monitoring (Sentry)
- [ ] 🟡 Database backups

---

## Phase 7: UX & Polish

- [ ] 🟡 Vault door open animation on crack
- [ ] 🟡 Confetti/particle effect on win
- [ ] 🟡 Share guess result to Twitter/X
- [ ] 🟡 Leaderboard: closest guesses, most guesses, longest streak
- [ ] 🟡 OpenGraph meta tags for social sharing
- [ ] 🟡 PWA manifest for mobile

---

## Phase 8: Admin Dashboard

- [ ] 🔴 Admin auth (isAdmin + whitelisted wallets)
- [ ] 🔴 Dashboard overview (users, guesses, vault status)
- [ ] 🔴 User management (list, detail, ban, credit)
- [ ] 🔴 Vault management (view, create, rotate)
- [ ] 🟡 Task CRUD
- [ ] 🟡 Audit logs viewer

---

## Environment Variables

```env
DATABASE_URL=                    # PostgreSQL (Supabase)
DIRECT_URL=                      # Direct connection
NEXT_PUBLIC_PROJECT_ID=          # Reown AppKit project ID
NEXTAUTH_SECRET=                 # JWT signing secret (32+ chars)
VAULT_SECRET_CODE=               # 6-digit secret code
CRON_SECRET=                     # Vercel Cron auth (optional)
```
