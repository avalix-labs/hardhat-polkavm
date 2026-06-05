import { readFileSync } from 'node:fs'

import { configVariable, defineConfig } from 'hardhat/config'
import hardhatPolkadot from 'hardhat-polkadot'

// Hardhat 3 does not auto-load .env files, so load the one next to this config
// (if present) into process.env. Variables already set in the real environment
// take precedence. This makes `configVariable('PRIVATE_KEY')` pick up a key
// placed in packages/example/.env without exporting it in the shell.
try {
  const envFile = readFileSync(new URL('.env', import.meta.url), 'utf8')
  for (const line of envFile.split('\n')) {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/)
    if (match === null) {
      continue
    }
    const key = match[1]
    let value = match[2].trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    process.env[key] ??= value
  }
} catch {
  // No .env file — rely on real environment variables (or the keystore).
}

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
      // Set PRIVATE_KEY in packages/example/.env (auto-loaded above) or export
      // it in your shell before deploying — see the README.
      accounts: [configVariable('PRIVATE_KEY')],
    },
  },
})
