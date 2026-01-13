import { TableSkeleton } from '@/components/ui/Skeleton';

export default function Loading() {
    return (
        <div className="space-y-6 animate-pulse">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <div className="h-8 w-44 bg-white/10 rounded-lg"></div>
                    <div className="h-4 w-52 bg-white/5 rounded mt-2"></div>
                </div>
                <div className="h-10 w-40 bg-purple-500/20 rounded-lg"></div>
            </div>

            {/* Category tabs */}
            <div className="flex gap-2">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-9 w-24 bg-white/10 rounded-lg"></div>
                ))}
            </div>

            {/* Table */}
            <TableSkeleton rows={6} />
        </div>
    );
}
