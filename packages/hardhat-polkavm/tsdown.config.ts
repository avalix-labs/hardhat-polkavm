import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.ts'],
  format: 'esm',
  // Emit .d.mts type declarations (includes the `declare module` augmentations
  // from type-extensions.ts so consumers get the extended Hardhat config types).
  dts: true,
  // Keep the source module graph 1:1 in dist: the hook handlers are loaded
  // lazily via dynamic import(), and `hardhat` / `@parity/resolc` stay external.
  unbundle: true,
})
