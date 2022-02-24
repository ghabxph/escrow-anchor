import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { EscrowAnchor } from "../target/types/escrow_anchor";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import {
  prepareTokens,
  prepareAlice,
  prepareBob,
} from "./prepare.spec";

// Configure the client to use the local cluster.
anchor.setProvider(anchor.Provider.env());

// Our smart contract
const program = anchor.workspace.EscrowAnchor as Program<EscrowAnchor>;

// Initial Setup
const setup = (async () => {
  const { tokenA, tokenB } = await prepareTokens(anchor.Provider.env());
  const alice = await prepareAlice(anchor.Provider.env().connection, tokenA, tokenB, 100_000);
  const bob = await prepareBob(anchor.Provider.env().connection, tokenA, tokenB, 100_000);
  const [tokenAPda] = await anchor.web3.PublicKey.findProgramAddress(
    [
      tokenA.mint.toBuffer(),
      alice.keypair.publicKey.toBuffer(),
    ],
    program.programId
  );
  const [trade] = await anchor.web3.PublicKey.findProgramAddress(
    [
      tokenAPda.toBuffer(),
      bob.tokenA.address.toBuffer(),
      alice.tokenB.address.toBuffer(),
      alice.keypair.publicKey.toBuffer(),
    ],
    program.programId
  );
  return {
    tokenA,
    alice,
    bob,
    tokenAPda,
    trade,
  }
})();

describe("Initial setup", () => {
  it("Initialize accounts", async () => {
    const {
      tokenA,
      alice,
      bob,
      tokenAPda,
      trade,
    } = await setup;
    const tokenADestination = bob.tokenA.address;
    const tokenBDestination = alice.tokenB.address;
    const tokenASource = alice.tokenA.address;
    const tokenAToSendAmount = new anchor.BN(1_000);
    const tokenBRequestAmount = new anchor.BN(1_500);

    await program.rpc.initializeAccounts(
      tokenADestination,
      tokenBDestination,
      tokenASource,
      tokenAToSendAmount,
      tokenBRequestAmount,
      {
        accounts: {
          tokenAPda,
          authority: alice.keypair.publicKey,
          trade,
          tokenAMint: tokenA.mint,
          tokenProgram: TOKEN_PROGRAM_ID,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
          systemProgram: anchor.web3.SystemProgram.programId,
        },
        signers: [alice.keypair]
      });
  });
});

describe("Start trade then cancel", () => {
  it("Alice starts the trade", async () => {
    const {
      alice,
      tokenAPda,
      trade,
    } = await setup;
    const tokenAToSendAmount = new anchor.BN(1_000);
    await program.rpc.startTrade(
      tokenAToSendAmount,
      {
        accounts: {
          tokenASrc: alice.tokenA.address,
          tokenAPdaDest: tokenAPda,
          authority: alice.keypair.publicKey,
          trade,
          tokenProgram: TOKEN_PROGRAM_ID,
        },
        signers: [alice.keypair]
      }
    );
  });
  it("Alice then cancels the trade", async () => {
    const {
      alice,
      tokenAPda,
      trade,
    } = await setup;
    await program.rpc.cancelTrade(
      {
        accounts: {
          tokenAPdaSrc: tokenAPda,
          tokenADest: alice.tokenA.address,
          authority: alice.keypair.publicKey,
          trade,
          tokenProgram: TOKEN_PROGRAM_ID,
        },
        signers: [alice.keypair]
      }
    );
  });
  it("Bob accepts the trade despite trade has been already cancelled", async () => {
    // const {
    //   alice,
    //   bob,
    //   tokenAPda,
    //   trade,
    // } = await setup;
    // const tokenBToSendAmount = new anchor.BN(1_500);
    // await program.rpc.acceptTrade(
    //   tokenBToSendAmount,
    //   {
    //     accounts: {
    //       tokenAPdaSrc: tokenAPda,
    //       tokenBSrc: bob.tokenB.address,
    //       tokenADest: bob.tokenA.address,
    //       tokenBDest: alice.tokenB.address,
    //       authority: bob.keypair,
    //       trade,
    //       tokenProgram: TOKEN_PROGRAM_ID,
    //     },
    //     signers: [alice.keypair]
    //   }
    // );
  });
});

describe("Starts the trade with wrong amount", () => {
  it("Alice starts the trade, but she gives wrong amount", async () => {
    // const {
    //   alice,
    //   tokenAPda,
    //   trade,
    // } = await setup;
    // const tokenAToSendAmount = new anchor.BN(999);
    // await program.rpc.startTrade(
    //   tokenAToSendAmount,
    //   {
    //     accounts: {
    //       tokenASrc: alice.tokenA.address,
    //       tokenAPdaDest: tokenAPda,
    //       authority: alice.keypair,
    //       trade,
    //       tokenProgram: TOKEN_PROGRAM_ID,
    //     },
    //     signers: [alice.keypair]
    //   }
    // );
  });
});

describe("Start trade then complete", () => {
  it("Alice starts another trade", async () => {
    const {
      alice,
      tokenAPda,
      trade,
    } = await setup;
    const tokenAToSendAmount = new anchor.BN(1_000);
    await program.rpc.startTrade(
      tokenAToSendAmount,
      {
        accounts: {
          tokenASrc: alice.tokenA.address,
          tokenAPdaDest: tokenAPda,
          authority: alice.keypair.publicKey,
          trade,
          tokenProgram: TOKEN_PROGRAM_ID,
        },
        signers: [alice.keypair]
      }
    );
  });
  it("Bob accepts the trade with incorrect amount", async () => {
    // const {
    //   alice,
    //   bob,
    //   tokenAPda,
    //   trade,
    // } = await setup;
    // const tokenBToSendAmount = new anchor.BN(1_499);
    // await program.rpc.acceptTrade(
    //   tokenBToSendAmount,
    //   {
    //     accounts: {
    //       tokenAPdaSrc: tokenAPda,
    //       tokenBSrc: bob.tokenB.address,
    //       tokenADest: bob.tokenA.address,
    //       tokenBDest: alice.tokenB.address,
    //       authority: bob.keypair,
    //       trade,
    //       tokenProgram: TOKEN_PROGRAM_ID,
    //     },
    //     signers: [alice.keypair]
    //   }
    // );
  });
  it("Bob accepts the trade with correct amount", async () => {
    const {
      alice,
      bob,
      tokenAPda,
      trade,
    } = await setup;
    const tokenBToSendAmount = new anchor.BN(1_500);
    await program.rpc.acceptTrade(
      tokenBToSendAmount,
      {
        accounts: {
          tokenAPdaSrc: tokenAPda,
          tokenBSrc: bob.tokenB.address,
          tokenADest: bob.tokenA.address,
          tokenBDest: alice.tokenB.address,
          authority: bob.keypair.publicKey,
          trade,
          tokenProgram: TOKEN_PROGRAM_ID,
        },
        signers: [alice.keypair]
      }
    );
  });
  it("Alice cancels the trade even if the trade has been completed", async () => {
    // const {
    //   alice,
    //   tokenAPda,
    //   trade,
    // } = await setup;
    // await program.rpc.cancelTrade(
    //   {
    //     accounts: {
    //       tokenAPdaSrc: tokenAPda,
    //       tokenADest: alice.tokenA.address,
    //       authority: alice,
    //       trade,
    //       tokenProgram: TOKEN_PROGRAM_ID,
    //     },
    //     signers: [alice.keypair]
    //   }
    // );
  });
});