export default function Loading() {
    return (
        <div className="space-y-6 animate-pulse">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <div className="h-8 w-28 bg-white/10 rounded-lg"></div>
                    <div className="h-4 w-44 bg-white/5 rounded mt-2"></div>
                </div>
                <div className="h-10 w-32 bg-purple-500/20 rounded-lg"></div>
            </div>

            {/* Product grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="bg-white/5 rounded-2xl border border-white/10 p-5">
                        <div className="flex items-start justify-between mb-3">
                            <div className="h-5 w-32 bg-white/10 rounded"></div>
                            <div className="h-6 w-6 bg-white/10 rounded"></div>
                        </div>
                        <div className="h-4 w-full bg-white/5 rounded mb-2"></div>
                        <div className="h-4 w-2/3 bg-white/5 rounded mb-4"></div>
                        <div className="flex justify-between">
                            <div className="h-4 w-20 bg-white/10 rounded"></div>
                            <div className="h-4 w-16 bg-white/10 rounded"></div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
