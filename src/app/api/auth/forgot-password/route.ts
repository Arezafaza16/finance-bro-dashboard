import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { sendOTPEmail, generateOTP } from '@/lib/email';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const forgotPasswordSchema = z.object({
    email: z.string().email('Email tidak valid'),
});

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const validatedData = forgotPasswordSchema.safeParse(body);

        if (!validatedData.success) {
            return NextResponse.json(
                { error: validatedData.error.issues[0].message },
                { status: 400 }
            );
        }

        await connectDB();

        const { email } = validatedData.data;

        // Find user by email
        const user = await User.findOne({ email: email.toLowerCase() });

        // Always return success to prevent email enumeration
        if (!user) {
            return NextResponse.json({
                message: 'Jika email terdaftar, Anda akan menerima kode OTP',
            });
        }

        // Generate OTP
        const otp = generateOTP();
        const hashedOTP = await bcrypt.hash(otp, 10);
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Use findOneAndUpdate to ensure fields are saved
        const updatedUser = await User.findOneAndUpdate(
            { _id: user._id },
            {
                $set: {
                    resetPasswordToken: hashedOTP,
                    resetPasswordExpires: expiresAt,
                }
            },
            { new: true }
        );

        console.log('========== OTP GENERATED ==========');
        console.log(' Email:', email);
        console.log(' OTP (plain):', otp);
        console.log(' Expires at:', expiresAt.toISOString());
        console.log(' Saved token:', !!updatedUser?.resetPasswordToken);
        console.log(' Saved expires:', updatedUser?.resetPasswordExpires);
        console.log(' ======================================');

        // Send OTP email
        await sendOTPEmail(email, otp);

        return NextResponse.json({
            message: 'Kode OTP telah dikirim ke email Anda',
        });
    } catch (error) {
        console.error('Forgot password error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
