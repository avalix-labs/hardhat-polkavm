import assert from 'node:assert/strict'
import { before, describe, it } from 'node:test'

import { network } from 'hardhat'
import {
  createPublicClient,
  createWalletClient,
  custom,
  getAddress,
  http,
} from 'viem'

// Integration test against the contract deployed on Polkadot Hub TestNet by
// `bun run deploy`. Runs with `hardhat test`.
const RPC = 'https://services.polkadothub-rpc.com/testnet'
const ADDRESS = getAddress('0xfb619b7484718335f553a8883e75fc7c9cac2b9b')

const COUNTER_ABI = [
  {
    type: 'function',
    name: 'count',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'inc',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: [],
  },
  {
    type: 'function',
    name: 'incBy',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'by', type: 'uint256' }],
    outputs: [],
  },
] as const

// Reads go straight to the RPC — no account needed.
const publicClient = createPublicClient({ transport: http(RPC) })

const readCount = () =>
  publicClient.readContract({
    address: ADDRESS,
    abi: COUNTER_ABI,
    functionName: 'count',
  })

describe('Counter on Polkadot Hub TestNet', () => {
  let walletClient: ReturnType<typeof createWalletClient>
  let account: `0x${string}` | undefined

  before(
    async () => {
      // Writes are signed by the configured account; the Hardhat connection
      // wires the provider to it. Needs PRIVATE_KEY via an env var or the
      // development keystore (`hardhat keystore set PRIVATE_KEY --dev`) — the
      // production keystore isn't used during tests.
      const { provider } = await network.getOrCreate('polkadotHubTestnet')
      walletClient = createWalletClient({ transport: custom(provider) })
      try {
        ;[account] = await walletClient.getAddresses()
      } catch {
        account = undefined
      }
    },
    { timeout: 60_000 },
  )

  it(
    'has PolkaVM bytecode at the deployed address',
    { timeout: 60_000 },
    async () => {
      const code = await publicClient.getCode({ address: ADDRESS })
      // PolkaVM program blobs start with the "PVM\0" magic (0x50564d00).
      assert.ok(
        code !== undefined && code.startsWith('0x50564d00'),
        'expected PolkaVM bytecode at the address',
      )
    },
  )

  it('reads count() (view function)', { timeout: 60_000 }, async () => {
    const count = await readCount()
    assert.equal(typeof count, 'bigint')
    assert.ok(count >= 0n)
  })

  it(
    'inc() and incBy() increase count() (write functions)',
    { timeout: 180_000 },
    async (t) => {
      if (account === undefined) {
        t.skip(
          'set a funded PRIVATE_KEY (env var or `hardhat keystore set PRIVATE_KEY --dev`) to run the write test',
        )
        return
      }

      const start = await readCount()

      const incHash = await walletClient.writeContract({
        address: ADDRESS,
        abi: COUNTER_ABI,
        functionName: 'inc',
        account,
        chain: null,
      })
      await publicClient.waitForTransactionReceipt({ hash: incHash })
      assert.equal(await readCount(), start + 1n)

      const incByHash = await walletClient.writeContract({
        address: ADDRESS,
        abi: COUNTER_ABI,
        functionName: 'incBy',
        args: [3n],
        account,
        chain: null,
      })
      await publicClient.waitForTransactionReceipt({ hash: incByHash })
      assert.equal(await readCount(), start + 4n)
    },
  )
})
