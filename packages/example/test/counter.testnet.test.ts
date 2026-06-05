import { createPublicClient, getAddress, http } from 'viem'
import { describe, expect, it } from 'vitest'

// Integration test against the real contract deployed on Polkadot Hub TestNet.
// Read-only, so it needs no account and no funds.
const TESTNET_RPC = 'https://services.polkadothub-rpc.com/testnet'

// Counter deployed by `bun run deploy` (see contracts/Counter.sol).
const DEPLOYED_ADDRESS = '0xfb619b7484718335f553a8883e75fc7c9cac2b9b'

const COUNTER_ABI = [
  {
    type: 'function',
    name: 'count',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
] as const

const client = createPublicClient({ transport: http(TESTNET_RPC) })
const address = getAddress(DEPLOYED_ADDRESS)

describe('Counter on Polkadot Hub TestNet', () => {
  it('has PolkaVM bytecode at the deployed address', async () => {
    const code = await client.getCode({ address })
    expect(code).toBeTruthy()
    // PolkaVM program blobs start with the "PVM\0" magic (0x50564d00).
    expect(code?.startsWith('0x50564d00')).toBe(true)
  }, 30_000)

  it('reads count() through eth_call', async () => {
    const count = await client.readContract({
      address,
      abi: COUNTER_ABI,
      functionName: 'count',
    })
    expect(typeof count).toBe('bigint')
    expect(count >= 0n).toBe(true)
  }, 30_000)
})
