import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { useAuthStore } from '../store/authStore';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
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
        <div
            className="relative min-h-screen flex items-center justify-center p-4 md:p-6 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: "url('../public/images/login-bg.jpeg')" }}
        >
            <div className="absolute inset-0 bg-black/75 backdrop-blur-xs z-0" />

            <main className="relative z-10 w-full max-w-4xl bg-card border border-border/60 shadow-2xl overflow-hidden rounded-2xl flex flex-col md:flex-row">

                <section
                    className="relative w-full md:w-1/2 h-56 md:h-auto min-h-[280px] overflow-hidden bg-cover bg-center"
                    style={{ backgroundImage: "url('/images/login-bg.jpeg')" }}
                >
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/65 to-black/40 z-10" />

                    <div className="relative z-20 h-full p-6 md:p-10 flex flex-col justify-between">
                        <div>
                            <span className="inline-block px-3 py-1 bg-amber/20 text-amber border border-amber/30 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
                                Asset Management System
                            </span>
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl text-white font-extrabold tracking-tight">Tollroad-AMS</h1>
                            <p className="text-xs md:text-sm text-gray-300 mt-1">Sistem Manajemen Aset Jalan Tol Terintegrasi</p>
                        </div>
                    </div>
                </section>

                <section className="flex-1 flex flex-col justify-center px-6 md:px-10 py-10 bg-card">
                    <div className="max-w-sm mx-auto w-full">
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold text-navy">Selamat Datang</h2>
                            <p className="text-sm text-text-muted mt-1">Masukkan kredensial Anda untuk mengakses dashboard.</p>
                        </div>

                        {error && (
                            <div className="mb-4 p-3 bg-danger/10 border border-danger/20 text-danger rounded-lg text-sm font-semibold flex items-center gap-2">
                                <span className="material-symbols-outlined text-[18px]">error</span>
                                {error}
                            </div>
                        )}

                        <form className="space-y-4" onSubmit={handleSubmit}>
                            <div className="space-y-1">
                                <label className="text-xs text-text-muted uppercase tracking-wider block font-bold" htmlFor="email">
                                    Email
                                </label>
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted text-[20px]">mail</span>
                                    <input
                                        id="email"
                                        type="email"
                                        placeholder="nama@email.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="w-full h-11 pl-10 pr-4 bg-card border border-border rounded-lg focus:border-amber focus:outline-none transition-all text-sm text-text-dark"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs text-text-muted uppercase tracking-wider block font-bold" htmlFor="password">
                                    Password
                                </label>
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted text-[20px]">lock</span>
                                    <input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        className="w-full h-11 pl-10 pr-10 bg-card border border-border rounded-lg focus:border-amber focus:outline-none transition-all text-sm text-text-dark"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((s) => !s)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-navy"
                                        tabIndex={-1}
                                    >
                                        <span className="material-symbols-outlined text-[20px]">
                                            {showPassword ? 'visibility_off' : 'visibility'}
                                        </span>
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full h-11 bg-navy text-white hover:bg-navy/90 font-bold rounded-lg shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-60 mt-2"
                            >
                                <span>{loading ? 'Memproses...' : 'Masuk'}</span>
                                {!loading && <span className="material-symbols-outlined text-[18px]">arrow_forward</span>}
                            </button>
                        </form>

                        <div className="mt-8 pt-4 border-t border-border flex flex-col gap-2">
                            <div className="flex items-center gap-2 text-text-muted">
                                <span className="material-symbols-outlined text-[16px]">verified_user</span>
                                <p className="text-xs">Akses terbatas untuk tim internal</p>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}