use anchor_lang::prelude::*;
use anchor_spl::token::{ Token, TokenAccount };
use std::mem::size_of;
use crate::state::Trade;

#[derive(Accounts)]
#[instruction(token_a_destination: Pubkey, token_b_destination: Pubkey)]
pub struct InitializeAccounts<'info> {

    /// @TODO: Initialize this!
    /// This is the account where Alice is going to send her Token A in exchange
    /// of Token B that is to be sent by Bob. Bob will receive Token A if the trade
    /// succeeds.
    pub token_a_pda: Account<'info, TokenAccount>,

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

    /// System Program
    pub system_program: Program<'info, System>
}


/// Alice starts a trade with Bob by sending 'X' token to the program and
/// requests 'Y' token to Bob for the trade to complete.
#[derive(Accounts)]
pub struct StartTrade<'info> {

    /// Address where Token A is coming from
    pub token_a_src: Account<'info, TokenAccount>,

    /// Address where Alice will send the Token A
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

    /// Bob sends x amount of token to this PDA. If the amount sent by Bob matches
    /// on what Alice requested, the exchange will succeed. Otherwise, the amount
    /// sent by Bob will be refunded to him until he sent the correct amount.
    pub token_b_pda: Account<'info, TokenAccount>,

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