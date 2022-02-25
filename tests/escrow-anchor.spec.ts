import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { EscrowAnchor } from "../target/types/escrow_anchor";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { disableLogging, enableLogging, initializeAccounts, RunSetup, runSetup } from "./util.spec";
import assert from "assert";

// Configure the client to use the local cluster.s
anchor.setProvider(anchor.Provider.env());

// Our smart contract
const program = anchor.workspace.EscrowAnchor as Program<EscrowAnchor>;

// Initial Setup
let setup: Promise<RunSetup>;

describe("Start trade then cancel", () => {
  it("Initialize accounts", async () => {
    setup = runSetup(program);
    await initializeAccounts(program, setup);
  });
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
  it("(FAIL) Bob accepts the trade despite trade has been already cancelled", async () => {
    const {
      alice,
      bob,
      tokenAPda,
      trade,
    } = await setup;
    const tokenBToSendAmount = new anchor.BN(1_500);
    let thrownError = false;
    try {
      disableLogging();
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
          signers: [bob.keypair]
        }
      );
    } catch (e) { thrownError = true }
    enableLogging();
    assert(thrownError, 'acceptTrade RPC did not fail. It is expected to fail as the trade is already cancelled and Bob attempts to accept the trade.');
  });
});

describe("Starts the trade with wrong amount", () => {
  it("Initialize accounts", async () => {
    setup = runSetup(program);
    await initializeAccounts(program, setup);
  });
  it("(FAIL) Alice starts the trade, but she gives wrong amount", async () => {
    const {
      alice,
      tokenAPda,
      trade,
    } = await setup;
    const tokenAToSendAmount = new anchor.BN(999);
    let thrownError = false;
    try {
      disableLogging();
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
    } catch (e) { thrownError = true };
    enableLogging();
    assert(thrownError, 'startTrade RPC did not fail. It is expected to fail as Alice gave incorrect amount.');
  });
});

describe("Start trade then complete", () => {
  it("Initialize accounts", async () => {
    setup = runSetup(program);
    await initializeAccounts(program, setup);
  });
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
  it("(FAIL) Bob accepts the trade with incorrect amount", async () => {
    const {
      alice,
      bob,
      tokenAPda,
      trade,
    } = await setup;
    const tokenBToSendAmount = new anchor.BN(1_499);
    let thrownError = false;
    try {
      disableLogging();
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
          signers: [bob.keypair]
        }
      );
    } catch (e) { thrownError = true };
    enableLogging();
    assert(thrownError, 'acceptTrade RPC did not fail. It is expected to fail as Bob gave incorrect amount from what Alice had requested.');
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
        signers: [bob.keypair]
      }
    );
  });
  it("(FAIL) Alice cancels the trade even if the trade has been completed", async () => {
    const {
      alice,
      tokenAPda,
      trade,
    } = await setup;
    let thrownError = false;
    try {
      disableLogging();
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
    } catch (e) { thrownError = true };
    enableLogging();
    assert(thrownError, 'cancelTrade RPC did not fail. It is expected to fail as the trade has been already completed and Alice attempted to cancel the trade.');
  });
});