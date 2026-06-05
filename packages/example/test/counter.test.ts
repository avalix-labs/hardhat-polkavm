import assert from 'node:assert/strict'
import { before, describe, it } from 'node:test'

import { network } from 'hardhat'
import { getAddress } from 'viem'

// Typed-contract integration test against the Counter deployed on Polkadot Hub
// TestNet by `bun run deploy`. Uses hardhat-viem's getContractAt, so calls go
// through the configured account — a PRIVATE_KEY must be available via an env
// var or the dev keystore. The suite is skipped otherwise.
const ADDRESS = getAddress('0xfb619b7484718335f553a8883e75fc7c9cac2b9b')

describe('Counter on Polkadot Hub TestNet', () => {
  let available = false

  before(
    async () => {
      try {
        const { viem } = await network.getOrCreate('polkadotHubTestnet')
        const walletClients = await viem.getWalletClients()
        available = walletClients.length > 0
      } catch {
        available = false
      }
    },
    { timeout: 60_000 },
  )

  it(
    'inc() and incBy() increase count() (write functions)',
    { timeout: 180_000 },
    async (t) => {
      if (!available) {
        t.skip('set a funded PRIVATE_KEY to run the write test')
        return
      }
      // Opt-in: this sends real transactions and spends PAS, so it only runs
      // when explicitly requested (e.g. `bun run test:write`).
      if (process.env.RUN_WRITE_TESTS !== '1') {
        t.skip('opt-in only — run `bun run test:write` (sends real txs, costs PAS)')
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
