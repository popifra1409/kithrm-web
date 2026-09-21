import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
    { to: '/', label: 'Accueil', icon: '🏠', end: true },
    { to: '/profile', label: 'Mon Profil', icon: '👤' },
    { to: '/leaves', label: 'Mes Congés', icon: '🏖️' },
    { to: '/dependents', label: 'Ayants Droit', icon: '👨‍👩‍👧' },
    { to: '/diplomas', label: 'Diplômes', icon: '🎓' },
];

export default function Layout() {
    const { user, logout } = useAuth();

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <aside className="w-64 bg-[#1e3a5f] text-white flex flex-col shrink-0">
                <div className="p-5 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        {user?.employee?.photo ? (
                            <img src={user.employee.photo} alt="" className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold">
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

                <nav className="flex-1 p-3 space-y-1">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.end}
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
            </aside>

            <main className="flex-1 overflow-y-auto">
                <Outlet />
            </main>
        </div>
    );
}