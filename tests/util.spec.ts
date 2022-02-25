import { EscrowAnchor } from "../target/types/escrow_anchor";
import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import {
    Token,
    prepareTokens,
    prepareAlice,
    prepareBob,
    Human,
} from "./prepare.spec";

export type RunSetup = {
    tokenA: Token,
    tokenB: Token,
    alice: Human,
    bob: Human,
    tokenAPda: anchor.web3.PublicKey,
    trade: anchor.web3.PublicKey,
}

export async function runSetup(program: Program<EscrowAnchor>): Promise<RunSetup> {
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
        tokenB,
        alice,
        bob,
        tokenAPda,
        trade,
    }
}

export async function initializeAccounts(program: Program<EscrowAnchor>, setup: Promise<RunSetup>) {
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
        }
    );
}

export const { disableLogging, enableLogging } = (() => {
    const log = console.log;
    const info = console.info;
    const warn = console.warn;
    const error = console.error;
    const disabled = function () { };
    return {
        disableLogging: () => {
            console.log = disabled;
            console.info = disabled;
            console.warn = disabled;
            console.error = disabled;
        },
        enableLogging: () => {
            console.log = log;
            console.info = info;
            console.warn = warn;
            console.error = error;
        }
    }
})();