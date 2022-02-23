use anchor_lang::prelude::*;
use crate::context::*;

impl<'info> InitializeAccounts<'info> {

    /// Sets Token A and Token B destination where trade will commence and set
    /// the amount of token that Alice will send to Bob and the amount of Token
    /// B that Alice wants to receive from Bob.
    pub fn initialize_accounts(
        &mut self,
        token_a_source: Pubkey,
        token_a_destination: Pubkey,
        token_b_destination: Pubkey,
        token_a_to_send_amount: u64,
        token_b_request_amount: u64,
    ) -> Result<()>  {
        self.trade.token_a_pda = self.token_a_pda.key();
        self.trade.authority = self.authority.key();
        self.trade.token_a_source = token_a_source;
        self.trade.token_a_destination = token_a_destination;
        self.trade.token_b_destination = token_b_destination;
        self.trade.token_a_to_send_amount = token_a_to_send_amount;
        self.trade.token_b_request_amount = token_b_request_amount;
        self.trade.trade_began = false;
        self.trade.trade_cancelled = false;
        self.trade.trade_done = false;
        Ok(())
    }
}

impl<'info> StartTrade<'info> {

    pub fn start_trade(
        &mut self, 
        token_a_to_send_amount: u64,
    ) -> Result<()>  {
        
        if token_a_to_send_amount != self.trade.token_a_to_send_amount {
            // Throw error here.
        }

        // @TODO: Send Token A to self.token_a_pda
        self.trade.trade_began = true;
        Ok(())
    }
}

impl<'info> CancelTrade<'info> {

    pub fn cancel_trade(&mut self) -> Result<()>  {

        // @TODO: Send Token A to token_a_source (Alice's Token A address)

        self.trade.trade_cancelled = true;
        Ok(())
    }
}

impl<'info> AcceptTrade<'info> {

    pub fn accept_trade(&mut self, token_b_to_send_amount: u64) -> Result<()>  {

        if self.trade.trade_cancelled || self.trade.trade_done {
            // Throw error here. Trade has been cancelled. Transfer of token should
            // not happen.
        }

        if self.trade.token_b_request_amount != token_b_to_send_amount {
            // Throw error here. No token should be sent to program.
        }

        // Everything is good here. Token B should be sent to Alice and Token A
        // should be received by Bob.
        self.trade.trade_done = true;
        Ok(())
    }
}