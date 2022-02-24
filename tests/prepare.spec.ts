import * as anchor from "@project-serum/anchor";
import { clusterApiUrl, Connection, Keypair, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { createMint, getOrCreateAssociatedTokenAccount, mintTo, Account } from '@solana/spl-token';
import { token } from "@project-serum/anchor/dist/cjs/utils";

const TOKEN_PER_UNIT = 1_000_000_000;

export type Token = {
    mintAuthority: Keypair,
    freezeAuthority: Keypair,
    mint: anchor.web3.PublicKey,
}

export type PrepareTokens = { tokenA: Token, tokenB: Token }

export async function prepareTokens(provider: anchor.Provider): Promise<PrepareTokens> {

    // Token Creator
    const tokenCreator = Keypair.generate();

    // Request airdrop for Token Creator
    await requestAirdrop(provider.connection, tokenCreator.publicKey, LAMPORTS_PER_SOL)

    // Create Token A
    const tokenAMintAuthority = Keypair.generate();
    const tokenAFreezeAuthority = Keypair.generate();
    const tokenAMint = await createMint(
        provider.connection,
        tokenCreator,
        tokenAMintAuthority.publicKey,
        tokenAFreezeAuthority.publicKey,
        9
    );

    // Create Token B
    const tokenBMintAuthority = Keypair.generate();
    const tokenBFreezeAuthority = Keypair.generate();
    const tokenBMint = await createMint(
        provider.connection,
        tokenCreator,
        tokenBMintAuthority.publicKey,
        tokenBFreezeAuthority.publicKey,
        9
    );

    return {
        tokenA: {
            mintAuthority: tokenAMintAuthority,
            freezeAuthority: tokenAFreezeAuthority,
            mint: tokenAMint,
        },
        tokenB: {
            mintAuthority: tokenBMintAuthority,
            freezeAuthority: tokenBFreezeAuthority,
            mint: tokenBMint,
        }
    }
}

type Human = {
    keypair: Keypair,
    tokenA: Account,
    tokenB: Account,
}

async function prepareHuman(connection: Connection, tokenA: Token, tokenB: Token): Promise<Human> {
    // Human's wallet
    const human = Keypair.generate();

    // Request sol airdrop (for human to be able to do transactions)
    requestAirdrop(connection, human.publicKey, LAMPORTS_PER_SOL)

    // Human's Token A Account
    const tokenAAccount = await getOrCreateAssociatedTokenAccount(
        connection,
        human,
        tokenA.mint,
        human.publicKey
    );

    // Human's Token B Account
    const tokenBAccount = await getOrCreateAssociatedTokenAccount(
        connection,
        human,
        tokenB.mint,
        human.publicKey
    );

    return {
        keypair: human,
        tokenA: tokenAAccount,
        tokenB: tokenBAccount,
    }
}

export async function prepareAlice(connection: Connection, tokenA: Token, tokenB: Token, amount: number): Promise<Human> {

    // Prepare for alice
    const { keypair: alice, tokenA: tokenAAccount, tokenB: tokenBAccount } = await prepareHuman(connection, tokenA, tokenB);

    // Let's give Alice some tokens (Token A)
    await mintTo(
        connection,
        alice,
        tokenA.mint,
        tokenAAccount.address,
        tokenA.mintAuthority,
        amount * TOKEN_PER_UNIT,
    );

    return {
        keypair: alice,
        tokenA: tokenAAccount,
        tokenB: tokenBAccount,
    }
}

export async function prepareBob(connection: Connection, tokenA: Token, tokenB: Token, amount: number): Promise<Human> {

    // Prepare for alice
    const { keypair: alice, tokenA: tokenAAccount, tokenB: tokenBAccount } = await prepareHuman(connection, tokenA, tokenB);

    // Let's give Alice some tokens (Token A)
    await mintTo(
        connection,
        alice,
        tokenB.mint,
        tokenBAccount.address,
        tokenB.mintAuthority,
        amount * TOKEN_PER_UNIT,
    );

    return {
        keypair: alice,
        tokenA: tokenAAccount,
        tokenB: tokenBAccount,
    }
}

async function requestAirdrop(connection: Connection, address: anchor.web3.PublicKey, lamports: number) {
    const tx = await connection.requestAirdrop(address, lamports);
    await connection.confirmTransaction(tx);
}