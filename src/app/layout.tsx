import type { Metadata } from 'next'
import { headers } from 'next/headers'
import ContextProvider from '@/context'
import './globals.css'

export const metadata: Metadata = {
  title: 'Crack the Safe | 1,000,000 $BLUFF',
  description:
    'Crack the 6-digit code and win 1,000,000 $BLUFF coins. Complete tasks, earn guesses, break the vault.',
  metadataBase: new URL('https://crack.scrim42.com'),
  openGraph: {
    title: 'Crack the Safe | Win 1,000,000 $BLUFF',
    description: 'Guess the 6-digit code locked inside the vault. Complete tasks to earn guesses. The first to crack it wins 1M $BLUFF tokens!',
    url: 'https://crack.scrim42.com',
    siteName: 'Crack the Safe',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Crack the Safe | Win 1,000,000 $BLUFF',
    description: 'Guess the 6-digit vault code. First to crack it wins 1M $BLUFF tokens on Base.',
  },
  icons: {
    icon: '/favicon.ico',
  },
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
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0a0a0f" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="min-h-screen bg-vault-black antialiased">
        <ContextProvider cookies={cookies}>{children}</ContextProvider>
      </body>
    </html>
  )
}
