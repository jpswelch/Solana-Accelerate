use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, MintTo};
use anchor_spl::associated_token::AssociatedToken;

declare_id!("6KuKaNddgSAsmPHvj2cxhS2CokUmJgRV2B3HjYxC4TgA"); // Replace with your program ID later

#[program]
pub mod quickdrop_nft {
    use super::*;

    pub fn airdrop_nft(ctx: Context<AirdropNFT>) -> Result<()> {
        // Step 1: Mint 1 token to the user's ATA
        let cpi_accounts = MintTo {
            mint: ctx.accounts.mint.to_account_info(),
            to: ctx.accounts.token_account.to_account_info(),
            authority: ctx.accounts.mint_authority.to_account_info(),
        };

        let cpi_ctx = CpiContext::new(ctx.accounts.token_program.to_account_info(), cpi_accounts);
        token::mint_to(cpi_ctx.with_signer(&[&[
            b"mint_auth",
            &[ctx.bumps.mint_authority],
        ]]), 1)?;

        Ok(())
    }
}

#[derive(Accounts)]
pub struct AirdropNFT<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
        init_if_needed,
        payer = payer,
        mint::decimals = 0,
        mint::authority = mint_authority,
        mint::freeze_authority = mint_authority,
    )]
    pub mint: Account<'info, Mint>,

    #[account(
        init,
        payer = payer,
        associated_token::mint = mint,
        associated_token::authority = recipient
    )]
    pub token_account: Account<'info, TokenAccount>,

    /// CHECK: PDA signing the mint
    #[account(
        seeds = [b"mint_auth"],
        bump
    )]
    pub mint_authority: UncheckedAccount<'info>,

    pub recipient: SystemAccount<'info>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}
