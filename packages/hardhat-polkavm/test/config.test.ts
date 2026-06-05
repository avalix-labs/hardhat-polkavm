import { describe, expect, it } from 'vitest'

import {
  applyResolcToSolidity,
  getResolcFromCompilerConfig,
  resolveResolcConfig,
  validateResolcUserConfig,
} from '../src/internal/config.js'

describe('resolveResolcConfig', () => {
  it('applies defaults when nothing is provided', () => {
    const config = resolveResolcConfig(undefined)
    expect(config.compilerSource).toBe('npm')
    expect(config.version).toBe('1.2.0')
    expect(config.optimizer.enabled).toBe(true)
    expect(config.optimizer.runs).toBe(200)
  })

  it('honors user overrides', () => {
    const config = resolveResolcConfig({
      compilerSource: 'binary',
      version: '1.1.0',
      optimizer: { enabled: false, runs: 400, mode: 'z' },
    })
    expect(config.compilerSource).toBe('binary')
    expect(config.version).toBe('1.1.0')
    expect(config.optimizer.enabled).toBe(false)
    expect(config.optimizer.runs).toBe(400)
    expect(config.optimizer.mode).toBe('z')
  })
})

describe('validateResolcUserConfig', () => {
  it('accepts a config without a resolc block', () => {
    expect(validateResolcUserConfig({})).toEqual([])
  })

  it('accepts a valid resolc block', () => {
    expect(
      validateResolcUserConfig({
        resolc: { compilerSource: 'npm', optimizer: { runs: 400 } },
      }),
    ).toEqual([])
  })

  it('rejects an invalid compilerSource', () => {
    const errors = validateResolcUserConfig({
      // @ts-expect-error intentionally invalid
      resolc: { compilerSource: 'wasm' },
    })
    expect(errors).toHaveLength(1)
    expect(errors[0]?.path).toEqual(['resolc', 'compilerSource'])
  })

  it('rejects a negative optimizer runs value', () => {
    const errors = validateResolcUserConfig({
      resolc: { optimizer: { runs: -1 } },
    })
    expect(errors).toHaveLength(1)
    expect(errors[0]?.path).toEqual(['resolc', 'optimizer', 'runs'])
  })
})

describe('applyResolcToSolidity', () => {
  function baseSolidity() {
    return {
      profiles: {
        default: {
          isolated: false,
          preferWasm: false,
          compilers: [{ type: 'solc', version: '0.8.29', settings: {} }],
          overrides: {
            'contracts/C.sol': {
              type: 'solc',
              version: '0.8.20',
              settings: {},
            },
          },
        },
      },
      registeredCompilerTypes: ['solc'],
      npmFilesToBuild: [],
      splitTestsCompilation: false,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any
  }

  it('stashes resolc settings on every compiler while keeping type solc', () => {
    const resolc = resolveResolcConfig({ compilerSource: 'npm' })
    const result = applyResolcToSolidity(baseSolidity(), resolc)

    const profile = result.profiles.default!
    const compiler = profile.compilers[0]!
    expect(compiler.type).toBe('solc')
    expect(getResolcFromCompilerConfig(compiler)).toEqual(resolc)

    const override = profile.overrides['contracts/C.sol']!
    expect(override.type).toBe('solc')
    expect(getResolcFromCompilerConfig(override)).toEqual(resolc)
  })

  it('returns undefined resolc settings for a plain solc compiler', () => {
    expect(
      getResolcFromCompilerConfig({
        type: 'solc',
        version: '0.8.29',
        settings: {},
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any),
    ).toBeUndefined()
  })

  it('preserves the original solidity version of each compiler', () => {
    const resolc = resolveResolcConfig(undefined)
    const result = applyResolcToSolidity(baseSolidity(), resolc)
    const profile = result.profiles.default!
    expect(profile.compilers[0]!.version).toBe('0.8.29')
    expect(profile.overrides['contracts/C.sol']!.version).toBe('0.8.20')
  })
})
