use anchor_lang::prelude::*;

pub mod context;
pub mod processor;
pub mod state;
use crate::context::*;

declare_id!("5v63TAY89KcCcAkNTFWm23bs23NYfiDLgaaKhvV78MCe");

#[program]
pub mod escrow_anchor {
    use super::*;

    /// Initializes account needed for trade between Alice and Bob to begin.
    pub fn initialize_accounts(
        ctx: Context<InitializeAccounts>,
        token_a_destination: Pubkey,
        token_b_destination: Pubkey,
        token_a_source: Pubkey,
        token_a_to_send_amount: u64,
        token_b_request_amount: u64,
    ) -> Result<()>  {
        ctx.accounts.initialize_accounts(
            token_a_source,
            token_a_destination,
            token_b_destination,
            token_a_to_send_amount,
            token_b_request_amount
        )
    }

    /// Alice starts a trade with Bob by sending 'X' token to the program and
    /// requests 'Y' token to Bob for the trade to complete.
    pub fn start_trade(ctx: Context<StartTrade>, token_a_to_send_amount: u64) -> Result<()>  {
        ctx.accounts.start_trade(token_a_to_send_amount)
    }

    /// Alice can cancel the trade anytime, for example, she wants to change the
    /// trade agreement. Cancelling the trade restores Alice's token that she sent
    /// in the Token A PDA.
    pub fn cancel_trade(ctx: Context<CancelTrade>) -> Result<()>  {
        ctx.accounts.cancel_trade()
    }

    /// Bob accepts the trade by sending 'Y' token requested by Alice to the
    /// program. If Bob give the correct amount of 'Y' token to the program,
    /// the trade will succeed. If not, then the trade will fail and the token
    /// sent by Bob will return to Bob.
    pub fn accept_trade(ctx: Context<AcceptTrade>, token_b_to_send_amount: u64) -> Result<()>  {
        ctx.accounts.accept_trade(token_b_to_send_amount)
    }
}
