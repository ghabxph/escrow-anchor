use anchor_lang::prelude::*;
use anchor_spl::token::{ transfer, Transfer};
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
        self.trade.token_a_mint = self.token_a_mint.key();
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

        // Throw error when token amount to send does not match in state account
        assert_eq!(token_a_to_send_amount, self.trade.token_a_to_send_amount);

        // Send Token A to self.token_a_pda
        transfer(
            CpiContext::new(
                self.token_program.to_account_info(), 
                Transfer{
                    from: self.token_a_src.to_account_info(),
                    to: self.token_a_pda_dest.to_account_info(),
                    authority: self.authority.to_account_info(),
                }
            ),
            self.trade.token_a_to_send_amount
        )?;

        self.trade.trade_began = true;
        Ok(())
    }
}

impl<'info> CancelTrade<'info> {

    pub fn cancel_trade(&mut self) -> Result<()>  {

        // Confirm that given addresses are correct
        assert_eq!(self.trade.token_a_pda, self.token_a_pda_src.key());
        assert_eq!(self.trade.token_a_source, self.token_a_dest.key());

        // Send Token A to Alice's Token A Address
        transfer(
            CpiContext::new(
                self.token_program.to_account_info(), 
                Transfer{
                    from: self.token_a_pda_src.to_account_info(),
                    to: self.token_a_dest.to_account_info(),
                    authority: self.authority.to_account_info(),
                }
            ),
            self.trade.token_a_to_send_amount
        )?;

        self.trade.trade_cancelled = true;
        Ok(())
    }
}

impl<'info> AcceptTrade<'info> {

    pub fn accept_trade(&mut self, token_b_to_send_amount: u64) -> Result<()>  {

        // Throw error when trade has been cancelled or trade is already done and user still accept the trade.
        assert_eq!(self.trade.trade_cancelled || self.trade.trade_done, true);
        
        // Throw error when requested amount by Alice is not given by Bob.
        assert_ne!(self.trade.token_b_request_amount, token_b_to_send_amount);

        // Make sure that destination addresses are correct before transaction proceeds
        assert_eq!(self.trade.token_a_destination,  self.token_a_dest.key());
        assert_eq!(self.trade.token_b_destination,  self.token_b_dest.key());

        // Send Token A to Bob's Token A Address
        transfer(
            CpiContext::new(
                self.token_program.to_account_info(), 
                Transfer{
                    from: self.token_a_pda_src.to_account_info(),
                    to: self.token_a_dest.to_account_info(),
                    authority: self.authority.to_account_info(),
                }
            ),
            self.trade.token_a_to_send_amount
        )?;

        // Send Token B to Alice's Token B Address
        transfer(
            CpiContext::new(
                self.token_program.to_account_info(), 
                Transfer{
                    from: self.token_b_src.to_account_info(),
                    to: self.token_b_dest.to_account_info(),
                    authority: self.authority.to_account_info(),
                }
            ),
            self.trade.token_b_request_amount
        )?;

        self.trade.trade_done = true;
        Ok(())
    }
}