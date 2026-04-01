import type { NextAuthOptions } from 'next-auth'
import credentialsProvider from 'next-auth/providers/credentials'
import {
  type SIWESession,
  verifySignature,
  getChainIdFromMessage,
  getAddressFromMessage,
} from '@reown/appkit-siwe'
import { prisma } from '@/lib/db'

declare module 'next-auth' {
  interface Session extends SIWESession {
    address: string
    chainId: number
    userId?: string
  }
}

const nextAuthSecret = process.env.NEXTAUTH_SECRET
if (!nextAuthSecret) {
  throw new Error('NEXTAUTH_SECRET is not set')
}

const projectId = process.env.NEXT_PUBLIC_PROJECT_ID
if (!projectId) {
  throw new Error('NEXT_PUBLIC_PROJECT_ID is not set')
}

export const authOptions: NextAuthOptions = {
  secret: nextAuthSecret,
  providers: [
    credentialsProvider({
      name: 'Ethereum',
      credentials: {
        message: {
          label: 'Message',
          type: 'text',
          placeholder: '0x0',
        },
        signature: {
          label: 'Signature',
          type: 'text',
          placeholder: '0x0',
        },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.message) {
            throw new Error('SiweMessage is undefined')
          }

          const { message, signature } = credentials
          const address = getAddressFromMessage(message)
          const chainId = getChainIdFromMessage(message)

          const isValid = await verifySignature({
            address,
            message,
            signature,
            chainId,
            projectId: projectId!,
          })

          if (isValid) {
            // Find or create user by wallet address
            const walletAddress = address.toLowerCase()
            let user = await prisma.user.findUnique({
              where: { walletAddress },
            })

            if (!user) {
              const shortAddr = `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
              user = await prisma.user.create({
                data: {
                  walletAddress,
                  displayName: shortAddr,
                },
              })

              // Grant initial guesses to new user
              await prisma.guessLedger.create({
                data: {
                  userId: user.id,
                  amount: 5,
                  reason: 'initial_signup',
                },
              })
            }

            return {
              id: `${chainId}:${address}`,
            }
          }

          return null
        } catch (e) {
          console.error('SIWE authorize error:', e)
          return null
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 days
    updateAge: 24 * 60 * 60,  // Refresh token every 24h on activity
  },
  callbacks: {
    jwt({ token, user }) {
      // On initial sign-in, persist the user.id (format: "chainId:address") into the JWT
      if (user) {
        token.sub = user.id
      }
      return token
    },
    session({ session, token }) {
      if (!token.sub) {
        return session
      }

      // token.sub format: "chainId:0xAddress"
      const colonIdx = token.sub.indexOf(':')
      if (colonIdx !== -1) {
        const chainId = token.sub.slice(0, colonIdx)
        const address = token.sub.slice(colonIdx + 1)
        session.address = address
        session.chainId = parseInt(chainId, 10)
      }

      return session
    },
  },
}
