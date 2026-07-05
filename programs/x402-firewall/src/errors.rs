use anchor_lang::prelude::*;

#[error_code]
pub enum FirewallError {
    #[msg("Firewall is paused")]
    FirewallPaused,
    #[msg("Firewall is not paused")]
    FirewallNotPaused,
    #[msg("Sender address is blocked")]
    SenderBlocked,
    #[msg("Recipient address is blacklisted")]
    RecipientBlacklisted,
    #[msg("Recipient not whitelisted")]
    RecipientNotWhitelisted,
    #[msg("Exceeds maximum payment limit")]
    ExceedsMaxPayment,
    #[msg("Exceeds daily spending limit")]
    ExceedsDailyLimit,
    #[msg("Rate limit exceeded - too soon since last payment")]
    RateLimitExceeded,
    #[msg("Payment intent has expired")]
    IntentExpired,
    #[msg("Payment intent is not pending")]
    IntentNotPending,
    #[msg("Payment intent is not approved")]
    IntentNotApproved,
    #[msg("Payment intent already executed")]
    IntentAlreadyExecuted,
    #[msg("Caller is not an authorized agent")]
    UnauthorizedAgent,
    #[msg("Caller is not the firewall owner")]
    UnauthorizedOwner,
    #[msg("Token mint does not match")]
    InvalidTokenMint,
    #[msg("Arithmetic overflow")]
    ArithmeticOverflow,
    #[msg("Sender-recipient pair not allowed")]
    PairNotAllowed,
    #[msg("Amount exceeds u64 range")]
    AmountTooLarge,
    #[msg("Insufficient lamports")]
    InsufficientLamports,
    #[msg("Exceeds sender-recipient pair max")]
    SenderRecipientPairMaxExceeded,
}
