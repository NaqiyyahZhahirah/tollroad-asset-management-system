import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';

/* ─── Context ─── */
const ToastContext = createContext(null);

const ICONS = {
    success: { icon: 'check_circle', bg: 'bg-[#D1FAE5]', text: 'text-[#065F46]', bar: 'bg-[#065F46]' },
    error:   { icon: 'error',        bg: 'bg-[#FEE2E2]', text: 'text-[#991B1B]', bar: 'bg-[#991B1B]' },
    warning: { icon: 'warning',      bg: 'bg-[#FEF3C7]', text: 'text-[#92400E]', bar: 'bg-[#92400E]' },
    info:    { icon: 'info',         bg: 'bg-blue-50',   text: 'text-blue-700',  bar: 'bg-blue-600'   },
};

function ToastItem({ toast, onClose }) {
    const style = ICONS[toast.type] || ICONS.info;
    const [visible, setVisible] = useState(false);
    const timerRef = useRef(null);

    useEffect(() => {
        // mount → animate in
        requestAnimationFrame(() => setVisible(true));

        const duration = toast.duration ?? 4000;
        timerRef.current = setTimeout(() => handleClose(), duration);
        return () => clearTimeout(timerRef.current);
    }, []);

    function handleClose() {
        setVisible(false);
        setTimeout(() => onClose(toast.id), 300);
    }

    return (
        <div
            className={`relative w-full max-w-sm bg-card border border-border rounded-xl shadow-lg overflow-hidden flex items-start gap-3 p-4 transition-all duration-300 ${
                visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'
            }`}
        >
            {/* Accent bar kiri */}
            <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ${style.bar}`} />

            {/* Icon */}
            <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${style.bg}`}>
                <span className={`material-symbols-outlined text-[18px] ${style.text}`}>{style.icon}</span>
            </div>

            {/* Message */}
            <p className="flex-1 text-sm text-navy leading-snug pt-0.5">{toast.message}</p>

            {/* Close button */}
            <button
                onClick={handleClose}
                className="shrink-0 text-text-muted hover:text-navy transition-colors mt-0.5"
            >
                <span className="material-symbols-outlined text-[18px]">close</span>
            </button>

            {/* Progress bar */}
            <div
                className={`absolute bottom-0 left-0 h-0.5 ${style.bar} opacity-40`}
                style={{
                    animation: `toast-progress ${toast.duration ?? 4000}ms linear forwards`
                }}
            />
        </div>
    );
}

/* ─── Provider ─── */
export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const showToast = useCallback((message, type = 'info', duration = 4000) => {
        const id = Date.now() + Math.random();
        setToasts((prev) => [...prev, { id, message, type, duration }]);
    }, []);

    const removeToast = useCallback((id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={showToast}>
            {children}
            {/* Toast container */}
            <div className="fixed bottom-6 right-4 z-[9999] flex flex-col gap-2 items-end pointer-events-none">
                {toasts.map((t) => (
                    <div key={t.id} className="pointer-events-auto w-full max-w-sm">
                        <ToastItem toast={t} onClose={removeToast} />
                    </div>
                ))}
            </div>
            {/* Keyframe style */}
            <style>{`
                @keyframes toast-progress {
                    from { width: 100%; }
                    to   { width: 0%; }
                }
            `}</style>
        </ToastContext.Provider>
    );
}

/* ─── Hook ─── */
export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');

    return {
        success: (msg, duration) => ctx(msg, 'success', duration),
        error:   (msg, duration) => ctx(msg, 'error',   duration),
        warning: (msg, duration) => ctx(msg, 'warning', duration),
        info:    (msg, duration) => ctx(msg, 'info',    duration),
    };
}
