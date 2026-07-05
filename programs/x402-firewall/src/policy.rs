use anchor_lang::prelude::*;

use crate::errors::FirewallError;
use crate::state::{DailyTracker, FirewallState, RecipientState, SenderRecipientPair, SenderState};

pub struct PolicyResult {
    pub allowed: bool,
    pub reason: String,
}

pub fn evaluate(
    firewall: &FirewallState,
    sender_state: Option<&SenderState>,
    recipient_state: Option<&RecipientState>,
    pair: Option<&SenderRecipientPair>,
    daily: &DailyTracker,
    amount: u64,
    current_time: i64,
) -> Result<PolicyResult> {
    // 1. Firewall paused?
    if firewall.paused {
        return Ok(PolicyResult {
            allowed: false,
            reason: "Firewall is paused".to_string(),
        });
    }

    // 2. Sender blocked?
    if let Some(s) = sender_state {
        if s.blocked {
            return Ok(PolicyResult {
                allowed: false,
                reason: "Sender is blocked".to_string(),
            });
        }
    }

    // 3. Recipient blacklisted?
    if let Some(r) = recipient_state {
        if r.blacklisted {
            return Ok(PolicyResult {
                allowed: false,
                reason: "Recipient is blacklisted".to_string(),
            });
        }
    }

    // 4. Whitelist mode: recipient must be whitelisted
    if firewall.whitelist_enabled {
        let is_whitelisted = recipient_state.map(|r| r.whitelisted).unwrap_or(false);
        if !is_whitelisted {
            return Ok(PolicyResult {
                allowed: false,
                reason: "Recipient not whitelisted".to_string(),
            });
        }
    }

    // 5. Sender-recipient pair rules (explicit allow/deny)
    if let Some(p) = pair {
        if let Some(allowed) = p.is_allowed {
            if !allowed {
                return Ok(PolicyResult {
                    allowed: false,
                    reason: "Sender-recipient pair not allowed".to_string(),
                });
            }
        }
    }

    // 6. Per-pair max
    if let Some(p) = pair {
        if let Some(pair_max) = p.max_amount {
            if amount > pair_max {
                return Ok(PolicyResult {
                    allowed: false,
                    reason: "Exceeds sender-recipient pair max".to_string(),
                });
            }
        }
    }

    // 7. Per-recipient max
    if let Some(r) = recipient_state {
        if let Some(rec_max) = r.per_recipient_max {
            if amount > rec_max {
                return Ok(PolicyResult {
                    allowed: false,
                    reason: "Exceeds per-recipient max".to_string(),
                });
            }
        }
    }

    // 8. Max payment limit (sender override or global)
    let max_payment = match sender_state {
        Some(s) if s.max_payment.is_some() => s.max_payment.unwrap(),
        _ => firewall.global_max_payment,
    };
    if amount > max_payment {
        return Ok(PolicyResult {
            allowed: false,
            reason: format!("Exceeds max payment: {} > {}", amount, max_payment),
        });
    }

    // 9. Daily limit (sender override or global)
    let daily_limit = match sender_state {
        Some(s) if s.daily_limit.is_some() => s.daily_limit.unwrap(),
        _ => firewall.global_daily_limit,
    };
    let daily_spent = get_daily_spent(daily, current_time);
    let new_daily_total = daily_spent
        .checked_add(amount)
        .ok_or(FirewallError::ArithmeticOverflow)?;
    if new_daily_total > daily_limit {
        return Ok(PolicyResult {
            allowed: false,
            reason: format!(
                "Exceeds daily limit: {} + {} > {}",
                daily_spent, amount, daily_limit
            ),
        });
    }

    // 10. Rate limit (minimum interval between payments)
    if firewall.min_payment_interval > 0 && firewall.last_payment_time > 0 {
        let elapsed = current_time - firewall.last_payment_time as i64;
        if elapsed < firewall.min_payment_interval {
            return Ok(PolicyResult {
                allowed: false,
                reason: format!(
                    "Rate limit: {}s since last payment, minimum {}s",
                    elapsed, firewall.min_payment_interval
                ),
            });
        }
    }

    Ok(PolicyResult {
        allowed: true,
        reason: "Payment allowed".to_string(),
    })
}

pub fn get_daily_spent(daily: &DailyTracker, current_time: i64) -> u64 {
    let seconds_in_day: i64 = 86400;
    if current_time >= daily.day_start + seconds_in_day {
        0
    } else {
        daily.total_spent
    }
}
