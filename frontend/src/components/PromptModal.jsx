import { useState, useEffect, useRef } from 'react';

/**
 * PromptModal — pengganti browser prompt()
 *
 * Props:
 *   open           boolean   — tampil atau tidak
 *   title          string    — judul modal
 *   message        string    — kalimat deskripsi / pertanyaan
 *   placeholder    string    — placeholder input
 *   required       boolean   — wajib isi (default false, opsional)
 *   confirmText    string    — teks tombol konfirmasi (default "Konfirmasi")
 *   confirmVariant string    — "danger" (merah) atau "primary" (navy)
 *   onConfirm      fn(value) — dipanggil dengan nilai input jika OK
 *   onCancel       fn()      — dipanggil jika Batal
 */
export default function PromptModal({
    open,
    title,
    message,
    placeholder = 'Alasan (opsional)...',
    required = false,
    confirmText = 'Konfirmasi',
    confirmVariant = 'primary',
    onConfirm,
    onCancel
}) {
    const [value, setValue] = useState('');
    const inputRef = useRef(null);

    useEffect(() => {
        if (open) {
            setValue('');
            setTimeout(() => inputRef.current?.focus(), 80);
        }
    }, [open]);

    if (!open) return null;

    function handleConfirm() {
        if (required && !value.trim()) return;
        onConfirm(value.trim());
    }

    function handleKeyDown(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleConfirm();
        }
        if (e.key === 'Escape') onCancel();
    }

    const isDanger = confirmVariant === 'danger';

    return (
        <div className="fixed inset-0 z-[9990] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-sm p-6 flex flex-col gap-4">
                {/* Header */}
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isDanger ? 'bg-[#FEE2E2]' : 'bg-amber-50'}`}>
                        <span className={`material-symbols-outlined ${isDanger ? 'text-[#991B1B]' : 'text-amber-700'}`}>
                            {isDanger ? 'cancel' : 'edit_note'}
                        </span>
                    </div>
                    <div>
                        <h3 className="font-bold text-navy text-base">{title}</h3>
                        {message && <p className="text-xs text-text-muted mt-0.5">{message}</p>}
                    </div>
                </div>

                {/* Input */}
                <textarea
                    ref={inputRef}
                    rows={3}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    className="w-full px-4 py-3 border border-border rounded-lg text-sm text-navy focus:outline-none focus:border-amber resize-none"
                />

                {/* Actions */}
                <div className="flex gap-2 justify-end">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-4 py-2 rounded-lg border border-border text-navy font-semibold text-sm hover:bg-card-hover transition-colors"
                    >
                        Batal
                    </button>
                    <button
                        type="button"
                        onClick={handleConfirm}
                        disabled={required && !value.trim()}
                        className={`px-4 py-2 rounded-lg font-semibold text-sm text-white hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity ${
                            isDanger ? 'bg-[#991B1B]' : 'bg-navy'
                        }`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
