import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { network } from 'hardhat'
import { getAddress } from 'viem'

// Typed-contract integration test against the Counter deployed on Polkadot Hub
// TestNet by `bun run deploy`. It sends real transactions (costs PAS), so it is
// opt-in: run it with `bun run test:write` (which sets RUN_WRITE_TESTS=1). Needs
// a funded PRIVATE_KEY via an env var or the dev keystore.
const ADDRESS = getAddress('0xfb619b7484718335f553a8883e75fc7c9cac2b9b')

describe('Counter on Polkadot Hub TestNet', () => {
  it(
    'inc() and incBy() increase count() (write functions)',
    { timeout: 180_000 },
    async (t) => {
      if (process.env.RUN_WRITE_TESTS !== '1') {
        t.skip(
          'opt-in only — run `bun run test:write` (sends real txs, costs PAS)',
        )
        return
      }

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
