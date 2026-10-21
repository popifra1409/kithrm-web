import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
        <div className="text-4xl" aria-hidden>🧭</div>
        <h1 className="text-lg font-bold text-[#1e3a5f] mt-3">Adresse introuvable</h1>
        <p className="text-sm text-gray-600 mt-2">
          Cette page n'existe pas dans ton espace employé. Le lien est peut-être incomplet ou
          ancien.
        </p>
        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/"
            className="px-4 py-2.5 rounded-lg bg-[#1e3a5f] text-white text-sm font-semibold"
          >
            Retour à l'accueil
          </Link>
          <Link
            to="/login"
            className="px-4 py-2.5 rounded-lg border border-gray-200 text-gray-700 text-sm font-semibold"
          >
            Se connecter
          </Link>
        </div>
        <p className="text-xs text-gray-400 mt-5">
          En cas de doute, préviens le service des Ressources Humaines.
        </p>
      </div>
    </div>
  );
}
