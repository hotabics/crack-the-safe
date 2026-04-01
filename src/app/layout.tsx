import type { Metadata } from 'next'
import { headers } from 'next/headers'
import ContextProvider from '@/context'
import './globals.css'

export const metadata: Metadata = {
  title: 'Crack the Safe | 1,000,000 $BLUFF',
  description:
    'Crack the 6-digit code and win 1,000,000 $BLUFF coins. Complete tasks, earn guesses, break the vault.',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const headersObj = await headers()
  const cookies = headersObj.get('cookie')

  return (
    <html lang="en">
      <body className="min-h-screen bg-vault-black antialiased">
        <ContextProvider cookies={cookies}>{children}</ContextProvider>
      </body>
    </html>
  )
}
