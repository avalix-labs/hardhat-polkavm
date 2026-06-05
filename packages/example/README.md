# example

A minimal Hardhat 3 project that uses [`hardhat-polkadot`](../hardhat-polkadot)
to compile a contract to PolkaVM and deploy it to **Polkadot Hub TestNet** (the
Asset Hub smart-contract testnet).

## Compile

```bash
bun run compile
```

Compiles `contracts/Counter.sol` with resolc. The resulting artifact
(`artifacts/contracts/Counter.sol/Counter.json`) contains PolkaVM bytecode —
you can confirm it starts with the `PVM\0` magic (`0x50564d00…`).

## Deploy to Polkadot Hub TestNet

1. **Create a deployer account** and grab its private key.

2. **Fund it** with test PAS from the faucet:
   <https://faucet.polkadot.io/> (select *Polkadot Hub TestNet*).

3. **Store the private key** in Hardhat's encrypted keystore (provided by the
   `@nomicfoundation/hardhat-keystore` plugin):

   ```bash
   npx hardhat keystore set PRIVATE_KEY
   ```

   You'll be prompted for the value and, the first time, a password to encrypt
   the keystore. On deploy you'll be asked for that password to decrypt it.

   > An exported `PRIVATE_KEY` environment variable also works and takes
   > precedence over the keystore.

4. **Deploy:**

   ```bash
   bun run deploy
   ```

   Expected output:

   ```text
   Deploying Counter to polkadotHubTestnet ...
   Deployer account: 0x….
   Submitted deployment tx: 0x….
   ✅ Counter deployed at 0x….
      Explorer: https://blockscout-testnet.polkadot.io/address/0x….
   ```

### Network details

| | |
| --- | --- |
| Network | Polkadot Hub TestNet (Asset Hub / "Passet Hub") |
| RPC URL | `https://services.polkadothub-rpc.com/testnet` |
| Chain ID | `420420417` |
| Token | PAS |
| Faucet | <https://faucet.polkadot.io/> |
| Explorer | <https://blockscout-testnet.polkadot.io/> |

See <https://docs.polkadot.com/smart-contracts/connect/> for the full list of
networks.

> **Tip:** deployment uses raw `eth_sendTransaction` over the network's
> EIP-1193 provider (`scripts/deploy.ts`), so no extra deploy library is
> required. If the deploy fails with error code `1010`, the account has no PAS —
> fund it and retry.

## Test

Two integration tests live in `test/` (run with [Vitest](https://vitest.dev) +
[viem](https://viem.sh)):

```bash
bun run test           # run all (testnet runs; local skips if no node)
bun run test:testnet   # only the live-testnet test
bun run test:local     # only the local-node test
```

- **`counter.testnet.test.ts`** — read-only integration against the **live
  testnet**. Confirms the contract deployed at `0xfb619b…` has PolkaVM bytecode
  and that `count()` is callable. Needs no account and no funds.
- **`counter.local.test.ts`** — deploy + interact against a **local PolkaVM
  node** (`http://localhost:8545`). PolkaVM contracts can't run on Hardhat's
  built-in EDR (EVM) simulator, so this needs a local PolkaVM node exposing an
  Ethereum JSON-RPC with an unlocked dev account. It is **skipped automatically**
  when no such node is reachable (or the project hasn't been compiled yet).
