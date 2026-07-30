import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { useAuthStore } from '../store/authStore';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const login = useAuthStore((state) => state.login);
    const navigate = useNavigate();

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await axiosClient.post('/auth/login', { email, password });
            const session = res.data.session;
            const token = session?.access_token || res.data.access_token;
            const user = res.data.user || session?.user;
            const expiresAt = session?.expires_at || res.data.expires_at;

            login(token, user, expiresAt);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.error || 'Login gagal');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="bg-app-bg text-text-dark min-h-screen flex items-center justify-center p-0 md:p-6">
            <main className="w-full h-screen md:h-auto md:max-w-5xl md:aspect-[16/9] bg-card shadow-2xl overflow-hidden md:rounded-xl flex flex-col md:flex-row">

                {/* Left: Visual Anchor */}
                <section className="relative w-full md:w-1/2 h-48 md:h-full overflow-hidden bg-gradient-to-br from-navy via-navy-light to-amber-dark">
                    <div className="absolute inset-0 z-10 bg-gradient-to-r from-navy/50 to-transparent" />
                    <div className="absolute bottom-4 left-4 z-20 md:hidden">
                        <h1 className="text-2xl text-white font-extrabold tracking-tight">JMTM-AMS</h1>
                        <p className="text-xs text-white/80 uppercase tracking-widest">Asset Management System</p>
                    </div>
                    <div className="hidden md:flex items-center justify-center h-full">
                        <span className="material-symbols-outlined text-white/20 text-[200px]">route</span>
                    </div>
                </section>

                {/* Right: Form */}
                <section className="flex-1 flex flex-col justify-center px-6 md:px-10 py-10 bg-card">
                    <div className="max-w-sm mx-auto w-full">
                        <div className="mb-8 hidden md:block">
                            <h1 className="text-3xl text-navy font-extrabold tracking-tighter leading-none mb-1">JMTM-AMS</h1>
                            <p className="text-sm text-text-muted">Intelligent Asset Management for Infrastructure</p>
                        </div>

                        <div className="mb-6">
                            <h2 className="text-xl font-semibold text-text-dark">Selamat Datang</h2>
                            <p className="text-sm text-text-muted">Masukkan kredensial kamu untuk mengakses dashboard.</p>
                        </div>

                        {error && (
                            <div className="mb-4 p-3 bg-danger-bg text-danger rounded-lg text-sm">
                                {error}
                            </div>
                        )}

                        <form className="space-y-5" onSubmit={handleSubmit}>
                            <div className="space-y-1">
                                <label className="text-xs text-text-muted uppercase tracking-wider block font-semibold" htmlFor="email">
                                    Email
                                </label>
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-icon-muted text-[20px]">mail</span>
                                    <input
                                        id="email"
                                        type="email"
                                        placeholder="name@jmtm.co.id"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="w-full h-12 pl-11 pr-4 bg-input-bg border border-border rounded-lg focus:border-amber focus:ring-2 focus:ring-amber/20 outline-none transition-all text-sm"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs text-text-muted uppercase tracking-wider block font-semibold" htmlFor="password">
                                    Password
                                </label>
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-icon-muted text-[20px]">lock</span>
                                    <input
                                        id="password"
                                        type="password"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        className="w-full h-12 pl-11 pr-4 bg-input-bg border border-border rounded-lg focus:border-amber focus:ring-2 focus:ring-amber/20 outline-none transition-all text-sm"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full h-12 bg-amber hover:bg-amber-dark text-amber-text font-bold rounded-lg shadow-lg shadow-amber/10 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-60"
                            >
                                <span>{loading ? 'Memproses...' : 'Masuk'}</span>
                                {!loading && <span className="material-symbols-outlined">arrow_forward</span>}
                            </button>
                        </form>

                        <div className="mt-8 pt-6 border-t border-border flex flex-col gap-2">
                            <div className="flex items-center gap-2 text-text-muted">
                                <span className="material-symbols-outlined text-[16px]">verified_user</span>
                                <p className="text-xs">Akses terbatas untuk tim internal JMTM</p>
                            </div>
                            <p className="text-xs text-text-muted/60 text-center mt-2">
                                © 2026 Jasa Marga Tollroad Maintenance. All rights reserved.
                            </p>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}