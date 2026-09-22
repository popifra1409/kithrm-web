import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAppInfo } from '../context/AppInfoContext';
import { extractApiError } from '../api/client';

export default function LoginPage() {
  const { login } = useAuth();
  const { appInfo } = useAppInfo();
  const navigate = useNavigate();

  const [matricule, setMatricule] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!matricule.trim() || !password) {
      setErrorMessage('Veuillez renseigner votre matricule et votre mot de passe.');
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      await login({ matricule: matricule.trim(), password });
      navigate('/', { replace: true });
    } catch (error) {
      setErrorMessage(extractApiError(error).message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="text-center mb-6">
          {appInfo?.logo_url ? (
            <img src={appInfo.logo_url} alt="" className="w-16 h-16 mx-auto mb-3 object-contain" />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-[#1e3a5f] mx-auto flex items-center justify-center mb-3">
              <span className="text-white text-2xl font-bold">{(appInfo?.hospital_short_name ?? 'H').charAt(0)}</span>
            </div>
          )}
          {appInfo?.hospital_name && (
            <p className="text-xs font-semibold text-gray-600 mb-2">{appInfo.hospital_name}</p>
          )}
          <h1 className="text-2xl font-bold text-[#1e3a5f]">Connexion</h1>
          <p className="text-sm text-gray-500 mt-1">Accédez à votre espace employé</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Matricule</label>
            <input
              type="text"
              value={matricule}
              onChange={(e) => setMatricule(e.target.value)}
              placeholder="Ex: 98240812A"
              autoCapitalize="characters"
              autoComplete="username"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent"
            />
          </div>

          {errorMessage && <p className="text-sm text-red-600 text-center">{errorMessage}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#1e3a5f] text-white rounded-lg py-2.5 text-sm font-semibold hover:opacity-90 transition disabled:opacity-60"
          >
            {isSubmitting ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        <div className="text-center mt-5">
          <Link to="/activate" className="text-sm font-medium text-[#1e3a5f] hover:underline">
            Première connexion ? Activer mon compte
          </Link>
        </div>
      </div>
    </div>
  );
}