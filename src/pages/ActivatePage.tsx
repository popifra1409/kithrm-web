import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAppInfo } from '../context/AppInfoContext';
import { startActivation, refreshActivationCaptcha } from '../api/auth';
import type { ActivationCaptcha } from '../api/auth';
import { extractApiError } from '../api/client';
import DateInput from '../components/DateInput';

type Step = 'credentials' | 'verification';

interface VerificationSession {
  token: string;
  captcha: ActivationCaptcha;
}

interface VerificationErrorBody {
  message?: string;
  captcha?: ActivationCaptcha;
  remaining_attempts?: number;
}

export default function ActivatePage() {
  const { completeActivation } = useAuth();
  const { appInfo } = useAppInfo();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>('credentials');
  const [session, setSession] = useState<VerificationSession | null>(null);

  // Étape 1
  const [matricule, setMatricule] = useState('');
  const [temporaryPassword, setTemporaryPassword] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');

  // Étape 2
  const [recruitmentDate, setRecruitmentDate] = useState('');
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  function backToCredentials(message: string | null) {
    setSession(null);
    setStep('credentials');
    setRecruitmentDate('');
    setCaptchaAnswer('');
    setRemainingAttempts(null);
    setErrorMessage(message);
  }

  async function handleStart(e: React.FormEvent) {
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
      const response = await startActivation({
        matricule: matricule.trim(),
        temporary_password: temporaryPassword,
        password,
        password_confirmation: passwordConfirmation,
      });

      setSession({ token: response.verification_token, captcha: response.captcha });
      setRecruitmentDate('');
      setCaptchaAnswer('');
      setRemainingAttempts(null);
      setStep('verification');
    } catch (error) {
      const apiError = extractApiError(error);
      setErrorMessage(apiError.message);
      if (apiError.errors) setFieldErrors(apiError.errors);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!session) return;

    setErrorMessage(null);

    if (!recruitmentDate) {
      setErrorMessage('Veuillez indiquer votre date de recrutement.');
      return;
    }

    if (captchaAnswer.trim() === '' || Number.isNaN(Number(captchaAnswer))) {
      setErrorMessage('Veuillez saisir le résultat du calcul.');
      return;
    }

    setIsSubmitting(true);

    try {
      await completeActivation({
        verification_token: session.token,
        recruitment_date: recruitmentDate,
        captcha_id: session.captcha.id,
        captcha_answer: Number(captchaAnswer),
      });
      navigate('/', { replace: true });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const body = error.response?.data as VerificationErrorBody | undefined;

        // Session expirée ou compte bloqué : il faut reprendre depuis le début.
        if (status === 410 || status === 429) {
          backToCredentials(body?.message ?? "La session d'activation a expiré. Veuillez recommencer.");
          return;
        }

        // Calcul ou date incorrects : un nouveau calcul est fourni, on reste ici.
        if (status === 422 && body?.captcha) {
          const nextCaptcha = body.captcha;
          setSession((current) => (current ? { ...current, captcha: nextCaptcha } : current));
          setCaptchaAnswer('');
          setRemainingAttempts(body.remaining_attempts ?? null);
          setErrorMessage(body.message ?? 'Vérification incorrecte.');
          return;
        }
      }

      setErrorMessage(extractApiError(error).message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRefreshCaptcha() {
    if (!session) return;

    setIsRefreshing(true);
    setErrorMessage(null);

    try {
      const captcha = await refreshActivationCaptcha(session.token);
      setSession({ ...session, captcha });
      setCaptchaAnswer('');
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 410) {
        backToCredentials(
          (error.response.data as VerificationErrorBody | undefined)?.message ??
          "La session d'activation a expiré. Veuillez recommencer."
        );
      } else {
        setErrorMessage(extractApiError(error).message);
      }
    } finally {
      setIsRefreshing(false);
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

          {step === 'credentials' ? (
            <>
              <h1 className="text-xl font-bold text-[#1e3a5f]">Activer mon compte</h1>
              <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                Utilisez le matricule et le mot de passe temporaire communiqués par les Ressources
                Humaines, puis choisissez votre mot de passe définitif.
              </p>
              <p className="text-[11px] font-semibold text-gray-400 mt-3 uppercase tracking-wide">Étape 1 sur 2</p>
            </>
          ) : (
            <>
              <h1 className="text-xl font-bold text-[#1e3a5f]">Vérification de sécurité</h1>
              <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                Dernière étape : confirmez votre date de recrutement et résolvez le petit calcul pour
                finaliser l'activation de votre compte.
              </p>
              <p className="text-[11px] font-semibold text-gray-400 mt-3 uppercase tracking-wide">Étape 2 sur 2</p>
            </>
          )}
        </div>

        {step === 'credentials' && (
          <form onSubmit={handleStart} className="space-y-4">
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
              {isSubmitting ? 'Vérification...' : 'Continuer'}
            </button>
          </form>
        )}

        {step === 'verification' && session && (
          <form onSubmit={handleVerify} className="space-y-4">
            <DateInput
              label="Date de recrutement"
              value={recruitmentDate}
              onChange={setRecruitmentDate}
              labelClassName="block text-sm font-medium text-gray-700 mb-1"
              inputClassName="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent"
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vérification anti-robot</label>
              <div className="flex items-center gap-3 rounded-lg bg-blue-50 border border-blue-100 px-3 py-2.5 mb-2">
                <span className="flex-1 text-center text-lg font-bold text-[#1e3a5f] tracking-wide select-none">
                  {session.captcha.question}
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
            {remainingAttempts !== null && (
              <p className="text-xs text-amber-700 text-center">
                Il vous reste {remainingAttempts} tentative{remainingAttempts > 1 ? 's' : ''} avant blocage temporaire.
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#1e3a5f] text-white rounded-lg py-2.5 text-sm font-semibold hover:opacity-90 transition disabled:opacity-60"
            >
              {isSubmitting ? 'Activation...' : 'Confirmer et activer mon compte'}
            </button>

            <button
              type="button"
              onClick={() => backToCredentials(null)}
              disabled={isSubmitting}
              className="w-full text-sm font-medium text-gray-500 hover:underline"
            >
              ← Retour
            </button>
          </form>
        )}

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