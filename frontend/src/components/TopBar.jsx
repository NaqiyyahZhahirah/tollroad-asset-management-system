import { useUiStore } from '../store/uiStore';

export default function TopBar() {
    const { toggleSidebar } = useUiStore();

    return (
        <header className="bg-card flex items-center gap-3 w-full px-4 md:px-8 h-14 md:h-16 border-b border-border z-30 shrink-0">
            <button onClick={toggleSidebar} className="p-2 -ml-2 hover:bg-card-hover rounded-full shrink-0">
                <span className="material-symbols-outlined text-navy">menu</span>
            </button>

            <div className="relative w-full max-w-xl hidden md:block">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-[20px]">search</span>
                <input
                    className="w-full bg-app-bg border border-border rounded-lg pl-10 pr-4 py-2 text-sm outline-none"
                    placeholder="Cari aset, ID, atau log perawatan..."
                    type="text"
                />
            </div>
        </header>
    );
}