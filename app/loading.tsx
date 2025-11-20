export default function PageLoading() {
    return (
        <main className="h-screen flex flex-col animate-pulse">
            <header className="flex items-center justify-between px-4 py-2 border-b bg-white">
                <div className="h-5 w-28 bg-neutral-200 rounded"/>
                <div className="h-8 w-24 bg-neutral-200 rounded"/>
            </header>
            <div className="flex flex-1 min-h-0">
                <aside className="w-64 border-r bg-white p-3 space-y-2">
                    <div className="h-9 bg-neutral-200 rounded"/>
                    {Array.from({length: 6}).map((_, i) => (
                        <div key={i} className="h-8 bg-neutral-200 rounded"/>
                    ))}
                </aside>
                <section className="flex-1 p-4 space-y-3">
                    <div className="h-9 bg-neutral-200 rounded"/>
                    <div className="h-11 bg-neutral-200 rounded"/>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {Array.from({length: 6}).map((_, i) => (
                            <div key={i} className="h-40 bg-neutral-200 rounded"/>
                        ))}
                    </div>
                </section>
            </div>
        </main>
    );
}

