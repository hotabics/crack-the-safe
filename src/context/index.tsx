'use client'

import { wagmiAdapter, projectId } from '@/config'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createAppKit } from '@reown/appkit/react'
import { mainnet, base } from '@reown/appkit/networks'
import React, { type ReactNode } from 'react'
import { cookieToInitialState, WagmiProvider, type Config } from 'wagmi'

// Set up queryClient
const queryClient = new QueryClient()

if (!projectId) {
  throw new Error('Project ID is not defined')
}

// Set up metadata
const metadata = {
  name: 'Crack the Safe',
  description: 'Crack the 6-digit code and win 1,000,000 $BLUFF coins',
  url: 'https://crack.scrim42.com',
  icons: ['https://crack.scrim42.com/icon.png']
}

// Create the modal (no SIWE — we handle auth manually via /api/auth/verify)
createAppKit({
  adapters: [wagmiAdapter],
  projectId,
  networks: [mainnet, base],
  defaultNetwork: base,
  metadata,
  features: {
    analytics: true,
    email: false,
    socials: [],
  },
  themeMode: 'dark',
  themeVariables: {
    '--w3m-accent': '#F59E0B',
    '--w3m-color-mix': '#1a1a2e',
    '--w3m-color-mix-strength': 40,
    '--w3m-border-radius-master': '2px',
  },
})

function ContextProvider({ children, cookies }: { children: ReactNode; cookies: string | null }) {
  const initialState = cookieToInitialState(wagmiAdapter.wagmiConfig as Config, cookies)

  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig as Config} initialState={initialState}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  )
}

export default ContextProvider
