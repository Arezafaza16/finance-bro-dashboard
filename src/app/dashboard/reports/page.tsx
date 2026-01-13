'use client';

import { useEffect, useState } from 'react';
import {
    FileText,
    TrendingUp,
    DollarSign,
    Download,
    Calendar,
    Package,
    ArrowUpRight,
    ArrowDownRight
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

interface MonthlyData {
    month: string;
    income: number;
    expense: number;
    profit: number;
}

interface ProductProfit {
    _id: string;
    name: string;
    revenue: number;
    cost: number;
    profit: number;
    quantity: number;
}

interface CashFlowData {
    category: string;
    income: number;
    expense: number;
    net: number;
}

function formatCurrency(value: number): string {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(value);
}

export default function ReportsPage() {
    const [selectedPeriod, setSelectedPeriod] = useState('this_month');
    const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
    const [productProfits, setProductProfits] = useState<ProductProfit[]>([]);
    const [cashFlowData, setCashFlowData] = useState<CashFlowData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [totals, setTotals] = useState({ income: 0, expense: 0, profit: 0 });

    useEffect(() => {
        fetchReportsData();
    }, [selectedPeriod]);

    const fetchReportsData = async () => {
        setIsLoading(true);
        try {
            // Fetch dashboard data for monthly trends
            const dashboardRes = await fetch('/api/dashboard');
            const dashboardData = dashboardRes.ok ? await dashboardRes.json() : {};

            // Calculate monthly data from dashboard
            if (dashboardData.monthlyData && Array.isArray(dashboardData.monthlyData)) {
                const monthly = dashboardData.monthlyData.map((m: { month: string; income: number; expense: number }) => ({
                    ...m,
                    profit: m.income - m.expense,
                }));
                setMonthlyData(monthly);
            }

            // Fetch product profits from top products
            if (dashboardData.topProducts && Array.isArray(dashboardData.topProducts)) {
                const productProfit = dashboardData.topProducts.map((p: { _id: string; name: string; revenue: number; quantity: number }) => ({
                    ...p,
                    cost: 0, // Would need HPP data from products
                    profit: p.revenue, // Simplified for now
                }));
                setProductProfits(productProfit);
            }

            // Set totals
            setTotals({
                income: dashboardData.totalIncome || 0,
                expense: dashboardData.totalExpense || 0,
                profit: dashboardData.profit || 0,
            });

            // Fetch expenses by category for cash flow
            const expensesRes = await fetch('/api/expenses');
            const expenses = expensesRes.ok ? await expensesRes.json() : [];

            // Group expenses by category (ensure it's an array)
            const categoryTotals: Record<string, number> = {};
            if (Array.isArray(expenses)) {
                expenses.forEach((e: { category: string; amount: number }) => {
                    categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
                });
            }

            const cashFlow: CashFlowData[] = [
                { category: 'Penjualan', income: dashboardData.totalIncome || 0, expense: 0, net: dashboardData.totalIncome || 0 },
                { category: 'Bahan Baku', income: 0, expense: categoryTotals['bahan_baku'] || 0, net: -(categoryTotals['bahan_baku'] || 0) },
                { category: 'Produksi', income: 0, expense: categoryTotals['produksi'] || 0, net: -(categoryTotals['produksi'] || 0) },
                { category: 'Operasional', income: 0, expense: categoryTotals['operasional'] || 0, net: -(categoryTotals['operasional'] || 0) },
            ];
            setCashFlowData(cashFlow);

        } catch (error) {
            console.error('Error fetching reports:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Helper function to escape CSV values
    const escapeCSV = (value: string | number): string => {
        const strValue = String(value);
        // If value contains semicolon, newline, or quotes, wrap in quotes and escape existing quotes
        if (strValue.includes(';') || strValue.includes('\n') || strValue.includes('"')) {
            return `"${strValue.replace(/"/g, '""')}"`;
        }
        return strValue;
    };

    // Helper function to format number for CSV (Indonesian format)
    const formatNumber = (value: number): string => {
        return value.toLocaleString('id-ID');
    };

    const exportToCSV = (type: 'monthly' | 'products' | 'cashflow') => {
        // BOM for UTF-8 Excel compatibility
        const BOM = '\uFEFF';
        let csvContent = BOM;
        let filename = '';

        switch (type) {
            case 'monthly':
                csvContent += 'Bulan;Pemasukan (Rp);Pengeluaran (Rp);Profit (Rp)\n';
                monthlyData.forEach(m => {
                    csvContent += `${escapeCSV(m.month)};${formatNumber(m.income)};${formatNumber(m.expense)};${formatNumber(m.profit)}\n`;
                });
                // Add total row
                const totalMonthlyIncome = monthlyData.reduce((sum, m) => sum + m.income, 0);
                const totalMonthlyExpense = monthlyData.reduce((sum, m) => sum + m.expense, 0);
                const totalMonthlyProfit = monthlyData.reduce((sum, m) => sum + m.profit, 0);
                csvContent += `\nTOTAL;${formatNumber(totalMonthlyIncome)};${formatNumber(totalMonthlyExpense)};${formatNumber(totalMonthlyProfit)}\n`;
                filename = `laporan-bulanan-${format(new Date(), 'yyyy-MM-dd')}.csv`;
                break;
            case 'products':
                csvContent += 'No;Produk;Penjualan (Rp);Quantity;Profit (Rp)\n';
                productProfits.forEach((p, i) => {
                    csvContent += `${i + 1};${escapeCSV(p.name)};${formatNumber(p.revenue)};${p.quantity};${formatNumber(p.profit)}\n`;
                });
                // Add total row
                const totalRevenue = productProfits.reduce((sum, p) => sum + p.revenue, 0);
                const totalQty = productProfits.reduce((sum, p) => sum + p.quantity, 0);
                const totalProfit = productProfits.reduce((sum, p) => sum + p.profit, 0);
                csvContent += `\n;TOTAL;${formatNumber(totalRevenue)};${totalQty};${formatNumber(totalProfit)}\n`;
                filename = `profit-produk-${format(new Date(), 'yyyy-MM-dd')}.csv`;
                break;
            case 'cashflow':
                csvContent += 'Kategori;Pemasukan (Rp);Pengeluaran (Rp);Netto (Rp)\n';
                cashFlowData.forEach(c => {
                    csvContent += `${escapeCSV(c.category)};${c.income > 0 ? formatNumber(c.income) : '-'};${c.expense > 0 ? formatNumber(c.expense) : '-'};${formatNumber(c.net)}\n`;
                });
                // Add total row
                const totalCashIn = cashFlowData.reduce((sum, c) => sum + c.income, 0);
                const totalCashOut = cashFlowData.reduce((sum, c) => sum + c.expense, 0);
                const netCashFlow = totalCashIn - totalCashOut;
                csvContent += `\nTOTAL;${formatNumber(totalCashIn)};${formatNumber(totalCashOut)};${formatNumber(netCashFlow)}\n`;
                filename = `cash-flow-${format(new Date(), 'yyyy-MM-dd')}.csv`;
                break;
        }

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();
    };

    const exportAllData = async () => {
        try {
            // Fetch all data
            const [incomesRes, expensesRes, productsRes, materialsRes] = await Promise.all([
                fetch('/api/income'),
                fetch('/api/expenses'),
                fetch('/api/products'),
                fetch('/api/materials'),
            ]);

            // Parse responses with validation
            const incomesData = incomesRes.ok ? await incomesRes.json() : [];
            const expensesData = expensesRes.ok ? await expensesRes.json() : [];
            const productsData = productsRes.ok ? await productsRes.json() : [];
            const materialsData = materialsRes.ok ? await materialsRes.json() : [];

            // Ensure all data are arrays
            const incomes = Array.isArray(incomesData) ? incomesData : [];
            const expenses = Array.isArray(expensesData) ? expensesData : [];
            const products = Array.isArray(productsData) ? productsData : [];
            const materials = Array.isArray(materialsData) ? materialsData : [];

            // BOM for UTF-8 Excel compatibility
            const BOM = '\uFEFF';
            let csvContent = BOM;

            // Header
            csvContent += 'LAPORAN KEUANGAN\n';
            csvContent += `Tanggal Export: ${format(new Date(), 'd MMMM yyyy', { locale: idLocale })}\n`;
            csvContent += '\n';

            // Summary Section
            csvContent += 'RINGKASAN\n';
            csvContent += 'Keterangan;Jumlah (Rp)\n';
            csvContent += `Total Pemasukan;${formatNumber(totals.income)}\n`;
            csvContent += `Total Pengeluaran;${formatNumber(totals.expense)}\n`;
            csvContent += `Total Profit;${formatNumber(totals.profit)}\n`;
            csvContent += '\n\n';

            // Incomes Section
            csvContent += 'DATA PEMASUKAN\n';
            csvContent += 'No;Tanggal;Produk;Quantity;Harga Satuan (Rp);Total (Rp);Customer\n';
            incomes.forEach((inc: { date: string; productId?: { name: string }; quantity: number; unitPrice: number; totalAmount: number; customerName?: string }, i: number) => {
                csvContent += `${i + 1};${format(new Date(inc.date), 'dd/MM/yyyy')};${escapeCSV(inc.productId?.name || '-')};${inc.quantity};${formatNumber(inc.unitPrice)};${formatNumber(inc.totalAmount)};${escapeCSV(inc.customerName || '-')}\n`;
            });
            csvContent += '\n\n';

            // Expenses Section
            csvContent += 'DATA PENGELUARAN\n';
            csvContent += 'No;Tanggal;Deskripsi;Kategori;Jumlah (Rp)\n';
            const categoryLabels: Record<string, string> = {
                bahan_baku: 'Bahan Baku',
                produksi: 'Produksi',
                operasional: 'Operasional',
            };
            expenses.forEach((exp: { date: string; description: string; category: string; amount: number }, i: number) => {
                csvContent += `${i + 1};${format(new Date(exp.date), 'dd/MM/yyyy')};${escapeCSV(exp.description)};${categoryLabels[exp.category] || exp.category};${formatNumber(exp.amount)}\n`;
            });
            csvContent += '\n\n';

            // Products Section
            csvContent += 'DATA PRODUK\n';
            csvContent += 'No;Nama Produk;Harga Jual (Rp);HPP (Rp);Margin (Rp)\n';
            products.forEach((prod: { name: string; sellingPrice: number; hpp: number }, i: number) => {
                const margin = prod.sellingPrice - (prod.hpp || 0);
                csvContent += `${i + 1};${escapeCSV(prod.name)};${formatNumber(prod.sellingPrice)};${formatNumber(prod.hpp || 0)};${formatNumber(margin)}\n`;
            });
            csvContent += '\n\n';

            // Materials Section
            csvContent += 'DATA BAHAN BAKU\n';
            csvContent += 'No;Nama Bahan;Satuan;Harga per Unit (Rp);Stok;Nilai Stok (Rp)\n';
            materials.forEach((mat: { name: string; unit: string; pricePerUnit: number; stock: number }, i: number) => {
                const stockValue = mat.pricePerUnit * mat.stock;
                csvContent += `${i + 1};${escapeCSV(mat.name)};${mat.unit};${formatNumber(mat.pricePerUnit)};${mat.stock};${formatNumber(stockValue)}\n`;
            });

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `export-semua-data-${format(new Date(), 'yyyy-MM-dd')}.csv`;
            link.click();
        } catch (error) {
            console.error('Export error:', error);
            alert('Terjadi kesalahan saat export data. Silakan coba lagi.');
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white">Laporan</h1>
                    <p className="text-gray-400">Analisis keuangan dan ekspor data</p>
                </div>
                <button
                    onClick={exportAllData}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700"
                >
                    <Download size={20} />
                    Export Semua Data
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-xl rounded-2xl border border-green-500/30 p-6">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-xl bg-green-500/20">
                            <TrendingUp size={24} className="text-green-400" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-400">Total Pemasukan</p>
                            <p className="text-xl font-bold text-white">{formatCurrency(totals.income)}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-gradient-to-r from-red-500/20 to-orange-500/20 backdrop-blur-xl rounded-2xl border border-red-500/30 p-6">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-xl bg-red-500/20">
                            <ArrowDownRight size={24} className="text-red-400" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-400">Total Pengeluaran</p>
                            <p className="text-xl font-bold text-white">{formatCurrency(totals.expense)}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-xl rounded-2xl border border-purple-500/30 p-6">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-xl bg-purple-500/20">
                            <DollarSign size={24} className="text-purple-400" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-400">Total Profit</p>
                            <p className="text-xl font-bold text-white">{formatCurrency(totals.profit)}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Reports Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Monthly Report */}
                <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-blue-500/20">
                                <Calendar size={20} className="text-blue-400" />
                            </div>
                            <h2 className="text-lg font-semibold text-white">Laporan Bulanan</h2>
                        </div>
                        <button
                            onClick={() => exportToCSV('monthly')}
                            className="p-2 text-gray-400 hover:text-purple-400 hover:bg-purple-500/10 rounded-lg transition-colors"
                            title="Export CSV"
                        >
                            <Download size={18} />
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-white/10">
                                    <th className="text-left p-3 text-gray-400 text-sm">Bulan</th>
                                    <th className="text-right p-3 text-gray-400 text-sm">Pemasukan</th>
                                    <th className="text-right p-3 text-gray-400 text-sm">Pengeluaran</th>
                                    <th className="text-right p-3 text-gray-400 text-sm">Profit</th>
                                </tr>
                            </thead>
                            <tbody>
                                {monthlyData.map((m, i) => (
                                    <tr key={i} className="border-b border-white/5">
                                        <td className="p-3 text-white">{m.month}</td>
                                        <td className="p-3 text-right text-green-400">{formatCurrency(m.income)}</td>
                                        <td className="p-3 text-right text-red-400">{formatCurrency(m.expense)}</td>
                                        <td className={`p-3 text-right font-medium ${m.profit >= 0 ? 'text-purple-400' : 'text-red-400'}`}>
                                            {formatCurrency(m.profit)}
                                        </td>
                                    </tr>
                                ))}
                                {monthlyData.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="p-4 text-center text-gray-500">
                                            Belum ada data
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Profit per Product */}
                <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-green-500/20">
                                <Package size={20} className="text-green-400" />
                            </div>
                            <h2 className="text-lg font-semibold text-white">Profit per Produk</h2>
                        </div>
                        <button
                            onClick={() => exportToCSV('products')}
                            className="p-2 text-gray-400 hover:text-purple-400 hover:bg-purple-500/10 rounded-lg transition-colors"
                            title="Export CSV"
                        >
                            <Download size={18} />
                        </button>
                    </div>
                    <div className="space-y-3">
                        {productProfits.map((p, i) => (
                            <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm">
                                        {i + 1}
                                    </div>
                                    <div>
                                        <p className="text-white font-medium">{p.name}</p>
                                        <p className="text-xs text-gray-400">{p.quantity} terjual</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-green-400 font-medium">{formatCurrency(p.revenue)}</p>
                                </div>
                            </div>
                        ))}
                        {productProfits.length === 0 && (
                            <p className="text-center text-gray-500 py-4">Belum ada data produk</p>
                        )}
                    </div>
                </div>

                {/* Cash Flow */}
                <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 lg:col-span-2">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-purple-500/20">
                                <DollarSign size={20} className="text-purple-400" />
                            </div>
                            <h2 className="text-lg font-semibold text-white">Cash Flow</h2>
                        </div>
                        <button
                            onClick={() => exportToCSV('cashflow')}
                            className="p-2 text-gray-400 hover:text-purple-400 hover:bg-purple-500/10 rounded-lg transition-colors"
                            title="Export CSV"
                        >
                            <Download size={18} />
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-white/10">
                                    <th className="text-left p-3 text-gray-400 text-sm">Kategori</th>
                                    <th className="text-right p-3 text-gray-400 text-sm">Masuk</th>
                                    <th className="text-right p-3 text-gray-400 text-sm">Keluar</th>
                                    <th className="text-right p-3 text-gray-400 text-sm">Netto</th>
                                </tr>
                            </thead>
                            <tbody>
                                {cashFlowData.map((c, i) => (
                                    <tr key={i} className="border-b border-white/5">
                                        <td className="p-3 text-white">{c.category}</td>
                                        <td className="p-3 text-right text-green-400">
                                            {c.income > 0 ? formatCurrency(c.income) : '-'}
                                        </td>
                                        <td className="p-3 text-right text-red-400">
                                            {c.expense > 0 ? formatCurrency(c.expense) : '-'}
                                        </td>
                                        <td className={`p-3 text-right font-medium ${c.net >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                            {c.net >= 0 ? '+' : ''}{formatCurrency(c.net)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="border-t-2 border-white/20">
                                    <td className="p-3 text-white font-bold">Total</td>
                                    <td className="p-3 text-right text-green-400 font-bold">
                                        {formatCurrency(cashFlowData.reduce((sum, c) => sum + c.income, 0))}
                                    </td>
                                    <td className="p-3 text-right text-red-400 font-bold">
                                        {formatCurrency(cashFlowData.reduce((sum, c) => sum + c.expense, 0))}
                                    </td>
                                    <td className={`p-3 text-right font-bold ${totals.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                        {totals.profit >= 0 ? '+' : ''}{formatCurrency(totals.profit)}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
