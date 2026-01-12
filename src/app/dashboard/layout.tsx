import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import Sidebar from '@/components/layout/Sidebar';
import Providers from '@/components/providers/SessionProvider';

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect('/login');
    }

    return (
        <Providers>
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
                <Sidebar />
                <main className="lg:ml-64 min-h-screen">
                    <div className="p-6 lg:p-8">{children}</div>
                </main>
            </div>
        </Providers>
    );
}
