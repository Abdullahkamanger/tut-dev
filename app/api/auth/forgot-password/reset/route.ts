import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
// TODO: Import your database connection and User model
import connectDB from '@/lib/db'; 
import User from '@/models/User';

export async function POST(request: Request) {
  try {
    // 1. Connect to Database
    await connectDB();

    // 2. Parse incoming data from your frontend handlePasswordSubmit function
    const { email, otp, newPassword } = await request.json();

    if (!email || !otp || !newPassword) {
      return NextResponse.json(
        { message: 'All fields (email, otp, and new password) are required.' },
        { status: 400 }
      );
    }

    // Basic server-side validation for password length
    if (newPassword.length < 8) {
      return NextResponse.json(
        { message: 'Password must be at least 8 characters long.' },
        { status: 400 }
      );
    }

    // 3. Fetch the user profile by normalized email
    const user = await User.findOne({ email: email.toLowerCase() });

    // Re-verify user existence and OTP status availability
    if (!user || !user.resetOtp || !user.resetOtpExpires) {
      return NextResponse.json(
        { message: 'Session expired or invalid request. Please restart the process.' },
        { status: 400 }
      );
    }

    // 4. Re-verify that the OTP timestamp is still valid
    const currentTime = new Date();
    if (currentTime > user.resetOtpExpires) {
      return NextResponse.json(
        { message: 'The OTP session has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    // 5. Re-verify the incoming OTP against the stored hashed OTP
    const isOtpMatch = await bcrypt.compare(otp, user.resetOtp);
    if (!isOtpMatch) {
      return NextResponse.json(
        { message: 'Invalid token confirmation mapping.' },
        { status: 400 }
      );
    }

    // 6. Hash the new password safely using bcryptjs
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // 7. CRITICAL ACTION: Update the password and wipe out OTP data in a single atomical save operation
    await User.updateOne(
      { email: email.toLowerCase() },
      {
        $set: { password: hashedPassword },
        $unset: { resetOtp: 1, resetOtpExpires: 1 } // unsets fields if using MongoDB, or set to null
      }
    );

    // 8. Return success confirmation response
    return NextResponse.json(
      { message: 'Your password has been securely updated.' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error in reset password execution route:', error);
    return NextResponse.json(
      { message: 'An internal server error occurred.' },
      { status: 500 }
    );
  }
}