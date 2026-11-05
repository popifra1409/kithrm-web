import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAppInfo } from '../context/AppInfoContext';
import { useLang } from '../context/LangContext';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { extractApiError } from '../api/client';
import {
  LOGIN_HELP_AFTER_ATTEMPTS,
  LOGIN_LOCK_MINUTES,
  MAX_LOGIN_ATTEMPTS,
  readLoginDenial,
  type LoginDenial,
} from '../api/auth';

export default function LoginPage() {
  const { login } = useAuth();
  const { appInfo } = useAppInfo();
  const { tr } = useLang();
  const navigate = useNavigate();

  const [matricule, setMatricule] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  // 'missing' désigne l'avis produit par cet écran : stocké en clé, il suit la langue
  // choisie après son affichage. Un message du serveur reste une phrase toute faite.
  const [errorMessage, setErrorMessage] = useState<'missing' | string | null>(null);
  // Le compteur d'échecs vit côté serveur : cet écran ne fait que restituer ce que
  // la réponse d'authentification vient d'indiquer.
  const [denial, setDenial] = useState<LoginDenial | null>(null);
  const [helpDismissed, setHelpDismissed] = useState(false);

  const attemptsUsed = denial ? MAX_LOGIN_ATTEMPTS - denial.attemptsLeft : 0;
  const isLocked = denial?.reason === 'locked';
  const needsActivation = denial?.reason === 'not_activated';
  const showHelp =
    denial !== null && (isLocked || needsActivation || attemptsUsed >= LOGIN_HELP_AFTER_ATTEMPTS) && !helpDismissed;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!matricule.trim() || !password) {
      setErrorMessage('missing');
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      await login({ matricule: matricule.trim(), password });
      navigate('/', { replace: true });
    } catch (error) {
      const apiError = extractApiError(error);
      setErrorMessage(apiError.message);
      const serverDenial = readLoginDenial(apiError.data);
      setDenial(serverDenial);
      // Le blocage doit être vu : on ne laisse pas l'employé cliquer sur un compte en pause.
      if (serverDenial?.reason === 'locked') setHelpDismissed(false);
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleMatriculeChange(value: string) {
    setMatricule(value);
    // L'échec affiché et l'aide proposée concernent le matricule précédent.
    setErrorMessage(null);
    setDenial(null);
    setHelpDismissed(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8">
        <div className="flex justify-end mb-2">
          <LanguageSwitcher />
        </div>
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
          <h1 className="text-2xl font-bold text-[#1e3a5f]">{tr.login.title}</h1>
          <p className="text-sm text-gray-500 mt-1">{tr.login.subtitle}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{tr.login.matriculeLabel}</label>
            <input
              type="text"
              value={matricule}
              onChange={(e) => handleMatriculeChange(e.target.value)}
              onBlur={() => setMatricule((v) => v.trim())}
              placeholder={tr.login.matriculePlaceholder}
              autoCapitalize="characters"
              autoComplete="username"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{tr.login.passwordLabel}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent"
            />
          </div>

          {errorMessage && (
            <p className="text-sm text-red-600 text-center">
              {errorMessage === 'missing' ? tr.login.missingFields : errorMessage}
            </p>
          )}

          {isLocked && denial?.retryAfterMinutes != null && (
            <p className="text-sm font-semibold text-amber-700 text-center">
              {tr.login.lockedRetry(denial.retryAfterMinutes)}
            </p>
          )}

          {!showHelp && !isLocked && attemptsUsed > 0 && (
            <p className="text-xs text-gray-500 text-center leading-relaxed">
              {attemptsUsed >= LOGIN_HELP_AFTER_ATTEMPTS
                ? tr.login.attemptsWithoutHelp(attemptsUsed, MAX_LOGIN_ATTEMPTS, LOGIN_LOCK_MINUTES)
                : tr.login.attemptsWithHelp(
                    attemptsUsed,
                    MAX_LOGIN_ATTEMPTS,
                    LOGIN_HELP_AFTER_ATTEMPTS,
                    LOGIN_LOCK_MINUTES,
                  )}
            </p>
          )}

          {helpDismissed && !isLocked && attemptsUsed >= LOGIN_HELP_AFTER_ATTEMPTS && (
            <button
              type="button"
              onClick={() => setHelpDismissed(false)}
              className="w-full text-center text-xs font-semibold text-[#1e3a5f] hover:underline"
            >
              {tr.login.showHelp}
            </button>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#1e3a5f] text-white rounded-lg py-2.5 text-sm font-semibold hover:opacity-90 transition disabled:opacity-60"
          >
            {isSubmitting ? tr.login.submitting : tr.login.submit}
          </button>
        </form>

        {/* Entrée permanente vers l'activation : un employé qui n'a jamais ouvert son
            compte ne doit pas être obligé d'échouer une connexion pour découvrir le lien,
            alors que chaque échec lui retire une des cinq tentatives. Le bloc d'aide le
            propose déjà, on ne l'affiche donc pas deux fois. */}
        {!showHelp && (
          <div className="text-center mt-5">
            <Link to="/activate" className="text-sm font-medium text-[#1e3a5f] hover:underline">
              {tr.login.firstConnectionLink}
            </Link>
          </div>
        )}

        {showHelp && (
          <div className="mt-5 rounded-lg border border-[#1e3a5f]/25 bg-[#1e3a5f]/5 p-4">
            <p className="text-sm font-semibold text-[#1e3a5f]">{tr.login.helpTitle}</p>
            <p className="text-xs text-gray-600 mt-1 leading-relaxed">
              {needsActivation
                ? tr.login.helpNeedsActivation
                : isLocked
                  ? tr.login.helpLocked
                  : tr.login.helpChoices}
            </p>

            <div className="mt-3 space-y-2">
              <Link
                to="/activate"
                className="flex items-center justify-between rounded-lg border border-[#1e3a5f] bg-white px-4 py-2.5 text-sm font-semibold text-[#1e3a5f] hover:bg-[#1e3a5f] hover:text-white transition"
              >
                <span>{tr.login.activateLink}</span>
                <span className="text-xs font-normal opacity-70">{tr.login.activateTag}</span>
              </Link>
              <Link
                to="/forgot-password"
                className="flex items-center justify-between rounded-lg border border-[#1e3a5f] bg-white px-4 py-2.5 text-sm font-semibold text-[#1e3a5f] hover:bg-[#1e3a5f] hover:text-white transition"
              >
                <span>{tr.login.forgotLink}</span>
                <span className="text-xs font-normal opacity-70">{tr.login.forgotTag}</span>
              </Link>
              {!isLocked && (
                <button
                  type="button"
                  onClick={() => setHelpDismissed(true)}
                  className="w-full rounded-lg px-4 py-2 text-sm text-gray-600 hover:text-[#1e3a5f] underline underline-offset-2"
                >
                  {tr.login.keepTrying(denial?.attemptsLeft ?? MAX_LOGIN_ATTEMPTS)}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
