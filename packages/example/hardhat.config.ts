import { configVariable, defineConfig } from 'hardhat/config'
import hardhatPolkadot from 'hardhat-polkadot'

export default defineConfig({
  plugins: [hardhatPolkadot],
  solidity: '0.8.29',
  // Presence of this block switches Solidity compilation from solc (EVM) to
  // resolc (PolkaVM). Remove it to compile for the EVM as usual.
  resolc: {
    // "npm" is self-contained and works everywhere. Switch to "binary" for the
    // faster native compiler on supported platforms.
    compilerSource: 'npm',
    optimizer: {
      enabled: true,
      runs: 200,
    },
  },
  networks: {
    // Polkadot Hub TestNet — the Asset Hub smart-contract testnet ("Passet Hub").
    // Token: PAS · Faucet: https://faucet.polkadot.io/
    // Docs: https://docs.polkadot.com/smart-contracts/connect/
    polkadotHubTestnet: {
      type: 'http',
      url: 'https://services.polkadothub-rpc.com/testnet',
      chainId: 420420417,
      // Set PRIVATE_KEY in your environment (or the Hardhat keystore) before
      // deploying — see the README.
      accounts: [configVariable('PRIVATE_KEY')],
    },
  },
})
