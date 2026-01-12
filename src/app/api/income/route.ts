import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Income from '@/models/Income';
import { z } from 'zod';

const incomeSchema = z.object({
    date: z.string().or(z.date()),
    productId: z.string().min(1, 'Produk wajib dipilih'),
    quantity: z.number().min(1, 'Quantity minimal 1'),
    unitPrice: z.number().min(0, 'Harga tidak boleh negatif'),
    totalAmount: z.number().min(0, 'Total tidak boleh negatif'),
    customerName: z.string().max(100).optional(),
    notes: z.string().max(500).optional(),
});

// GET all income
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();

        const { searchParams } = new URL(request.url);
        const productId = searchParams.get('productId');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const query: any = { userId: session.user.id };

        if (productId) {
            query.productId = productId;
        }

        if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = new Date(startDate);
            if (endDate) query.date.$lte = new Date(endDate);
        }

        const incomes = await Income.find(query)
            .populate('productId', 'name sellingPrice')
            .sort({ date: -1, createdAt: -1 });

        return NextResponse.json(incomes);
    } catch (error) {
        console.error('Get income error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

// POST create income
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const validatedData = incomeSchema.safeParse(body);

        if (!validatedData.success) {
            return NextResponse.json(
                { error: validatedData.error.issues[0].message },
                { status: 400 }
            );
        }

        await connectDB();

        const income = await Income.create({
            ...validatedData.data,
            date: new Date(validatedData.data.date),
            userId: session.user.id,
        });

        return NextResponse.json(income, { status: 201 });
    } catch (error) {
        console.error('Create income error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
