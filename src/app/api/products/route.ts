import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Product from '@/models/Product';
import Material from '@/models/Material';
import { z } from 'zod';

const productMaterialSchema = z.object({
    materialId: z.string(),
    quantity: z.number().min(0),
});

const productSchema = z.object({
    name: z.string().min(1, 'Nama produk wajib diisi').max(100),
    description: z.string().max(500).optional(),
    sellingPrice: z.number().min(0, 'Harga jual tidak boleh negatif'),
    materials: z.array(productMaterialSchema).optional().default([]),
});

// Calculate HPP from materials
async function calculateHPP(materials: { materialId: string; quantity: number }[]) {
    if (!materials.length) return 0;

    const materialIds = materials.map((m) => m.materialId);
    const materialDocs = await Material.find({ _id: { $in: materialIds } });

    let hpp = 0;
    materials.forEach((m) => {
        const materialDoc = materialDocs.find((doc) => doc._id.toString() === m.materialId);
        if (materialDoc) {
            hpp += materialDoc.pricePerUnit * m.quantity;
        }
    });

    return hpp;
}

// GET all products
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();

        const products = await Product.find({ userId: session.user.id })
            .populate('materials.materialId', 'name unit pricePerUnit')
            .sort({ createdAt: -1 });

        return NextResponse.json(products);
    } catch (error) {
        console.error('Get products error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

// POST create product
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const validatedData = productSchema.safeParse(body);

        if (!validatedData.success) {
            return NextResponse.json(
                { error: validatedData.error.issues[0].message },
                { status: 400 }
            );
        }

        await connectDB();

        // Check for duplicate name
        const existing = await Product.findOne({
            userId: session.user.id,
            name: { $regex: new RegExp(`^${validatedData.data.name}$`, 'i') },
        });

        if (existing) {
            return NextResponse.json(
                { error: 'Produk dengan nama ini sudah ada' },
                { status: 400 }
            );
        }

        // Calculate HPP
        const hpp = await calculateHPP(validatedData.data.materials);

        const product = await Product.create({
            ...validatedData.data,
            userId: session.user.id,
            hpp,
        });

        return NextResponse.json(product, { status: 201 });
    } catch (error) {
        console.error('Create product error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
