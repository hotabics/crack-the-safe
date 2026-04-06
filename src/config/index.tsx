import { cookieStorage, createStorage } from '@wagmi/core'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { mainnet, base } from '@reown/appkit/networks'

export const projectId = process.env.NEXT_PUBLIC_PROJECT_ID

if (!projectId) {
  throw new Error('NEXT_PUBLIC_PROJECT_ID is not defined')
}

export const networks = [mainnet, base]

export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({
    storage: cookieStorage
  }),
  ssr: true,
  projectId,
  networks
})

export const config = wagmiAdapter.wagmiConfig

// Contract addresses (Base mainnet)
export const BLUFF_TOKEN_ADDRESS = '0x287a19FbeA6C6A400Bf3cc8331F2a7c9aE59e57a' as const
export const PRIZE_VAULT_ADDRESS = '0x08BAEee1a025156d42AB97E6113f341080D96280' as const
export const BASE_CHAIN_ID = 8453
