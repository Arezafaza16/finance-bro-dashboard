import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Income from '@/models/Income';
import { z } from 'zod';

const updateIncomeSchema = z.object({
    date: z.string().or(z.date()).optional(),
    productId: z.string().optional(),
    quantity: z.number().min(1).optional(),
    unitPrice: z.number().min(0).optional(),
    totalAmount: z.number().min(0).optional(),
    customerName: z.string().max(100).optional().nullable(),
    notes: z.string().max(500).optional().nullable(),
});

// GET single income
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

        const income = await Income.findOne({
            _id: id,
            userId: session.user.id,
        }).populate('productId', 'name sellingPrice');

        if (!income) {
            return NextResponse.json({ error: 'Pemasukan tidak ditemukan' }, { status: 404 });
        }

        return NextResponse.json(income);
    } catch (error) {
        console.error('Get income error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

// PUT update income
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
        const validatedData = updateIncomeSchema.safeParse(body);

        if (!validatedData.success) {
            return NextResponse.json(
                { error: validatedData.error.issues[0].message },
                { status: 400 }
            );
        }

        await connectDB();

        const updateData = {
            ...validatedData.data,
            ...(validatedData.data.date && { date: new Date(validatedData.data.date) }),
        };

        const income = await Income.findOneAndUpdate(
            { _id: id, userId: session.user.id },
            updateData,
            { new: true }
        ).populate('productId', 'name sellingPrice');

        if (!income) {
            return NextResponse.json({ error: 'Pemasukan tidak ditemukan' }, { status: 404 });
        }

        return NextResponse.json(income);
    } catch (error) {
        console.error('Update income error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

// DELETE income
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

        const income = await Income.findOneAndDelete({
            _id: id,
            userId: session.user.id,
        });

        if (!income) {
            return NextResponse.json({ error: 'Pemasukan tidak ditemukan' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Pemasukan berhasil dihapus' });
    } catch (error) {
        console.error('Delete income error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
