use anchor_lang::prelude::*;

#[account]
pub struct FirewallState {
    pub owner: Pubkey,
    pub paused: bool,
    pub whitelist_enabled: bool,
    pub global_max_payment: u64,
    pub global_daily_limit: u64,
    pub min_payment_interval: i64,
    pub total_payments: u64,
    pub total_volume: u64,
    pub total_blocked: u64,
    pub total_intents: u64,
    pub total_approved: u64,
    pub total_rejected: u64,
    pub total_executed: u64,
    pub last_payment_time: u64,
    pub authorized_agents_count: u8,
    pub bump: u8,
}

impl FirewallState {
    pub const SEEDS: &'static [u8] = b"firewall-state";

    pub fn space() -> usize {
        8 +     // discriminator
        32 +    // owner
        1 +     // paused
        1 +     // whitelist_enabled
        8 +     // global_max_payment
        8 +     // global_daily_limit
        8 +     // min_payment_interval
        8 +     // total_payments
        8 +     // total_volume
        8 +     // total_blocked
        8 +     // total_intents
        8 +     // total_approved
        8 +     // total_rejected
        8 +     // total_executed
        8 +     // last_payment_time
        1 +     // authorized_agents_count
        1       // bump
    }
}

#[account]
pub struct AuthorizedAgent {
    pub agent: Pubkey,
    pub bump: u8,
}

impl AuthorizedAgent {
    pub const SEEDS: &'static [u8] = b"authorized-agent";

    pub fn space() -> usize {
        8 + 32 + 1
    }
}

#[account]
#[derive(Default)]
pub struct SenderState {
    pub sender: Pubkey,
    pub blocked: bool,
    pub max_payment: Option<u64>,
    pub daily_limit: Option<u64>,
    pub bump: u8,
}

impl SenderState {
    pub const SEEDS: &'static [u8] = b"sender-state";

    pub fn space() -> usize {
        8 + 32 + 1 + (1 + 8) + (1 + 8) + 1
    }
}

#[account]
#[derive(Default)]
pub struct RecipientState {
    pub recipient: Pubkey,
    pub blacklisted: bool,
    pub whitelisted: bool,
    pub per_recipient_max: Option<u64>,
    pub bump: u8,
}

impl RecipientState {
    pub const SEEDS: &'static [u8] = b"recipient-state";

    pub fn space() -> usize {
        8 + 32 + 1 + 1 + (1 + 8) + 1
    }
}

#[account]
#[derive(Default)]
pub struct SenderRecipientPair {
    pub sender: Pubkey,
    pub recipient: Pubkey,
    pub is_allowed: Option<bool>,
    pub max_amount: Option<u64>,
    pub bump: u8,
}

impl SenderRecipientPair {
    pub const SEEDS: &'static [u8] = b"sender-recipient";

    pub fn space() -> usize {
        8 + 32 + 32 + (1 + 1) + (1 + 8) + 1
    }
}

#[account]
#[derive(Default)]
pub struct DailyTracker {
    pub sender: Pubkey,
    pub day_start: i64,
    pub total_spent: u64,
    pub bump: u8,
}

impl DailyTracker {
    pub const SEEDS: &'static [u8] = b"daily-tracker";

    pub fn space() -> usize {
        8 + 32 + 8 + 8 + 1
    }
}

#[account]
pub struct PaymentIntent {
    pub creator: Pubkey,
    pub recipient: Pubkey,
    pub amount: u64,
    pub token_mint: Option<Pubkey>,
    pub nonce: u64,
    pub expiry: i64,
    pub status: IntentStatus,
    pub risk_score: u8,
    pub reason: String,
    pub approved_by: Pubkey,
    pub created_at: i64,
    pub bump: u8,
}

impl PaymentIntent {
    pub const SEEDS: &'static [u8] = b"intent";

    pub fn space(reason_len: usize) -> usize {
        8 +     // discriminator
        32 +    // creator
        32 +    // recipient
        8 +     // amount
        (1 + 32) + // token_mint Option
        8 +     // expiry
        1 +     // status
        1 +     // risk_score
        (4 + reason_len) + // reason String
        32 +    // approved_by
        8 +     // created_at
        1       // bump
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum IntentStatus {
    Pending,
    Approved,
    Rejected,
    Executed,
    Expired,
    Cancelled,
}

impl Default for IntentStatus {
    fn default() -> Self {
        IntentStatus::Pending
    }
}
