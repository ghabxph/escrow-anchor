use crate::state::*;
use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};
use std::mem::size_of;

#[derive(Accounts)]
#[instruction(token_a_destination: Pubkey, token_b_destination: Pubkey)]
pub struct InitializeAccounts<'info> {
    /// This is the account where Alice is going to send her Token A in exchange
    /// of Token B that is to be sent by Bob. Bob will receive Token A if the trade
    /// succeeds.
    #[account(
        init_if_needed,
        token::mint = token_a_mint,
        token::authority = trade,
        seeds = [
            token_a_mint.key().as_ref(),
            authority.key().as_ref(),
        ],
        bump,
        payer = authority
    )]
    pub token_a_pda: Account<'info, TokenAccount>,

    /// Token A Mint. Virtually, we can escrow any Solana Tokens.
    pub token_a_mint: Account<'info, Mint>,

    /// Account that whose going to pay for this transaction.
    #[account(mut)]
    pub authority: Signer<'info>,

    /// Account that stores trade information
    #[account(
        init,
        seeds = [
            token_a_pda.key().as_ref(),
            token_a_destination.as_ref(),
            token_b_destination.as_ref(),
            authority.key().as_ref(),
        ],
        bump,
        payer = authority,
        space = 8 + size_of::<Trade>()
    )]
    pub trade: Account<'info, Trade>,

    /// Token Program
    pub token_program: Program<'info, Token>,

    /// System Program
    pub rent: Sysvar<'info, Rent>,

    /// System Program
    pub system_program: Program<'info, System>,
}

/// Alice starts a trade with Bob by sending 'X' token to the program and
/// requests 'Y' token to Bob for the trade to complete.
#[derive(Accounts)]
pub struct StartTrade<'info> {
    /// Address where Token A is coming from
    #[account(mut)]
    pub token_a_src: Account<'info, TokenAccount>,

    /// Address where Alice will send the Token A
    #[account(
        mut,
        seeds = [
            trade.token_a_mint.as_ref(),
            trade.authority.as_ref(),
        ],
        bump,
    )]
    pub token_a_pda_dest: Account<'info, TokenAccount>,

    /// Account that whose going to pay for this transaction.
    pub authority: Signer<'info>,

    /// Account where we are going to query information about the trade.
    #[account(
        mut,
        seeds = [
            trade.token_a_pda.as_ref(),
            trade.token_a_destination.as_ref(),
            trade.token_b_destination.as_ref(),
            trade.authority.as_ref(),
        ],
        bump,
    )]
    pub trade: Account<'info, Trade>,

    /// SPL Token Program to execute to begin trade
    pub token_program: Program<'info, Token>,
}

/// Alice starts a trade with Bob by sending 'X' token to the program and
/// requests 'Y' token to Bob for the trade to complete.
#[derive(Accounts)]
pub struct CancelTrade<'info> {
    /// PDA where Token A is coming from
    #[account(
        mut,
        seeds = [
            trade.token_a_mint.as_ref(),
            trade.authority.as_ref(),
        ],
        bump,
    )]
    pub token_a_pda_src: Account<'info, TokenAccount>,

    /// Address where program will send the Token A to (Alice's Token A Address)
    #[account(mut)]
    pub token_a_dest: Account<'info, TokenAccount>,

    /// Account that whose going to pay for this transaction.
    pub authority: Signer<'info>,

    /// Account where we are going to query information about the trade.
    /// This account is needed for us to know how much do we owe from Alice.
    ///
    /// NOTE: This code is vulnerable. Make sure that the account used here
    /// is the account that Alice is authorized to use.
    ///
    /// One solution is not to use bump and use a keypair that Alice only
    /// controls.
    #[account(
        mut,
        seeds = [
            trade.token_a_pda.as_ref(),
            trade.token_a_destination.as_ref(),
            trade.token_b_destination.as_ref(),
            trade.authority.as_ref(),
        ],
        bump,
    )]
    pub trade: Account<'info, Trade>,

    /// SPL Token Program to execute to cancel trade
    pub token_program: Program<'info, Token>,
}

/// Alice starts a trade with Bob by sending 'X' token to the program and
/// requests 'Y' token to Bob for the trade to complete.
#[derive(Accounts)]
pub struct AcceptTrade<'info> {
    /// Address where Alice sent the Token A. This is where Token A is coming from
    /// when Bob is going to receive Token A.
    #[account(
        mut,
        seeds = [
            trade.token_a_mint.as_ref(),
            trade.authority.as_ref(),
        ],
        bump,
    )]
    pub token_a_pda_src: Account<'info, TokenAccount>,

    /// Address where Bob's Token B is located. This is where Token B is coming from
    /// when Alice is going to receive Token B.
    #[account(mut)]
    pub token_b_src: Account<'info, TokenAccount>,

    /// Bob's Token A Address where Bob is going to receive Alice's Token A when
    /// transaction succeeds.
    #[account(mut)]
    pub token_a_dest: Account<'info, TokenAccount>,

    /// Alice's Token A Address where Alice is going to receive Bob's Token B when
    /// transaction succeeds
    #[account(mut)]
    pub token_b_dest: Account<'info, TokenAccount>,

    /// Account that whose going to pay for this transaction.
    pub authority: Signer<'info>,

    /// Account where we are going to query information about the trade.
    /// This account is needed for us to know whether the trade must be executed or
    /// not.
    ///
    /// NOTE: This code is vulnerable. Make sure that the account used here
    /// is the account that Alice is authorized to use.
    ///
    /// One solution is not to use bump and use a keypair that Alice only
    /// controls.
    #[account(
        mut,
        seeds = [
            trade.token_a_pda.as_ref(),
            trade.token_a_destination.as_ref(),
            trade.token_b_destination.as_ref(),
            trade.authority.as_ref(),
        ],
        bump,
    )]
    pub trade: Account<'info, Trade>,

    /// SPL Token Program to execute to accept trade
    pub token_program: Program<'info, Token>,
}