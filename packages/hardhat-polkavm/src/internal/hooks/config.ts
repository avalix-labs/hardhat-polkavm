import type { ConfigHooks } from 'hardhat/types/hooks'

import {
  applyResolcToSolidity,
  resolveResolcConfig,
  validateResolcUserConfig,
} from '../config.js'

export default async (): Promise<Partial<ConfigHooks>> => ({
  async validateUserConfig(userConfig) {
    return validateResolcUserConfig(userConfig)
  },

  async resolveUserConfig(userConfig, resolveConfigurationVariable, next) {
    const resolvedConfig = await next(userConfig, resolveConfigurationVariable)

    // The plugin stays completely inert unless the user opts in with a
    // top-level `resolc` block.
    if (userConfig.resolc === undefined) {
      return resolvedConfig
    }

    const resolc = resolveResolcConfig(userConfig.resolc)

    return {
      ...resolvedConfig,
      resolc,
      solidity: applyResolcToSolidity(resolvedConfig.solidity, resolc),
    }
  },
})
