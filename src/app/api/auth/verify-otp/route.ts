import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import crypto from 'crypto';

const verifyOTPSchema = z.object({
    email: z.string().email('Email tidak valid'),
    otp: z.string().length(6, 'OTP harus 6 digit'),
});

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const validatedData = verifyOTPSchema.safeParse(body);

        if (!validatedData.success) {
            return NextResponse.json(
                { error: validatedData.error.issues[0].message },
                { status: 400 }
            );
        }

        await connectDB();

        const { email, otp } = validatedData.data;

        // Find user
        const user = await User.findOne({ email: email.toLowerCase() });

        console.log(' ========== VERIFY OTP DEBUG ==========');
        console.log(' Email:', email);
        console.log(' User found:', !!user);
        console.log(' Has token:', !!user?.resetPasswordToken);
        console.log(' Token expires:', user?.resetPasswordExpires);
        console.log(' ==========================================');

        if (!user || !user.resetPasswordToken || !user.resetPasswordExpires) {
            return NextResponse.json(
                { error: 'Kode OTP tidak valid atau sudah kadaluarsa. Silakan minta OTP baru.' },
                { status: 400 }
            );
        }

        // Check if OTP is expired
        const now = Date.now();
        const expiryTime = new Date(user.resetPasswordExpires).getTime();

        console.log(' Now (ms):', now);
        console.log(' Expiry (ms):', expiryTime);
        console.log(' Diff (seconds):', Math.round((expiryTime - now) / 1000));

        if (now > expiryTime) {
            // Clear expired token
            await User.findOneAndUpdate(
                { _id: user._id },
                { $unset: { resetPasswordToken: 1, resetPasswordExpires: 1 } }
            );

            return NextResponse.json(
                { error: 'Kode OTP sudah kadaluarsa. Silakan minta OTP baru.' },
                { status: 400 }
            );
        }

        // Verify OTP
        const isValidOTP = await bcrypt.compare(otp, user.resetPasswordToken);
        console.log(' OTP valid:', isValidOTP);

        if (!isValidOTP) {
            return NextResponse.json(
                { error: 'Kode OTP tidak valid' },
                { status: 400 }
            );
        }

        // Generate a temporary reset token for the password reset step
        const resetToken = crypto.randomBytes(32).toString('hex');
        const hashedResetToken = await bcrypt.hash(resetToken, 10);

        // Update user with new reset token (expires in 15 minutes)
        await User.findOneAndUpdate(
            { _id: user._id },
            {
                $set: {
                    resetPasswordToken: hashedResetToken,
                    resetPasswordExpires: new Date(Date.now() + 15 * 60 * 1000),
                }
            }
        );

        console.log(' OTP verified successfully!');

        return NextResponse.json({
            message: 'OTP berhasil diverifikasi',
            resetToken: resetToken,
        });
    } catch (error) {
        console.error('Verify OTP error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
