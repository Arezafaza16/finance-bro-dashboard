import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { sendPasswordChangedNotification } from '@/lib/email';

const resetPasswordSchema = z.object({
    email: z.string().email('Email tidak valid'),
    resetToken: z.string().min(1, 'Reset token diperlukan'),
    newPassword: z.string().min(6, 'Password minimal 6 karakter'),
});

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const validatedData = resetPasswordSchema.safeParse(body);

        if (!validatedData.success) {
            return NextResponse.json(
                { error: validatedData.error.issues[0].message },
                { status: 400 }
            );
        }

        await connectDB();

        const { email, resetToken, newPassword } = validatedData.data;

        // Find user
        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user || !user.resetPasswordToken || !user.resetPasswordExpires) {
            return NextResponse.json(
                { error: 'Link reset tidak valid atau sudah kadaluarsa' },
                { status: 400 }
            );
        }

        // Check if token is expired
        if (new Date() > new Date(user.resetPasswordExpires)) {
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;
            await user.save();

            return NextResponse.json(
                { error: 'Link reset sudah kadaluarsa. Silakan minta reset ulang.' },
                { status: 400 }
            );
        }

        // Verify reset token
        const isValidToken = await bcrypt.compare(resetToken, user.resetPasswordToken);

        if (!isValidToken) {
            return NextResponse.json(
                { error: 'Link reset tidak valid' },
                { status: 400 }
            );
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 12);

        // Update user password and clear reset tokens
        user.password = hashedPassword;
        user.passwordChangedAt = new Date();
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        // Generate emergency reset link
        const appUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
        const emergencyResetLink = `${appUrl}/forgot-password`;

        // Send notification email
        await sendPasswordChangedNotification(email, emergencyResetLink);

        return NextResponse.json({
            message: 'Password berhasil diubah. Silakan login dengan password baru.',
        });
    } catch (error) {
        console.error('Reset password error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
