use anchor_lang::prelude::*;

#[account]
pub struct Trade {

    /// This is the account where Alice is going to send her Token A in exchange
    /// of Token B that is to be sent by Bob. Bob will receive Token A if the trade
    /// succeeds.
    pub token_a_pda: Pubkey,

    /// Mint of Token A.
    pub token_a_mint: Pubkey,

    /// Initiator of this trade
    pub authority: Pubkey,

    /// This is where token_a is going to when Alice chose to cancel the trade.
    pub token_a_source: Pubkey,

    /// This is where the token_a is going to go once the trade succeeds. AKA, Bob's
    /// Token A address.
    pub token_a_destination: Pubkey,

    /// This is where the token_b is going to once the trade succeeds. AKA, Alice's
    /// Token B address.
    pub token_b_destination: Pubkey,

    /// Amount of Token A that Alice is going to send to Bob when transaction succeeds.
    pub token_a_to_send_amount: u64,

    /// Amount of Token B that Alice wants to request from Bob.
    pub token_b_request_amount: u64,

    /// Flag that notes that the trade has began.
    pub trade_began: bool,

    /// Flag that notes that the trade is cancelled.
    pub trade_cancelled: bool,

    /// Flag that notes that the trade is done.
    pub trade_done: bool,
}
