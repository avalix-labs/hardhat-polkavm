import { readFile } from 'node:fs/promises'
import path from 'node:path'

import { network } from 'hardhat'

const CONTRACT = 'Counter'
const NETWORK = 'polkadotHubTestnet'

interface Provider {
  request(args: { method: string; params?: unknown[] }): Promise<unknown>
}

async function waitForReceipt(
  provider: Provider,
  txHash: string,
): Promise<{ contractAddress: string; status: string }> {
  for (let attempt = 0; attempt < 60; attempt++) {
    const receipt = (await provider.request({
      method: 'eth_getTransactionReceipt',
      params: [txHash],
    })) as { contractAddress: string; status: string } | null

    if (receipt !== null) {
      return receipt
    }
    await new Promise((resolve) => setTimeout(resolve, 3000))
  }
  throw new Error('Timed out waiting for the deployment receipt.')
}

async function main(): Promise<void> {
  const artifactPath = path.join(
    import.meta.dirname,
    `../artifacts/contracts/${CONTRACT}.sol/${CONTRACT}.json`,
  )
  const artifact = JSON.parse(await readFile(artifactPath, 'utf8')) as {
    abi: unknown[]
    bytecode: string
  }

  const { provider, networkName } = await network.connect(NETWORK)
  console.log(`Deploying ${CONTRACT} to ${networkName} ...`)

  const accounts = (await provider.request({
    method: 'eth_accounts',
    params: [],
  })) as string[]
  const from = accounts[0]
  if (from === undefined) {
    throw new Error(
      'No account available. Set PRIVATE_KEY in your environment (see the ' +
        'README) and fund it from https://faucet.polkadot.io/.',
    )
  }
  console.log(`Deployer account: ${from}`)

  const txHash = (await provider.request({
    method: 'eth_sendTransaction',
    params: [{ from, data: artifact.bytecode }],
  })) as string
  console.log(`Submitted deployment tx: ${txHash}`)

  const receipt = await waitForReceipt(provider, txHash)
  if (receipt.status !== '0x1') {
    throw new Error(`Deployment failed (status ${receipt.status}).`)
  }

  console.log(`\n✅ ${CONTRACT} deployed at ${receipt.contractAddress}`)
  console.log(
    `   Explorer: https://blockscout-testnet.polkadot.io/address/${receipt.contractAddress}`,
  )
}

main().catch((error) => {
  // Substrate error 1010 == "Invalid Transaction: inability to pay fees".
  const code = (error as { code?: number }).code
  if (code === 1010) {
    console.error(
      '\n❌ The deployer account cannot pay fees — it likely has no PAS.\n' +
        '   Fund it at https://faucet.polkadot.io/ and try again.',
    )
  } else {
    console.error(error)
  }
  process.exitCode = 1
})
