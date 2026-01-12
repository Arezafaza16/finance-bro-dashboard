import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Income from '@/models/Income';
import Expense from '@/models/Expense';
import Product from '@/models/Product';
import mongoose from 'mongoose';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { id } from 'date-fns/locale';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();

        // Convert string userId to ObjectId for aggregation queries
        const userObjectId = new mongoose.Types.ObjectId(session.user.id);
        const userId = session.user.id; // Keep string version for regular queries

        const now = new Date();
        const thisMonthStart = startOfMonth(now);
        const thisMonthEnd = endOfMonth(now);
        const lastMonthStart = startOfMonth(subMonths(now, 1));
        const lastMonthEnd = endOfMonth(subMonths(now, 1));

        // This month totals
        const thisMonthIncome = await Income.aggregate([
            {
                $match: {
                    userId: userObjectId,
                    date: { $gte: thisMonthStart, $lte: thisMonthEnd },
                },
            },
            { $group: { _id: null, total: { $sum: '$totalAmount' } } },
        ]);

        const thisMonthExpense = await Expense.aggregate([
            {
                $match: {
                    userId: userObjectId,
                    date: { $gte: thisMonthStart, $lte: thisMonthEnd },
                },
            },
            { $group: { _id: null, total: { $sum: '$amount' } } },
        ]);

        // Last month totals for comparison
        const lastMonthIncome = await Income.aggregate([
            {
                $match: {
                    userId: userObjectId,
                    date: { $gte: lastMonthStart, $lte: lastMonthEnd },
                },
            },
            { $group: { _id: null, total: { $sum: '$totalAmount' } } },
        ]);

        const lastMonthExpense = await Expense.aggregate([
            {
                $match: {
                    userId: userObjectId,
                    date: { $gte: lastMonthStart, $lte: lastMonthEnd },
                },
            },
            { $group: { _id: null, total: { $sum: '$amount' } } },
        ]);

        // Product count
        const productCount = await Product.countDocuments({ userId });

        // Monthly data (last 6 months)
        const monthlyData = [];
        for (let i = 5; i >= 0; i--) {
            const monthStart = startOfMonth(subMonths(now, i));
            const monthEnd = endOfMonth(subMonths(now, i));

            const monthIncome = await Income.aggregate([
                {
                    $match: {
                        userId: userObjectId,
                        date: { $gte: monthStart, $lte: monthEnd },
                    },
                },
                { $group: { _id: null, total: { $sum: '$totalAmount' } } },
            ]);

            const monthExpense = await Expense.aggregate([
                {
                    $match: {
                        userId: userObjectId,
                        date: { $gte: monthStart, $lte: monthEnd },
                    },
                },
                { $group: { _id: null, total: { $sum: '$amount' } } },
            ]);

            monthlyData.push({
                month: format(monthStart, 'MMM', { locale: id }),
                income: monthIncome[0]?.total || 0,
                expense: monthExpense[0]?.total || 0,
            });
        }

        // Top products
        const topProducts = await Income.aggregate([
            { $match: { userId: userObjectId } },
            {
                $group: {
                    _id: '$productId',
                    revenue: { $sum: '$totalAmount' },
                    quantity: { $sum: '$quantity' },
                },
            },
            { $sort: { revenue: -1 } },
            { $limit: 5 },
            {
                $lookup: {
                    from: 'products',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'product',
                },
            },
            { $unwind: '$product' },
            {
                $project: {
                    name: '$product.name',
                    revenue: 1,
                    quantity: 1,
                },
            },
        ]);

        // Recent transactions
        const recentIncomes = await Income.find({ userId })
            .sort({ date: -1 })
            .limit(5)
            .populate('productId', 'name');

        const recentExpenses = await Expense.find({ userId })
            .sort({ date: -1 })
            .limit(5);

        const recentTransactions = [
            ...recentIncomes.map((inc) => ({
                id: inc._id.toString(),
                type: 'income' as const,
                description: `Penjualan ${(inc.productId as unknown as { name: string } | null)?.name || 'Produk'}`,
                amount: inc.totalAmount,
                date: format(inc.date, 'd MMM yyyy', { locale: id }),
            })),
            ...recentExpenses.map((exp) => ({
                id: exp._id.toString(),
                type: 'expense' as const,
                description: exp.description,
                amount: exp.amount,
                date: format(exp.date, 'd MMM yyyy', { locale: id }),
            })),
        ]
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 10);

        // Calculate changes
        const totalIncome = thisMonthIncome[0]?.total || 0;
        const totalExpense = thisMonthExpense[0]?.total || 0;
        const prevIncome = lastMonthIncome[0]?.total || 0;
        const prevExpense = lastMonthExpense[0]?.total || 0;

        // Calculate percentage change
        // If no previous month data but current month has data = 100%
        // If previous and current both exist = calculate percentage
        // If no current and no previous = null (don't show)
        let incomeChange: number | null = null;
        if (prevIncome > 0) {
            incomeChange = Math.round(((totalIncome - prevIncome) / prevIncome) * 100);
        } else if (totalIncome > 0) {
            incomeChange = 100; // New income, 100% increase
        }

        let expenseChange: number | null = null;
        if (prevExpense > 0) {
            expenseChange = Math.round(((totalExpense - prevExpense) / prevExpense) * 100);
        } else if (totalExpense > 0) {
            expenseChange = 100; // New expense, 100% increase
        }

        return NextResponse.json({
            totalIncome,
            totalExpense,
            profit: totalIncome - totalExpense,
            productCount,
            incomeChange,
            expenseChange,
            monthlyData,
            topProducts,
            recentTransactions,
        });
    } catch (error) {
        console.error('Dashboard error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
