import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppInfo } from '../context/AppInfoContext';
import { useLang } from '../context/LangContext';
import { extractApiError } from '../api/client';
import { fileUrl } from '../lib/fileUrl';
import LanguageSwitcher from '../components/LanguageSwitcher';
import {
  fetchForgotPasswordCaptcha,
  requestPasswordReset,
  type ActivationCaptcha,
} from '../api/auth';

type Step = 'matricule' | 'verify' | 'requested';

/** Refus produit ici, avant l'envoi : stocké par clé pour suivre la langue affichée. */
type ClientIssue = 'matriculeRequired';

export default function ForgotPasswordPage() {
  const { appInfo } = useAppInfo();
  const { tr } = useLang();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>('matricule');
  const [matricule, setMatricule] = useState('');
  const [captcha, setCaptcha] = useState<ActivationCaptcha | null>(null);
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<ClientIssue | string | null>(null);
  /** La démarche à suivre n'est pas la même si le compte n'a jamais été activé. */
  const [neverActivated, setNeverActivated] = useState(false);
  const [reference, setReference] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);

  const errorCopy = (message: ClientIssue | string) =>
    message === 'matriculeRequired' ? tr.forgot.errors.matriculeRequired : message;

  async function handleLoadCaptcha(e: React.FormEvent) {
    e.preventDefault();

    if (!matricule.trim()) {
      setErrorMessage('matriculeRequired');
      return;
    }

    setErrorMessage(null);
    setNeverActivated(false);
    setIsSubmitting(true);

    try {
      setCaptcha(await fetchForgotPasswordCaptcha(matricule.trim()));
      setStep('verify');
    } catch (error) {
      setErrorMessage(extractApiError(error, tr.api).message);
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
      setErrorMessage(extractApiError(error, tr.api).message);
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
      const apiError = extractApiError(error, tr.api);
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
    ? new Intl.DateTimeFormat(tr.date.locale, { day: '2-digit', month: 'long', year: 'numeric' }).format(
        new Date(expiresAt)
      )
    : null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-sm bg-surface rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8">
        <div className="flex justify-end mb-2">
          <LanguageSwitcher />
        </div>

        <div className="text-center mb-6">
          {appInfo?.logo_url ? (
            <img src={fileUrl(appInfo.logo_url) ?? undefined} alt="" className="w-16 h-16 mx-auto mb-3 object-contain" />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-primary mx-auto flex items-center justify-center mb-3">
              <span className="text-white text-2xl font-bold">{(appInfo?.hospital_short_name ?? 'H').charAt(0)}</span>
            </div>
          )}
          {appInfo?.hospital_name && (
            <p className="text-xs font-semibold text-gray-600 mb-2">{appInfo.hospital_name}</p>
          )}
          <h1 className="text-2xl font-bold text-accent">{tr.forgot.title}</h1>
          <p className="text-sm text-gray-500 mt-1">{tr.forgot.intro}</p>
        </div>

        {step === 'matricule' && (
          <form onSubmit={handleLoadCaptcha} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{tr.common.matriculeLabel}</label>
              <input
                type="text"
                value={matricule}
                onChange={(e) => {
                  setMatricule(e.target.value);
                  setErrorMessage(null);
                  setNeverActivated(false);
                }}
                onBlur={() => setMatricule((v) => v.trim())}
                placeholder={tr.common.matriculePlaceholder}
                autoCapitalize="characters"
                autoComplete="username"
                autoFocus
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">{tr.forgot.matriculeHint}</p>
            </div>

            {errorMessage && <p className="text-sm text-red-600 text-center">{errorCopy(errorMessage)}</p>}
            {neverActivated && <p className="text-xs text-amber-700 text-center">{tr.forgot.neverActivated}</p>}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary text-white rounded-lg py-2.5 text-sm font-semibold hover:opacity-90 transition disabled:opacity-60"
            >
              {isSubmitting ? tr.forgot.preparing : tr.forgot.continue}
            </button>
          </form>
        )}

        {step === 'verify' && captcha && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-sm text-gray-700">
              {tr.forgot.verifyIntroStart} <strong>{matricule.trim()}</strong>
              {tr.forgot.verifyIntroEnd}
            </p>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{tr.common.captchaLabel}</label>
              <div className="flex items-center gap-3 rounded-lg bg-blue-50 border border-blue-100 px-3 py-2.5 mb-2">
                <span className="flex-1 text-center text-lg font-bold text-accent tracking-wide select-none">
                  {captcha.question}
                </span>
                <button
                  type="button"
                  onClick={handleRefreshCaptcha}
                  disabled={isRefreshing || isSubmitting}
                  className="text-xs font-semibold text-accent hover:underline disabled:opacity-50"
                  title={tr.common.captchaRefreshTitle}
                >
                  {isRefreshing ? '…' : tr.common.captchaRefresh}
                </button>
              </div>
              <input
                type="text"
                inputMode="numeric"
                value={captchaAnswer}
                onChange={(e) => setCaptchaAnswer(e.target.value)}
                placeholder={tr.common.answerPlaceholder}
                autoComplete="off"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            {errorMessage && <p className="text-sm text-red-600 text-center">{errorCopy(errorMessage)}</p>}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary text-white rounded-lg py-2.5 text-sm font-semibold hover:opacity-90 transition disabled:opacity-60"
            >
              {isSubmitting ? tr.common.submitting : tr.forgot.submit}
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
              {tr.common.back}
            </button>
          </form>
        )}

        {step === 'requested' && (
          <div className="space-y-4">
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-center">
              <p className="text-xs uppercase tracking-wide text-gray-500">{tr.common.referenceLabel}</p>
              <p className="text-2xl font-bold text-accent mt-1 select-all">{reference}</p>
              {validityLabel && <p className="text-xs text-gray-500 mt-2">{tr.forgot.validUntil(validityLabel)}</p>}
            </div>

            <ol className="text-sm text-gray-700 space-y-2 list-decimal pl-5">
              <li>{tr.forgot.steps.note}</li>
              <li>
                {tr.forgot.steps.present} <strong>{matricule.trim()}</strong>.
              </li>
              <li>{tr.forgot.steps.identity}</li>
              <li>{tr.forgot.steps.connect}</li>
            </ol>

            <p className="text-xs text-gray-500">{tr.forgot.expiryNote}</p>

            <button
              type="button"
              onClick={() => navigate('/login')}
              className="w-full bg-primary text-white rounded-lg py-2.5 text-sm font-semibold hover:opacity-90 transition"
            >
              {tr.forgot.goToLogin}
            </button>
          </div>
        )}

        <div className="text-center mt-5 space-y-2">
          <p className="text-sm font-medium text-accent">
            <Link to="/login" className="hover:underline">{tr.forgot.backToLogin}</Link>
          </p>
          {step !== 'requested' && (
            <p className="text-xs text-gray-500">
              {tr.forgot.neverOpened}{' '}
              <Link to="/activate" className="font-medium text-accent hover:underline">
                {tr.forgot.activateLink}
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
