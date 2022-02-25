# Escrow Anchor by Gabriel

Implementation of Escrow program, inspired by the works of Paul Schaaf's Solana Escrow in his Solana
tutorial: https://paulx.dev/blog/2021/01/14/programming-on-solana-an-introduction

## Prerequisites

* Rust 1.58.0
* Anchor 0.22.0
* Solana 1.8.16 (Mainnet Stable)

## Running the test

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

## Running the test in Devnet

Go to Anchor.toml, and change provider.cluster to `devnet`. This is how it looks like:

```
[provider]
cluster = "devnet"
wallet = "/home/gabriel/.config/solana/id.json"
```