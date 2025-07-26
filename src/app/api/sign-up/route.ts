import dbConnect from '@/lib/dbConnect'
import UserModel from '@/modal/User'
import bcrypt from 'bcryptjs'
import { sendVerificationEmail } from '@/helpers/sendVerificationEmail'

export async function POST(req: Request) {
  await dbConnect()
  try {
    const { username, email, password } = await req.json()
    const existingUserVerifiedByUsername = await UserModel.findOne({
      username,
      isVerified: true
    })

    if (existingUserVerifiedByUsername) {
      return Response.json(
        { success: false, message: 'Username already exists' },
        { status: 400 }
      )
    }

    const existingUserVerifiedByEmail = await UserModel.findOne({
      email,
      isVerified: true
    })

    if (existingUserVerifiedByEmail) {
      return Response.json(
        { success: false, message: 'Email already exists' },
        { status: 400 }
      )
    }else{
      const hashedPassword = await bcrypt.hash(password, 10)
      const user = new UserModel({
        username,
        email,
        password: hashedPassword,
        verifyCode: Math.floor(100000 + Math.random() * 900000).toString(),
        verifyCodeExpiry: new Date(Date.now() + 3600000),
        isVerified: false,
        isAcceptingMessages: true,
        messages: []
      })
    }
  } catch (error) {
    console.error('Error during sign-up:', error)
    return new Response(
      JSON.stringify({ success: false, message: 'Internal server error' }),
      { status: 500 }
    )
  }
}
