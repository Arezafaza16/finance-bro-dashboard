import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Material from '@/models/Material';
import { z } from 'zod';

const updateMaterialSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    unit: z.enum(['kg', 'gram', 'liter', 'ml', 'pcs', 'pack', 'meter', 'cm', 'box']).optional(),
    pricePerUnit: z.number().min(0).optional(),
    stock: z.number().min(0).optional(),
    description: z.string().max(500).optional(),
});

// GET single material
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        await connectDB();

        const material = await Material.findOne({
            _id: id,
            userId: session.user.id,
        });

        if (!material) {
            return NextResponse.json({ error: 'Bahan tidak ditemukan' }, { status: 404 });
        }

        return NextResponse.json(material);
    } catch (error) {
        console.error('Get material error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

// PUT update material
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();
        const validatedData = updateMaterialSchema.safeParse(body);

        if (!validatedData.success) {
            return NextResponse.json(
                { error: validatedData.error.issues[0].message },
                { status: 400 }
            );
        }

        await connectDB();

        const material = await Material.findOneAndUpdate(
            { _id: id, userId: session.user.id },
            validatedData.data,
            { new: true }
        );

        if (!material) {
            return NextResponse.json({ error: 'Bahan tidak ditemukan' }, { status: 404 });
        }

        return NextResponse.json(material);
    } catch (error) {
        console.error('Update material error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

// DELETE material
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        await connectDB();

        const material = await Material.findOneAndDelete({
            _id: id,
            userId: session.user.id,
        });

        if (!material) {
            return NextResponse.json({ error: 'Bahan tidak ditemukan' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Bahan berhasil dihapus' });
    } catch (error) {
        console.error('Delete material error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
