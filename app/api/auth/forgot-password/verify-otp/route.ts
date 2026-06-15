import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt'; // Using bcryptjs to prevent system compilation issues
// TODO: Import your database connection and User model
import connectDB from '@/lib/db';
import User from '@/models/User';

export async function POST(request: Request) {
  try {
    // 1. Connect to Database
    await connectDB();

    // 2. Parse incoming payload from your frontend verifyOtp function
    const { email, otp } = await request.json();

    if (!email || !otp) {
      return NextResponse.json(
        { message: 'Email and OTP token are required.' },
        { status: 400 }
      );
    }

    // 3. Fetch the user profile by normalized email
    const user = await User.findOne({ email: email.toLowerCase() });

    // Security Check: If user isn't found, keep error generic to block sniffing
    if (!user || !user.resetOtp || !user.resetOtpExpires) {
      return NextResponse.json(
        { message: 'Invalid or expired OTP.' },
        { status: 400 }
      );
    }

    // 4. Check if the current time has passed the resetOtpExpires window
    const currentTime = new Date();
    if (currentTime > user.resetOtpExpires) {
      return NextResponse.json(
        { message: 'Invalid or expired OTP.' },
        { status: 400 }
      );
    }

    // 5. Compare/verify the plain text incoming OTP against the stored hashed OTP
    const isOtpMatch = await bcrypt.compare(otp, user.resetOtp);

    if (!isOtpMatch) {
      const updatedAttempts = (user.otpFailedAttempts || 0) + 1;
      const maxAttempts = 3;
      const attemptsLeft = Math.max(0, maxAttempts - updatedAttempts);

      if (updatedAttempts >= maxAttempts) {
        // CRITICAL ACTION: Burn the OTP out of the database immediately
        await User.updateOne(
          { email: email.toLowerCase() },
          {
            $set: { otpFailedAttempts: updatedAttempts },
            $unset: { resetOtp: 1, resetOtpExpires: 1 } // Instantly expires the token data
          }
        );
        return NextResponse.json(
          { message: 'Too many incorrect attempts. This OTP has been invalidated. Please request a new one.' },
          { status: 400 }
        );
      } else {
        // Increment the failed count but keep the OTP alive
        await User.updateOne(
          { email: email.toLowerCase() },
          { $set: { otpFailedAttempts: updatedAttempts } }
        );
        return NextResponse.json({
          message: 'Invalid or expired OTP.',
          attemptsLeft,

        }, { status: 400 });
      }




    }

    // 6. If valid, return a clean success response.
    // frontend receives 'res.ok' and sets state to 'PASSWORD'
    return NextResponse.json(
      { message: 'OTP verified successfully.' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error in verify-otp route:', error);
    return NextResponse.json(
      { message: 'An internal server error occurred.' },
      { status: 500 }
    );
  }
}