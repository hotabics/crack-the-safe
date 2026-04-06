# Crack the Safe — Development TODO

## Priority Legend
- 🔴 Critical (must have before launch)
- 🟡 Important (should have for launch)
- 🟢 Nice to have (post-launch iteration)

---

## Phase 1: Infrastructure & Security ✅

- [x] PostgreSQL on Supabase + Prisma ORM
- [x] All API routes: guess, vault, profile, tasks, heat, user guesses, buy guesses
- [x] Server-side vault code (SHA-256, constant-time comparison)
- [x] Rate limiting (per-user guess 10s, global 60/min, task claim 5s)
- [x] Request size limits, DB transactions, zod validation
- [ ] 🟡 Connection pooling (Supabase pooler)
- [ ] 🟡 CAPTCHA after rapid guesses
- [ ] 🟡 Device fingerprinting

---

## Phase 2: Web3 Wallet Authentication

### EVM Wallets ✅
- [x] Reown AppKit + wagmi/viem (MetaMask, Coinbase, WalletConnect)
- [x] Custom SIWE auth: `GET /api/auth/nonce` + `POST /api/auth/verify`
- [x] JWT session in httpOnly cookie (7-day, jose library)

### Solana — IN PROGRESS
- [ ] 🟡 @solana/wallet-adapter-react + tweetnacl
- [ ] 🟡 `POST /api/auth/verify/solana` — Ed25519 signature verification
- [ ] 🟡 Chain selector UI (EVM / Solana tabs)

### Multi-Wallet Support
- [ ] 🟡 `POST /api/user/link-wallet` — link additional wallets
- [ ] 🟡 `GET /api/user/wallets` — list all linked wallets
- [ ] 🟡 `DELETE /api/user/wallets/:id` — unlink wallet (keep at least one)
- [ ] 🟡 Prevent cross-user wallet linking

---

## Phase 3: Real-Time Features ✅

- [x] SSE endpoint (`/api/vault/events`) with auto-reconnect
- [x] Real-time hints, heat updates, vault cracked broadcast
- [x] `useVaultEvents` client hook
- [x] Vercel Cron vault rotation (daily midnight UTC)
- [x] Archive expired vaults, auto-generate new 6-digit code
- [ ] 🟡 Growing pot: roll prize into next vault if uncracked

---

## Phase 4: $BLUFF Token Integration ✅

### Smart Contracts (Base Mainnet)
- [x] BLUFF ERC-20: `0x287a19FbeA6C6A400Bf3cc8331F2a7c9aE59e57a` (100M supply)
- [x] PrizeVault: `0x08BAEee1a025156d42AB97E6113f341080D96280` (1M BLUFF locked)
- [x] 8/8 Foundry tests passing
- [ ] 🟡 Audit (Slither/Mythril static analysis)
- [ ] 🟡 Verify on BaseScan

### On-Chain Integration ✅
- [x] `POST /api/vault/claim-prize` calls PrizeVault.claimPrize() on-chain
- [x] `useBluffBalance` hook reads ERC-20 balance via wagmi
- [x] Header shows on-chain + in-game $BLUFF
- [x] TokenTransaction model tracks all $BLUFF movements
- [x] Fallback to off-chain credit if no signer key

---

## Phase 5: Task System Hardening

- [x] Server-side task claiming with atomic transactions
- [x] Daily login unique constraint + streak calculation
- [x] Referral system: `GET/POST /api/user/referral` (unique codes, 3 guesses each)
- [x] Audit logging: `logAudit()` on guess, login, prize, referral
- [x] AuditLog + TokenTransaction DB models
- [ ] 🟡 Twitter/X follow verification
- [ ] 🟡 Discord join verification via OAuth
- [ ] 🟡 Admin dashboard for suspicious patterns

---

## Phase 6: Security Hardening

- [x] CORS, CSP, security headers, input validation
- [x] Audit logging integrated
- [ ] 🟡 Error monitoring (Sentry)
- [ ] 🟡 Database backups

---

## Phase 7: UX & Polish

- [ ] 🟡 Vault crack animation + confetti
- [ ] 🟡 Share guess to Twitter/X
- [ ] 🟡 Leaderboard
- [ ] 🟡 OpenGraph meta tags
- [ ] 🟡 PWA manifest

---

## Phase 8: Admin Dashboard

- [ ] 🔴 Admin auth (isAdmin + whitelisted wallets)
- [ ] 🔴 Dashboard overview + user management
- [ ] 🔴 Vault management (create, rotate)
- [ ] 🟡 Task CRUD + audit logs viewer

---

## Environment Variables

```env
DATABASE_URL=                      # PostgreSQL (Supabase)
DIRECT_URL=                        # Direct connection
NEXT_PUBLIC_PROJECT_ID=            # Reown AppKit project ID
NEXTAUTH_SECRET=                   # JWT signing secret
VAULT_SECRET_CODE=                 # 6-digit secret code
VAULT_SIGNER_PRIVATE_KEY=          # PrizeVault owner key (for on-chain claims)
CRON_SECRET=                       # Vercel Cron auth
```
