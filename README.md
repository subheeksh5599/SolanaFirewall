# x402 Payment Firewall — Solana

On-Chain Security Layer for Autonomous AI Agent Payments on Solana

Built for Superteam Agentic Engineering Grants

---

## Project Overview

x402 Payment Firewall is an Anchor-based Solana program that protects autonomous AI agent payments by enforcing spending policies directly on-chain. If an AI agent's private key is compromised, attackers cannot drain funds beyond configured limits — the blockchain itself blocks unauthorized transfers.

### What It Does

| Policy | Description |
|--------|-------------|
| Max per transaction | Caps individual payment amount |
| Daily spending limit | Caps cumulative daily spending per sender |
| Sender blacklist | Blocks specific senders from all payments |
| Recipient blacklist | Blocks payments to specific recipients |
| Recipient whitelist | Optional mode: only allowlisted recipients can receive |
| Sender-recipient pair rules | Per-pair overrides (allow/deny + custom caps) |
| Rate limiting | Minimum interval between payments |
| Emergency pause | Instant global freeze by admin |
| Intent registration flow | Register → approve → execute pipeline for AI agents |
| SPL token support | Both SOL and SPL token payments are protected |
| Audit trail | All attempts logged via Anchor events |

### Key Innovation

Unlike off-chain security (which can be bypassed), the firewall is enforced at the **Solana program level**. The runtime itself prevents unauthorized transfers — no trust assumptions, no external dependencies.

```
Without Firewall:    Agent → Wallet → Solana (no protection)
With Firewall:       Agent → Firewall Program → Policy Check → Solana (protected)
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              USER / AI AGENT                             │
│              (Wallet: Phantom, Backpack, Solflare, etc.)                │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
                    ▼               ▼               ▼
            ┌───────────┐   ┌───────────┐   ┌───────────┐
            │  Direct   │   │  Intent   │   │  Admin    │
            │  Payment  │   │   Flow    │   │  Controls │
            └─────┬─────┘   └─────┬─────┘   └─────┬─────┘
                  │               │               │
                  └───────────────┼───────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     X402 FIREWALL PROGRAM (Anchor)                       │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                    Policy Evaluation Engine                        │   │
│  │                                                                    │   │
│  │  Checks (in order):                                               │   │
│  │  ├── 1. Is firewall paused?                                       │   │
│  │  ├── 2. Is sender blocked?                                        │   │
│  │  ├── 3. Is recipient blacklisted?                                 │   │
│  │  ├── 4. Whitelist enabled → is recipient whitelisted?             │   │
│  │  ├── 5. Sender-recipient pair rules overrides?                    │   │
│  │  ├── 6. Amount > per-pair max?                                    │   │
│  │  ├── 7. Amount > max payment limit?                               │   │
│  │  ├── 8. Amount + daily spent > daily limit?                       │   │
│  │  └── 9. Time since last payment < rate limit?                     │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                  │                                       │
│                    ┌─────────────┴─────────────┐                         │
│                    │                           │                         │
│                    ▼                           ▼                         │
│            ┌─────────────┐             ┌─────────────┐                  │
│            │  ✅ ALLOWED  │             │  ❌ BLOCKED  │                  │
│            │   CPI to     │             │   Error     │                  │
│            │   System/    │             │   Returned   │                  │
│            │   Token      │             │   No funds  │                  │
│            │   Program    │             │   move      │                  │
│            └─────────────┘             └─────────────┘                  │
└─────────────────────────────────────────────────────────────────────────┘
```

### Program Derived Addresses (PDAs)

```
firewall_state
    seeds = [b"firewall-state"]
    → Singleton global state (owner, paused, limits, counters)

sender_state
    seeds = [b"sender-state", sender.key().as_ref()]
    → Per-sender overrides (custom max, custom daily, blocked flag)

recipient_state
    seeds = [b"recipient-state", recipient.key().as_ref()]
    → Per-recipient flags (blacklisted, whitelisted, per-recipient max)

sender_recipient_pair
    seeds = [b"sender-recipient", sender.key().as_ref(), recipient.key().as_ref()]
    → Pair-specific rules (is_allowed override, custom max amount)

daily_tracker
    seeds = [b"daily-tracker", sender.key().as_ref()]
    → Daily spending tracker (day_start timestamp, total_spent)

payment_intent
    seeds = [b"intent", creator.key().as_ref(), &nonce.to_le_bytes()]
    → Intent records (recipient, amount, token_mint, expiry, status, risk_score)

authorized_agent
    seeds = [b"authorized-agent", agent.key().as_ref()]
    → Agent authorization marker (exists = authorized)
```

---

## Instructions Reference

### Direct Payment Flow

| Instruction | Description | Key Accounts |
|-------------|-------------|--------------|
| `execute_payment` | Execute SOL payment with policy check | firewall_state, sender, recipient, daily_tracker, system_program |
| `execute_token_payment` | Execute SPL token payment with policy check | firewall_state, sender, recipient, daily_tracker, sender_ata, recipient_ata, token_program |
| `simulate_payment` | Check if payment would pass (read-only) | firewall_state, sender, recipient, daily_tracker (optional) |

### Intent Registration Flow

| Instruction | Description | Access |
|-------------|-------------|--------|
| `initialize_intent` | Create new PaymentIntent PDA | Anyone |
| `approve_intent` | Agent approves a pending intent | Authorized agent only |
| `reject_intent` | Agent rejects a pending intent | Authorized agent only |
| `execute_intent` | Execute an approved intent (with fresh policy check) | Intent creator |
| `cancel_intent` | Creator cancels own pending intent | Intent creator |

### Admin Instructions

| Instruction | Description | Access |
|-------------|-------------|--------|
| `initialize` | One-time init of FirewallState PDA | Owner |
| `set_global_max_payment` | Set max per-transaction limit | Owner |
| `set_global_daily_limit` | Set daily spending cap | Owner |
| `set_whitelist_enabled` | Toggle whitelist mode | Owner |
| `set_min_payment_interval` | Set rate limit (seconds) | Owner |
| `block_sender` | Block/unblock a sender address | Owner |
| `blacklist_recipient` | Blacklist/unblacklist a recipient | Owner |
| `whitelist_recipient` | Whitelist/unwhitelist a recipient | Owner |
| `set_sender_max_payment` | Per-sender max override | Owner |
| `set_sender_daily_limit` | Per-sender daily limit override | Owner |
| `set_pair_rules` | Sender-recipient pair rules | Owner |
| `add_authorized_agent` | Authorize an agent for intent approvals | Owner |
| `remove_authorized_agent` | Revoke agent authorization | Owner |
| `pause` | Emergency pause (blocks all payments) | Owner |
| `unpause` | Resume normal operation | Owner |
| `transfer_ownership` | Transfer admin ownership | Current owner |

---

## Policy Enforcement Flow

### execute_payment / execute_token_payment

```
1. Verify firewall_state PDA
2. Load sender_state PDA (default to global if not initialized)
3. Load recipient_state PDA (default to global if not initialized)
4. Load or init daily_tracker PDA
5. Call policy::evaluate() which checks:
   a. paused?
   b. sender blocked?
   c. recipient blacklisted?
   d. whitelist_active AND recipient NOT whitelisted?
   e. sender-recipient pair disallowed?
   f. amount > pair_max?
   g. amount > max_payment?
   h. amount + daily_spent > daily_limit?
   i. time_since_last_payment < min_payment_interval?
6. If all pass:
   a. Update daily_tracker.total_spent += amount
   b. Update firewall_state.last_payment_time[sender] = clock.unix_timestamp
   c. Update firewall_state counters (total_payments, total_volume)
   d. CPI to SystemProgram::transfer (SOL) or TokenProgram::transfer (SPL)
   e. emit PaymentExecuted event
7. If any check fails:
   a. Update firewall_state.total_blocked += 1
   b. emit PaymentBlocked event
   c. Return error
```

### Intent Flow

```
register_intent:
  1. Generate intent PDA with creator + nonce
  2. Create PaymentIntent account
  3. Set status = PENDING, expiry = now + valid_for
  4. Run pre-flight policy evaluation (records result but doesn't block)
  5. emit IntentRegistered event
  6. Return intent PDA address

approve_intent:
  1. Verify caller is authorized agent
  2. Verify intent is PENDING and not expired
  3. Set status = APPROVED, record risk_score, reason, approved_by
  4. emit IntentApproved event

execute_intent:
  1. Verify caller is intent creator
  2. Verify intent is APPROVED and not expired
  3. Re-run FULL policy evaluation (state may have changed since approval)
  4. On pass: CPI transfer, mark intent EXECUTED, update counters
  5. On fail: emit PaymentBlocked, return error (intent stays APPROVED)
```

---

## Error Codes

| Code | Name | Description |
|------|------|-------------|
| 6000 | FirewallPaused | All payments blocked by admin |
| 6001 | FirewallNotPaused | Operation requires firewall to be paused |
| 6002 | SenderBlocked | Sender address is blocked |
| 6003 | RecipientBlacklisted | Recipient address is blacklisted |
| 6004 | RecipientNotWhitelisted | Whitelist active and recipient not on it |
| 6005 | ExceedsMaxPayment | Amount exceeds per-transaction cap |
| 6006 | ExceedsDailyLimit | Would exceed daily spending limit |
| 6007 | RateLimitExceeded | Payment too soon after last one |
| 6008 | IntentExpired | Intent has passed its expiry time |
| 6009 | IntentNotPending | Intent is not in PENDING status |
| 6010 | IntentNotApproved | Intent is not in APPROVED status |
| 6011 | IntentAlreadyExecuted | Intent has already been executed |
| 6012 | UnauthorizedAgent | Caller is not an authorized agent |
| 6013 | UnauthorizedOwner | Caller is not the firewall owner |
| 6014 | InvalidTokenMint | Token mint doesn't match intent's mint |
| 6015 | ArithmeticOverflow | Math overflow in calculation |
| 6016 | PairNotAllowed | Sender-recipient pair rule disallows |
| 6017 | AmountTooLarge | Amount exceeds u64 range for lamports |
| 6018 | InsufficientLamports | Sender doesn't have enough SOL |
| 6019 | SenderRecipientPairMaxExceeded | Exceeds pair-specific max |

---

## Events (Anchor Events)

```rust
PaymentExecuted {
    sender: Pubkey,
    recipient: Pubkey,
    token_mint: Option<Pubkey>,  // None = SOL
    amount: u64,
    intent_hash: Option<[u8; 32]>,
    timestamp: i64,
}

PaymentBlocked {
    sender: Pubkey,
    recipient: Pubkey,
    token_mint: Option<Pubkey>,
    amount: u64,
    reason: String,
}

IntentRegistered {
    intent: Pubkey,
    creator: Pubkey,
    recipient: Pubkey,
    amount: u64,
    token_mint: Option<Pubkey>,
    expiry: i64,
}

IntentApproved {
    intent: Pubkey,
    agent: Pubkey,
    risk_score: u8,
    reason: String,
}

IntentRejected {
    intent: Pubkey,
    agent: Pubkey,
    risk_score: u8,
    reason: String,
}

IntentCancelled {
    intent: Pubkey,
    creator: Pubkey,
}

IntentExecuted {
    intent: Pubkey,
    creator: Pubkey,
    recipient: Pubkey,
    amount: u64,
    timestamp: i64,
}

FirewallInitialized {
    owner: Pubkey,
    global_max_payment: u64,
    global_daily_limit: u64,
}

EmergencyPause {
    by: Pubkey,
    timestamp: i64,
}

EmergencyUnpause {
    by: Pubkey,
    timestamp: i64,
}
```

---

## Project Structure

```
solana-firewall/
├── programs/
│   └── x402-firewall/
│       ├── Cargo.toml
│       └── src/
│           ├── lib.rs                 # Entry point, instruction dispatch
│           ├── instructions/
│           │   ├── mod.rs
│           │   ├── initialize.rs      # One-time program init
│           │   ├── execute_payment.rs # SOL transfer with policy check
│           │   ├── execute_token_payment.rs  # SPL transfer with policy check
│           │   ├── simulate.rs        # Pre-flight simulation
│           │   ├── register_intent.rs # Create payment intent
│           │   ├── approve_intent.rs  # Agent approves intent
│           │   ├── reject_intent.rs   # Agent rejects intent
│           │   ├── execute_intent.rs  # Execute approved intent
│           │   ├── cancel_intent.rs   # Creator cancels intent
│           │   └── admin.rs           # All admin instructions
│           ├── state.rs               # Account structs + PDA seeds
│           ├── policy.rs              # Policy evaluation engine
│           ├── errors.rs              # Custom error codes
│           └── events.rs              # Anchor event definitions
├── tests/
│   └── x402-firewall.ts              # Anchor TypeScript tests
├── scripts/
│   ├── deploy.ts                     # Deploy + initialize
│   └── demo.ts                       # Full demo flow
├── sdk/
│   ├── package.json
│   └── src/
│       ├── index.ts                  # X402SolanaFirewall class
│       ├── idl.ts                    # Generated IDL type
│       ├── hooks.ts                  # React hooks
│       ├── batch.ts                  # Batch operations
│       └── errors.ts                 # Typed error parsing
├── frontend/
│   ├── package.json
│   ├── vite.config.ts
│   ├── index.html
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── hooks/
│       │   └── useSolanaFirewall.ts
│       ├── components/
│       │   ├── Header.tsx
│       │   ├── Dashboard.tsx
│       │   ├── PaymentForm.tsx
│       │   ├── Policies.tsx
│       │   ├── AuditLogs.tsx
│       │   └── Intents.tsx
│       └── utils/
│           └── connection.ts
├── Anchor.toml
├── package.json
├── tsconfig.json
└── README.md                         # This file
```

---

## TypeScript SDK API

```typescript
import { X402SolanaFirewall } from '@venkat5599/x402-solana-firewall';

const firewall = new X402SolanaFirewall(connection, wallet, { network: 'devnet' });

// Direct payment
const result = await firewall.pay(recipientPubkey, 1_000_000_000); // 1 SOL

// Simulate
const { allowed, reason } = await firewall.simulate(senderPubkey, recipientPubkey, amount);

// Intent flow
const { intentPda, tx } = await firewall.registerIntent(recipient, amount, 3600);
await firewall.approveIntent(intentPda, 15, 'Low risk recurring payment');
const result = await firewall.executeIntent(intentPda);

// Admin
await firewall.pause();
await firewall.blockSender(maliciousAddress);
await firewall.setGlobalMaxPayment(10_000_000_000); // 10 SOL

// Read
const stats = await firewall.getStats();
const remaining = await firewall.getDailyRemaining(senderPubkey);

// Events
firewall.onPaymentExecuted((event) => { console.log(event); });
firewall.onPaymentBlocked((event) => { console.log(event); });
```

### React Hooks

```typescript
const { pay, loading, result } = usePayment(firewall);
const { stats, refresh } = useFirewallStats(firewall, 10_000);
const { policy } = usePolicyState(firewall);
const { remaining } = useDailyRemaining(firewall, walletPubkey);
```

---

## Frontend Pages

| Page | Description |
|------|-------------|
| **Dashboard** | Payment form, quick presets (0.01 / 1 / 100 SOL), pre-flight simulation, execution results, stats bar |
| **Policies** | Current policy config display, admin controls (set limits, block sender, blacklist recipient) |
| **Intents** | List all pending intents, approve/reject buttons for agents, intent history |
| **Audit Logs** | Transaction history from events, allow/block timeline, export JSON |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Smart Contract | Anchor (Rust) on Solana |
| Testing | Anchor TypeScript + Mocha |
| Frontend | React 18, Vite, TailwindCSS |
| Wallet | @solana/wallet-adapter (Phantom, Backpack, Solflare) |
| Client | @coral-xyz/anchor, @solana/web3.js |
| SDK | TypeScript (npm package) |
| Deployment | Solana CLI + Anchor |

---

## Setup & Development

### Prerequisites

```bash
# Install Solana CLI
sh -c "$(curl -sSfL https://release.anza.xyz/stable/install)"

# Install Anchor
cargo install --git https://github.com/coral-xyz/anchor avm --force
avm install latest
avm use latest

# Install Node dependencies
npm install
```

### Build & Test

```bash
# Build the program
anchor build

# Run tests (local validator)
anchor test

# Deploy to devnet
anchor deploy --provider.cluster devnet

# Initialize the firewall
npx ts-node scripts/deploy.ts
```

### Local Development

```bash
# Start local validator
solana-test-validator

# In another terminal
anchor build && anchor deploy

# Run frontend
cd frontend && npm install && npm run dev
```

---

## Default Policy Configuration

| Setting | Default Value |
|---------|---------------|
| Global max payment | 10,000 SOL |
| Global daily limit | 50,000 SOL |
| Whitelist mode | Disabled |
| Rate limit | 0 (disabled) |
| Paused | false |

All defaults are configurable by the owner after initialization.

---

## Deployment

| Network | Status |
|---------|--------|
| Localnet | For development |
| Devnet | Testing |
| Mainnet-beta | Production |

---

## License

MIT
