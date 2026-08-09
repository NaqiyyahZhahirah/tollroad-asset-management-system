import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useUiStore } from '../store/uiStore';

const menuItems = [
    { to: '/dashboard', icon: 'dashboard', label: 'Dashboard' },
    { to: '/aset', icon: 'inventory_2', label: 'Asset' },
    { to: '/peta', icon: 'map', label: 'Map' },
];

export default function Sidebar() {
    const { user, logout } = useAuthStore();
    const { isSidebarOpen, closeSidebar } = useUiStore();
    const navigate = useNavigate();

    function handleLogout() {
        logout();
        navigate('/login');
    }

    return (
        <>
            {isSidebarOpen && (
                <div
                    onClick={closeSidebar}
                    className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[9998] md:hidden"
                />
            )}

            <aside
                className={`bg-navy text-white h-screen flex flex-col border-r border-white/10 shrink-0
                    fixed md:sticky top-0 left-0 z-[9999] overflow-hidden shadow-2xl
                    transition-all duration-200 ease-in-out
                    ${isSidebarOpen
                        ? 'w-[280px] translate-x-0'
                        : 'w-[280px] -translate-x-full md:w-0 md:translate-x-0 md:border-r-0'
                    }`}
            >
                <div className="w-[280px] flex flex-col h-full">
                    <div className="px-6 py-5 flex items-center justify-between border-b border-white/10 shrink-0">
                        <div>
                            <h1 className="text-xl font-bold text-white tracking-tight">Tollroad AMS</h1>
                            <p className="text-xs text-amber font-semibold uppercase tracking-wider mt-0.5">Asset Management System</p>
                        </div>
                        <button onClick={closeSidebar} className="md:hidden p-1 text-white/70 hover:text-white transition-colors">
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>

                    <div className="px-6 py-4 flex items-center gap-3 border-b border-white/10 shrink-0 bg-white/5">
                        <div className="w-10 h-10 rounded-full bg-amber/20 text-amber flex items-center justify-center font-bold text-sm shrink-0 border border-amber/30">
                            {user?.nama?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="text-sm font-bold text-white truncate">{user?.nama}</span>
                            <span className="text-xs text-gray-300 capitalize">{user?.role}</span>
                        </div>
                    </div>

                    <nav className="flex flex-col flex-grow py-3 overflow-y-auto">
                        {menuItems.map((item) => (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                className={({ isActive }) =>
                                    `flex items-center px-6 py-3.5 gap-3 transition-all whitespace-nowrap ${
                                        isActive
                                            ? 'border-l-4 border-amber bg-white/15 text-white font-bold shadow-sm'
                                            : 'text-gray-300 hover:bg-white/10 hover:text-white'
                                    }`
                                }
                            >
                                <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                                <span className="text-sm">{item.label}</span>
                            </NavLink>
                        ))}
                        {user?.role === 'admin' && (
                            <>
                                <NavLink
                                    to="/kategori"
                                    className={({ isActive }) =>
                                        `flex items-center px-6 py-3.5 gap-3 transition-all whitespace-nowrap ${
                                            isActive
                                                ? 'border-l-4 border-amber bg-white/15 text-white font-bold shadow-sm'
                                                : 'text-gray-300 hover:bg-white/10 hover:text-white'
                                        }`
                                    }
                                >
                                    <span className="material-symbols-outlined text-[20px]">fact_check</span>
                                    <span className="text-sm">Kelola Kategori</span>
                                </NavLink>
                                <NavLink
                                    to="/referensi-jalan"
                                    className={({ isActive }) =>
                                        `flex items-center px-6 py-3.5 gap-3 transition-all whitespace-nowrap ${
                                            isActive
                                                ? 'border-l-4 border-amber bg-white/15 text-white font-bold shadow-sm'
                                                : 'text-gray-300 hover:bg-white/10 hover:text-white'
                                        }`
                                    }
                                >
                                    <span className="material-symbols-outlined text-[20px]">signpost</span>
                                    <span className="text-sm">Data Referensi Jalan</span>
                                </NavLink>
                                <NavLink
                                    to="/pengguna"
                                    className={({ isActive }) =>
                                        `flex items-center px-6 py-3.5 gap-3 transition-all whitespace-nowrap ${
                                            isActive
                                                ? 'border-l-4 border-amber bg-white/15 text-white font-bold shadow-sm'
                                                : 'text-gray-300 hover:bg-white/10 hover:text-white'
                                        }`
                                    }
                                >
                                    <span className="material-symbols-outlined text-[20px]">manage_accounts</span>
                                    <span className="text-sm">Kelola Pengguna</span>
                                </NavLink>
                            </>
                        )}
                    </nav>

                    <div className="p-4 border-t border-white/10 shrink-0 mt-auto bg-black/20">
                        <button
                            onClick={handleLogout}
                            className="flex items-center justify-center gap-2.5 text-white/90 hover:text-red-300 hover:bg-red-500/20 transition-all w-full py-2.5 px-4 rounded-lg bg-white/10 font-semibold text-xs uppercase tracking-wider"
                        >
                            <span className="material-symbols-outlined text-[18px]">logout</span>
                            <span>Sign Out</span>
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
}