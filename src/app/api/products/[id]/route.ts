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

const updateProductSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().max(500).optional(),
    sellingPrice: z.number().min(0).optional(),
    materials: z.array(productMaterialSchema).optional(),
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

// GET single product
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

        const product = await Product.findOne({
            _id: id,
            userId: session.user.id,
        }).populate('materials.materialId', 'name unit pricePerUnit');

        if (!product) {
            return NextResponse.json({ error: 'Produk tidak ditemukan' }, { status: 404 });
        }

        return NextResponse.json(product);
    } catch (error) {
        console.error('Get product error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

// PUT update product
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
        const validatedData = updateProductSchema.safeParse(body);

        if (!validatedData.success) {
            return NextResponse.json(
                { error: validatedData.error.issues[0].message },
                { status: 400 }
            );
        }

        await connectDB();

        // Calculate HPP if materials are updated
        let hpp;
        if (validatedData.data.materials) {
            hpp = await calculateHPP(validatedData.data.materials);
        }

        const updateData = {
            ...validatedData.data,
            ...(hpp !== undefined && { hpp }),
        };

        const product = await Product.findOneAndUpdate(
            { _id: id, userId: session.user.id },
            updateData,
            { new: true }
        ).populate('materials.materialId', 'name unit pricePerUnit');

        if (!product) {
            return NextResponse.json({ error: 'Produk tidak ditemukan' }, { status: 404 });
        }

        return NextResponse.json(product);
    } catch (error) {
        console.error('Update product error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

// DELETE product
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

        const product = await Product.findOneAndDelete({
            _id: id,
            userId: session.user.id,
        });

        if (!product) {
            return NextResponse.json({ error: 'Produk tidak ditemukan' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Produk berhasil dihapus' });
    } catch (error) {
        console.error('Delete product error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
