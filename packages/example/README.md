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

3. **Provide the private key** via the `PRIVATE_KEY` environment variable:

   ```bash
   export PRIVATE_KEY=0xyourprivatekey
   # or copy .env.example -> .env and load it, or use the Hardhat keystore:
   #   npx hardhat keystore set PRIVATE_KEY
   ```

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
