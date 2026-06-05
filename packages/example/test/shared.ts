export const TESTNET_RPC = 'https://services.polkadothub-rpc.com/testnet'
export const LOCAL_RPC = 'http://localhost:8545'

/** Counter deployed by `bun run deploy` on Polkadot Hub TestNet. */
export const DEPLOYED_ADDRESS = '0xfb619b7484718335f553a8883e75fc7c9cac2b9b'

/** Minimal ABI for the Counter contract (see contracts/Counter.sol). */
export const COUNTER_ABI = [
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
  {
    type: 'event',
    name: 'Increment',
    inputs: [{ name: 'by', type: 'uint256', indexed: false }],
  },
] as const
