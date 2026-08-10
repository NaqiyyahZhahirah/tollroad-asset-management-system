const KATEGORI_LIST = [
    { key: 'main_road', label: 'Main Road', shape: 'line', color: '#f59e0b', dashed: true },
    { key: 'ramp', label: 'Ramp / Akses', shape: 'line', color: '#7c3aed', dashed: true },
    { key: 'gerbang_tol', label: 'Gerbang Tol', shape: 'square', color: '#dc2626' },
    { key: 'patok_heksa', label: 'Patok Heksa', shape: 'circle', color: '#6b7280' }
];

function LayerIndicator({ shape, color, dashed }) {
    if (shape === 'line') {
        return (
            <span
                className="w-4 h-0 shrink-0 border-t-2"
                style={{
                    borderColor: color,
                    borderStyle: dashed ? 'dashed' : 'solid'
                }}
            />
        );
    }
    if (shape === 'square') {
        return (
            <span
                className="w-2.5 h-2.5 rounded-[3px] shrink-0 border border-white"
                style={{ backgroundColor: color }}
            />
        );
    }
    return (
        <span
            className="w-2 h-2 rounded-full shrink-0 border border-white"
            style={{ backgroundColor: color }}
        />
    );
}

export default function ReferensiJalanToggles({ visible, onToggle, showKm, onToggleKm }) {
    return (
        <div className="space-y-2">
            {KATEGORI_LIST.map((k) => (
                <div key={k.key}>
                    <div className="flex items-center justify-between gap-3">
                        <span className="flex items-center gap-2 text-xs font-bold text-text-muted">
                            <LayerIndicator shape={k.shape} color={k.color} dashed={k.dashed} />
                            {k.label}
                        </span>
                        <button
                            type="button"
                            onClick={() => onToggle(k.key)}
                            className="w-9 h-5 rounded-full transition-colors relative p-0.5 shrink-0"
                            style={{ backgroundColor: visible[k.key] ? k.color : '#d1d5db' }}
                        >
                            <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${visible[k.key] ? 'translate-x-4' : 'translate-x-0'}`} />
                        </button>
                    </div>

                    {k.key === 'patok_heksa' && visible.patok_heksa && (
                        <div className="flex items-center justify-between gap-3 mt-2 ml-5 pl-2 border-l-2 border-border">
                            <span className="text-[11px] font-semibold text-text-muted">
                                Tampilkan KM
                            </span>
                            <button
                                type="button"
                                onClick={onToggleKm}
                                className={`w-8 h-4.5 rounded-full transition-colors relative p-0.5 shrink-0 ${showKm ? 'bg-gray-500' : 'bg-gray-300'}`}
                            >
                                <div className={`w-3.5 h-3.5 rounded-full bg-white shadow transition-transform ${showKm ? 'translate-x-3.5' : 'translate-x-0'}`} />
                            </button>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}