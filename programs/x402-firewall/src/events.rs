use anchor_lang::prelude::*;

#[event]
pub struct PaymentExecuted {
    pub sender: Pubkey,
    pub recipient: Pubkey,
    pub token_mint: Option<Pubkey>,
    pub amount: u64,
    pub intent_hash: Option<[u8; 32]>,
    pub timestamp: i64,
}

#[event]
pub struct PaymentBlocked {
    pub sender: Pubkey,
    pub recipient: Pubkey,
    pub token_mint: Option<Pubkey>,
    pub amount: u64,
    pub reason: String,
}

#[event]
pub struct IntentRegistered {
    pub intent: Pubkey,
    pub creator: Pubkey,
    pub recipient: Pubkey,
    pub amount: u64,
    pub token_mint: Option<Pubkey>,
    pub expiry: i64,
}

#[event]
pub struct IntentApproved {
    pub intent: Pubkey,
    pub agent: Pubkey,
    pub risk_score: u8,
    pub reason: String,
}

#[event]
pub struct IntentRejected {
    pub intent: Pubkey,
    pub agent: Pubkey,
    pub risk_score: u8,
    pub reason: String,
}

#[event]
pub struct IntentCancelled {
    pub intent: Pubkey,
    pub creator: Pubkey,
}

#[event]
pub struct IntentExecuted {
    pub intent: Pubkey,
    pub creator: Pubkey,
    pub recipient: Pubkey,
    pub amount: u64,
    pub timestamp: i64,
}

#[event]
pub struct FirewallInitialized {
    pub owner: Pubkey,
    pub global_max_payment: u64,
    pub global_daily_limit: u64,
}

#[event]
pub struct EmergencyPause {
    pub by: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct EmergencyUnpause {
    pub by: Pubkey,
    pub timestamp: i64,
}
