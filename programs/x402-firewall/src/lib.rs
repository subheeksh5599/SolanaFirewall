use anchor_lang::prelude::*;
use anchor_spl::token::{Token, TokenAccount};

pub mod errors;
pub mod events;
pub mod state;
pub mod policy;

use errors::*;
use events::*;
use state::*;

fn try_deser<T: AccountDeserialize>(ai: &AccountInfo) -> Option<T> {
    ai.try_borrow_data().ok()
        .and_then(|d| T::try_deserialize(&mut &d[..]).ok())
}

fn try_deser_daily(ai: &AccountInfo, current_time: i64) -> DailyTracker {
    match try_deser::<DailyTracker>(ai) {
        Some(mut d) => {
            let seconds_in_day: i64 = 86400;
            if current_time >= d.day_start + seconds_in_day {
                d.day_start = current_time;
                d.total_spent = 0;
            }
            d
        }
        None => DailyTracker { sender: Pubkey::default(), day_start: current_time, total_spent: 0, bump: 0 },
    }
}

fn write_daily(daily_info: &AccountInfo, daily: &DailyTracker) -> Result<()> {
    let mut data = daily_info.try_borrow_mut_data()?;
    let mut buf: &mut [u8] = &mut data;
    daily.try_serialize(&mut buf).map_err(|_| error!(FirewallError::ArithmeticOverflow))
}

declare_id!("56hwxWZ1K1K6wCqGozkF1VTmUxSiWD1DYxm54F9U57EA");

// ─── Initialize ─────────────────────────────────────

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = owner,
        space = FirewallState::space(),
        seeds = [FirewallState::SEEDS],
        bump
    )]
    pub firewall_state: Account<'info, FirewallState>,

    #[account(mut)]
    pub owner: Signer<'info>,

    pub system_program: Program<'info, System>,
}

// ─── Execute Payment ────────────────────────────────

#[derive(Accounts)]
pub struct ExecutePayment<'info> {
    #[account(mut, seeds = [FirewallState::SEEDS], bump = firewall_state.bump)]
    pub firewall_state: Account<'info, FirewallState>,
    #[account(mut)]
    pub sender: Signer<'info>,
    /// CHECK: recipient validated by policy
    pub recipient: AccountInfo<'info>,
    /// CHECK: optional sender state PDA
    pub sender_state: Option<UncheckedAccount<'info>>,
    /// CHECK: optional recipient state PDA
    pub recipient_state: Option<UncheckedAccount<'info>>,
    /// CHECK: optional pair PDA
    pub sender_recipient_pair: Option<UncheckedAccount<'info>>,
    /// CHECK: daily tracker PDA
    pub daily_tracker: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
}

// ─── Execute Token Payment ──────────────────────────

#[derive(Accounts)]
pub struct ExecuteTokenPayment<'info> {
    #[account(mut, seeds = [FirewallState::SEEDS], bump = firewall_state.bump)]
    pub firewall_state: Account<'info, FirewallState>,
    #[account(mut)]
    pub sender: Signer<'info>,
    /// CHECK: recipient validated by policy
    pub recipient: AccountInfo<'info>,
    /// CHECK: optional sender state PDA
    pub sender_state: Option<UncheckedAccount<'info>>,
    /// CHECK: optional recipient state PDA
    pub recipient_state: Option<UncheckedAccount<'info>>,
    /// CHECK: optional pair PDA
    pub sender_recipient_pair: Option<UncheckedAccount<'info>>,
    /// CHECK: daily tracker PDA
    pub daily_tracker: UncheckedAccount<'info>,
    #[account(mut)]
    pub sender_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    /// CHECK: validated by token program
    pub recipient_token_account: AccountInfo<'info>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

// ─── Simulate Payment ──────────────────────────────

#[derive(Accounts)]
pub struct SimulatePayment<'info> {
    #[account(
        seeds = [FirewallState::SEEDS],
        bump = firewall_state.bump,
    )]
    pub firewall_state: Account<'info, FirewallState>,

    /// CHECK: simulation sender
    pub sender: AccountInfo<'info>,

    /// CHECK: simulation recipient
    pub recipient: AccountInfo<'info>,

    pub sender_state: Option<Box<Account<'info, SenderState>>>,
    pub recipient_state: Option<Box<Account<'info, RecipientState>>>,
    pub sender_recipient_pair: Option<Box<Account<'info, SenderRecipientPair>>>,
    pub daily_tracker: Option<Account<'info, DailyTracker>>,
}

// ─── Register Intent ───────────────────────────────

#[derive(Accounts)]
#[instruction(nonce: u64)]
pub struct RegisterIntent<'info> {
    #[account(
        mut,
        seeds = [FirewallState::SEEDS],
        bump = firewall_state.bump,
    )]
    pub firewall_state: Account<'info, FirewallState>,

    #[account(
        init,
        payer = creator,
        space = PaymentIntent::space(128),
        seeds = [
            PaymentIntent::SEEDS,
            creator.key().as_ref(),
            &nonce.to_le_bytes()
        ],
        bump
    )]
    pub payment_intent: Account<'info, PaymentIntent>,

    #[account(mut)]
    pub creator: Signer<'info>,

    pub system_program: Program<'info, System>,
}

// ─── Approve Intent ────────────────────────────────

#[derive(Accounts)]
pub struct ApproveIntent<'info> {
    #[account(
        mut,
        seeds = [FirewallState::SEEDS],
        bump = firewall_state.bump,
    )]
    pub firewall_state: Account<'info, FirewallState>,

    #[account(
        mut,
        seeds = [
            PaymentIntent::SEEDS,
            payment_intent.creator.as_ref(),
            &payment_intent.nonce.to_le_bytes()
        ],
        bump = payment_intent.bump,
    )]
    pub payment_intent: Account<'info, PaymentIntent>,

    #[account(
        seeds = [
            AuthorizedAgent::SEEDS,
            agent.key().as_ref()
        ],
        bump,
    )]
    pub authorized_agent: Account<'info, AuthorizedAgent>,

    pub agent: Signer<'info>,
}

// ─── Reject Intent ─────────────────────────────────

#[derive(Accounts)]
pub struct RejectIntent<'info> {
    #[account(
        mut,
        seeds = [FirewallState::SEEDS],
        bump = firewall_state.bump,
    )]
    pub firewall_state: Account<'info, FirewallState>,

    #[account(
        mut,
        seeds = [
            PaymentIntent::SEEDS,
            payment_intent.creator.as_ref(),
            &payment_intent.nonce.to_le_bytes()
        ],
        bump = payment_intent.bump,
    )]
    pub payment_intent: Account<'info, PaymentIntent>,

    #[account(
        seeds = [
            AuthorizedAgent::SEEDS,
            agent.key().as_ref()
        ],
        bump,
    )]
    pub authorized_agent: Account<'info, AuthorizedAgent>,

    pub agent: Signer<'info>,
}

// ─── Cancel Intent ─────────────────────────────────

#[derive(Accounts)]
pub struct CancelIntent<'info> {
    #[account(
        seeds = [FirewallState::SEEDS],
        bump = firewall_state.bump,
    )]
    pub firewall_state: Account<'info, FirewallState>,

    #[account(
        mut,
        seeds = [
            PaymentIntent::SEEDS,
            payment_intent.creator.as_ref(),
            &payment_intent.nonce.to_le_bytes()
        ],
        bump = payment_intent.bump,
    )]
    pub payment_intent: Account<'info, PaymentIntent>,

    pub creator: Signer<'info>,
}

// ─── Execute Intent ────────────────────────────────

#[derive(Accounts)]
pub struct ExecuteIntent<'info> {
    #[account(mut, seeds = [FirewallState::SEEDS], bump = firewall_state.bump)]
    pub firewall_state: Account<'info, FirewallState>,
    #[account(mut)]
    pub payment_intent: Account<'info, PaymentIntent>,
    #[account(mut)]
    pub executor: Signer<'info>,
    /// CHECK: recipient from intent
    pub recipient: AccountInfo<'info>,
    /// CHECK: optional sender state PDA
    pub sender_state: Option<UncheckedAccount<'info>>,
    /// CHECK: optional recipient state PDA
    pub recipient_state: Option<UncheckedAccount<'info>>,
    /// CHECK: optional pair PDA
    pub sender_recipient_pair: Option<UncheckedAccount<'info>>,
    /// CHECK: daily tracker PDA
    pub daily_tracker: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
}

// ─── Admin: Transfer Ownership ─────────────────────

#[derive(Accounts)]
pub struct TransferOwnership<'info> {
    #[account(
        mut,
        seeds = [FirewallState::SEEDS],
        bump = firewall_state.bump,
        has_one = owner @ FirewallError::UnauthorizedOwner,
    )]
    pub firewall_state: Account<'info, FirewallState>,

    pub owner: Signer<'info>,
}

// ─── Admin: Toggle Pause ───────────────────────────

#[derive(Accounts)]
pub struct TogglePause<'info> {
    #[account(
        mut,
        seeds = [FirewallState::SEEDS],
        bump = firewall_state.bump,
        has_one = owner @ FirewallError::UnauthorizedOwner,
    )]
    pub firewall_state: Account<'info, FirewallState>,

    pub owner: Signer<'info>,
}

// ─── Admin: Manage Agent ───────────────────────────

#[derive(Accounts)]
#[instruction(agent_address: Pubkey)]
pub struct ManageAgent<'info> {
    #[account(
        mut,
        seeds = [FirewallState::SEEDS],
        bump = firewall_state.bump,
        has_one = owner @ FirewallError::UnauthorizedOwner,
    )]
    pub firewall_state: Account<'info, FirewallState>,

    #[account(
        init_if_needed,
        payer = owner,
        space = AuthorizedAgent::space(),
        seeds = [AuthorizedAgent::SEEDS, agent_address.as_ref()],
        bump
    )]
    pub authorized_agent: Account<'info, AuthorizedAgent>,

    #[account(mut)]
    pub owner: Signer<'info>,

    pub system_program: Program<'info, System>,
}

// ─── Admin: Remove Agent ───────────────────────────

#[derive(Accounts)]
pub struct RemoveAgent<'info> {
    #[account(
        mut,
        seeds = [FirewallState::SEEDS],
        bump = firewall_state.bump,
        has_one = owner @ FirewallError::UnauthorizedOwner,
    )]
    pub firewall_state: Account<'info, FirewallState>,

    #[account(
        mut,
        close = owner,
        seeds = [AuthorizedAgent::SEEDS, agent_to_remove.key().as_ref()],
        bump,
    )]
    pub authorized_agent: Account<'info, AuthorizedAgent>,

    /// CHECK: agent being removed
    pub agent_to_remove: AccountInfo<'info>,

    #[account(mut)]
    pub owner: Signer<'info>,
}

// ─── Admin: Set Global Limits ──────────────────────

#[derive(Accounts)]
pub struct SetGlobalLimits<'info> {
    #[account(
        mut,
        seeds = [FirewallState::SEEDS],
        bump = firewall_state.bump,
        has_one = owner @ FirewallError::UnauthorizedOwner,
    )]
    pub firewall_state: Account<'info, FirewallState>,

    pub owner: Signer<'info>,
}

// ─── Admin: Manage Sender ──────────────────────────

#[derive(Accounts)]
#[instruction(sender_address: Pubkey)]
pub struct ManageSender<'info> {
    #[account(
        mut,
        seeds = [FirewallState::SEEDS],
        bump = firewall_state.bump,
        has_one = owner @ FirewallError::UnauthorizedOwner,
    )]
    pub firewall_state: Account<'info, FirewallState>,

    #[account(
        init_if_needed,
        payer = owner,
        space = SenderState::space(),
        seeds = [SenderState::SEEDS, sender_address.as_ref()],
        bump
    )]
    pub sender_state: Account<'info, SenderState>,

    #[account(mut)]
    pub owner: Signer<'info>,

    pub system_program: Program<'info, System>,
}

// ─── Admin: Manage Recipient ───────────────────────

#[derive(Accounts)]
#[instruction(recipient_address: Pubkey)]
pub struct ManageRecipient<'info> {
    #[account(
        mut,
        seeds = [FirewallState::SEEDS],
        bump = firewall_state.bump,
        has_one = owner @ FirewallError::UnauthorizedOwner,
    )]
    pub firewall_state: Account<'info, FirewallState>,

    #[account(
        init_if_needed,
        payer = owner,
        space = RecipientState::space(),
        seeds = [RecipientState::SEEDS, recipient_address.as_ref()],
        bump
    )]
    pub recipient_state: Account<'info, RecipientState>,

    #[account(mut)]
    pub owner: Signer<'info>,

    pub system_program: Program<'info, System>,
}

// ─── Admin: Manage Sender-Recipient Pair ───────────

#[derive(Accounts)]
#[instruction(sender_address: Pubkey, recipient_address: Pubkey)]
pub struct ManagePair<'info> {
    #[account(
        seeds = [FirewallState::SEEDS],
        bump = firewall_state.bump,
        has_one = owner @ FirewallError::UnauthorizedOwner,
    )]
    pub firewall_state: Account<'info, FirewallState>,

    #[account(
        init_if_needed,
        payer = owner,
        space = SenderRecipientPair::space(),
        seeds = [
            SenderRecipientPair::SEEDS,
            sender_address.as_ref(),
            recipient_address.as_ref()
        ],
        bump
    )]
    pub sender_recipient_pair: Account<'info, SenderRecipientPair>,

    #[account(mut)]
    pub owner: Signer<'info>,

    pub system_program: Program<'info, System>,
}

// ─── Program Entry Point ───────────────────────────

#[program]
pub mod x402_firewall {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let firewall = &mut ctx.accounts.firewall_state;

        firewall.owner = ctx.accounts.owner.key();
        firewall.paused = false;
        firewall.whitelist_enabled = false;
        firewall.global_max_payment = 10_000_000_000_000;
        firewall.global_daily_limit = 50_000_000_000_000;
        firewall.min_payment_interval = 0;
        firewall.total_payments = 0;
        firewall.total_volume = 0;
        firewall.total_blocked = 0;
        firewall.total_intents = 0;
        firewall.total_approved = 0;
        firewall.total_rejected = 0;
        firewall.total_executed = 0;
        firewall.last_payment_time = 0;
        firewall.authorized_agents_count = 0;
        firewall.bump = ctx.bumps.firewall_state;

        emit!(FirewallInitialized {
            owner: firewall.owner,
            global_max_payment: firewall.global_max_payment,
            global_daily_limit: firewall.global_daily_limit,
        });

        Ok(())
    }

    // ─── Direct Payment ─────────────────────────────

    pub fn execute_payment(ctx: Context<ExecutePayment>, amount: u64) -> Result<()> {
        let firewall = &ctx.accounts.firewall_state;
        let sender = &ctx.accounts.sender;
        let recipient = &ctx.accounts.recipient;
        let clock = Clock::get()?;

        let sender_state = ctx.accounts.sender_state.as_ref().and_then(|a| try_deser::<SenderState>(a));
        let recipient_state = ctx.accounts.recipient_state.as_ref().and_then(|a| try_deser::<RecipientState>(a));
        let pair = ctx.accounts.sender_recipient_pair.as_ref().and_then(|a| try_deser::<SenderRecipientPair>(a));
        let mut daily = try_deser_daily(&ctx.accounts.daily_tracker, clock.unix_timestamp);

        let result = policy::evaluate(
            firewall,
            sender_state,
            recipient_state,
            pair,
            &daily,
            amount,
            clock.unix_timestamp,
        )?;

        if !result.allowed {
            let fw = &mut ctx.accounts.firewall_state;
            fw.total_blocked = fw.total_blocked.checked_add(1).ok_or(FirewallError::ArithmeticOverflow)?;

            write_daily(&ctx.accounts.daily_tracker, &daily)?;

            emit!(PaymentBlocked {
                sender: sender.key(),
                recipient: recipient.key(),
                token_mint: None,
                amount,
                reason: result.reason.clone(),
            });

            return Err(FirewallError::ExceedsMaxPayment.into());
        }

        if sender.lamports() < amount {
            return Err(FirewallError::InsufficientLamports.into());
        }

        daily.total_spent = daily.total_spent.checked_add(amount).ok_or(FirewallError::ArithmeticOverflow)?;
        daily.sender = sender.key();
        write_daily(&ctx.accounts.daily_tracker, &daily)?;

        let fw = &mut ctx.accounts.firewall_state;
        fw.total_payments = fw.total_payments.checked_add(1).ok_or(FirewallError::ArithmeticOverflow)?;
        fw.total_volume = fw.total_volume.checked_add(amount).ok_or(FirewallError::ArithmeticOverflow)?;
        fw.last_payment_time = clock.unix_timestamp as u64;

        anchor_lang::system_program::transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                anchor_lang::system_program::Transfer {
                    from: sender.to_account_info(),
                    to: recipient.to_account_info(),
                },
            ),
            amount,
        )?;

        emit!(PaymentExecuted {
            sender: sender.key(),
            recipient: recipient.key(),
            token_mint: None,
            amount,
            intent_hash: None,
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }

    // ─── Token Payment ──────────────────────────────

    pub fn execute_token_payment(ctx: Context<ExecuteTokenPayment>, amount: u64) -> Result<()> {
        let firewall = &ctx.accounts.firewall_state;
        let sender = &ctx.accounts.sender;
        let recipient = &ctx.accounts.recipient;
        let clock = Clock::get()?;
        let token_mint = ctx.accounts.sender_token_account.mint;

        let sender_state = ctx.accounts.sender_state.as_ref().and_then(|a| try_deser::<SenderState>(a));
        let recipient_state = ctx.accounts.recipient_state.as_ref().and_then(|a| try_deser::<RecipientState>(a));
        let pair = ctx.accounts.sender_recipient_pair.as_ref().and_then(|a| try_deser::<SenderRecipientPair>(a));
        let mut daily = try_deser_daily(&ctx.accounts.daily_tracker, clock.unix_timestamp);

        let result = policy::evaluate(firewall, sender_state, recipient_state, pair, &daily, amount, clock.unix_timestamp)?;

        if !result.allowed {
            let fw = &mut ctx.accounts.firewall_state;
            fw.total_blocked = fw.total_blocked.checked_add(1).ok_or(FirewallError::ArithmeticOverflow)?;
            write_daily(&ctx.accounts.daily_tracker, &daily)?;
            emit!(PaymentBlocked { sender: sender.key(), recipient: recipient.key(), token_mint: Some(token_mint), amount, reason: result.reason.clone() });
            return Err(FirewallError::ExceedsMaxPayment.into());
        }

        daily.total_spent = daily.total_spent.checked_add(amount).ok_or(FirewallError::ArithmeticOverflow)?;
        daily.sender = sender.key();
        write_daily(&ctx.accounts.daily_tracker, &daily)?;

        let fw = &mut ctx.accounts.firewall_state;
        fw.total_payments = fw.total_payments.checked_add(1).ok_or(FirewallError::ArithmeticOverflow)?;
        fw.total_volume = fw.total_volume.checked_add(amount).ok_or(FirewallError::ArithmeticOverflow)?;
        fw.last_payment_time = clock.unix_timestamp as u64;

        anchor_spl::token::transfer(
            CpiContext::new(ctx.accounts.token_program.to_account_info(), anchor_spl::token::Transfer {
                from: ctx.accounts.sender_token_account.to_account_info(),
                to: ctx.accounts.recipient_token_account.to_account_info(),
                authority: sender.to_account_info(),
            }),
            amount,
        )?;

        emit!(PaymentExecuted { sender: sender.key(), recipient: recipient.key(), token_mint: Some(token_mint), amount, intent_hash: None, timestamp: clock.unix_timestamp });
        Ok(())
    }

    // ─── Simulation ─────────────────────────────────

    pub fn simulate_payment(ctx: Context<SimulatePayment>, amount: u64) -> Result<(bool, String)> {
        let firewall = &ctx.accounts.firewall_state;
        let clock = Clock::get()?;
        let mut default_daily = DailyTracker::default();
        default_daily.day_start = clock.unix_timestamp;
        let daily_ref: &DailyTracker = ctx.accounts.daily_tracker.as_ref()
            .map(|d| d.as_ref())
            .unwrap_or(&default_daily);
        let sender_ref: Option<&SenderState> = ctx.accounts.sender_state.as_ref().map(|b| &***b);
        let recipient_ref: Option<&RecipientState> = ctx.accounts.recipient_state.as_ref().map(|b| &***b);
        let pair_ref: Option<&SenderRecipientPair> = ctx.accounts.sender_recipient_pair.as_ref().map(|b| &***b);
        let result = policy::evaluate_ref(firewall, sender_ref, recipient_ref, pair_ref, daily_ref, amount, clock.unix_timestamp)?;
        Ok((result.allowed, result.reason))
    }

    // ─── Intent Flow ────────────────────────────────

    pub fn register_intent(
        ctx: Context<RegisterIntent>,
        nonce: u64,
        recipient: Pubkey,
        amount: u64,
        token_mint: Option<Pubkey>,
        valid_for: i64,
    ) -> Result<()> {
        let firewall = &mut ctx.accounts.firewall_state;
        let clock = Clock::get()?;

        let intent = &mut ctx.accounts.payment_intent;
        intent.creator = ctx.accounts.creator.key();
        intent.recipient = recipient;
        intent.amount = amount;
        intent.token_mint = token_mint;
        intent.nonce = nonce;
        intent.expiry = clock.unix_timestamp.checked_add(valid_for).ok_or(FirewallError::ArithmeticOverflow)?;
        intent.status = IntentStatus::Pending;
        intent.risk_score = 0;
        intent.reason = String::new();
        intent.approved_by = Pubkey::default();
        intent.created_at = clock.unix_timestamp;
        intent.bump = ctx.bumps.payment_intent;

        firewall.total_intents = firewall.total_intents.checked_add(1).ok_or(FirewallError::ArithmeticOverflow)?;

        emit!(IntentRegistered {
            intent: intent.key(),
            creator: intent.creator,
            recipient: intent.recipient,
            amount: intent.amount,
            token_mint: intent.token_mint,
            expiry: intent.expiry,
        });

        Ok(())
    }

    pub fn approve_intent(
        ctx: Context<ApproveIntent>,
        risk_score: u8,
        reason: String,
    ) -> Result<()> {
        let intent = &mut ctx.accounts.payment_intent;
        let clock = Clock::get()?;

        require!(intent.status == IntentStatus::Pending, FirewallError::IntentNotPending);
        require!(clock.unix_timestamp <= intent.expiry, FirewallError::IntentExpired);

        intent.status = IntentStatus::Approved;
        intent.risk_score = risk_score;
        intent.reason = reason;
        intent.approved_by = ctx.accounts.agent.key();

        let fw = &mut ctx.accounts.firewall_state;
        fw.total_approved = fw.total_approved.checked_add(1).ok_or(FirewallError::ArithmeticOverflow)?;

        emit!(IntentApproved {
            intent: intent.key(),
            agent: ctx.accounts.agent.key(),
            risk_score,
            reason: intent.reason.clone(),
        });

        Ok(())
    }

    pub fn reject_intent(
        ctx: Context<RejectIntent>,
        risk_score: u8,
        reason: String,
    ) -> Result<()> {
        let intent = &mut ctx.accounts.payment_intent;
        let clock = Clock::get()?;

        require!(intent.status == IntentStatus::Pending, FirewallError::IntentNotPending);
        require!(clock.unix_timestamp <= intent.expiry, FirewallError::IntentExpired);

        intent.status = IntentStatus::Rejected;
        intent.risk_score = risk_score;
        intent.reason = reason;
        intent.approved_by = ctx.accounts.agent.key();

        let fw = &mut ctx.accounts.firewall_state;
        fw.total_rejected = fw.total_rejected.checked_add(1).ok_or(FirewallError::ArithmeticOverflow)?;

        emit!(IntentRejected {
            intent: intent.key(),
            agent: ctx.accounts.agent.key(),
            risk_score,
            reason: intent.reason.clone(),
        });

        Ok(())
    }

    pub fn cancel_intent(ctx: Context<CancelIntent>) -> Result<()> {
        let intent = &mut ctx.accounts.payment_intent;
        require!(intent.creator == ctx.accounts.creator.key(), FirewallError::UnauthorizedAgent);
        require!(intent.status == IntentStatus::Pending, FirewallError::IntentNotPending);

        intent.status = IntentStatus::Cancelled;

        emit!(IntentCancelled {
            intent: intent.key(),
            creator: intent.creator,
        });

        Ok(())
    }

    pub fn execute_intent(ctx: Context<ExecuteIntent>) -> Result<()> {
        let intent = &mut ctx.accounts.payment_intent;
        let clock = Clock::get()?;

        require!(intent.creator == ctx.accounts.executor.key(), FirewallError::UnauthorizedAgent);
        require!(intent.status == IntentStatus::Approved, FirewallError::IntentNotApproved);
        require!(clock.unix_timestamp <= intent.expiry, FirewallError::IntentExpired);

        let firewall = &ctx.accounts.firewall_state;
        let sender_state = ctx.accounts.sender_state.as_ref().and_then(|a| try_deser::<SenderState>(a));
        let recipient_state = ctx.accounts.recipient_state.as_ref().and_then(|a| try_deser::<RecipientState>(a));
        let pair = ctx.accounts.sender_recipient_pair.as_ref().and_then(|a| try_deser::<SenderRecipientPair>(a));
        let mut daily = try_deser_daily(&ctx.accounts.daily_tracker, clock.unix_timestamp);

        let result = policy::evaluate(firewall, sender_state, recipient_state, pair, &daily, intent.amount, clock.unix_timestamp)?;

        if !result.allowed {
            let fw = &mut ctx.accounts.firewall_state;
            fw.total_blocked = fw.total_blocked.checked_add(1).ok_or(FirewallError::ArithmeticOverflow)?;
            write_daily(&ctx.accounts.daily_tracker, &daily)?;
            emit!(PaymentBlocked { sender: intent.creator, recipient: intent.recipient, token_mint: intent.token_mint, amount: intent.amount, reason: result.reason.clone() });
            return Err(FirewallError::ExceedsMaxPayment.into());
        }

        if intent.token_mint.is_none() {
            let from = ctx.accounts.executor.to_account_info();
            let to = ctx.accounts.recipient.to_account_info();
            **from.try_borrow_mut_lamports()? = from.lamports().checked_sub(intent.amount).ok_or(FirewallError::InsufficientLamports)?;
            **to.try_borrow_mut_lamports()? = to.lamports().checked_add(intent.amount).ok_or(FirewallError::ArithmeticOverflow)?;
        }

        daily.total_spent = daily.total_spent.checked_add(intent.amount).ok_or(FirewallError::ArithmeticOverflow)?;
        daily.sender = intent.creator;
        write_daily(&ctx.accounts.daily_tracker, &daily)?;

        intent.status = IntentStatus::Executed;
        let fw = &mut ctx.accounts.firewall_state;
        fw.total_executed = fw.total_executed.checked_add(1).ok_or(FirewallError::ArithmeticOverflow)?;
        fw.total_payments = fw.total_payments.checked_add(1).ok_or(FirewallError::ArithmeticOverflow)?;
        fw.total_volume = fw.total_volume.checked_add(intent.amount).ok_or(FirewallError::ArithmeticOverflow)?;
        fw.last_payment_time = clock.unix_timestamp as u64;

        emit!(IntentExecuted { intent: intent.key(), creator: intent.creator, recipient: intent.recipient, amount: intent.amount, timestamp: clock.unix_timestamp });
        emit!(PaymentExecuted { sender: intent.creator, recipient: intent.recipient, token_mint: intent.token_mint, amount: intent.amount, intent_hash: Some(intent.key().to_bytes()), timestamp: clock.unix_timestamp });
        Ok(())
    }

    // ─── Admin ──────────────────────────────────────

    pub fn transfer_ownership(ctx: Context<TransferOwnership>, new_owner: Pubkey) -> Result<()> {
        ctx.accounts.firewall_state.owner = new_owner;
        Ok(())
    }

    pub fn pause(ctx: Context<TogglePause>) -> Result<()> {
        ctx.accounts.firewall_state.paused = true;
        emit!(EmergencyPause {
            by: ctx.accounts.owner.key(),
            timestamp: Clock::get()?.unix_timestamp,
        });
        Ok(())
    }

    pub fn unpause(ctx: Context<TogglePause>) -> Result<()> {
        ctx.accounts.firewall_state.paused = false;
        emit!(EmergencyUnpause {
            by: ctx.accounts.owner.key(),
            timestamp: Clock::get()?.unix_timestamp,
        });
        Ok(())
    }

    pub fn add_agent(ctx: Context<ManageAgent>, _agent_address: Pubkey) -> Result<()> {
        let authorized = &mut ctx.accounts.authorized_agent;
        authorized.agent = _agent_address;
        authorized.bump = ctx.bumps.authorized_agent;

        let fw = &mut ctx.accounts.firewall_state;
        fw.authorized_agents_count = fw.authorized_agents_count.checked_add(1).ok_or(FirewallError::ArithmeticOverflow)?;
        Ok(())
    }

    pub fn remove_agent(ctx: Context<RemoveAgent>) -> Result<()> {
        let fw = &mut ctx.accounts.firewall_state;
        fw.authorized_agents_count = fw.authorized_agents_count.checked_sub(1).ok_or(FirewallError::ArithmeticOverflow)?;
        Ok(())
    }

    pub fn set_global_max_payment(ctx: Context<SetGlobalLimits>, max: u64) -> Result<()> {
        ctx.accounts.firewall_state.global_max_payment = max;
        Ok(())
    }

    pub fn set_global_daily_limit(ctx: Context<SetGlobalLimits>, limit: u64) -> Result<()> {
        ctx.accounts.firewall_state.global_daily_limit = limit;
        Ok(())
    }

    pub fn set_whitelist_enabled(ctx: Context<SetGlobalLimits>, enabled: bool) -> Result<()> {
        ctx.accounts.firewall_state.whitelist_enabled = enabled;
        Ok(())
    }

    pub fn set_min_payment_interval(ctx: Context<SetGlobalLimits>, interval: i64) -> Result<()> {
        ctx.accounts.firewall_state.min_payment_interval = interval;
        Ok(())
    }

    pub fn block_sender(ctx: Context<ManageSender>, _sender_address: Pubkey, blocked: bool) -> Result<()> {
        let s = &mut ctx.accounts.sender_state;
        s.sender = _sender_address;
        s.blocked = blocked;
        s.bump = ctx.bumps.sender_state;
        Ok(())
    }

    pub fn set_sender_max_payment(ctx: Context<ManageSender>, _sender_address: Pubkey, max: Option<u64>) -> Result<()> {
        let s = &mut ctx.accounts.sender_state;
        s.sender = _sender_address;
        s.max_payment = max;
        s.bump = ctx.bumps.sender_state;
        Ok(())
    }

    pub fn set_sender_daily_limit(ctx: Context<ManageSender>, _sender_address: Pubkey, limit: Option<u64>) -> Result<()> {
        let s = &mut ctx.accounts.sender_state;
        s.sender = _sender_address;
        s.daily_limit = limit;
        s.bump = ctx.bumps.sender_state;
        Ok(())
    }

    pub fn blacklist_recipient(ctx: Context<ManageRecipient>, _recipient_address: Pubkey, blacklisted: bool) -> Result<()> {
        let r = &mut ctx.accounts.recipient_state;
        r.recipient = _recipient_address;
        r.blacklisted = blacklisted;
        r.bump = ctx.bumps.recipient_state;
        Ok(())
    }

    pub fn whitelist_recipient(ctx: Context<ManageRecipient>, _recipient_address: Pubkey, whitelisted: bool) -> Result<()> {
        let r = &mut ctx.accounts.recipient_state;
        r.recipient = _recipient_address;
        r.whitelisted = whitelisted;
        r.bump = ctx.bumps.recipient_state;
        Ok(())
    }

    pub fn set_pair_rules(
        ctx: Context<ManagePair>,
        _sender: Pubkey,
        _recipient: Pubkey,
        is_allowed: Option<bool>,
        max_amount: Option<u64>,
    ) -> Result<()> {
        let p = &mut ctx.accounts.sender_recipient_pair;
        p.sender = _sender;
        p.recipient = _recipient;
        p.is_allowed = is_allowed;
        p.max_amount = max_amount;
        p.bump = ctx.bumps.sender_recipient_pair;
        Ok(())
    }
}
