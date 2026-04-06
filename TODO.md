# Crack the Safe — Development TODO

## Priority Legend
- 🔴 Critical (must have before launch)
- 🟡 Important (should have for launch)
- 🟢 Nice to have (post-launch iteration)

---

## Phase 1: Infrastructure & Security ✅

- [x] PostgreSQL on Supabase + Prisma ORM (10 tables)
- [x] All API routes: guess, vault, profile, tasks, heat, user guesses, buy guesses
- [x] Server-side vault code (SHA-256, constant-time comparison)
- [x] Rate limiting (per-user 10s, global 60/min, task claim 5s)
- [x] Request size limits, DB transactions, zod validation
- [ ] 🟡 Connection pooling (Supabase pooler)
- [ ] 🟡 CAPTCHA after rapid guesses
- [ ] 🟡 Device fingerprinting

---

## Phase 2: Web3 Wallet Authentication ✅

- [x] EVM: Reown AppKit + wagmi/viem (MetaMask, Coinbase, WalletConnect)
- [x] Custom SIWE auth: `GET /api/auth/nonce` + `POST /api/auth/verify`
- [x] JWT session in httpOnly cookie (7-day, jose library)
- [x] Solana: `POST /api/auth/verify-solana` (Ed25519 via tweetnacl)
- [x] Chain selector UI (EVM / Solana tabs)
- [x] Multi-wallet API: `GET/POST/DELETE /api/user/wallets`

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

### Smart Contracts (Base Mainnet — deployed)
- [x] BLUFF ERC-20: `0x287a19FbeA6C6A400Bf3cc8331F2a7c9aE59e57a` (100M supply)
- [x] PrizeVault: `0x08BAEee1a025156d42AB97E6113f341080D96280` (1M BLUFF locked)
- [x] 8/8 Foundry tests passing
- [ ] 🟡 Verify contracts on BaseScan
- [ ] 🟡 Audit (Slither/Mythril)

### On-Chain Integration
- [x] `POST /api/vault/claim-prize` calls PrizeVault.claimPrize() on-chain
- [x] `useBluffBalance` hook reads ERC-20 balance via wagmi
- [x] Header shows on-chain + in-game $BLUFF
- [x] TokenTransaction model tracks all $BLUFF movements
- [x] Buy guesses with $BLUFF (3 for 10, 50 for 100)

---

## Phase 5: Task System ✅

- [x] Server-side atomic task claiming + daily unique constraint
- [x] Streak calculation server-side
- [x] Referral system: `GET/POST /api/user/referral` (unique codes, 3 guesses each)
- [x] Audit logging: `logAudit()` on guess, login, prize, referral
- [x] 10 tasks seeded (daily, quest, bonus)
- [ ] 🟡 Twitter/X follow verification
- [ ] 🟡 Discord join verification via OAuth

---

## Phase 6: Security ✅

- [x] CORS, CSP, security headers
- [x] Input validation (zod), parameterized queries (Prisma)
- [x] Audit logging (AuditLog model)
- [x] No secrets in code, env vars on Vercel
- [ ] 🟡 Error monitoring (Sentry)
- [ ] 🟡 Database backups

---

## Phase 7: UX & Polish

- [ ] 🟡 Vault crack animation + confetti
- [ ] 🟡 Share guess to Twitter/X
- [ ] 🟡 Leaderboard (closest guesses, most guesses, longest streak)
- [ ] 🟡 OpenGraph meta tags for social sharing
- [ ] 🟡 PWA manifest for mobile
- [ ] 🟢 Sound effects
- [ ] 🟢 Three.js vault door

---

## Phase 8: Admin Dashboard ✅

### Auth & API
- [x] `isAdmin` field + `requireAdmin()` middleware
- [x] `GET /api/admin/stats` — overview (users, guesses, vault, daily/weekly)
- [x] `GET /api/admin/users` — paginated, searchable, with balances
- [x] `POST /api/admin/users` — ban/unban, credit/debit guesses
- [x] `GET /api/admin/vaults` — history with cracker info
- [x] `POST /api/admin/vaults` — rotate vault (archive + create new)
- [x] `GET /api/admin/logs` — filtered audit logs

### Dashboard UI (`/admin`)
- [x] Overview tab: 6 stat cards, active vault, recent guesses feed
- [x] Users tab: searchable table with ban/unban/credit actions
- [x] Vaults tab: vault history + rotate button
- [x] Logs tab: color-coded audit feed
- [ ] 🟡 Task CRUD (create/edit/disable tasks)

---

## Phase 9: Advanced Features (Post-Launch)

- [ ] 🟢 Vault difficulty tiers (6/7/8 digits)
- [ ] 🟢 Season system with leaderboards
- [ ] 🟢 Near-miss consolation prizes
- [ ] 🟢 Premium hint packs
- [ ] 🟢 NFT rewards for crackers
- [ ] 🟢 Discord bot for live hints
- [ ] 🟢 Telegram mini-app
- [ ] 🟢 Community governance

---

## Deployment

| Component | URL / Location |
|-----------|---------------|
| App | https://crack.scrim42.com |
| Admin | https://crack.scrim42.com/admin |
| GitHub | github.com/hotabics/crack-the-safe |
| DB | Supabase `oivjhlujewaobxxzxbdi` (eu-west-1) |
| $BLUFF Token | `0x287a19FbeA6C6A400Bf3cc8331F2a7c9aE59e57a` (Base) |
| PrizeVault | `0x08BAEee1a025156d42AB97E6113f341080D96280` (Base) |
| Vercel | hotabics-projects/crack-the-safe |

## Environment Variables

```env
DATABASE_URL=                      # PostgreSQL (Supabase)
DIRECT_URL=                        # Direct connection
NEXT_PUBLIC_PROJECT_ID=            # Reown AppKit project ID
NEXTAUTH_SECRET=                   # JWT signing secret
VAULT_SECRET_CODE=                 # 6-digit secret code
VAULT_SIGNER_PRIVATE_KEY=          # PrizeVault owner key
CRON_SECRET=                       # Vercel Cron auth
```
