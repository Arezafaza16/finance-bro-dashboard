import { TableSkeleton } from '@/components/ui/Skeleton';

export default function Loading() {
    return (
        <div className="space-y-6 animate-pulse">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <div className="h-8 w-40 bg-white/10 rounded-lg"></div>
                    <div className="h-4 w-56 bg-white/5 rounded mt-2"></div>
                </div>
                <div className="h-10 w-36 bg-purple-500/20 rounded-lg"></div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-white/5 rounded-2xl border border-white/10 p-4">
                        <div className="h-3 w-16 bg-white/10 rounded mb-2"></div>
                        <div className="h-6 w-24 bg-white/10 rounded"></div>
                    </div>
                ))}
            </div>

            {/* Table */}
            <TableSkeleton rows={6} />
        </div>
    );
}
