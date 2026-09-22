import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAppInfo } from '../context/AppInfoContext';
import { extractApiError } from '../api/client';

export default function ActivatePage() {
  const { activate } = useAuth();
  const { appInfo } = useAppInfo();
  const navigate = useNavigate();

  const [matricule, setMatricule] = useState('');
  const [temporaryPassword, setTemporaryPassword] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);
    setFieldErrors({});

    if (!matricule.trim() || !temporaryPassword || !password || !passwordConfirmation) {
      setErrorMessage('Veuillez remplir tous les champs.');
      return;
    }

    if (password !== passwordConfirmation) {
      setErrorMessage('Les deux mots de passe ne correspondent pas.');
      return;
    }

    if (password.length < 8) {
      setErrorMessage('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }

    setIsSubmitting(true);

    try {
      await activate({
        matricule: matricule.trim(),
        temporary_password: temporaryPassword,
        password,
        password_confirmation: passwordConfirmation,
      });
      navigate('/', { replace: true });
    } catch (error) {
      const apiError = extractApiError(error);
      setErrorMessage(apiError.message);
      if (apiError.errors) setFieldErrors(apiError.errors);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8">
        <div className="text-center mb-6">
          {appInfo?.logo_url ? (
            <img src={appInfo.logo_url} alt="" className="w-14 h-14 mx-auto mb-3 object-contain" />
          ) : (
            <div className="w-14 h-14 rounded-2xl bg-[#1e3a5f] mx-auto flex items-center justify-center mb-3">
              <span className="text-white text-xl font-bold">{(appInfo?.hospital_short_name ?? 'H').charAt(0)}</span>
            </div>
          )}
          <h1 className="text-xl font-bold text-[#1e3a5f]">Activer mon compte</h1>
          <p className="text-xs text-gray-500 mt-2 leading-relaxed">
            Utilisez le matricule et le mot de passe temporaire communiqués par les Ressources
            Humaines, puis choisissez votre mot de passe définitif.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field
            label="Matricule"
            value={matricule}
            onChange={setMatricule}
            placeholder="Ex: 98240812A"
            error={fieldErrors.matricule?.[0]}
          />
          <Field
            label="Mot de passe temporaire"
            type="password"
            value={temporaryPassword}
            onChange={setTemporaryPassword}
            placeholder="Donné par les RH"
            error={fieldErrors.temporary_password?.[0]}
          />
          <Field
            label="Nouveau mot de passe"
            type="password"
            value={password}
            onChange={setPassword}
            placeholder="8 caractères minimum"
            error={fieldErrors.password?.[0]}
          />
          <Field
            label="Confirmer le mot de passe"
            type="password"
            value={passwordConfirmation}
            onChange={setPasswordConfirmation}
            placeholder="••••••••"
          />

          {errorMessage && <p className="text-sm text-red-600 text-center">{errorMessage}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#1e3a5f] text-white rounded-lg py-2.5 text-sm font-semibold hover:opacity-90 transition disabled:opacity-60"
          >
            {isSubmitting ? 'Activation...' : 'Activer mon compte'}
          </button>
        </form>

        <div className="text-center mt-5">
          <Link to="/login" className="text-sm font-medium text-[#1e3a5f] hover:underline">
            Déjà activé ? Se connecter
          </Link>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  error,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  error?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent"
      />
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}