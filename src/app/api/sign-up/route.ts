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

    const verifyCode = Math.floor(100000 + Math.random() * 900000).toString()

    if (existingUserVerifiedByEmail) {
      if (existingUserVerifiedByEmail.isVerified) {
        return Response.json(
          { success: false, message: 'Email already exists' },
          { status: 400 }
        )
      } else {
        const hashedPassword = await bcrypt.hash(password, 10)
        existingUserVerifiedByEmail.password = hashedPassword
        existingUserVerifiedByEmail.verifyCode = verifyCode
        existingUserVerifiedByEmail.verifyCodeExpiry = new Date(
          Date.now() + 360000
        )
        await existingUserVerifiedByEmail.save()
      }
    } else {
      const hashedPassword = await bcrypt.hash(password, 10)
      const expiryDate = new Date()
      expiryDate.setHours(expiryDate.getHours() + 1)

      const newUser = new UserModel({
        username,
        email,
        password: hashedPassword,
        verifyCode,
        verifyCodeExpiry: expiryDate,
        isVerified: false,
        isAcceptingMessages: true,
        messages: []
      })
      await newUser.save()
    }
    const emailResponse = await sendVerificationEmail(
      email,
      username,
      verifyCode
    )
    if (!emailResponse.success) {
      return Response.json(
        { success: false, message: emailResponse.message },
        { status: 400 }
      )
    }

    return Response.json(
      { success: true, message: 'Sign-up successful please verify your email' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error during sign-up:', error)
    return new Response(
      JSON.stringify({ success: false, message: 'Internal server error' }),
      { status: 500 }
    )
  }
}
