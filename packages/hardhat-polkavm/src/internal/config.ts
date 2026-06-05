import type {
  HardhatConfig,
  HardhatUserConfig,
  SolidityCompilerConfig,
} from 'hardhat/types/config'
import type { HardhatUserConfigValidationError } from 'hardhat/types/hooks'

import { DEFAULT_RESOLC_VERSION } from './constants.js'

/** Which compiler backend produces the PolkaVM bytecode. */
export type ResolcCompilerSource = 'npm' | 'binary'

export type ResolcOptimizerMode = '0' | '1' | '2' | '3' | 's' | 'z'

export interface ResolcOptimizerUserConfig {
  /** Enable the optimizer. Defaults to `true`. */
  enabled?: boolean
  /** Number of optimizer runs. Defaults to `200`. */
  runs?: number
  /** Optimization mode: `3` for speed, `z` for size. */
  mode?: ResolcOptimizerMode
  /** Retry with `-Oz` if the bytecode is too large. */
  fallbackOz?: boolean
}

export interface ResolcUserConfig {
  /**
   * `"npm"` (default) uses the self-contained `@parity/resolc` package — works
   * on every platform, no downloads. `"binary"` downloads the native resolc
   * release (faster, common platforms only).
   */
  compilerSource?: ResolcCompilerSource
  /** revive/resolc release to use in `"binary"` mode. Defaults to 1.2.0. */
  version?: string
  optimizer?: ResolcOptimizerUserConfig
  /** Use a resolc binary already on disk instead of downloading one. */
  resolcPath?: string
  /** Path to the `solc` binary resolc should call (`"binary"` mode only). */
  solcPath?: string
}

export interface ResolcOptimizerConfig {
  enabled: boolean
  runs: number
  mode?: ResolcOptimizerMode
  fallbackOz?: boolean
}

export interface ResolcConfig {
  compilerSource: ResolcCompilerSource
  version: string
  optimizer: ResolcOptimizerConfig
  resolcPath?: string
  solcPath?: string
}

/** Fills in defaults for a user-provided `resolc` block. */
export function resolveResolcConfig(
  userConfig: ResolcUserConfig | undefined,
): ResolcConfig {
  const u = userConfig ?? {}
  return {
    compilerSource: u.compilerSource ?? 'npm',
    version: u.version ?? DEFAULT_RESOLC_VERSION,
    optimizer: {
      enabled: u.optimizer?.enabled ?? true,
      runs: u.optimizer?.runs ?? 200,
      mode: u.optimizer?.mode,
      fallbackOz: u.optimizer?.fallbackOz,
    },
    resolcPath: u.resolcPath,
    solcPath: u.solcPath,
  }
}

/** Validates the `resolc` block of the user config (shape only). */
export function validateResolcUserConfig(
  userConfig: HardhatUserConfig,
): HardhatUserConfigValidationError[] {
  const errors: HardhatUserConfigValidationError[] = []
  const resolc = userConfig.resolc
  if (resolc === undefined) {
    return errors
  }

  if (typeof resolc !== 'object') {
    errors.push({ path: ['resolc'], message: 'Expected an object.' })
    return errors
  }

  if (
    resolc.compilerSource !== undefined &&
    resolc.compilerSource !== 'npm' &&
    resolc.compilerSource !== 'binary'
  ) {
    errors.push({
      path: ['resolc', 'compilerSource'],
      message: 'Expected "npm" or "binary".',
    })
  }

  const runs = resolc.optimizer?.runs
  if (runs !== undefined && (typeof runs !== 'number' || runs < 0)) {
    errors.push({
      path: ['resolc', 'optimizer', 'runs'],
      message: 'Expected a non-negative number.',
    })
  }

  return errors
}

/**
 * Stashes the resolved resolc settings on every Solidity compiler in the
 * resolved config (under `settings.resolc`). The compiler `type` is left as
 * `solc` on purpose, so Hardhat still downloads and manages solc as usual; the
 * solidity hook then sees the stashed settings and swaps in resolc.
 */
export function applyResolcToSolidity(
  solidity: HardhatConfig['solidity'],
  resolc: ResolcConfig,
): HardhatConfig['solidity'] {
  const withResolc = (
    compiler: SolidityCompilerConfig,
  ): SolidityCompilerConfig => ({
    ...compiler,
    settings: { ...compiler.settings, resolc },
  })

  const profiles: HardhatConfig['solidity']['profiles'] = {}
  for (const [name, profile] of Object.entries(solidity.profiles)) {
    const overrides: typeof profile.overrides = {}
    for (const [key, override] of Object.entries(profile.overrides)) {
      overrides[key] = withResolc(override)
    }
    profiles[name] = {
      ...profile,
      compilers: profile.compilers.map(withResolc),
      overrides,
    }
  }

  return { ...solidity, profiles }
}

/**
 * Returns the resolc settings stashed on a compiler config by the config hook,
 * or `undefined` when resolc is not active for that compiler.
 */
export function getResolcFromCompilerConfig(
  compilerConfig: SolidityCompilerConfig,
): ResolcConfig | undefined {
  const settings = compilerConfig.settings as
    | { resolc?: ResolcConfig }
    | undefined
  return settings?.resolc
}
