import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
    { to: '/', label: 'Accueil', icon: '🏠', end: true },
    { to: '/profile', label: 'Mon Profil', icon: '👤' },
    { to: '/leaves', label: 'Mes Congés', icon: '🏖️' },
    { to: '/dependents', label: 'Ayants Droit', icon: '👨‍👩‍👧' },
    { to: '/diplomas', label: 'Diplômes', icon: '🎓' },
    { to: '/census', label: 'Recensement', icon: '📋' },
];

export default function Layout() {
    const { user, logout } = useAuth();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const sidebarContent = (
        <>
            <div className="p-5 border-b border-white/10">
                <div className="flex items-center gap-3">
                    {user?.employee?.photo ? (
                        <img src={user.employee.photo} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
                    ) : (
                        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold shrink-0">
                            {(user?.employee?.full_name ?? user?.name ?? '?').charAt(0)}
                        </div>
                    )}
                    <div className="min-w-0">
                        <p className="text-sm font-semibold truncate">{user?.employee?.full_name ?? user?.name}</p>
                        {user?.employee?.matricule && (
                            <p className="text-xs text-white/60 truncate">{user.employee.matricule}</p>
                        )}
                    </div>
                </div>
            </div>

            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                {navItems.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.end}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${isActive ? 'bg-white/15' : 'hover:bg-white/10 text-white/80'
                            }`
                        }
                    >
                        <span>{item.icon}</span>
                        {item.label}
                    </NavLink>
                ))}
            </nav>

            <div className="p-3 border-t border-white/10">
                <button
                    onClick={logout}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/80 hover:bg-white/10 transition"
                >
                    <span>🚪</span>
                    Se déconnecter
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

            {/* Barre latérale : fixe sur desktop, tiroir superposé sur mobile */}
            <aside className="hidden md:flex w-64 bg-[#1e3a5f] text-white flex-col shrink-0">
                {sidebarContent}
            </aside>

            {isMobileMenuOpen && (
                <div className="md:hidden fixed inset-0 z-40 flex">
                    <div className="w-72 max-w-[80vw] bg-[#1e3a5f] text-white flex flex-col h-full">
                        <div className="flex justify-end p-3">
                            <button onClick={() => setIsMobileMenuOpen(false)} className="p-1 text-white/80" aria-label="Fermer le menu">
                                ✕
                            </button>
                        </div>
                        {sidebarContent}
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