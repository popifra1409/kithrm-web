import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppInfo } from '../context/AppInfoContext';
import { extractApiError } from '../api/client';
import {
  fetchForgotPasswordCaptcha,
  requestPasswordReset,
  type ActivationCaptcha,
} from '../api/auth';

type Step = 'matricule' | 'verify' | 'requested';

export default function ForgotPasswordPage() {
  const { appInfo } = useAppInfo();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>('matricule');
  const [matricule, setMatricule] = useState('');
  const [captcha, setCaptcha] = useState<ActivationCaptcha | null>(null);
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  /** La démarche à suivre n'est pas la même si le compte n'a jamais été activé. */
  const [neverActivated, setNeverActivated] = useState(false);
  const [reference, setReference] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);

  async function handleLoadCaptcha(e: React.FormEvent) {
    e.preventDefault();

    if (!matricule.trim()) {
      setErrorMessage('Saisissez votre matricule.');
      return;
    }

    setErrorMessage(null);
    setNeverActivated(false);
    setIsSubmitting(true);

    try {
      setCaptcha(await fetchForgotPasswordCaptcha(matricule.trim()));
      setStep('verify');
    } catch (error) {
      setErrorMessage(extractApiError(error).message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRefreshCaptcha() {
    setIsRefreshing(true);
    try {
      setCaptcha(await fetchForgotPasswordCaptcha(matricule.trim()));
      setCaptchaAnswer('');
    } catch (error) {
      setErrorMessage(extractApiError(error).message);
    } finally {
      setIsRefreshing(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!captcha) return;

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const review = await requestPasswordReset({
        matricule: matricule.trim(),
        captcha_id: captcha.id,
        captcha_answer: Number(captchaAnswer),
      });
      setReference(review.reference);
      setExpiresAt(review.expires_at);
      setStep('requested');
    } catch (error) {
      const apiError = extractApiError(error);
      setErrorMessage(apiError.message);
      setNeverActivated(apiError.status === 409);

      // Un calcul est à usage unique : la réponse d'échec en fournit un nouveau.
      const fresh = apiError.data?.captcha as ActivationCaptcha | undefined;
      if (fresh) {
        setCaptcha(fresh);
        setCaptchaAnswer('');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  const validityLabel = expiresAt
    ? new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(expiresAt))
    : null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8">
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
          <h1 className="text-2xl font-bold text-[#1e3a5f]">Mot de passe oublié</h1>
          <p className="text-sm text-gray-500 mt-1">
            Aucun mot de passe n'est envoyé automatiquement : le Service RH vous en remet un après avoir vérifié votre
            identité.
          </p>
        </div>

        {step === 'matricule' && (
          <form onSubmit={handleLoadCaptcha} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Matricule</label>
              <input
                type="text"
                value={matricule}
                onChange={(e) => {
                  setMatricule(e.target.value);
                  setErrorMessage(null);
                  setNeverActivated(false);
                }}
                onBlur={() => setMatricule((v) => v.trim())}
                placeholder="Ex: 98240812A"
                autoCapitalize="characters"
                autoComplete="username"
                autoFocus
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">Celui inscrit sur votre contrat, à conserver pour le Service RH.</p>
            </div>

            {errorMessage && <p className="text-sm text-red-600 text-center">{errorMessage}</p>}
            {neverActivated && (
              <p className="text-xs text-amber-700 text-center">
                Ce compte n&apos;a jamais été ouvert&nbsp;: la démarche est l&apos;activation, pas la réinitialisation.
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#1e3a5f] text-white rounded-lg py-2.5 text-sm font-semibold hover:opacity-90 transition disabled:opacity-60"
            >
              {isSubmitting ? 'Préparation...' : 'Continuer'}
            </button>
          </form>
        )}

        {step === 'verify' && captcha && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-sm text-gray-700">
              Demande de réinitialisation pour <strong>{matricule.trim()}</strong>. Résolvez le calcul pour
              enregistrer la demande.
            </p>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vérification anti-robot</label>
              <div className="flex items-center gap-3 rounded-lg bg-blue-50 border border-blue-100 px-3 py-2.5 mb-2">
                <span className="flex-1 text-center text-lg font-bold text-[#1e3a5f] tracking-wide select-none">
                  {captcha.question}
                </span>
                <button
                  type="button"
                  onClick={handleRefreshCaptcha}
                  disabled={isRefreshing || isSubmitting}
                  className="text-xs font-semibold text-[#1e3a5f] hover:underline disabled:opacity-50"
                  title="Obtenir un autre calcul"
                >
                  {isRefreshing ? '…' : '↻ Changer'}
                </button>
              </div>
              <input
                type="text"
                inputMode="numeric"
                value={captchaAnswer}
                onChange={(e) => setCaptchaAnswer(e.target.value)}
                placeholder="Votre réponse"
                autoComplete="off"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent"
              />
            </div>

            {errorMessage && <p className="text-sm text-red-600 text-center">{errorMessage}</p>}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#1e3a5f] text-white rounded-lg py-2.5 text-sm font-semibold hover:opacity-90 transition disabled:opacity-60"
            >
              {isSubmitting ? 'Envoi en cours...' : 'Demander la réinitialisation'}
            </button>

            <button
              type="button"
              onClick={() => {
                setStep('matricule');
                setCaptcha(null);
                setCaptchaAnswer('');
                setErrorMessage(null);
              }}
              disabled={isSubmitting}
              className="w-full text-sm font-medium text-gray-500 hover:underline"
            >
              ← Retour
            </button>
          </form>
        )}

        {step === 'requested' && (
          <div className="space-y-4">
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-center">
              <p className="text-xs uppercase tracking-wide text-gray-500">Votre référence</p>
              <p className="text-2xl font-bold text-[#1e3a5f] mt-1 select-all">{reference}</p>
              {validityLabel && (
                <p className="text-xs text-gray-500 mt-2">Valable jusqu&apos;au {validityLabel}.</p>
              )}
            </div>

            <ol className="text-sm text-gray-700 space-y-2 list-decimal pl-5">
              <li>Notez ou gardez cette page ouverte.</li>
              <li>
                Présentez-vous au Service RH avec cette référence et votre matricule{' '}
                <strong>{matricule.trim()}</strong>.
              </li>
              <li>Après vérification de votre identité, un agent génère un mot de passe temporaire et vous le remet.</li>
              <li>
                Connectez-vous avec ce mot de passe temporaire, puis changez-le depuis votre espace.
              </li>
            </ol>

            <p className="text-xs text-gray-500">
              Passé le délai, la demande expire et le mot de passe temporaire n&apos;est plus émis&nbsp;: il suffit de
              relancer la démarche.
            </p>

            <button
              type="button"
              onClick={() => navigate('/login')}
              className="w-full bg-[#1e3a5f] text-white rounded-lg py-2.5 text-sm font-semibold hover:opacity-90 transition"
            >
              Aller à la connexion
            </button>
          </div>
        )}

        <div className="text-center mt-5 space-y-2">
          <p className="text-sm font-medium text-[#1e3a5f]">
            <Link to="/login" className="hover:underline">Retour à la connexion</Link>
          </p>
          {step !== 'requested' && (
            <p className="text-xs text-gray-500">
              Compte jamais ouvert&nbsp;?{' '}
              <Link to="/activate" className="font-medium text-[#1e3a5f] hover:underline">
                Activer mon compte
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
