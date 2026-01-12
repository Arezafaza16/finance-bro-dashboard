import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Expense from '@/models/Expense';
import { z } from 'zod';

const updateExpenseSchema = z.object({
    date: z.string().or(z.date()).optional(),
    description: z.string().min(1).max(200).optional(),
    category: z.enum(['bahan_baku', 'produksi', 'operasional']).optional(),
    productId: z.string().optional().nullable(),
    materialId: z.string().optional().nullable(),
    quantity: z.number().min(0).optional().nullable(),
    amount: z.number().min(0).optional(),
});

// GET single expense
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

        const expense = await Expense.findOne({
            _id: id,
            userId: session.user.id,
        })
            .populate('productId', 'name')
            .populate('materialId', 'name unit');

        if (!expense) {
            return NextResponse.json({ error: 'Pengeluaran tidak ditemukan' }, { status: 404 });
        }

        return NextResponse.json(expense);
    } catch (error) {
        console.error('Get expense error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

// PUT update expense
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
        const validatedData = updateExpenseSchema.safeParse(body);

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

        const expense = await Expense.findOneAndUpdate(
            { _id: id, userId: session.user.id },
            updateData,
            { new: true }
        )
            .populate('productId', 'name')
            .populate('materialId', 'name unit');

        if (!expense) {
            return NextResponse.json({ error: 'Pengeluaran tidak ditemukan' }, { status: 404 });
        }

        return NextResponse.json(expense);
    } catch (error) {
        console.error('Update expense error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

// DELETE expense
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

        const expense = await Expense.findOneAndDelete({
            _id: id,
            userId: session.user.id,
        });

        if (!expense) {
            return NextResponse.json({ error: 'Pengeluaran tidak ditemukan' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Pengeluaran berhasil dihapus' });
    } catch (error) {
        console.error('Delete expense error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
