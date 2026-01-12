'use client';

import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Search, Filter, TrendingDown } from 'lucide-react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

interface Expense {
    _id: string;
    date: string;
    description: string;
    category: 'bahan_baku' | 'produksi' | 'operasional';
    productId?: { _id: string; name: string };
    materialId?: { _id: string; name: string; unit: string };
    quantity?: number;
    amount: number;
}

interface Material {
    _id: string;
    name: string;
    unit: string;
    pricePerUnit: number;
}

interface Product {
    _id: string;
    name: string;
}

const categoryLabels: Record<string, string> = {
    bahan_baku: 'Bahan Baku',
    produksi: 'Produksi',
    operasional: 'Operasional',
};

const categoryColors: Record<string, string> = {
    bahan_baku: 'bg-blue-500/20 text-blue-400',
    produksi: 'bg-purple-500/20 text-purple-400',
    operasional: 'bg-orange-500/20 text-orange-400',
};

function formatCurrency(value: number): string {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(value);
}

function getTodayDate(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

export default function ExpensesPage() {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [materials, setMaterials] = useState<Material[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [formCategory, setFormCategory] = useState<string>('operasional');
    const [formDate, setFormDate] = useState('');

    const fetchExpenses = async () => {
        try {
            let url = '/api/expenses';
            if (categoryFilter) url += `?category=${categoryFilter}`;
            const response = await fetch(url);
            if (response.ok) {
                const data = await response.json();
                setExpenses(data);
            }
        } catch (error) {
            console.error('Error fetching expenses:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchMaterials = async () => {
        const response = await fetch('/api/materials');
        if (response.ok) setMaterials(await response.json());
    };

    const fetchProducts = async () => {
        const response = await fetch('/api/products');
        if (response.ok) setProducts(await response.json());
    };

    useEffect(() => {
        fetchExpenses();
        fetchMaterials();
        fetchProducts();
    }, [categoryFilter]);

    const openModal = (expense: Expense | null = null) => {
        setEditingExpense(expense);
        setFormCategory(expense?.category || 'operasional');
        setFormDate(expense ? format(new Date(expense.date), 'yyyy-MM-dd') : getTodayDate());
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');

        const formData = new FormData(e.currentTarget);
        const data = {
            date: formDate,
            description: formData.get('description') as string,
            category: formData.get('category') as string,
            amount: Number(formData.get('amount')),
            productId: formData.get('productId') || undefined,
            materialId: formData.get('materialId') || undefined,
            quantity: formData.get('quantity') ? Number(formData.get('quantity')) : undefined,
        };

        try {
            const url = editingExpense ? `/api/expenses/${editingExpense._id}` : '/api/expenses';
            const method = editingExpense ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const result = await response.json();
                setError(result.error || 'Terjadi kesalahan');
                return;
            }

            setShowModal(false);
            setEditingExpense(null);
            fetchExpenses();
        } catch {
            setError('Terjadi kesalahan, silakan coba lagi');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Yakin ingin menghapus pengeluaran ini?')) return;
        try {
            const response = await fetch(`/api/expenses/${id}`, { method: 'DELETE' });
            if (response.ok) fetchExpenses();
        } catch (error) {
            console.error('Error:', error);
        }
    };

    const filteredExpenses = expenses.filter((e) =>
        e.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalExpense = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white">Pengeluaran</h1>
                    <p className="text-gray-400">Tracking pengeluaran perusahaan</p>
                </div>
                <button
                    onClick={() => openModal()}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700"
                >
                    <Plus size={20} />
                    Tambah Pengeluaran
                </button>
            </div>

            {/* Summary */}
            <div className="bg-gradient-to-r from-red-500/20 to-orange-500/20 backdrop-blur-xl rounded-2xl border border-red-500/30 p-6">
                <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-red-500/20">
                        <TrendingDown size={24} className="text-red-400" />
                    </div>
                    <div>
                        <p className="text-gray-400 text-sm">Total Pengeluaran</p>
                        <p className="text-2xl font-bold text-white">{formatCurrency(totalExpense)}</p>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Cari pengeluaran..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                </div>
                <div className="relative">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="pl-10 pr-8 py-3 bg-slate-700 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                        <option value="">Semua Kategori</option>
                        <option value="bahan_baku">Bahan Baku</option>
                        <option value="produksi">Produksi</option>
                        <option value="operasional">Operasional</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
                {isLoading ? (
                    <div className="flex items-center justify-center h-48">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                    </div>
                ) : filteredExpenses.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                        <TrendingDown size={48} className="mb-4 opacity-50" />
                        <p>Belum ada pengeluaran</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-white/10">
                                    <th className="text-left p-4 text-gray-400 font-medium">Tanggal</th>
                                    <th className="text-left p-4 text-gray-400 font-medium">Deskripsi</th>
                                    <th className="text-left p-4 text-gray-400 font-medium">Kategori</th>
                                    <th className="text-right p-4 text-gray-400 font-medium">Jumlah</th>
                                    <th className="text-right p-4 text-gray-400 font-medium">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredExpenses.map((expense) => (
                                    <tr key={expense._id} className="border-b border-white/5 hover:bg-white/5">
                                        <td className="p-4 text-gray-300">
                                            {format(new Date(expense.date), 'd MMM yyyy', { locale: idLocale })}
                                        </td>
                                        <td className="p-4">
                                            <p className="text-white">{expense.description}</p>
                                            {expense.materialId && (
                                                <p className="text-sm text-gray-400">
                                                    {expense.materialId.name} × {expense.quantity} {expense.materialId.unit}
                                                </p>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded-full text-xs ${categoryColors[expense.category]}`}>
                                                {categoryLabels[expense.category]}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right text-red-400 font-medium">
                                            -{formatCurrency(expense.amount)}
                                        </td>
                                        <td className="p-4 text-right">
                                            <button onClick={() => openModal(expense)} className="p-2 text-gray-400 hover:text-purple-400">
                                                <Pencil size={18} />
                                            </button>
                                            <button onClick={() => handleDelete(expense._id)} className="p-2 text-gray-400 hover:text-red-400">
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
                    <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-md border border-white/10 my-8">
                        <h2 className="text-xl font-bold text-white mb-6">
                            {editingExpense ? 'Edit Pengeluaran' : 'Tambah Pengeluaran'}
                        </h2>

                        {error && (
                            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-sm">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Tanggal</label>
                                <input
                                    type="date"
                                    name="date"
                                    required
                                    value={formDate}
                                    onChange={(e) => setFormDate(e.target.value)}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Kategori</label>
                                <select
                                    name="category"
                                    required
                                    value={formCategory}
                                    onChange={(e) => setFormCategory(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-700 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                >
                                    <option value="operasional">Operasional</option>
                                    <option value="bahan_baku">Bahan Baku</option>
                                    <option value="produksi">Produksi</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Deskripsi</label>
                                <input
                                    type="text"
                                    name="description"
                                    required
                                    defaultValue={editingExpense?.description}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                            </div>

                            {formCategory === 'bahan_baku' && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">Bahan (Opsional)</label>
                                        <select
                                            name="materialId"
                                            defaultValue={editingExpense?.materialId?._id || ''}
                                            className="w-full px-4 py-3 bg-slate-700 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        >
                                            <option value="">Pilih bahan</option>
                                            {materials.map((m) => (
                                                <option key={m._id} value={m._id}>{m.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">Quantity</label>
                                        <input
                                            type="number"
                                            name="quantity"
                                            min="0"
                                            step="0.01"
                                            defaultValue={editingExpense?.quantity}
                                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        />
                                    </div>
                                </>
                            )}

                            {formCategory === 'produksi' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Produk (Opsional)</label>
                                    <select
                                        name="productId"
                                        defaultValue={editingExpense?.productId?._id || ''}
                                        className="w-full px-4 py-3 bg-slate-700 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    >
                                        <option value="">Pilih produk</option>
                                        {products.map((p) => (
                                            <option key={p._id} value={p._id}>{p.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Jumlah (Rp)</label>
                                <input
                                    type="number"
                                    name="amount"
                                    required
                                    min="0"
                                    defaultValue={editingExpense?.amount}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowModal(false);
                                        setEditingExpense(null);
                                        setError('');
                                    }}
                                    className="flex-1 py-3 px-4 border border-white/10 text-gray-300 rounded-lg hover:bg-white/5"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-1 py-3 px-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg disabled:opacity-50"
                                >
                                    {isSubmitting ? 'Menyimpan...' : 'Simpan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
