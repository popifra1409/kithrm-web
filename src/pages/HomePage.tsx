import { useAuth } from '../context/AuthContext';

export default function HomePage() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      {user?.employee?.photo ? (
        <img
          src={user.employee.photo}
          alt=""
          className="w-20 h-20 rounded-full object-cover mb-4"
        />
      ) : (
        <div className="w-20 h-20 rounded-full bg-[#1e3a5f] flex items-center justify-center mb-4">
          <span className="text-white text-2xl font-bold">
            {(user?.employee?.full_name ?? user?.name ?? '?').charAt(0)}
          </span>
        </div>
      )}

      <h1 className="text-lg font-bold text-gray-900">{user?.employee?.full_name ?? user?.name}</h1>
      {user?.employee?.matricule && (
        <p className="text-sm text-gray-500 mt-1">{user.employee.matricule}</p>
      )}

      <p className="text-sm text-gray-600 mt-4 mb-6 text-center max-w-xs">
        Bienvenue dans votre espace employé — version web de secours.
      </p>

      <button
        onClick={logout}
        className="border border-red-600 text-red-600 rounded-lg px-6 py-2 text-sm font-semibold hover:bg-red-50 transition"
      >
        Se déconnecter
      </button>
    </div>
  );
}
