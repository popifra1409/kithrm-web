import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const SIDEBAR_COLLAPSED_KEY = 'kithrm_sidebar_collapsed';

const navItems = [
    { to: '/', label: 'Accueil', icon: '🏠', end: true },
    { to: '/profile', label: 'Mon Profil', icon: '👤' },
    { to: '/leaves', label: 'Mes Congés', icon: '🏖️' },
    { to: '/dependents', label: 'Ayants Droit', icon: '👨‍👩‍👧' },
    { to: '/diplomas', label: 'Diplômes', icon: '🎓' },
    { to: '/census', label: 'Recensement', icon: '📋' },
];

function ChevronToggle({ collapsed, onClick }: { collapsed: boolean; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            title={collapsed ? 'Déplier le menu' : 'Replier le menu'}
            aria-label={collapsed ? 'Déplier le menu' : 'Replier le menu'}
            className="p-1.5 rounded-lg text-white/70 hover:bg-white/10 hover:text-white transition shrink-0"
        >
            <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className={`transition-transform ${collapsed ? 'rotate-180' : ''}`}
            >
                <polyline points="15 18 9 12 15 6" />
            </svg>
        </button>
    );
}

export default function Layout() {
    const { user, logout } = useAuth();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === '1');

    function toggleCollapsed() {
        const next = !isCollapsed;
        localStorage.setItem(SIDEBAR_COLLAPSED_KEY, next ? '1' : '0');
        setIsCollapsed(next);
    }

    const renderSidebar = (collapsed: boolean, onToggle?: () => void) => (
        <>
            <div
                className={`border-b border-white/10 ${
                    collapsed ? 'p-2 flex flex-col items-center gap-1' : 'p-5'
                }`}
            >
                <div className={`flex items-center gap-3 min-w-0 ${collapsed ? 'justify-center' : 'w-full'}`}>
                    {user?.employee?.photo ? (
                        <img src={user.employee.photo} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
                    ) : (
                        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold shrink-0">
                            {(user?.employee?.full_name ?? user?.name ?? '?').charAt(0)}
                        </div>
                    )}
                    {!collapsed && (
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold truncate">{user?.employee?.full_name ?? user?.name}</p>
                            {user?.employee?.matricule && (
                                <p className="text-xs text-white/60 truncate">{user.employee.matricule}</p>
                            )}
                        </div>
                    )}
                    {!collapsed && onToggle && <ChevronToggle collapsed={collapsed} onClick={onToggle} />}
                </div>
                {collapsed && onToggle && <ChevronToggle collapsed={collapsed} onClick={onToggle} />}
            </div>

            <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
                {navItems.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.end}
                        title={item.label}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                                collapsed ? 'justify-center px-0' : ''
                            } ${isActive ? 'bg-white/15' : 'hover:bg-white/10 text-white/80'}`
                        }
                    >
                        <span>{item.icon}</span>
                        {!collapsed && item.label}
                    </NavLink>
                ))}
            </nav>

            <div className="p-2 border-t border-white/10">
                <button
                    onClick={logout}
                    title="Se déconnecter"
                    aria-label="Se déconnecter"
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/80 hover:bg-white/10 transition ${
                        collapsed ? 'justify-center px-0' : ''
                    }`}
                >
                    <span>🚪</span>
                    {!collapsed && 'Se déconnecter'}
                </button>
            </div>
        </>
    );

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
            {/* Barre du haut, visible uniquement sur mobile/tablette */}
            <header className="md:hidden bg-[#1e3a5f] text-white flex items-center justify-between px-4 py-3 sticky top-0 z-30">
                <span className="font-semibold text-sm">KitHRM</span>
                <button
                    onClick={() => setIsMobileMenuOpen(true)}
                    className="p-2 -mr-2"
                    aria-label="Ouvrir le menu"
                >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="3" y1="6" x2="21" y2="6" />
                        <line x1="3" y1="12" x2="21" y2="12" />
                        <line x1="3" y1="18" x2="21" y2="18" />
                    </svg>
                </button>
            </header>

            {/* Barre latérale : repliable sur desktop, tiroir superposé sur mobile */}
            <aside
                className={`hidden md:flex bg-[#1e3a5f] text-white flex-col shrink-0 transition-[width] duration-200 ${
                    isCollapsed ? 'w-[60px]' : 'w-64'
                }`}
            >
                {renderSidebar(isCollapsed, toggleCollapsed)}
            </aside>

            {isMobileMenuOpen && (
                <div className="md:hidden fixed inset-0 z-40 flex">
                    <div className="w-72 max-w-[80vw] bg-[#1e3a5f] text-white flex flex-col h-full">
                        <div className="flex justify-end p-3">
                            <button onClick={() => setIsMobileMenuOpen(false)} className="p-1 text-white/80" aria-label="Fermer le menu">
                                ✕
                            </button>
                        </div>
                        {renderSidebar(false)}
                    </div>
                    <div className="flex-1 bg-black/40" onClick={() => setIsMobileMenuOpen(false)} />
                </div>
            )}

            <main className="flex-1 overflow-y-auto min-w-0">
                <Outlet />
            </main>
        </div>
    );
}
