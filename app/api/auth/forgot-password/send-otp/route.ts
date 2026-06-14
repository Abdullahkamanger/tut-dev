import { NextResponse } from 'next/server';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import nodemailer from 'nodemailer';
// TODO: Import your database connection and User model
import connectDB from '@/lib/db';
import User from '@/models/User';

// Configure the Nodemailer Transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '465'),
  secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

export async function POST(request: Request) {
  try {
    // 1. Connect to Database
    await connectDB();

    // 2. Parse incoming request body
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ message: 'Email is required' }, { status: 400 });
    }

    // 3. Search for user in database
    const user = await User.findOne({ email: email.toLowerCase() });
    // const user = true; // Placeholder for demo logic

    /**
     * SECURITY PROTOCOL (Email Enumeration Mitigation):
     * If the user doesn't exist, we do NOT want to tell an attacker "Email not found".
     * We return a 200 OK status with a success message anyway.
     * The frontend will transition to the OTP step seamlessly, keeping the system safe.
     */
    if (!user) {
      return NextResponse.json(
        { message: 'If this email exists in our system, an OTP has been sent.' },
        { status: 200 }
      );
    }

    // 4. Generate a random secure 6-digit numeric string
    const otp = crypto.randomInt(100000, 999999).toString();

    // 5. Hash the OTP using bcrypt
    const saltRounds = 10;
    const hashedOtp = await bcrypt.hash(otp, saltRounds);

    // 6. Set an expiry timestamp (10 minutes from now)
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    // 7. Save hashed OTP and expiry to user's record
    await User.updateOne(
      { email: email.toLowerCase() },
      {
        $set: {
          resetOtp: hashedOtp,
          resetOtpExpires: otpExpiry,
        },
      }
    );

    // 8. Send the PLAIN TEXT 6-digit OTP to the user's email via Nodemailer
    const mailOptions = {
      from: `"TutDev Tutorials" <${process.env.SMTP_USER}>`,
      to: email.toLowerCase(),
      subject: 'Your Password Reset OTP - TutDev',
      html: `
        <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e4e4e7; rounded: 8px;">
          <h2 style="color: #18181b; text-align: center;">Reset Your Password</h2>
          <p style="color: #71717a; font-size: 16px;">You requested a password reset for your TutDev account. Use the 6-digit security code below to proceed. This code is valid for 10 minutes.</p>
          <div style="background-color: #f4f4f5; text-align: center; padding: 15px; border-radius: 6px; margin: 24px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #2563eb;">${otp}</span>
          </div>
          <p style="color: #a1a1aa; font-size: 12px; text-align: center;">If you didn't request this, you can safely ignore this email.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json(
      { message: 'If this email exists in our system, an OTP has been sent.' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error in send-otp route:', error);
    return NextResponse.json(
      { message: 'An internal server error occurred.' },
      { status: 500 }
    );
  }
}