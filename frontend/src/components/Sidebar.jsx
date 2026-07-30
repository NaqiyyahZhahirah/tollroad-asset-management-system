import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useUiStore } from '../store/uiStore';

const menuItems = [
    { to: '/dashboard', icon: 'dashboard', label: 'Dashboard' },
    { to: '/aset', icon: 'inventory_2', label: 'Assets' },
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
            {/* Backdrop, cuma muncul kalau sidebar kebuka di layar kecil */}
            {isSidebarOpen && (
                <div
                    onClick={closeSidebar}
                    className="fixed inset-0 bg-black/40 z-40 md:hidden"
                />
            )}

            <aside
                className={`bg-card h-full flex flex-col border-r border-border py-6 gap-2 shrink-0
                    fixed md:static top-0 left-0 z-50 overflow-hidden
                    transition-all duration-200 ease-in-out
                    ${isSidebarOpen
                        ? 'w-[280px] translate-x-0'
                        : 'w-[280px] -translate-x-full md:w-0 md:translate-x-0 md:border-r-0 md:py-0'
                    }`}
            >
                <div className="w-[280px] flex flex-col h-full">
                    <div className="px-6 mb-6 flex items-center justify-between">
                        <div>
                            <h1 className="text-xl font-bold text-navy">JMTM-AMS</h1>
                            <p className="text-xs text-text-muted uppercase tracking-wider mt-1">Asset Management</p>
                        </div>
                        <button onClick={closeSidebar} className="md:hidden p-1 text-text-muted">
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>

                    <div className="px-6 mb-4 flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-card-strong flex items-center justify-center font-bold text-navy">
                            {user?.nama?.charAt(0) || '?'}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-bold text-text-dark">{user?.nama}</span>
                            <span className="text-xs text-text-muted capitalize">{user?.role}</span>
                        </div>
                    </div>

                    <nav className="flex flex-col flex-grow">
                        {menuItems.map((item) => (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                className={({ isActive }) =>
                                    `flex items-center px-6 py-3 gap-3 transition-all whitespace-nowrap ${
                                        isActive
                                            ? 'border-l-4 border-amber bg-card-strong text-text-dark font-bold'
                                            : 'text-text-muted opacity-70 hover:bg-card-hover'
                                    }`
                                }
                            >
                                <span className="material-symbols-outlined">{item.icon}</span>
                                <span className="text-sm">{item.label}</span>
                            </NavLink>
                        ))}
                        {user?.role === 'admin' && (
                            <NavLink
                                to="/kategori"
                                className={({ isActive }) =>
                                    `flex items-center px-6 py-3 gap-3 transition-all whitespace-nowrap ${
                                        isActive
                                            ? 'border-l-4 border-amber bg-card-strong text-text-dark font-bold'
                                            : 'text-text-muted opacity-70 hover:bg-card-hover'
                                    }`
                                }
                            >
                                <span className="material-symbols-outlined">fact_check</span>
                                <span className="text-sm">Kelola Kategori</span>
                            </NavLink>
                        )}
                    </nav>

                    <div className="px-6 pt-6 mt-auto">
                        <button onClick={handleLogout} className="flex items-center gap-3 text-text-muted hover:text-danger transition-colors w-full py-2 whitespace-nowrap">
                            <span className="material-symbols-outlined">logout</span>
                            <span className="text-xs font-semibold">Sign Out</span>
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
}