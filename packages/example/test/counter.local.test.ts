import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { createPublicClient, createWalletClient, http } from 'viem'
import { describe, expect, it } from 'vitest'

import { COUNTER_ABI, LOCAL_RPC } from './shared.js'

// Local integration test: deploys a fresh Counter to a local PolkaVM node and
// exercises it. PolkaVM contracts cannot run on Hardhat's built-in EDR (EVM)
// simulator, so this needs a local PolkaVM node exposing an Ethereum JSON-RPC
// at LOCAL_RPC with at least one unlocked dev account. If no such node is
// reachable (or the project isn't compiled yet), the suite is skipped.

const artifactPath = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '../artifacts/contracts/Counter.sol/Counter.json',
)

async function probeLocalNode() {
  const publicClient = createPublicClient({ transport: http(LOCAL_RPC) })
  const walletClient = createWalletClient({ transport: http(LOCAL_RPC) })
  try {
    await publicClient.getChainId()
    const [account] = await walletClient.getAddresses()
    if (account === undefined) {
      return null
    }
    const artifact = JSON.parse(await readFile(artifactPath, 'utf8')) as {
      bytecode: `0x${string}`
    }
    return { publicClient, walletClient, account, bytecode: artifact.bytecode }
  } catch {
    return null
  }
}

const local = await probeLocalNode()

describe.skipIf(local === null)('Counter on a local PolkaVM node', () => {
  it('deploys, then inc() and incBy() update count()', async () => {
    const { publicClient, walletClient, account, bytecode } = local!

    // chain: null lets viem use whatever chain the local node reports.
    const deployHash = await walletClient.deployContract({
      abi: COUNTER_ABI,
      bytecode,
      account,
      chain: null,
    })
    const { contractAddress } = await publicClient.waitForTransactionReceipt({
      hash: deployHash,
    })
    expect(contractAddress).toBeTruthy()
    const address = contractAddress!

    const read = () =>
      publicClient.readContract({ address, abi: COUNTER_ABI, functionName: 'count' })

    expect(await read()).toBe(0n)

    const incHash = await walletClient.writeContract({
      address,
      abi: COUNTER_ABI,
      functionName: 'inc',
      account,
      chain: null,
    })
    await publicClient.waitForTransactionReceipt({ hash: incHash })
    expect(await read()).toBe(1n)

    const incByHash = await walletClient.writeContract({
      address,
      abi: COUNTER_ABI,
      functionName: 'incBy',
      args: [5n],
      account,
      chain: null,
    })
    await publicClient.waitForTransactionReceipt({ hash: incByHash })
    expect(await read()).toBe(6n)
  }, 180_000)
})
