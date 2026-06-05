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

`test/counter.testnet.test.ts` is a read-only integration test (using
[Vitest](https://vitest.dev) + [viem](https://viem.sh)) that runs against the
contract deployed on the live testnet — it checks the deployed address has
PolkaVM bytecode and that `count()` is callable. No account or funds needed.

```bash
bun run test
```
