import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Material from '@/models/Material';
import { z } from 'zod';

const materialSchema = z.object({
    name: z.string().min(1, 'Nama bahan wajib diisi').max(100),
    unit: z.enum(['kg', 'gram', 'liter', 'ml', 'pcs', 'pack', 'meter', 'cm', 'box']),
    pricePerUnit: z.number().min(0, 'Harga tidak boleh negatif'),
    stock: z.number().min(0, 'Stok tidak boleh negatif').optional().default(0),
    description: z.string().max(500).optional(),
});

// GET all materials
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();

        const materials = await Material.find({ userId: session.user.id })
            .sort({ createdAt: -1 });

        return NextResponse.json(materials);
    } catch (error) {
        console.error('Get materials error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

// POST create material
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const validatedData = materialSchema.safeParse(body);

        if (!validatedData.success) {
            return NextResponse.json(
                { error: validatedData.error.issues[0].message },
                { status: 400 }
            );
        }

        await connectDB();

        // Check for duplicate name
        const existing = await Material.findOne({
            userId: session.user.id,
            name: { $regex: new RegExp(`^${validatedData.data.name}$`, 'i') },
        });

        if (existing) {
            return NextResponse.json(
                { error: 'Bahan dengan nama ini sudah ada' },
                { status: 400 }
            );
        }

        const material = await Material.create({
            ...validatedData.data,
            userId: session.user.id,
        });

        return NextResponse.json(material, { status: 201 });
    } catch (error) {
        console.error('Create material error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
