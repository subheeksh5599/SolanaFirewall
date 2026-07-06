# Agentic Engineering Grant Application — x402 Payment Firewall
## Response from solana.new (Claude/Codex Session)

### One-Line Summary
On-chain payment firewall that stops compromised AI agents from draining Solana wallets.

---

### What I Built
I've been building an AI agent that manages a Solana wallet — paying for API calls, subscriptions, on-chain services. Then it hit me: if someone prompt-injects this agent or steals its private key, there's zero protection. The entire wallet gets drained in one transaction. No enterprise would deploy this.

So I built a payment firewall as an Anchor program on Solana. Every agent payment goes through policy checks enforced at the blockchain level:

- Max per-transaction caps: agent can't spend more than X SOL in one shot
- Daily spending limits: caps total outflow per wallet per day  
- Sender/recipient blocklists: ban specific addresses
- Rate limiting: minimum interval between payments
- Intent-based approval: agent proposes a payment, authorized approver reviews risk score, then executes through the firewall — like 2FA for autonomous spending
- Emergency pause: instant global freeze
- Full audit trail via Anchor events

The key insight: if any policy check fails, the Solana runtime itself reverts the transaction. No funds move. No trusted third party. No off-chain validation that can be bypassed.

### Live Demos
- **Website:** https://solanafirewall.vercel.app
- **Interactive app:** https://solanafirewall.vercel.app/app (connect Phantom wallet on devnet, try sending 15000 SOL — it gets blocked)
- **Deployed program:** 56hwxWZ1K1K6wCqGozkF1VTmUxSiWD1DYxm54F9U57EA on Solana devnet

### Technical Details
- 25 Anchor instruction handlers (payments, intent flow, admin controls)
- 7 PDA-based account types (FirewallState, SenderState, RecipientState, DailyTracker, PaymentIntent, etc.)
- 10 layered policy checks evaluated in the policy engine
- 19 custom error codes with descriptive messages
- SOL and SPL token support
- 17 TypeScript test cases

### How I Used AI Tools
This whole project was built with AI coding tools ($200 grant would cover Cursor Pro + Claude):

1. **Cursor** — Wrote the Anchor program structure, generated instruction handlers, fixed BPF stack overflow errors (3 instructions had too many `init_if_needed` accounts — fixed with UncheckedAccount + manual deserialization)
2. **Claude/Cursor** — Designed the PDA layout, policy evaluation engine, error handling patterns
3. **Claude** — Ported the landing page design from a reference site, adapted copy for the firewall context
4. **Vercel AI** — Deployed the React + Vite frontend

### What I'd Build Next With The Grant
- Autonomous agent demo script that runs headless, registers intents, gets risk-scored
- AI-powered risk scoring engine for intent approval
- Mainnet deployment with security audit
- Integration with popular Solana agent frameworks

### Proof of Execution
- GitHub: https://github.com/subheeksh5599/SolanaFirewall (40+ commits, clean history)
- Devnet TX: 2LVzqkyartuNS3KcFH93ekdySooLZXZ27sBBSbDnQd1evMrp8yhxvHgmGsb9pU6R82mCqVba4JyVQYNo5CiyT1s
- npm SDK: @subheeksh5599/solanafirewall
- Winner: Cronos x402 Hackathon 2025 (original concept, now ported to Solana)
