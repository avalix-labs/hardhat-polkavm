import { defineConfig } from 'hardhat/config'
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
})
