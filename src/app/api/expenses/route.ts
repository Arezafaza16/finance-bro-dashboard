import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Expense from '@/models/Expense';
import { z } from 'zod';
import { checkRateLimit, rateLimitResponse, sanitizeExpenseList, sanitizeExpense } from '@/lib/security';

// Strict schema - rejects unknown fields
const expenseSchema = z.object({
    date: z.string().or(z.date()),
    description: z.string().min(1, 'Deskripsi wajib diisi').max(200),
    category: z.enum(['bahan_baku', 'produksi', 'operasional']),
    productId: z.string().optional(),
    materialId: z.string().optional(),
    quantity: z.number().min(0).optional(),
    amount: z.number().min(0, 'Jumlah tidak boleh negatif'),
}).strict();

// GET all expenses
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();

        const { searchParams } = new URL(request.url);
        const category = searchParams.get('category');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const query: any = { userId: session.user.id };

        if (category) {
            query.category = category;
        }

        if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = new Date(startDate);
            if (endDate) query.date.$lte = new Date(endDate);
        }

        const expenses = await Expense.find(query)
            .populate('productId', 'name')
            .populate('materialId', 'name unit')
            .sort({ date: -1, createdAt: -1 })
            .lean();

        // Sanitize response
        const sanitizedExpenses = sanitizeExpenseList(expenses);

        return NextResponse.json(sanitizedExpenses);
    } catch (error) {
        console.error('Get expenses error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

// POST create expense
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
        const validatedData = expenseSchema.safeParse(body);

        if (!validatedData.success) {
            const firstError = validatedData.error.issues[0];
            const errorMessage = firstError.code === 'unrecognized_keys'
                ? `Field tidak dikenal: ${(firstError as { keys: string[] }).keys.join(', ')}`
                : firstError.message;
            return NextResponse.json({ error: errorMessage }, { status: 400 });
        }

        await connectDB();

        const expense = await Expense.create({
            ...validatedData.data,
            date: new Date(validatedData.data.date),
            userId: session.user.id,
        });

        // Sanitize response
        const sanitizedExpense = sanitizeExpense(expense.toObject());

        return NextResponse.json(sanitizedExpense, { status: 201 });
    } catch (error) {
        console.error('Create expense error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

