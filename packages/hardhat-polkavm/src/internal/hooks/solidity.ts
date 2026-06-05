import type { SolidityHooks } from 'hardhat/types/hooks'

import { getResolcFromCompilerConfig } from '../config.js'
import { downloadResolcBinary, getResolcBinaryPath } from '../download.js'
import { ResolcCompiler } from '../resolc-compiler.js'

export default async (): Promise<Partial<SolidityHooks>> => ({
  async downloadCompilers(_context, compilerConfigs, quiet) {
    // solc itself is downloaded by Hardhat's built-in handler (the compiler
    // type is still "solc"); we only need to fetch the native resolc binary.
    const versions = new Set<string>()
    for (const compilerConfig of compilerConfigs) {
      const resolc = getResolcFromCompilerConfig(compilerConfig)
      if (
        resolc?.compilerSource === 'binary' &&
        resolc.resolcPath === undefined
      ) {
        versions.add(resolc.version)
      }
    }

    await Promise.all(
      [...versions].map((version) => downloadResolcBinary(version, quiet)),
    )
  },

  async getCompiler(context, compilerConfig, next) {
    const resolc = getResolcFromCompilerConfig(compilerConfig)
    if (resolc === undefined) {
      // resolc not active for this compiler — use the normal solc compiler.
      return next(context, compilerConfig)
    }

    const solidityVersion = compilerConfig.version

    if (resolc.compilerSource === 'npm') {
      return new ResolcCompiler(
        solidityVersion,
        `${solidityVersion}+resolc-npm`,
        '',
        resolc,
        undefined,
      )
    }

    // Binary mode: the native resolc binary drives Hardhat's own solc via
    // `--solc`. `next` returns the (already downloaded) solc compiler.
    const resolcPath = resolc.resolcPath ?? getResolcBinaryPath(resolc.version)

    let solcPath = resolc.solcPath
    if (solcPath === undefined) {
      const solc = await next(context, compilerConfig)
      solcPath = solc.compilerPath
    }

    return new ResolcCompiler(
      solidityVersion,
      `${solidityVersion}+resolc-v${resolc.version}`,
      resolcPath,
      resolc,
      solcPath,
    )
  },
})
