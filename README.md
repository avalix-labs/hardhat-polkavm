# @avalix/hardhat-polkavm (Hardhat 3)

A Hardhat **v3** plugin for Polkadot: compile Solidity to **PolkaVM** bytecode
with Parity's `resolc` (revive) compiler.

The official [`paritytech/hardhat-polkadot`](https://github.com/paritytech/hardhat-polkadot)
only supports Hardhat 2. This is a simpler reimplementation built on the
[Hardhat 3 plugin system](https://hardhat.org/docs/plugin-development).

## Monorepo layout

| Package | Description |
| --- | --- |
| [`packages/hardhat-polkavm`](packages/hardhat-polkavm) | The plugin. |
| [`packages/example`](packages/example) | A minimal Hardhat 3 project that uses the plugin. |

Managed with [Bun](https://bun.sh) workspaces and built with
[tsdown](https://tsdown.dev).

## Development

```bash
bun install        # install all workspaces
bun run build      # build the plugin (packages/hardhat-polkavm)
bun run test       # run the plugin unit tests

# Try it end-to-end:
cd packages/example
bun run compile    # npx hardhat compile -> PolkaVM artifacts
```

See [`packages/hardhat-polkavm/README.md`](packages/hardhat-polkavm/README.md)
for usage and configuration.
