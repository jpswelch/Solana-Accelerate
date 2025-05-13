import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { QuickdropNft } from "../target/types/quickdrop_nft";
import {
  createAssociatedTokenAccount,
  getAccount,
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { assert } from "chai";

describe("quickdrop-nft", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.QuickdropNft as Program<QuickdropNft>;

  const payer = provider.wallet as anchor.Wallet;
  const recipient = anchor.web3.Keypair.generate();

  it("Airdrops an NFT to a user", async () => {
    // Airdrop SOL to recipient so they can create token account if needed
    const sig = await provider.connection.requestAirdrop(
      recipient.publicKey,
      2 * anchor.web3.LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(sig);

    // Derive the mint authority PDA
    const [mintAuthority] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("mint_auth")],
      program.programId
    );

    // Create a new mint account
    const mint = anchor.web3.Keypair.generate();

    // Get the token account address
    const recipientATA = await getAssociatedTokenAddress(
      mint.publicKey,
      recipient.publicKey
    );

    try {
      await program.methods
        .airdropNft()
        .accounts({
          payer: payer.publicKey,
          mint: mint.publicKey,
          tokenAccount: recipientATA,
          mintAuthority: mintAuthority,
          recipient: recipient.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        })
        .signers([mint])
        .rpc();

      // Verify the token account has 1 token
      const accountInfo = await getAccount(provider.connection, recipientATA);
      assert.strictEqual(Number(accountInfo.amount), 1);

      console.log("✅ NFT minted to:", recipientATA.toBase58());
    } catch (error) {
      console.error("Error:", error);
      throw error;
    }
  });
});


// import * as anchor from "@coral-xyz/anchor";
// import { Program } from "@coral-xyz/anchor";
// import { Project5Capstone } from "../target/types/project_5_capstone";

// describe("project-5-capstone", () => {
//   // Configure the client to use the local cluster.
//   anchor.setProvider(anchor.AnchorProvider.env());

//   const program = anchor.workspace.project5Capstone as Program<Project5Capstone>;

//   it("Is initialized!", async () => {
//     // Add your test here.
//     const tx = await program.methods.initialize().rpc();
//     console.log("Your transaction signature", tx);
//   });
// });
