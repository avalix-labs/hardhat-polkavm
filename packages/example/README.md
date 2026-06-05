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

3. **Store the private key** in Hardhat's keystore (provided by the
   `@nomicfoundation/hardhat-keystore` plugin). For this testnet example, use
   the **development keystore** — it's read by both `deploy` and `test` and
   doesn't prompt for a password:

   ```bash
   npx hardhat keystore set PRIVATE_KEY --dev
   ```

   > Alternatives: an exported `PRIVATE_KEY` env var (takes precedence over the
   > keystore), or the password-protected production keystore
   > (`npx hardhat keystore set PRIVATE_KEY`). Note the **production keystore is
   > not read during `hardhat test`** (Hardhat avoids password prompts mid-test),
   > so it works for deploy but not for the write test below.

4. **Deploy** with Hardhat Ignition:

   ```bash
   bun run deploy
   ```

   This runs `hardhat ignition deploy ignition/modules/Counter.ts --network
   polkadotHubTestnet`. Confirm the prompt; expected output:

   ```text
   Hardhat Ignition 🚀

   Deploying [ CounterModule ]

   Batch #1
     Executed CounterModule#Counter

   [ CounterModule ] successfully deployed 🚀

   Deployed Addresses
   CounterModule#Counter - 0x…
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

> **Tip:** deployment uses [Hardhat Ignition](https://hardhat.org/ignition)
> (`ignition/modules/Counter.ts`). Ignition records deployments under
> `ignition/deployments/`, so re-running `bun run deploy` won't redeploy a module
> that already succeeded. If it fails with "insufficient funds", the account has
> no PAS — fund it and retry.

## Test

Run the integration tests with `hardhat test` (Node.js test runner +
[viem](https://viem.sh)):

```bash
bun run test
```

`test/counter.test.ts` runs against the contract deployed on the live testnet:

- **Read tests** — always run, no account or funds: the deployed address has
  PolkaVM bytecode and `count()` is callable.
- **Write test** (`inc()` / `incBy()`) — runs only when a **funded**
  `PRIVATE_KEY` is available. It reuses the same key from the Deploy step (the
  **dev keystore** or an env var — not the production keystore). It sends real
  transactions (costs PAS) and asserts `count()` increases; it is **skipped**
  otherwise.

> PolkaVM contracts can't run on Hardhat's built-in EDR (EVM) simulator, so
> these are integration tests against the live testnet, not local unit tests.
