import { useAuth } from '../context/AuthContext';

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div className="p-4 sm:p-8">
      <h1 className="text-xl font-bold text-gray-900">
        Bonjour, {user?.employee?.full_name?.split(' ')[0] ?? user?.name} 👋
      </h1>
      <p className="text-sm text-gray-600 mt-2">
        Bienvenue dans votre espace employé — version web alternative de KitHRM mobile.
      </p>
    </div>
  );
}