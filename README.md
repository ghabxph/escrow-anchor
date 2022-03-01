# Escrow Anchor by Gabriel

Implementation of Escrow program, inspired by the works of Paul Schaaf's Solana Escrow in his Solana
tutorial: https://paulx.dev/blog/2021/01/14/programming-on-solana-an-introduction

**Devnet Program ID: 5v63TAY89KcCcAkNTFWm23bs23NYfiDLgaaKhvV78MCe**

## Explaining the escrow problem

Alice and Bob wants to exchange X and Y tokens. They want to do it in a way that one cannot cheat the
another. This is where Escrow program comes in.s

The role of Escrow program is to hold X tokens. X tokens would then be released to other party when
Y token requested by initiator is sent by the other party. In our case, Alice wants to send 1,000 X
tokens to Bob for 1,500 Y tokens, thus, Bob needs to send 1,500 Y tokens in order for Bob to receive
the 1,000 X token and for Alice to receive the 1,500 Y tokens. The escrow will act as their middleman.

**This escrow program consists of 4 RPC methods:**

1. initialize_accounts
2. start_trade
3. cancel_trade
4. accept_trade

To summarize the idea, the trade initiators needs a way to establish who are the participants of the
trade, amount in which the initiator wants to send to other party, and the amount it want to receive
from the other party. When the trade is started in which involves the initiator sending some X amount
of token to the escrow program, the trader needs to be able to cancel the transaction to revert back
his X tokens back to his wallet account.

### initialize_accounts

This RPC initializes 2 accounts: `token_a_pda` account and `trade` account. `token_a_pda` is temporary
account where the X token is going to be stored. The `trade` account is our state account that will
consist of information about how much token is Alice (trade initiator) is going to send to Bob (other
party), their addresses and how much Alice wants to receive from Bob before the trade will succeed.
Other state information such as whether the trade has started, cancelled, or finished is stored in this
account as well.

### start_trade

This RPC marks the beginning of the trade. If Alice sents the correct amount to be sent to Bob, the
X Token will be sent to `token_a_pda` account and will wait for Bob to accept the trade.

### cancel_trade

This RPC cancels the started trade. If the trade has already been accepted, this RPC call will fail.
Upon success, tokens sent from this RPC will be received back by its rightful owner (Alice).

### accept_trade

This RPC marks the acceptance of the trade. If Bob sends the correct amount of Y tokens, then the
trade will proceed and Bob shall receive X tokens from the `token_a_pda` account and Alice will
receive Bob's Y tokens.

## Developing Guide

### Prerequisites

* Rust 1.58.0
* Anchor 0.22.0
* Solana 1.8.16 (Mainnet Stable)

### Running the test in devnet

Just run `anchor test` in this directory.

```
BPF SDK: /home/gabriel/.local/share/solana/install/releases/1.8.16/solana-release/bin/sdk/bpf
cargo-build-bpf child: rustup toolchain list -v
cargo-build-bpf child: cargo +bpf build --target bpfel-unknown-unknown --release
    Finished release [optimized] target(s) in 0.29s
cargo-build-bpf child: /home/gabriel/.local/share/solana/install/releases/1.8.16/solana-release/bin/sdk/bpf/dependencies/bpf-tools/llvm/bin/llvm-readelf --dyn-symbols /home/gabriel/files/projects/ghabxph/escrow-anchor/target/deploy/escrow_anchor.so

To deploy this program:
  $ solana program deploy /home/gabriel/files/projects/ghabxph/escrow-anchor/target/deploy/escrow_anchor.so
The program address will default to this keypair (override with --program-id):
  /home/gabriel/files/projects/ghabxph/escrow-anchor/target/deploy/escrow_anchor-keypair.json
yarn run v1.22.11
warning package.json: No license field
$ /home/gabriel/files/projects/ghabxph/escrow-anchor/node_modules/.bin/ts-mocha -p ./tsconfig.json -t 1000000 tests/escrow-anchor.spec.ts


  Start trade then cancel
    ✔ Initialize accounts (5014ms)
    ✔ Alice starts the trade (418ms)
    ✔ Alice then cancels the trade (415ms)
    ✔ (FAIL) Bob accepts the trade despite trade has been already cancelled

  Starts the trade with wrong amount
    ✔ Initialize accounts (5001ms)
    ✔ (FAIL) Alice starts the trade, but she gives wrong amount

  Start trade then complete
    ✔ Initialize accounts (4987ms)
    ✔ Alice starts another trade (420ms)
    ✔ (FAIL) Bob accepts the trade with incorrect amount (52ms)
    ✔ Bob accepts the trade with correct amount (365ms)
    ✔ (FAIL) Alice cancels the trade even if the trade has been completed (62ms)


  11 passing (17s)

Done in 22.56s.
```

### Running the test in localnet

Go to Anchor.toml, and change provider.cluster to `localnet`. This is how it looks like:

```
[provider]
cluster = "localnet"
wallet = "/home/gabriel/.config/solana/id.json"
```

Before running the test, we still have to get the program id. To do that, you have to run
`anchor keys list`

```
gabriel@t14s ~/f/p/g/escrow-anchor (master)> anchor keys list
escrow_anchor: 5v63TAY89KcCcAkNTFWm23bs23NYfiDLgaaKhvV78MCe
```

Then go to `programs/escrow-anchor/lib.rs` and `Anchor.toml` to change the program ids
in the localnet.

```
// programs/escrow-anchor/lib.rs
use anchor_lang::prelude::*;

pub mod context;
pub mod processor;
pub mod state;
use crate::context::*;

declare_id!("5v63TAY89KcCcAkNTFWm23bs23NYfiDLgaaKhvV78MCe");
```

```
# Anchor.toml
[programs.devnet]
escrow_anchor = "5v63TAY89KcCcAkNTFWm23bs23NYfiDLgaaKhvV78MCe"
```

Then run `anchor test`.

```
BPF SDK: /home/gabriel/.local/share/solana/install/releases/1.8.16/solana-release/bin/sdk/bpf
cargo-build-bpf child: rustup toolchain list -v
cargo-build-bpf child: cargo +bpf build --target bpfel-unknown-unknown --release
    Finished release [optimized] target(s) in 0.29s
cargo-build-bpf child: /home/gabriel/.local/share/solana/install/releases/1.8.16/solana-release/bin/sdk/bpf/dependencies/bpf-tools/llvm/bin/llvm-readelf --dyn-symbols /home/gabriel/files/projects/ghabxph/escrow-anchor/target/deploy/escrow_anchor.so

To deploy this program:
  $ solana program deploy /home/gabriel/files/projects/ghabxph/escrow-anchor/target/deploy/escrow_anchor.so
The program address will default to this keypair (override with --program-id):
  /home/gabriel/files/projects/ghabxph/escrow-anchor/target/deploy/escrow_anchor-keypair.json
yarn run v1.22.11
warning package.json: No license field
$ /home/gabriel/files/projects/ghabxph/escrow-anchor/node_modules/.bin/ts-mocha -p ./tsconfig.json -t 1000000 tests/escrow-anchor.spec.ts


  Start trade then cancel
    ✔ Initialize accounts (5014ms)
    ✔ Alice starts the trade (418ms)
    ✔ Alice then cancels the trade (415ms)
    ✔ (FAIL) Bob accepts the trade despite trade has been already cancelled

  Starts the trade with wrong amount
    ✔ Initialize accounts (5001ms)
    ✔ (FAIL) Alice starts the trade, but she gives wrong amount

  Start trade then complete
    ✔ Initialize accounts (4987ms)
    ✔ Alice starts another trade (420ms)
    ✔ (FAIL) Bob accepts the trade with incorrect amount (52ms)
    ✔ Bob accepts the trade with correct amount (365ms)
    ✔ (FAIL) Alice cancels the trade even if the trade has been completed (62ms)


  11 passing (17s)

Done in 22.56s.
```