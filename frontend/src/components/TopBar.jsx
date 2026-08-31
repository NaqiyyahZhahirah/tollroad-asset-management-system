import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { useUiStore } from '../store/uiStore';

const statusColor = {
    baik: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    perlu_perawatan: 'text-amber-600 bg-amber-50 border-amber-200',
    rusak: 'text-red-600 bg-red-50 border-red-200'
};

export default function TopBar() {
    const { toggleSidebar } = useUiStore();
    const navigate = useNavigate();
    const [query, setQuery] = useState('');
    const [allAssets, setAllAssets] = useState([]);
    const [results, setResults] = useState([]);
    const [open, setOpen] = useState(false);
    const wrapperRef = useRef(null);

    useEffect(() => {
        axiosClient.get('/aset')
            .then((res) => setAllAssets(res.data.data || []))
            .catch(() => setAllAssets([]));
    }, []);

    useEffect(() => {
        function handleClickOutside(e) {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
                setOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    function handleSearch(q) {
        setQuery(q);
        if (!q.trim() || q.length < 2) {
            setResults([]);
            setOpen(false);
            return;
        }
        const qLower = q.toLowerCase();
        const filtered = allAssets.filter((a) => {
            const name = (a.nama_aset || '').toLowerCase();
            const seri = (a.nomor_seri || '').toLowerCase();
            const kat = (a.kategori_aset?.nama_kategori || '').toLowerCase();
            const km = String(a.lokasi_km || '');
            return name.includes(qLower) || seri.includes(qLower) || kat.includes(qLower) || km.includes(qLower);
        }).slice(0, 6);

        setResults(filtered);
        setOpen(true);
    }

    function handleSelect(aset) {
        setQuery('');
        setOpen(false);
        navigate(`/peta?selectedId=${aset.id}`);
    }

    return (
        <header className="sticky top-0 bg-navy text-white flex items-center justify-between gap-3 w-full px-4 md:px-8 h-14 md:h-16 border-b border-navy/40 z-30 shrink-0 shadow-md">            <div className="flex items-center gap-3 flex-1 min-w-0">
                <button
                    onClick={toggleSidebar}
                    className="p-2 -ml-2 hover:bg-white/10 rounded-full shrink-0 text-white transition-colors"
                    title="Buka Menu"
                >
                    <span className="material-symbols-outlined text-[22px]">menu</span>
                </button>

                {/* TopBar Search Input */}
                <div ref={wrapperRef} className="relative w-full max-w-md md:max-w-xl">
                    <div className="relative flex items-center">
                        <span className="material-symbols-outlined absolute left-3 text-white/60 text-[20px]">search</span>
                        <input
                            className="w-full bg-white/10 border border-white/20 rounded-xl pl-10 pr-8 py-2 text-xs md:text-sm outline-none focus:border-amber focus:ring-1 focus:ring-amber/40 transition-all text-white placeholder:text-white/60"
                            placeholder="Cari aset, ID, kategori, atau KM..."
                            type="text"
                            value={query}
                            onChange={(e) => handleSearch(e.target.value)}
                            onFocus={() => query.trim().length >= 2 && setOpen(true)}
                        />
                        {query && (
                            <button
                                type="button"
                                onClick={() => { setQuery(''); setOpen(false); }}
                                className="absolute right-2.5 text-white/60 hover:text-white"
                            >
                                <span className="material-symbols-outlined text-[18px]">close</span>
                            </button>
                        )}
                    </div>

                    {/* Results Dropdown */}
                    {open && (
                        <div className="absolute top-full left-0 right-0 mt-1.5 bg-card text-text-dark border border-border rounded-xl shadow-2xl z-[1200] overflow-hidden max-h-80 overflow-y-auto">
                            {results.length > 0 ? (
                                results.map((aset) => (
                                    <button
                                        key={aset.id}
                                        type="button"
                                        onClick={() => handleSelect(aset)}
                                        className="w-full text-left px-4 py-3 hover:bg-card-hover transition-colors flex items-center justify-between border-b border-border/50 last:border-0 gap-3"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-8 h-8 rounded-lg bg-card-strong flex items-center justify-center shrink-0">
                                                <span className="material-symbols-outlined text-navy text-[18px]">construction</span>
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs font-bold text-navy truncate">{aset.nama_aset}</p>
                                                <p className="text-[11px] text-text-muted truncate">
                                                    {aset.kategori_aset?.nama_kategori || 'Aset'} • KM {aset.lokasi_km || '-'} Jalur {aset.jalur || '-'}
                                                </p>
                                            </div>
                                        </div>
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border shrink-0 ${statusColor[aset.status_kondisi] || 'text-gray-600 bg-gray-50 border-gray-200'}`}>
                                            {aset.status_kondisi?.replace('_', ' ')}
                                        </span>
                                    </button>
                                ))
                            ) : (
                                <div className="p-4 text-center text-xs text-text-muted font-medium">
                                    Aset tidak ditemukan untuk "{query}"
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}