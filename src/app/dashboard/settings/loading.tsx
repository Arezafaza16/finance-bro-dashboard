export default function Loading() {
    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
            {/* Header */}
            <div>
                <div className="h-8 w-40 bg-white/10 rounded-lg"></div>
                <div className="h-4 w-64 bg-white/5 rounded mt-2"></div>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 border-b border-white/10 pb-4">
                <div className="h-8 w-20 bg-white/10 rounded-lg"></div>
                <div className="h-8 w-24 bg-white/5 rounded-lg"></div>
            </div>

            {/* Settings form */}
            <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
                <div className="space-y-6">
                    {[1, 2, 3].map((i) => (
                        <div key={i}>
                            <div className="h-4 w-24 bg-white/10 rounded mb-2"></div>
                            <div className="h-10 w-full bg-white/5 rounded-lg"></div>
                        </div>
                    ))}
                </div>
                <div className="h-10 w-32 bg-purple-500/20 rounded-lg mt-6"></div>
            </div>
        </div>
    );
}
