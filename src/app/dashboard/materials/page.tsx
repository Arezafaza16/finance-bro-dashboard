'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Pencil, Trash2, Search, Package } from 'lucide-react';

interface Material {
    _id: string;
    name: string;
    unit: string;
    pricePerUnit: number;
    stock: number;
    description?: string;
}

const unitLabels: Record<string, string> = {
    kg: 'Kg',
    gram: 'Gram',
    liter: 'Liter',
    ml: 'ml',
    pcs: 'Pcs',
    pack: 'Pack',
    meter: 'Meter',
    cm: 'Cm',
    box: 'Box',
};

function formatCurrency(value: number): string {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(value);
}

export default function MaterialsPage() {
    const [materials, setMaterials] = useState<Material[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [selectedUnit, setSelectedUnit] = useState('pcs');

    const fetchMaterials = async () => {
        try {
            const response = await fetch('/api/materials');
            if (response.ok) {
                const data = await response.json();
                setMaterials(data);
            }
        } catch (error) {
            console.error('Error fetching materials:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchMaterials();
    }, []);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');

        const formData = new FormData(e.currentTarget);
        const stock = Number(formData.get('stock'));
        const pricePerUnit = Number(formData.get('pricePerUnit'));

        const data = {
            name: formData.get('name') as string,
            unit: formData.get('unit') as string,
            pricePerUnit,
            stock,
            description: formData.get('description') as string,
        };

        try {
            const url = editingMaterial
                ? `/api/materials/${editingMaterial._id}`
                : '/api/materials';
            const method = editingMaterial ? 'PUT' : 'POST';

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

            const savedMaterial = await response.json();

            // Auto-create expense when adding new material with stock > 0
            if (!editingMaterial && stock > 0) {
                const expenseData = {
                    date: new Date().toISOString(),
                    description: `Pembelian bahan: ${data.name} (${stock} ${unitLabels[data.unit] || data.unit})`,
                    category: 'bahan_baku',
                    materialId: savedMaterial._id,
                    quantity: stock,
                    amount: stock * pricePerUnit,
                };

                await fetch('/api/expenses', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(expenseData),
                });
            }

            setShowModal(false);
            setEditingMaterial(null);
            setSelectedUnit('pcs');
            fetchMaterials();
        } catch {
            setError('Terjadi kesalahan, silakan coba lagi');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Yakin ingin menghapus bahan ini?')) return;

        try {
            const response = await fetch(`/api/materials/${id}`, { method: 'DELETE' });
            if (response.ok) {
                fetchMaterials();
            }
        } catch (error) {
            console.error('Error deleting material:', error);
        }
    };

    const openModal = (material: Material | null = null) => {
        setEditingMaterial(material);
        setSelectedUnit(material?.unit || 'pcs');
        setShowModal(true);
    };

    const filteredMaterials = materials.filter((m) =>
        m.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white">Bahan Baku</h1>
                    <p className="text-gray-400">Kelola bahan baku untuk produksi</p>
                </div>
                <button
                    onClick={() => openModal()}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all"
                >
                    <Plus size={20} />
                    Tambah Bahan
                </button>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                    type="text"
                    placeholder="Cari bahan..."
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
                ) : filteredMaterials.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                        <Package size={48} className="mb-4 opacity-50" />
                        <p>Belum ada bahan baku</p>
                        <Link href="#" onClick={() => openModal()} className="text-purple-400 hover:text-purple-300 mt-2">
                            Tambah bahan pertama
                        </Link>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-white/10">
                                    <th className="text-left p-4 text-gray-400 font-medium">Nama</th>
                                    <th className="text-left p-4 text-gray-400 font-medium">Satuan</th>
                                    <th className="text-left p-4 text-gray-400 font-medium">Harga/Unit</th>
                                    <th className="text-left p-4 text-gray-400 font-medium">Stok</th>
                                    <th className="text-right p-4 text-gray-400 font-medium">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredMaterials.map((material) => (
                                    <tr key={material._id} className="border-b border-white/5 hover:bg-white/5">
                                        <td className="p-4 text-white font-medium">{material.name}</td>
                                        <td className="p-4 text-gray-300">{unitLabels[material.unit] || material.unit}</td>
                                        <td className="p-4 text-gray-300">{formatCurrency(material.pricePerUnit)}</td>
                                        <td className="p-4 text-gray-300">{material.stock} {unitLabels[material.unit] || material.unit}</td>
                                        <td className="p-4 text-right">
                                            <button
                                                onClick={() => openModal(material)}
                                                className="p-2 text-gray-400 hover:text-purple-400 transition-colors"
                                            >
                                                <Pencil size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(material._id)}
                                                className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                                            >
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
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-md border border-white/10">
                        <h2 className="text-xl font-bold text-white mb-6">
                            {editingMaterial ? 'Edit Bahan' : 'Tambah Bahan Baru'}
                        </h2>

                        {error && (
                            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-sm">
                                {error}
                            </div>
                        )}

                        {!editingMaterial && (
                            <div className="mb-4 p-3 bg-blue-500/20 border border-blue-500/50 rounded-lg text-blue-300 text-sm">
                                💡 Stok awal akan otomatis tercatat sebagai pengeluaran
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Nama Bahan</label>
                                <input
                                    type="text"
                                    name="name"
                                    required
                                    defaultValue={editingMaterial?.name}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Satuan</label>
                                <select
                                    name="unit"
                                    required
                                    value={selectedUnit}
                                    onChange={(e) => setSelectedUnit(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-700 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none cursor-pointer"
                                    style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.75rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}
                                >
                                    <option value="kg">Kilogram (Kg)</option>
                                    <option value="gram">Gram</option>
                                    <option value="liter">Liter</option>
                                    <option value="ml">Mililiter (ml)</option>
                                    <option value="pcs">Pieces (Pcs)</option>
                                    <option value="pack">Pack</option>
                                    <option value="meter">Meter</option>
                                    <option value="cm">Centimeter (Cm)</option>
                                    <option value="box">Box</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Harga per {unitLabels[selectedUnit] || 'Unit'}</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">Rp</span>
                                    <input
                                        type="number"
                                        name="pricePerUnit"
                                        required
                                        min="0"
                                        defaultValue={editingMaterial?.pricePerUnit}
                                        className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    {editingMaterial ? 'Stok Saat Ini' : 'Stok Awal'}
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        name="stock"
                                        min="0"
                                        step="0.01"
                                        defaultValue={editingMaterial?.stock || 0}
                                        className="w-full px-4 py-3 pr-16 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">
                                        {unitLabels[selectedUnit] || selectedUnit}
                                    </span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Deskripsi (Opsional)</label>
                                <textarea
                                    name="description"
                                    rows={2}
                                    defaultValue={editingMaterial?.description}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowModal(false);
                                        setEditingMaterial(null);
                                        setSelectedUnit('pcs');
                                        setError('');
                                    }}
                                    className="flex-1 py-3 px-4 border border-white/10 text-gray-300 rounded-lg hover:bg-white/5 transition-colors"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-1 py-3 px-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50"
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
