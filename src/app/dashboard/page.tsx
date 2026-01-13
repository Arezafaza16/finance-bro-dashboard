'use client';

import { useEffect, useState } from 'react';
import {
    TrendingUp,
    TrendingDown,
    DollarSign,
    Package,
    ArrowUpRight,
    ArrowDownRight,
} from 'lucide-react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
} from 'recharts';

interface DashboardData {
    totalIncome: number;
    totalExpense: number;
    profit: number;
    productCount: number;
    incomeChange: number;
    expenseChange: number;
    monthlyData: { month: string; income: number; expense: number }[];
    topProducts: { name: string; revenue: number; quantity: number }[];
    recentTransactions: {
        id: string;
        type: 'income' | 'expense';
        description: string;
        amount: number;
        date: string;
    }[];
}

function formatCurrency(value: number): string {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
}

function SummaryCard({
    title,
    value,
    change,
    icon: Icon,
    iconBg,
    cardColor = 'default',
    showChange = false,
}: {
    title: string;
    value: string;
    change?: number | null;
    icon: React.ElementType;
    iconBg: string;
    cardColor?: 'green' | 'red' | 'default';
    showChange?: boolean;
}) {
    const isPositive = change !== undefined && change !== null && change > 0;
    const isNegative = change !== undefined && change !== null && change < 0;

    // Card color scheme
    const colorScheme = {
        green: { text: 'text-green-400', bgLight: 'bg-green-500/10', border: 'border-green-500/30' },
        red: { text: 'text-red-400', bgLight: 'bg-red-500/10', border: 'border-red-500/30' },
        default: { text: 'text-gray-400', bgLight: 'bg-white/5', border: 'border-white/10' },
    };

    const scheme = colorScheme[cardColor];

    return (
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 hover:bg-white/10 transition-all duration-300">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-gray-400 text-sm mb-1">{title}</p>
                    <p className="text-2xl font-bold text-white">{value}</p>
                    {showChange && change !== undefined && change !== null && (
                        <div className={`flex items-center gap-1 mt-2 ${scheme.text}`}>
                            {isPositive ? (
                                <ArrowUpRight size={16} />
                            ) : isNegative ? (
                                <ArrowDownRight size={16} />
                            ) : (
                                <span className="w-4 h-4 flex items-center justify-center">—</span>
                            )}
                            <span className="text-sm">
                                {isPositive ? '+' : ''}{change}% dari bulan lalu
                            </span>
                        </div>
                    )}
                    {showChange && (change === undefined || change === null) && (
                        <div className="flex items-center gap-1 mt-2 text-gray-500">
                            <span className="text-sm">Belum ada data bulan lalu</span>
                        </div>
                    )}
                </div>
                <div className={`p-3 rounded-xl ${iconBg}`}>
                    <Icon size={24} className="text-white" />
                </div>
            </div>
        </div>
    );
}



export default function DashboardPage() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch('/api/dashboard');
                if (response.ok) {
                    const dashboardData = await response.json();
                    setData(dashboardData);
                }
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    if (isLoading) {
        return (
            <div className="space-y-8 animate-pulse">
                {/* Header skeleton */}
                <div>
                    <div className="h-8 w-40 bg-white/10 rounded-lg mb-2"></div>
                    <div className="h-4 w-60 bg-white/5 rounded"></div>
                </div>
                {/* Stats skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="bg-white/5 rounded-2xl border border-white/10 p-6">
                            <div className="flex items-start justify-between">
                                <div>
                                    <div className="h-3 w-24 bg-white/10 rounded mb-2"></div>
                                    <div className="h-7 w-32 bg-white/10 rounded"></div>
                                </div>
                                <div className="w-12 h-12 bg-white/10 rounded-xl"></div>
                            </div>
                        </div>
                    ))}
                </div>
                {/* Charts skeleton */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {[1, 2].map((i) => (
                        <div key={i} className="bg-white/5 rounded-2xl border border-white/10 p-6">
                            <div className="h-5 w-48 bg-white/10 rounded mb-6"></div>
                            <div className="h-80 bg-white/5 rounded-xl"></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    const dashboardData = data || {
        totalIncome: 0,
        totalExpense: 0,
        profit: 0,
        productCount: 0,
        incomeChange: 0,
        expenseChange: 0,
        monthlyData: [],
        topProducts: [],
        recentTransactions: [],
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
                <p className="text-gray-400">Ringkasan keuangan perusahaan Anda</p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <SummaryCard
                    title="Total Pemasukan"
                    value={formatCurrency(dashboardData.totalIncome)}
                    change={dashboardData.incomeChange}
                    icon={TrendingUp}
                    iconBg="bg-gradient-to-r from-green-500 to-emerald-500"
                    cardColor="green"
                    showChange={true}
                />
                <SummaryCard
                    title="Total Pengeluaran"
                    value={formatCurrency(dashboardData.totalExpense)}
                    change={dashboardData.expenseChange}
                    icon={TrendingDown}
                    iconBg="bg-gradient-to-r from-red-500 to-orange-500"
                    cardColor="red"
                    showChange={true}
                />
                <SummaryCard
                    title="Profit"
                    value={formatCurrency(dashboardData.profit)}
                    icon={DollarSign}
                    iconBg="bg-gradient-to-r from-purple-500 to-pink-500"
                />
                <SummaryCard
                    title="Total Produk"
                    value={dashboardData.productCount.toString()}
                    icon={Package}
                    iconBg="bg-gradient-to-r from-blue-500 to-cyan-500"
                />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Trend Chart */}
                <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
                    <h3 className="text-lg font-semibold text-white mb-6">
                        Tren Pemasukan & Pengeluaran
                    </h3>
                    <div className="h-80">
                        {dashboardData.monthlyData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={dashboardData.monthlyData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                    <XAxis dataKey="month" stroke="#9CA3AF" fontSize={12} />
                                    <YAxis stroke="#9CA3AF" fontSize={12} tickFormatter={(v) => `${v / 1000000}M`} />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#1F2937',
                                            border: 'none',
                                            borderRadius: '8px',
                                            color: '#fff',
                                        }}
                                        formatter={(value) => formatCurrency(Number(value) || 0)}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="income"
                                        stroke="#22C55E"
                                        strokeWidth={3}
                                        dot={{ fill: '#22C55E', strokeWidth: 2 }}
                                        name="Pemasukan"
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="expense"
                                        stroke="#EF4444"
                                        strokeWidth={3}
                                        dot={{ fill: '#EF4444', strokeWidth: 2 }}
                                        name="Pengeluaran"
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-400">
                                Belum ada data
                            </div>
                        )}
                    </div>
                </div>

                {/* Top Products */}
                <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
                    <h3 className="text-lg font-semibold text-white mb-6">
                        Produk Terlaris
                    </h3>
                    <div className="h-80">
                        {dashboardData.topProducts.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={dashboardData.topProducts} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                    <XAxis type="number" stroke="#9CA3AF" fontSize={12} tickFormatter={(v) => `${v / 1000000}M`} />
                                    <YAxis dataKey="name" type="category" stroke="#9CA3AF" fontSize={12} width={100} />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#1F2937',
                                            border: 'none',
                                            borderRadius: '8px',
                                            color: '#fff',
                                        }}
                                        formatter={(value) => formatCurrency(Number(value) || 0)}
                                    />
                                    <Bar
                                        dataKey="revenue"
                                        fill="url(#colorRevenue)"
                                        radius={[0, 4, 4, 0]}
                                        name="Pendapatan"
                                    />
                                    <defs>
                                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="1" y2="0">
                                            <stop offset="0%" stopColor="#8B5CF6" />
                                            <stop offset="100%" stopColor="#EC4899" />
                                        </linearGradient>
                                    </defs>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-400">
                                Belum ada data produk
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Recent Transactions */}
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
                <h3 className="text-lg font-semibold text-white mb-6">
                    Transaksi Terbaru
                </h3>
                {dashboardData.recentTransactions.length > 0 ? (
                    <div className="space-y-4">
                        {dashboardData.recentTransactions.map((transaction) => (
                            <div
                                key={transaction.id}
                                className="flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-all duration-200"
                            >
                                <div className="flex items-center gap-4">
                                    <div
                                        className={`p-2 rounded-lg ${transaction.type === 'income'
                                            ? 'bg-green-500/20 text-green-400'
                                            : 'bg-red-500/20 text-red-400'
                                            }`}
                                    >
                                        {transaction.type === 'income' ? (
                                            <TrendingUp size={20} />
                                        ) : (
                                            <TrendingDown size={20} />
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-white font-medium">{transaction.description}</p>
                                        <p className="text-gray-400 text-sm">{transaction.date}</p>
                                    </div>
                                </div>
                                <p
                                    className={`font-semibold ${transaction.type === 'income' ? 'text-green-400' : 'text-red-400'
                                        }`}
                                >
                                    {transaction.type === 'income' ? '+' : '-'}
                                    {formatCurrency(transaction.amount)}
                                </p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 text-gray-400">
                        Belum ada transaksi. Mulai tambahkan pemasukan atau pengeluaran.
                    </div>
                )}
            </div>
        </div>
    );
}
