import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { z } from 'zod';

const updateProfileSchema = z.object({
    name: z.string().min(2, 'Nama minimal 2 karakter').max(50).optional(),
    email: z.string().email('Email tidak valid').optional(),
    phone: z.string().regex(/^(\+62|62|0)[0-9]{9,12}$/, 'Nomor HP tidak valid').optional().or(z.literal('')),
}).strict();

// GET current user profile
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();

        const user = await User.findById(session.user.id).select('name email phone passwordChangedAt createdAt');

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({
            name: user.name,
            email: user.email,
            phone: user.phone || '',
            passwordChangedAt: user.passwordChangedAt,
            createdAt: user.createdAt,
        });
    } catch (error) {
        console.error('Get profile error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

// PUT update user profile
export async function PUT(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const validatedData = updateProfileSchema.safeParse(body);

        if (!validatedData.success) {
            const firstError = validatedData.error.issues[0];
            const errorMessage = firstError.code === 'unrecognized_keys'
                ? `Field tidak dikenal: ${(firstError as { keys: string[] }).keys.join(', ')}`
                : firstError.message;
            return NextResponse.json({ error: errorMessage }, { status: 400 });
        }

        await connectDB();

        const updateData: Record<string, string | undefined> = {};

        if (validatedData.data.name) {
            updateData.name = validatedData.data.name;
        }

        if (validatedData.data.email) {
            // Check if email is already taken by another user
            const existingUser = await User.findOne({
                email: validatedData.data.email.toLowerCase(),
                _id: { $ne: session.user.id },
            });

            if (existingUser) {
                return NextResponse.json(
                    { error: 'Email sudah digunakan oleh akun lain' },
                    { status: 400 }
                );
            }

            updateData.email = validatedData.data.email.toLowerCase();
        }

        if (validatedData.data.phone !== undefined) {
            updateData.phone = validatedData.data.phone || undefined;
        }

        const user = await User.findByIdAndUpdate(
            session.user.id,
            updateData,
            { new: true, runValidators: true }
        ).select('name email phone');

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({
            message: 'Profil berhasil diperbarui',
            user: {
                name: user.name,
                email: user.email,
                phone: user.phone || '',
            },
        });
    } catch (error) {
        console.error('Update profile error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
