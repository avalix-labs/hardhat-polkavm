import type {
  Compiler,
  CompilerInput,
  CompilerOutput,
  CompilerOutputError,
} from 'hardhat/types/solidity'

import { spawnCompile } from 'hardhat/internal/solidity'

import type { ResolcConfig, ResolcOptimizerConfig } from './config.js'

/**
 * resolc's standard-json parser only understands these coarse output selectors
 * (Hardhat's default selection includes finer ones like `evm.bytecode.object`
 * that resolc rejects).
 */
const RESOLC_OUTPUT_SELECTION = {
  '*': {
    '*': [
      'abi',
      'metadata',
      'evm.bytecode',
      'evm.deployedBytecode',
      'evm.methodIdentifiers',
      'storageLayout',
    ],
    '': ['ast'],
  },
}

/**
 * A Hardhat `Compiler` that produces PolkaVM bytecode via resolc instead of
 * EVM bytecode via solc. Two backends are supported:
 *
 * - `"npm"`: the self-contained `@parity/resolc` package (bundles solc).
 * - `"binary"`: a native resolc binary driven over `--standard-json`, reusing
 *   Hardhat's own `spawnCompile`.
 */
export class ResolcCompiler implements Compiler {
  public readonly isSolcJs: boolean

  constructor(
    /** Solidity language version, e.g. `0.8.29`. */
    public readonly version: string,
    /** Human-readable version, e.g. `0.8.29+resolc-v1.2.0`. */
    public readonly longVersion: string,
    /** Path to the resolc binary (empty in `"npm"` mode). */
    public readonly compilerPath: string,
    private readonly resolc: ResolcConfig,
    /** Path to the solc binary resolc should call (`"binary"` mode only). */
    private readonly solcPath: string | undefined,
  ) {
    this.isSolcJs = resolc.compilerSource === 'npm'
  }

  public async compile(input: CompilerInput): Promise<CompilerOutput> {
    if (this.resolc.compilerSource === 'binary') {
      return this.compileWithBinary(input)
    }
    return this.compileWithNpm(input)
  }

  private async compileWithBinary(
    input: CompilerInput,
  ): Promise<CompilerOutput> {
    const args = ['--standard-json']
    if (this.solcPath !== undefined) {
      args.push(`--solc=${this.solcPath}`)
    }

    // Drop the resolc settings we stashed on the config so they aren't sent to
    // the compiler, swap in resolc's optimizer format, and replace Hardhat's
    // fine-grained outputSelection with the coarse selectors resolc accepts.
    const { resolc: _resolc, ...solcSettings } = input.settings as Record<
      string,
      unknown
    >
    const modifiedInput: CompilerInput = {
      ...input,
      settings: {
        ...(solcSettings as CompilerInput['settings']),
        optimizer: buildOptimizer(this.resolc.optimizer),
        outputSelection: RESOLC_OUTPUT_SELECTION,
      },
    }

    return spawnCompile(this.compilerPath, args, modifiedInput)
  }

  private async compileWithNpm(input: CompilerInput): Promise<CompilerOutput> {
    const { compile, resolveInputs } = await import('@parity/resolc')

    const sources = resolveInputs(input.sources)
    const optimizer = buildOptimizer(this.resolc.optimizer)
    const output = await compile(sources, { optimizer })

    return toHardhatCompilerOutput(output, input)
  }
}

/** resolc's optimizer settings format (shared by npm and binary backends). */
function buildOptimizer(
  optimizer: ResolcOptimizerConfig,
): Record<string, unknown> {
  if (!optimizer.enabled) {
    return { enabled: false }
  }
  return {
    enabled: true,
    runs: optimizer.runs,
    ...(optimizer.mode !== undefined ? { mode: optimizer.mode } : {}),
    ...(optimizer.fallbackOz !== undefined
      ? { fallback_to_optimizing_for_size: optimizer.fallbackOz }
      : {}),
  }
}

interface ResolcNpmOutput {
  contracts?: {
    [file: string]: {
      [name: string]: {
        abi?: unknown
        evm?: { bytecode?: { object?: string } }
      }
    }
  }
  errors?: Array<{
    component?: string
    errorCode?: string
    formattedMessage?: string
    message?: string
    severity?: string
    type?: string
  }>
}

/**
 * The `@parity/resolc` npm API returns a trimmed output (abi + bytecode only).
 * Expand it into the standard-json shape Hardhat's build system expects.
 */
function toHardhatCompilerOutput(
  output: ResolcNpmOutput,
  input: CompilerInput,
): CompilerOutput {
  const sources: CompilerOutput['sources'] = {}
  let id = 0
  for (const sourceName of Object.keys(input.sources)) {
    sources[sourceName] = { id: id++, ast: {} }
  }

  const contracts: NonNullable<CompilerOutput['contracts']> = {}
  for (const [file, fileContracts] of Object.entries(output.contracts ?? {})) {
    contracts[file] = {}
    for (const [name, contract] of Object.entries(fileContracts)) {
      const object = contract.evm?.bytecode?.object ?? ''
      const bytecode = {
        object,
        opcodes: '',
        sourceMap: '',
        linkReferences: {},
      }
      contracts[file][name] = {
        abi: contract.abi ?? [],
        evm: {
          bytecode,
          deployedBytecode: { ...bytecode },
          methodIdentifiers: {},
        },
      }
    }
  }

  return {
    errors: (output.errors ?? []).map(toCompilerOutputError),
    sources,
    contracts,
  }
}

function toCompilerOutputError(error: {
  component?: string
  errorCode?: string
  formattedMessage?: string
  message?: string
  severity?: string
  type?: string
}): CompilerOutputError {
  const severity: CompilerOutputError['severity'] =
    error.severity === 'error' || error.severity === 'info'
      ? error.severity
      : 'warning'
  return {
    type: error.type ?? 'Error',
    component: error.component ?? 'resolc',
    message: error.message ?? '',
    severity,
    errorCode: error.errorCode,
    formattedMessage: error.formattedMessage,
  }
}
