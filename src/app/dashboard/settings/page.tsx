'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { User, Phone, Lock, Shield, Save, Eye, EyeOff } from 'lucide-react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

type Tab = 'profile' | 'security';

interface UserProfile {
    name: string;
    email: string;
    phone: string;
    passwordChangedAt?: string;
    createdAt: string;
}

export default function SettingsPage() {
    const { data: session, update: updateSession } = useSession();
    const [activeTab, setActiveTab] = useState<Tab>('profile');
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // Profile form
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');

    // Password form
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPasswords, setShowPasswords] = useState(false);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const res = await fetch('/api/account');
            if (res.ok) {
                const data = await res.json();
                setProfile(data);
                setName(data.name);
                setEmail(data.email);
                setPhone(data.phone || '');
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setMessage({ type: '', text: '' });

        try {
            const res = await fetch('/api/account', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, phone: phone || '' }),
            });

            const data = await res.json();

            if (!res.ok) {
                setMessage({ type: 'error', text: data.error });
                return;
            }

            setMessage({ type: 'success', text: 'Profil berhasil diperbarui' });

            // Update session if name changed
            if (data.user?.name !== session?.user?.name) {
                await updateSession({ name: data.user.name });
            }

            fetchProfile();
        } catch {
            setMessage({ type: 'error', text: 'Terjadi kesalahan' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setMessage({ type: '', text: '' });

        if (newPassword !== confirmPassword) {
            setMessage({ type: 'error', text: 'Password baru tidak cocok' });
            setIsSaving(false);
            return;
        }

        try {
            const res = await fetch('/api/account/change-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
            });

            const data = await res.json();

            if (!res.ok) {
                setMessage({ type: 'error', text: data.error });
                return;
            }

            setMessage({ type: 'success', text: 'Password berhasil diubah. Email notifikasi telah dikirim.' });
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            fetchProfile();
        } catch {
            setMessage({ type: 'error', text: 'Terjadi kesalahan' });
        } finally {
            setIsSaving(false);
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
            <div>
                <h1 className="text-3xl font-bold text-white">Pengaturan Akun</h1>
                <p className="text-gray-400">Kelola profil dan keamanan akun Anda</p>
            </div>

            {/* Account Info Card */}
            <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-xl rounded-2xl border border-purple-500/30 p-6">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-bold text-2xl">
                            {profile?.name?.charAt(0).toUpperCase() || 'U'}
                        </span>
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">{profile?.name}</h2>
                        <p className="text-gray-400">{profile?.email}</p>
                        <p className="text-xs text-gray-500 mt-1">
                            Bergabung sejak {profile?.createdAt ? format(new Date(profile.createdAt), 'd MMMM yyyy', { locale: idLocale }) : '-'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-white/10 pb-1">
                <button
                    onClick={() => setActiveTab('profile')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-t-lg transition-colors ${activeTab === 'profile'
                            ? 'bg-white/10 text-white border-b-2 border-purple-500'
                            : 'text-gray-400 hover:text-white'
                        }`}
                >
                    <User size={18} />
                    Profil
                </button>
                <button
                    onClick={() => setActiveTab('security')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-t-lg transition-colors ${activeTab === 'security'
                            ? 'bg-white/10 text-white border-b-2 border-purple-500'
                            : 'text-gray-400 hover:text-white'
                        }`}
                >
                    <Shield size={18} />
                    Keamanan
                </button>
            </div>

            {/* Message */}
            {message.text && (
                <div className={`p-3 rounded-lg ${message.type === 'success'
                        ? 'bg-green-500/20 border border-green-500/50 text-green-300'
                        : 'bg-red-500/20 border border-red-500/50 text-red-300'
                    }`}>
                    {message.text}
                </div>
            )}

            {/* Profile Tab */}
            {activeTab === 'profile' && (
                <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
                    <form onSubmit={handleUpdateProfile} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                <User size={16} className="inline mr-2" />
                                Nama Lengkap
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                minLength={2}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                <span className="mr-2">📧</span>
                                Email
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Email akan digunakan untuk login dan notifikasi
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                <Phone size={16} className="inline mr-2" />
                                Nomor HP (Opsional)
                            </label>
                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="08xxxxxxxxxx"
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Format: 08xxxxxxxxxx atau +62xxxxxxxxxx
                            </p>
                        </div>

                        <button
                            type="submit"
                            disabled={isSaving}
                            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 transition-all"
                        >
                            <Save size={18} />
                            {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
                        </button>
                    </form>
                </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
                <div className="space-y-6">
                    {/* Password Info */}
                    <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <Lock size={20} />
                            Informasi Keamanan
                        </h3>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                                <span className="text-gray-400">Password terakhir diubah</span>
                                <span className="text-white">
                                    {profile?.passwordChangedAt
                                        ? format(new Date(profile.passwordChangedAt), 'd MMM yyyy, HH:mm', { locale: idLocale })
                                        : 'Belum pernah diubah'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Change Password Form */}
                    <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
                        <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                            <Lock size={20} />
                            Ganti Password
                        </h3>

                        <form onSubmit={handleChangePassword} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Password Lama
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPasswords ? 'text' : 'password'}
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        required
                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 pr-12"
                                        placeholder="Masukkan password lama"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPasswords(!showPasswords)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                                    >
                                        {showPasswords ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Password Baru
                                </label>
                                <input
                                    type={showPasswords ? 'text' : 'password'}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                    minLength={6}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    placeholder="Minimal 6 karakter"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Konfirmasi Password Baru
                                </label>
                                <input
                                    type={showPasswords ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    placeholder="Ulangi password baru"
                                />
                            </div>

                            <div className="pt-4">
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 transition-all"
                                >
                                    <Lock size={18} />
                                    {isSaving ? 'Menyimpan...' : 'Ganti Password'}
                                </button>
                            </div>

                            <p className="text-xs text-gray-500">
                                Setelah mengganti password, Anda akan menerima email notifikasi keamanan.
                            </p>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
