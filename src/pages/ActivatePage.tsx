import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAppInfo } from '../context/AppInfoContext';
import { startActivation, refreshActivationCaptcha, requestActivationReview } from '../api/auth';
import type { ActivationCaptcha } from '../api/auth';
import { extractApiError } from '../api/client';
import DateInput from '../components/DateInput';

type Step = 'credentials' | 'verification' | 'review_requested';

/** L'employé qui ne connaît que son année d'entrée saisit une année, pas une date. */
type DateMode = 'full' | 'year';

interface VerificationSession {
  token: string;
  captcha: ActivationCaptcha;
}

interface VerificationErrorBody {
  message?: string;
  captcha?: ActivationCaptcha;
  remaining_attempts?: number;
}

const EARLIEST_YEAR = 1980;

function yearOptions(): number[] {
  const last = new Date().getFullYear();
  return Array.from({ length: last - EARLIEST_YEAR + 1 }, (_, i) => last - i);
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
  const [dateMode, setDateMode] = useState<DateMode>('full');
  const [recruitmentDate, setRecruitmentDate] = useState('');
  const [declaredYear, setDeclaredYear] = useState('');
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);

  // Secours RH
  const [reviewReference, setReviewReference] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  /** Date réellement envoyée : en mode année, le jour et le mois n'ont pas d'effet. */
  function declaredDate(): string {
    if (dateMode === 'year') return declaredYear ? `${declaredYear}-01-01` : '';
    return recruitmentDate;
  }

  function resetVerificationFields() {
    setRecruitmentDate('');
    setDeclaredYear('');
    setDateMode('full');
    setCaptchaAnswer('');
    setRemainingAttempts(null);
  }

  function backToCredentials(message: string | null) {
    setSession(null);
    setStep('credentials');
    resetVerificationFields();
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
      resetVerificationFields();
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

    if (dateMode === 'year' ? !declaredYear : !recruitmentDate) {
      setErrorMessage(
        dateMode === 'year'
          ? 'Veuillez indiquer votre année de recrutement.'
          : 'Veuillez indiquer votre date de recrutement.'
      );
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
        recruitment_date: declaredDate(),
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

  /**
   * Secours : l'employé ne retrouve pas sa date. On enregistre une demande que le
   * Service RH validera après vérification d'identité ; le calcul doit être
   * résolu pour éviter d'engorger la file d'attente.
   */
  async function handleRequestReview() {
    if (!session) return;

    setErrorMessage(null);

    if (captchaAnswer.trim() === '' || Number.isNaN(Number(captchaAnswer))) {
      setErrorMessage('Résolvez d\'abord le petit calcul, puis envoyez votre demande aux RH.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await requestActivationReview({
        verification_token: session.token,
        captcha_id: session.captcha.id,
        captcha_answer: Number(captchaAnswer),
        self_declared_date: declaredDate() || undefined,
      });

      setReviewReference(response.reference);
      setStep('review_requested');
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const body = error.response?.data as VerificationErrorBody | undefined;

        if (status === 410 || status === 409) {
          backToCredentials(body?.message ?? null);
          return;
        }

        // Calcul incorrect : un nouveau calcul est fourni, on reste sur l'étape 2.
        if (status === 422 && body?.captcha) {
          setSession((current) => (current ? { ...current, captcha: body.captcha as ActivationCaptcha } : current));
          setCaptchaAnswer('');
          setErrorMessage(body.message ?? 'Le résultat du calcul est incorrect.');
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

          {step === 'credentials' && (
            <>
              <h1 className="text-xl font-bold text-[#1e3a5f]">Activer mon compte</h1>
              <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                Utilisez le matricule et le mot de passe temporaire communiqués par les Ressources
                Humaines, puis choisissez votre mot de passe définitif.
              </p>
              <p className="text-[11px] font-semibold text-gray-400 mt-3 uppercase tracking-wide">Étape 1 sur 2</p>
            </>
          )}

          {step === 'verification' && (
            <>
              <h1 className="text-xl font-bold text-[#1e3a5f]">Vérification de sécurité</h1>
              <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                Dernière étape : confirmez votre année d&apos;entrée et résolvez le petit calcul pour
                finaliser l&apos;activation de votre compte.
              </p>
              <p className="text-[11px] font-semibold text-gray-400 mt-3 uppercase tracking-wide">Étape 2 sur 2</p>
            </>
          )}

          {step === 'review_requested' && (
            <>
              <h1 className="text-xl font-bold text-[#1e3a5f]">Demande transmise aux RH</h1>
              <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                Votre compte n&apos;est pas encore ouvert. Un agent des Ressources Humaines doit
                vérifier votre identité.
              </p>
            </>
          )}
        </div>

        {step === 'credentials' && (
          <form onSubmit={handleStart} className="space-y-4">
            <Field
              label="Matricule"
              value={matricule}
              onChange={setMatricule}
              onBlur={() => setMatricule((v) => v.trim())}
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
            <div className="grid grid-cols-2 gap-2">
              <ModeButton active={dateMode === 'full'} onClick={() => setDateMode('full')}>
                Date exacte
              </ModeButton>
              <ModeButton active={dateMode === 'year'} onClick={() => setDateMode('year')}>
                Année seulement
              </ModeButton>
            </div>

            {dateMode === 'full' ? (
              <DateInput
                label="Date de recrutement"
                value={recruitmentDate}
                onChange={setRecruitmentDate}
                labelClassName="block text-sm font-medium text-gray-700 mb-1"
                inputClassName="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent"
              />
            ) : (
              <div>
                <label htmlFor="declared-year" className="block text-sm font-medium text-gray-700 mb-1">
                  Année de recrutement
                </label>
                <select
                  id="declared-year"
                  value={declaredYear}
                  onChange={(e) => setDeclaredYear(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent"
                >
                  <option value="">Choisissez une année</option>
                  {yearOptions().map((year) => (
                    <option key={year} value={String(year)}>
                      {year}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">L&apos;année suffit : le jour et le mois ne sont pas vérifiés.</p>
              </div>
            )}

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

            <div className="border-t border-gray-100 pt-4">
              <p className="text-xs text-gray-500 text-center mb-2">
                Impossible de vous rappeler&nbsp;? Le Service RH peut vérifier votre
                identité sur place et ouvrir votre compte.
              </p>
              <button
                type="button"
                onClick={handleRequestReview}
                disabled={isSubmitting}
                className="w-full rounded-lg border border-[#1e3a5f] text-[#1e3a5f] py-2.5 text-sm font-semibold hover:bg-blue-50 transition disabled:opacity-60"
              >
                {isSubmitting ? 'Envoi en cours...' : "Demander la vérification aux RH"}
              </button>
            </div>
          </form>
        )}

        {step === 'review_requested' && (
          <div className="space-y-4">
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-center">
              <p className="text-xs uppercase tracking-wide text-gray-500">Votre référence</p>
              <p className="text-2xl font-bold text-[#1e3a5f] mt-1 select-all">{reviewReference}</p>
            </div>

            <ol className="text-sm text-gray-700 space-y-2 list-decimal pl-5">
              <li>Notez ou gardez cette page ouverte.</li>
              <li>
                Présentez-vous aux Ressources Humaines avec cette référence et votre matricule
                {' '}
                <strong>{matricule.trim()}</strong>.
              </li>
              <li>Dès leur validation, votre compte s&apos;ouvre avec le mot de passe que vous avez choisi.</li>
            </ol>

            <button
              type="button"
              onClick={() => navigate('/login')}
              className="w-full bg-[#1e3a5f] text-white rounded-lg py-2.5 text-sm font-semibold hover:opacity-90 transition"
            >
              Aller à la connexion
            </button>
          </div>
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

function ModeButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${
        active
          ? 'border-[#1e3a5f] bg-[#1e3a5f] text-white'
          : 'border-gray-300 bg-white text-gray-600 hover:border-[#1e3a5f] hover:text-[#1e3a5f]'
      }`}
    >
      {children}
    </button>
  );
}

function Field({
  label,
  value,
  onChange,
  onBlur,
  placeholder,
  type = 'text',
  error,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
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
        onBlur={onBlur}
        placeholder={placeholder}
        className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent"
      />
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}