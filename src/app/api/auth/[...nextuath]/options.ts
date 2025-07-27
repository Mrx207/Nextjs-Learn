/* eslint-disable @typescript-eslint/no-explicit-any */
import NextAuth from 'next-auth/next'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'

import dbConnect from '@/lib/dbConnect'
import UserModel from '@/modal/User'
import { NextAuthOptions } from 'next-auth'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials: any): Promise<any> {
        await dbConnect()
        try {
          const user = await UserModel.findOne({
            $or: [
              { email: credentials.identifier },
              { username: credentials.identifier }
            ]
          })
          if (!user) {
            throw new Error('User not found')
          }
          if (!user.isVerified) {
            throw new Error(
              'User is not verified please verify your account before login'
            )
          }
          const isPasswordCorrect = await bcrypt.compare(
            credentials.password,
            user.password
          )
          if (isPasswordCorrect) {
            return user
          } else {
            throw new Error('Incorrect password')
          }
        } catch (error: any) {
          console.error('Error during authorization:', error)
          throw new Error(error)
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token._id = user._id?.toString()
        token._isVerified = user.isVerified
        token._isAcceptingMessages = user.isAcceptingMessages
        token.username = user.username
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user._id = token._id
        session.user.isVerified = token._isVerified as boolean | undefined
        session.user.isAcceptingMessages = token._isAcceptingMessages as
          | boolean
          | undefined
        session.user.username = token.username
      }
      return session
    }
  },
  pages: {
    signIn: '/sign-in'
  },

  session: {
    strategy: 'jwt'
  },
  secret: process.env.NEXTAUTH_SECRET
}
