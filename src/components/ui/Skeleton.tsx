'use client';

export default function DashboardSkeleton() {
    return (
        <div className="space-y-6 animate-pulse">
            {/* Header skeleton */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <div className="h-8 w-48 bg-white/10 rounded-lg"></div>
                    <div className="h-4 w-64 bg-white/5 rounded mt-2"></div>
                </div>
                <div className="h-10 w-32 bg-white/10 rounded-lg"></div>
            </div>

            {/* Stats cards skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white/5 rounded-2xl border border-white/10 p-6">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-white/10 rounded-xl"></div>
                            <div className="flex-1">
                                <div className="h-3 w-20 bg-white/10 rounded"></div>
                                <div className="h-6 w-28 bg-white/10 rounded mt-2"></div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Table skeleton */}
            <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
                <div className="h-6 w-40 bg-white/10 rounded mb-4"></div>
                <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="flex items-center gap-4 p-3 bg-white/5 rounded-lg">
                            <div className="h-4 w-24 bg-white/10 rounded"></div>
                            <div className="h-4 w-32 bg-white/10 rounded flex-1"></div>
                            <div className="h-4 w-20 bg-white/10 rounded"></div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export function CardSkeleton() {
    return (
        <div className="bg-white/5 rounded-2xl border border-white/10 p-6 animate-pulse">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-white/10 rounded-xl"></div>
                <div className="h-5 w-32 bg-white/10 rounded"></div>
            </div>
            <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="h-4 bg-white/10 rounded" style={{ width: `${100 - i * 15}%` }}></div>
                ))}
            </div>
        </div>
    );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
    return (
        <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden animate-pulse">
            {/* Header */}
            <div className="p-4 border-b border-white/10 flex gap-4">
                <div className="h-4 w-24 bg-white/10 rounded"></div>
                <div className="h-4 w-32 bg-white/10 rounded flex-1"></div>
                <div className="h-4 w-20 bg-white/10 rounded"></div>
            </div>
            {/* Rows */}
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="p-4 border-b border-white/5 flex gap-4">
                    <div className="h-4 w-24 bg-white/5 rounded"></div>
                    <div className="h-4 w-32 bg-white/5 rounded flex-1"></div>
                    <div className="h-4 w-20 bg-white/5 rounded"></div>
                </div>
            ))}
        </div>
    );
}
