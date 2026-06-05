import type {
  ResolcConfig,
  ResolcUserConfig,
} from './internal/config.js'
import type { HardhatPlugin } from 'hardhat/types/plugins'

import { definePlugin } from 'hardhat/plugins'

/**
 * Hardhat 3 plugin that compiles Solidity to PolkaVM bytecode using Parity's
 * `resolc` (revive) compiler, so contracts can be deployed to Polkadot's
 * smart-contract chains (e.g. Asset Hub).
 *
 * Enable it by adding a top-level `resolc` block to your Hardhat config. When
 * present, every Solidity compiler is transparently switched from `solc` to
 * `resolc` — no per-compiler `type` wiring required.
 */
const hardhatPolkaVM: HardhatPlugin = definePlugin({
  id: 'hardhat-polkavm',
  npmPackage: '@avalix/hardhat-polkavm',
  hookHandlers: {
    config: () => import('./internal/hooks/config.js'),
    solidity: () => import('./internal/hooks/solidity.js'),
  },
})

export default hardhatPolkaVM

export type {
  ResolcConfig,
  ResolcUserConfig,
  ResolcOptimizerUserConfig,
} from './internal/config.js'

// Extend Hardhat's config types with the `resolc` block. This augmentation
// lives in the entry file so it is always part of the published `index.d.mts`
// and therefore loads whenever a consumer imports this plugin.
declare module 'hardhat/types/config' {
  /** Top-level `resolc` block in `hardhat.config.ts`. */
  interface HardhatUserConfig {
    resolc?: ResolcUserConfig
  }

  /** Resolved `resolc` config available on `hre.config.resolc`. */
  interface HardhatConfig {
    resolc?: ResolcConfig
  }
}
