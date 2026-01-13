'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Pencil, Trash2, Search, ShoppingBag, X } from 'lucide-react';

interface Material {
    _id: string;
    name: string;
    unit: string;
    pricePerUnit: number;
}

interface ProductMaterial {
    materialId: Material | string;
    quantity: number;
}

interface Product {
    _id: string;
    name: string;
    description?: string;
    sellingPrice: number;
    materials: ProductMaterial[];
    hpp: number;
}

function formatCurrency(value: number): string {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(value);
}

export default function ProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [materials, setMaterials] = useState<Material[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [productMaterials, setProductMaterials] = useState<{ materialId: string; quantity: number }[]>([]);

    const fetchProducts = async () => {
        try {
            const response = await fetch('/api/products');
            if (response.ok) {
                const data = await response.json();
                setProducts(data);
            }
        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchMaterials = async () => {
        try {
            const response = await fetch('/api/materials');
            if (response.ok) {
                const data = await response.json();
                setMaterials(data);
            }
        } catch (error) {
            console.error('Error fetching materials:', error);
        }
    };

    useEffect(() => {
        fetchProducts();
        fetchMaterials();
    }, []);

    const openModal = (product: Product | null = null) => {
        setEditingProduct(product);
        if (product) {
            setProductMaterials(
                product.materials.map((m) => ({
                    materialId: typeof m.materialId === 'string' ? m.materialId : m.materialId._id,
                    quantity: m.quantity,
                }))
            );
        } else {
            setProductMaterials([]);
        }
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');

        const formData = new FormData(e.currentTarget);
        const data = {
            name: formData.get('name') as string,
            description: formData.get('description') as string,
            sellingPrice: Number(formData.get('sellingPrice')),
            materials: productMaterials.filter((m) => m.materialId && m.quantity > 0),
        };

        try {
            const url = editingProduct ? `/api/products/${editingProduct._id}` : '/api/products';
            const method = editingProduct ? 'PUT' : 'POST';

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
            setEditingProduct(null);
            setProductMaterials([]);
            fetchProducts();
        } catch {
            setError('Terjadi kesalahan, silakan coba lagi');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Yakin ingin menghapus produk ini?')) return;

        try {
            const response = await fetch(`/api/products/${id}`, { method: 'DELETE' });
            if (response.ok) {
                fetchProducts();
            }
        } catch (error) {
            console.error('Error deleting product:', error);
        }
    };

    const addMaterial = () => {
        setProductMaterials([...productMaterials, { materialId: '', quantity: 0 }]);
    };

    const removeMaterial = (index: number) => {
        setProductMaterials(productMaterials.filter((_, i) => i !== index));
    };

    const updateMaterial = (index: number, field: 'materialId' | 'quantity', value: string | number) => {
        const updated = [...productMaterials];
        updated[index] = { ...updated[index], [field]: value };
        setProductMaterials(updated);
    };

    const filteredProducts = products.filter((p) =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white">Produk</h1>
                    <p className="text-gray-400">Kelola produk dan bahan bakunya</p>
                </div>
                <button
                    onClick={() => openModal()}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all"
                >
                    <Plus size={20} />
                    Tambah Produk
                </button>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                    type="text"
                    placeholder="Cari produk..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
            </div>

            {/* Products Grid */}
            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="bg-white/5 rounded-2xl border border-white/10 p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <div className="h-5 w-28 bg-white/10 rounded mb-2"></div>
                                    <div className="h-3 w-40 bg-white/5 rounded"></div>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <div className="h-4 w-20 bg-white/10 rounded"></div>
                                    <div className="h-4 w-24 bg-white/10 rounded"></div>
                                </div>
                                <div className="flex justify-between">
                                    <div className="h-4 w-16 bg-white/10 rounded"></div>
                                    <div className="h-4 w-20 bg-white/10 rounded"></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : filteredProducts.length === 0 ? (
                <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-12 text-center">
                    <ShoppingBag size={48} className="mx-auto mb-4 text-gray-500 opacity-50" />
                    <p className="text-gray-400">Belum ada produk</p>
                    <Link href="#" onClick={() => openModal()} className="text-purple-400 hover:text-purple-300 mt-2 inline-block">
                        Tambah produk pertama
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProducts.map((product) => (
                        <div
                            key={product._id}
                            className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 hover:bg-white/10 transition-all"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h3 className="text-lg font-semibold text-white">{product.name}</h3>
                                    {product.description && (
                                        <p className="text-gray-400 text-sm mt-1">{product.description}</p>
                                    )}
                                </div>
                                <div className="flex">
                                    <button
                                        onClick={() => openModal(product)}
                                        className="p-2 text-gray-400 hover:text-purple-400 transition-colors"
                                    >
                                        <Pencil size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(product._id)}
                                        className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Harga Jual</span>
                                    <span className="text-white font-medium">{formatCurrency(product.sellingPrice)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400">HPP</span>
                                    <span className="text-white font-medium">{formatCurrency(product.hpp)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Margin</span>
                                    <span className={`font-medium ${product.sellingPrice - product.hpp > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                        {formatCurrency(product.sellingPrice - product.hpp)}
                                    </span>
                                </div>
                            </div>

                            {product.materials.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-white/10">
                                    <p className="text-sm text-gray-400 mb-2">Bahan ({product.materials.length})</p>
                                    <div className="flex flex-wrap gap-2">
                                        {product.materials.slice(0, 3).map((m, i) => (
                                            <span
                                                key={i}
                                                className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded-full"
                                            >
                                                {typeof m.materialId === 'object' ? m.materialId.name : 'Bahan'}
                                            </span>
                                        ))}
                                        {product.materials.length > 3 && (
                                            <span className="px-2 py-1 bg-gray-500/20 text-gray-300 text-xs rounded-full">
                                                +{product.materials.length - 3} lagi
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
                    <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-lg border border-white/10 my-8">
                        <h2 className="text-xl font-bold text-white mb-6">
                            {editingProduct ? 'Edit Produk' : 'Tambah Produk Baru'}
                        </h2>

                        {error && (
                            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-sm">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Nama Produk</label>
                                <input
                                    type="text"
                                    name="name"
                                    required
                                    defaultValue={editingProduct?.name}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Deskripsi (Opsional)</label>
                                <textarea
                                    name="description"
                                    rows={2}
                                    defaultValue={editingProduct?.description}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Harga Jual</label>
                                <input
                                    type="number"
                                    name="sellingPrice"
                                    required
                                    min="0"
                                    defaultValue={editingProduct?.sellingPrice}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                            </div>

                            {/* Materials Section */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="block text-sm font-medium text-gray-300">Bahan Baku</label>
                                    <button
                                        type="button"
                                        onClick={addMaterial}
                                        className="text-sm text-purple-400 hover:text-purple-300 flex items-center gap-1"
                                    >
                                        <Plus size={16} />
                                        Tambah Bahan
                                    </button>
                                </div>

                                {productMaterials.length === 0 ? (
                                    <p className="text-gray-500 text-sm py-4 text-center border border-dashed border-white/10 rounded-lg">
                                        Belum ada bahan. Klik tombol di atas untuk menambah.
                                    </p>
                                ) : (
                                    <div className="space-y-3">
                                        {productMaterials.map((pm, index) => (
                                            <div key={index} className="flex gap-2">
                                                <select
                                                    value={pm.materialId}
                                                    onChange={(e) => updateMaterial(index, 'materialId', e.target.value)}
                                                    className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                                >
                                                    <option value="">Pilih bahan</option>
                                                    {materials.map((m) => (
                                                        <option key={m._id} value={m._id}>
                                                            {m.name} ({formatCurrency(m.pricePerUnit)}/{m.unit})
                                                        </option>
                                                    ))}
                                                </select>
                                                <input
                                                    type="number"
                                                    placeholder="Qty"
                                                    value={pm.quantity || ''}
                                                    onChange={(e) => updateMaterial(index, 'quantity', Number(e.target.value))}
                                                    className="w-20 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => removeMaterial(index)}
                                                    className="p-2 text-gray-400 hover:text-red-400"
                                                >
                                                    <X size={18} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowModal(false);
                                        setEditingProduct(null);
                                        setProductMaterials([]);
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
