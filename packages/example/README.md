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

`test/counter.test.ts` uses `hardhat test` with a typed contract from
`@nomicfoundation/hardhat-viem` (`viem.getContractAt('Counter', …)`), attaching
to the contract already deployed on the live testnet.

```bash
bun run test         # read test (count) — write test is skipped
bun run test:write   # also runs the write test (sends real txs, costs PAS)
```

hardhat-viem routes calls through the configured account, so the tests need a
`PRIVATE_KEY` available via an env var or the **dev keystore**
(`npx hardhat keystore set PRIVATE_KEY --dev`) — the production keystore isn't
read during tests. Without a key the suite is skipped.

- **`reads count()`** — calls the `count()` view function (free).
- **`inc()` / `incBy()`** — opt-in (`bun run test:write`); sends real
  transactions and asserts `count()` increases. Needs a **funded** account.

> PolkaVM contracts can't run on Hardhat's built-in EDR (EVM) simulator, so
> these are integration tests against the live testnet, not local unit tests.
