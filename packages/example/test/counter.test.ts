import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { network } from 'hardhat'
import { getAddress } from 'viem'

// Typed-contract integration test against the Counter deployed on Polkadot Hub
// TestNet by `bun run deploy`. `bun run test` sends real transactions (costs
// PAS) with the configured account — a funded PRIVATE_KEY must be available via
// an env var or the dev keystore.
const ADDRESS = getAddress('0xfb619b7484718335f553a8883e75fc7c9cac2b9b')

describe('Counter on Polkadot Hub TestNet', () => {
  it(
    'inc() and incBy() increase count() (write functions)',
    { timeout: 180_000 },
    async () => {
      const { viem } = await network.getOrCreate('polkadotHubTestnet')
      const publicClient = await viem.getPublicClient()
      const counter = await viem.getContractAt('Counter', ADDRESS)

      const start = await counter.read.count()

      const incHash = await counter.write.inc()
      await publicClient.waitForTransactionReceipt({ hash: incHash })
      assert.equal(await counter.read.count(), start + 1n)

      const incByHash = await counter.write.incBy([3n])
      await publicClient.waitForTransactionReceipt({ hash: incByHash })
      assert.equal(await counter.read.count(), start + 4n)
    },
  )
})
