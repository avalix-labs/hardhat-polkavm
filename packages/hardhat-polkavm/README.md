# @avalix/hardhat-polkavm

A **Hardhat 3** plugin that compiles your Solidity contracts to **PolkaVM**
bytecode using Parity's [`resolc`](https://github.com/paritytech/revive)
(revive) compiler, so you can deploy them to Polkadot smart-contract chains
(e.g. Asset Hub).

> The official [`paritytech/hardhat-polkadot`](https://github.com/paritytech/hardhat-polkadot)
> targets Hardhat 2. This plugin is a lightweight reimplementation for the
> Hardhat 3 plugin system (config + `solidity` hooks).

## Install

```bash
npm install --save-dev @avalix/hardhat-polkavm
# or: bun add -d @avalix/hardhat-polkavm
```

Requires `hardhat@^3.4.0`.

## Usage

Add the plugin and a top-level `resolc` block to your config. The presence of
that block transparently switches **every** Solidity compiler from `solc` (EVM)
to `resolc` (PolkaVM) — there is no per-compiler `type` wiring to do.

```ts
// hardhat.config.ts
import { defineConfig } from "hardhat/config";
import hardhatPolkaVM from "@avalix/hardhat-polkavm";

export default defineConfig({
  plugins: [hardhatPolkaVM],
  solidity: "0.8.29",
  resolc: {
    compilerSource: "npm",
    optimizer: { enabled: true, runs: 200 },
  },
});
```

Then compile as usual:

```bash
npx hardhat compile
```

The emitted artifacts contain PolkaVM bytecode. Remove the `resolc` block to go
back to a normal EVM build.

## Compiler sources

| `compilerSource` | How it works | When to use |
| --- | --- | --- |
| `"npm"` *(default)* | Uses the self-contained [`@parity/resolc`](https://www.npmjs.com/package/@parity/resolc) package, which bundles `solc`. No downloads, works on every platform/arch. | The simplest, most portable option. |
| `"binary"` | Downloads the native `resolc` release from GitHub and drives it over `--standard-json`, calling Hardhat's `solc` via `--solc`. Faster, but native binaries exist only for macOS, Linux x64 and Windows x64. | Larger projects where compile speed matters. |

## Configuration reference

```ts
resolc: {
  // "npm" (default) | "binary"
  compilerSource: "npm",

  // revive/resolc release for "binary" mode (default: "1.2.0")
  version: "1.2.0",

  optimizer: {
    enabled: true,   // default: true
    runs: 200,       // default: 200
    mode: "3",       // "0" | "1" | "2" | "3" | "s" | "z" (optional)
    fallbackOz: true // retry with -Oz if the bytecode is too large (optional)
  },

  // "binary" mode only — skip the download / use your own toolchain:
  resolcPath: "/path/to/resolc",
  solcPath: "/path/to/solc",
}
```

## How it works

Hardhat 3 exposes a `solidity` hook with two extension points the plugin uses:

- **`getCompiler`** — returns a custom `Compiler` for `type: "resolc"` that
  produces PolkaVM bytecode (instead of solc's EVM bytecode).
- **`downloadCompilers`** — fetches the native resolc binary in `"binary"` mode.

A `config` hook resolves the `resolc` block and rewrites the resolved Solidity
config so each compiler uses `type: "resolc"`.

## License

MIT
