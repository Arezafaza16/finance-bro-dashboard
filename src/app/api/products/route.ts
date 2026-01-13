import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Product from '@/models/Product';
import Material from '@/models/Material';
import { z } from 'zod';
import { checkRateLimit, rateLimitResponse, sanitizeProductList, sanitizeProduct } from '@/lib/security';

const productMaterialSchema = z.object({
    materialId: z.string(),
    quantity: z.number().min(0),
}).strict();

// Strict schema - rejects unknown fields
const productSchema = z.object({
    name: z.string().min(1, 'Nama produk wajib diisi').max(100),
    description: z.string().max(500).optional(),
    sellingPrice: z.number().min(0, 'Harga jual tidak boleh negatif'),
    materials: z.array(productMaterialSchema).optional().default([]),
}).strict();

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
            .sort({ createdAt: -1 })
            .lean();

        // Sanitize response
        const sanitizedProducts = sanitizeProductList(products);

        return NextResponse.json(sanitizedProducts);
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

        // Rate limiting
        const rateLimit = checkRateLimit(session.user.id);
        if (!rateLimit.allowed) {
            return rateLimitResponse(rateLimit.resetTime);
        }

        const body = await request.json();

        // Strict validation
        const validatedData = productSchema.safeParse(body);

        if (!validatedData.success) {
            const firstError = validatedData.error.issues[0];
            const errorMessage = firstError.code === 'unrecognized_keys'
                ? `Field tidak dikenal: ${(firstError as { keys: string[] }).keys.join(', ')}`
                : firstError.message;
            return NextResponse.json({ error: errorMessage }, { status: 400 });
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

        // Sanitize response
        const sanitizedProduct = sanitizeProduct(product.toObject());

        return NextResponse.json(sanitizedProduct, { status: 201 });
    } catch (error) {
        console.error('Create product error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

