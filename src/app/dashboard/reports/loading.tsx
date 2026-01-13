import { CardSkeleton } from '@/components/ui/Skeleton';

export default function Loading() {
    return (
        <div className="space-y-6 animate-pulse">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <div className="h-8 w-32 bg-white/10 rounded-lg"></div>
                    <div className="h-4 w-48 bg-white/5 rounded mt-2"></div>
                </div>
                <div className="h-10 w-36 bg-purple-500/20 rounded-lg"></div>
            </div>

            {/* Stats cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white/5 rounded-2xl border border-white/10 p-6">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-white/10 rounded-xl"></div>
                            <div className="flex-1">
                                <div className="h-3 w-24 bg-white/10 rounded"></div>
                                <div className="h-6 w-32 bg-white/10 rounded mt-2"></div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Reports grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <CardSkeleton />
                <CardSkeleton />
                <div className="lg:col-span-2">
                    <CardSkeleton />
                </div>
            </div>
        </div>
    );
}
