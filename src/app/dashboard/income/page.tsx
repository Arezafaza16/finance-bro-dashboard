'use client';

import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Search, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

interface Income {
    _id: string;
    date: string;
    productId: { _id: string; name: string; sellingPrice: number };
    quantity: number;
    unitPrice: number;
    totalAmount: number;
    customerName?: string;
    notes?: string;
}

interface Product {
    _id: string;
    name: string;
    sellingPrice: number;
}

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

export default function IncomePage() {
    const [incomes, setIncomes] = useState<Income[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingIncome, setEditingIncome] = useState<Income | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [quantity, setQuantity] = useState(1);
    const [unitPrice, setUnitPrice] = useState(0);
    const [formDate, setFormDate] = useState('');

    const fetchIncomes = async () => {
        try {
            const response = await fetch('/api/income');
            if (response.ok) {
                const data = await response.json();
                setIncomes(data);
            }
        } catch (error) {
            console.error('Error fetching incomes:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchProducts = async () => {
        const response = await fetch('/api/products');
        if (response.ok) setProducts(await response.json());
    };

    useEffect(() => {
        fetchIncomes();
        fetchProducts();
    }, []);

    const openModal = (income: Income | null = null) => {
        setEditingIncome(income);
        setFormDate(income ? format(new Date(income.date), 'yyyy-MM-dd') : getTodayDate());
        if (income) {
            setSelectedProduct(income.productId as unknown as Product);
            setQuantity(income.quantity);
            setUnitPrice(income.unitPrice);
        } else {
            setSelectedProduct(null);
            setQuantity(1);
            setUnitPrice(0);
        }
        setShowModal(true);
    };

    const handleProductChange = (productId: string) => {
        const product = products.find((p) => p._id === productId);
        setSelectedProduct(product || null);
        if (product) setUnitPrice(product.sellingPrice);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');

        const formData = new FormData(e.currentTarget);
        const data = {
            date: formDate,
            productId: formData.get('productId') as string,
            quantity,
            unitPrice,
            totalAmount: quantity * unitPrice,
            customerName: formData.get('customerName') || undefined,
            notes: formData.get('notes') || undefined,
        };

        try {
            const url = editingIncome ? `/api/income/${editingIncome._id}` : '/api/income';
            const method = editingIncome ? 'PUT' : 'POST';

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
            setEditingIncome(null);
            fetchIncomes();
        } catch {
            setError('Terjadi kesalahan, silakan coba lagi');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Yakin ingin menghapus pemasukan ini?')) return;
        try {
            const response = await fetch(`/api/income/${id}`, { method: 'DELETE' });
            if (response.ok) fetchIncomes();
        } catch (error) {
            console.error('Error:', error);
        }
    };

    const filteredIncomes = incomes.filter((i) =>
        i.productId?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.customerName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalIncome = filteredIncomes.reduce((sum, i) => sum + i.totalAmount, 0);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white">Pemasukan</h1>
                    <p className="text-gray-400">Tracking penjualan produk</p>
                </div>
                <button
                    onClick={() => openModal()}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700"
                >
                    <Plus size={20} />
                    Tambah Penjualan
                </button>
            </div>

            {/* Summary */}
            <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-xl rounded-2xl border border-green-500/30 p-6">
                <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-green-500/20">
                        <TrendingUp size={24} className="text-green-400" />
                    </div>
                    <div>
                        <p className="text-gray-400 text-sm">Total Pemasukan</p>
                        <p className="text-2xl font-bold text-white">{formatCurrency(totalIncome)}</p>
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                    type="text"
                    placeholder="Cari berdasarkan produk atau customer..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
            </div>

            {/* Table */}
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
                {isLoading ? (
                    <div className="flex items-center justify-center h-48">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                    </div>
                ) : filteredIncomes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                        <TrendingUp size={48} className="mb-4 opacity-50" />
                        <p>Belum ada pemasukan</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-white/10">
                                    <th className="text-left p-4 text-gray-400 font-medium">Tanggal</th>
                                    <th className="text-left p-4 text-gray-400 font-medium">Produk</th>
                                    <th className="text-center p-4 text-gray-400 font-medium">Qty</th>
                                    <th className="text-right p-4 text-gray-400 font-medium">Harga</th>
                                    <th className="text-right p-4 text-gray-400 font-medium">Total</th>
                                    <th className="text-right p-4 text-gray-400 font-medium">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredIncomes.map((income) => (
                                    <tr key={income._id} className="border-b border-white/5 hover:bg-white/5">
                                        <td className="p-4 text-gray-300">
                                            {format(new Date(income.date), 'd MMM yyyy', { locale: idLocale })}
                                        </td>
                                        <td className="p-4">
                                            <p className="text-white">{income.productId?.name}</p>
                                            {income.customerName && (
                                                <p className="text-sm text-gray-400">{income.customerName}</p>
                                            )}
                                        </td>
                                        <td className="p-4 text-center text-gray-300">{income.quantity}</td>
                                        <td className="p-4 text-right text-gray-300">{formatCurrency(income.unitPrice)}</td>
                                        <td className="p-4 text-right text-green-400 font-medium">
                                            +{formatCurrency(income.totalAmount)}
                                        </td>
                                        <td className="p-4 text-right">
                                            <button onClick={() => openModal(income)} className="p-2 text-gray-400 hover:text-purple-400">
                                                <Pencil size={18} />
                                            </button>
                                            <button onClick={() => handleDelete(income._id)} className="p-2 text-gray-400 hover:text-red-400">
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
                            {editingIncome ? 'Edit Penjualan' : 'Tambah Penjualan'}
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
                                <label className="block text-sm font-medium text-gray-300 mb-2">Produk</label>
                                <select
                                    name="productId"
                                    required
                                    value={selectedProduct?._id || editingIncome?.productId?._id || ''}
                                    onChange={(e) => handleProductChange(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-700 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                >
                                    <option value="">Pilih produk</option>
                                    {products.map((p) => (
                                        <option key={p._id} value={p._id}>
                                            {p.name} - {formatCurrency(p.sellingPrice)}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Quantity</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={quantity}
                                        onChange={(e) => setQuantity(Number(e.target.value))}
                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Harga Satuan</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={unitPrice}
                                        onChange={(e) => setUnitPrice(Number(e.target.value))}
                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    />
                                </div>
                            </div>

                            {/* Total Preview */}
                            <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/30">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-300">Total:</span>
                                    <span className="text-xl font-bold text-green-400">{formatCurrency(quantity * unitPrice)}</span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Nama Customer (Opsional)</label>
                                <input
                                    type="text"
                                    name="customerName"
                                    defaultValue={editingIncome?.customerName}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Catatan (Opsional)</label>
                                <textarea
                                    name="notes"
                                    rows={2}
                                    defaultValue={editingIncome?.notes}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowModal(false);
                                        setEditingIncome(null);
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
