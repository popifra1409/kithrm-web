import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAppInfo } from '../context/AppInfoContext';
import { useLang } from '../context/LangContext';
import { startActivation, refreshActivationCaptcha, requestActivationReview } from '../api/auth';
import type { ActivationCaptcha } from '../api/auth';
import { extractApiError } from '../api/client';
import { fileUrl } from '../lib/fileUrl';
import LanguageSwitcher from '../components/LanguageSwitcher';
import DateInput from '../components/DateInput';

type Step = 'credentials' | 'verification' | 'review_requested';

/** L'employé qui ne connaît que son année d'entrée saisit une année, pas une date. */
type DateMode = 'full' | 'year';

/** Refus produits ici : stockés par clé pour qu'un changement de langue les traduise aussitôt. */
type ClientIssue =
  | 'all_fields'
  | 'password_mismatch'
  | 'password_short'
  | 'year_required'
  | 'date_required'
  | 'calculation_required'
  | 'session_expired'
  | 'verification_incorrect'
  | 'review_calculation_first'
  | 'calculation_incorrect';

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
  const { tr } = useLang();
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
  const [errorMessage, setErrorMessage] = useState<ClientIssue | string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  // Une clé connue est traduite, un message du serveur est affiché tel quel.
  const errorCopy = (message: ClientIssue | string) => tr.activate.errors[message as ClientIssue] ?? message;

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

  function backToCredentials(message: ClientIssue | string | null) {
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
      setErrorMessage('all_fields');
      return;
    }

    if (password !== passwordConfirmation) {
      setErrorMessage('password_mismatch');
      return;
    }

    if (password.length < 8) {
      setErrorMessage('password_short');
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
      const apiError = extractApiError(error, tr.api);
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
      setErrorMessage(dateMode === 'year' ? 'year_required' : 'date_required');
      return;
    }

    if (captchaAnswer.trim() === '' || Number.isNaN(Number(captchaAnswer))) {
      setErrorMessage('calculation_required');
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
          backToCredentials(body?.message ?? 'session_expired');
          return;
        }

        // Calcul ou date incorrects : un nouveau calcul est fourni, on reste ici.
        if (status === 422 && body?.captcha) {
          const nextCaptcha = body.captcha;
          setSession((current) => (current ? { ...current, captcha: nextCaptcha } : current));
          setCaptchaAnswer('');
          setRemainingAttempts(body.remaining_attempts ?? null);
          setErrorMessage(body.message ?? 'verification_incorrect');
          return;
        }
      }

      setErrorMessage(extractApiError(error, tr.api).message);
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
      setErrorMessage('review_calculation_first');
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
          setErrorMessage(body.message ?? 'calculation_incorrect');
          return;
        }
      }

      setErrorMessage(extractApiError(error, tr.api).message);
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
          (error.response.data as VerificationErrorBody | undefined)?.message ?? 'session_expired'
        );
      } else {
        setErrorMessage(extractApiError(error, tr.api).message);
      }
    } finally {
      setIsRefreshing(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-sm bg-surface rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8">
        <div className="flex justify-end mb-2">
          <LanguageSwitcher />
        </div>

        <div className="text-center mb-6">
          {appInfo?.logo_url ? (
            <img src={fileUrl(appInfo.logo_url) ?? undefined} alt="" className="w-14 h-14 mx-auto mb-3 object-contain" />
          ) : (
            <div className="w-14 h-14 rounded-2xl bg-primary mx-auto flex items-center justify-center mb-3">
              <span className="text-white text-xl font-bold">{(appInfo?.hospital_short_name ?? 'H').charAt(0)}</span>
            </div>
          )}

          {step === 'credentials' && (
            <>
              <h1 className="text-xl font-bold text-accent">{tr.activate.title}</h1>
              <p className="text-xs text-gray-500 mt-2 leading-relaxed">{tr.activate.intro}</p>
              <p className="text-[11px] font-semibold text-gray-400 mt-3 uppercase tracking-wide">
                {tr.activate.stepOf(1, 2)}
              </p>
            </>
          )}

          {step === 'verification' && (
            <>
              <h1 className="text-xl font-bold text-accent">{tr.activate.verificationTitle}</h1>
              <p className="text-xs text-gray-500 mt-2 leading-relaxed">{tr.activate.verificationIntro}</p>
              <p className="text-[11px] font-semibold text-gray-400 mt-3 uppercase tracking-wide">
                {tr.activate.stepOf(2, 2)}
              </p>
            </>
          )}

          {step === 'review_requested' && (
            <>
              <h1 className="text-xl font-bold text-accent">{tr.activate.reviewTitle}</h1>
              <p className="text-xs text-gray-500 mt-2 leading-relaxed">{tr.activate.reviewIntro}</p>
            </>
          )}
        </div>

        {step === 'credentials' && (
          <form onSubmit={handleStart} className="space-y-4">
            <Field
              label={tr.common.matriculeLabel}
              value={matricule}
              onChange={setMatricule}
              onBlur={() => setMatricule((v) => v.trim())}
              placeholder={tr.common.matriculePlaceholder}
              error={fieldErrors.matricule?.[0]}
            />
            <Field
              label={tr.activate.temporaryPassword}
              type="password"
              value={temporaryPassword}
              onChange={setTemporaryPassword}
              placeholder={tr.activate.temporaryPasswordPlaceholder}
              error={fieldErrors.temporary_password?.[0]}
            />
            <Field
              label={tr.activate.newPassword}
              type="password"
              value={password}
              onChange={setPassword}
              placeholder={tr.activate.newPasswordPlaceholder}
              error={fieldErrors.password?.[0]}
            />
            <Field
              label={tr.activate.confirmPassword}
              type="password"
              value={passwordConfirmation}
              onChange={setPasswordConfirmation}
              placeholder="••••••••"
            />

            {errorMessage && <p className="text-sm text-red-600 text-center">{errorCopy(errorMessage)}</p>}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary text-white rounded-lg py-2.5 text-sm font-semibold hover:opacity-90 transition disabled:opacity-60"
            >
              {isSubmitting ? tr.activate.checking : tr.activate.continue}
            </button>
          </form>
        )}

        {step === 'verification' && session && (
          <form onSubmit={handleVerify} className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <ModeButton active={dateMode === 'full'} onClick={() => setDateMode('full')}>
                {tr.activate.modeExactDate}
              </ModeButton>
              <ModeButton active={dateMode === 'year'} onClick={() => setDateMode('year')}>
                {tr.activate.modeYearOnly}
              </ModeButton>
            </div>

            {dateMode === 'full' ? (
              <DateInput
                label={tr.activate.recruitmentDate}
                value={recruitmentDate}
                onChange={setRecruitmentDate}
                labelClassName="block text-sm font-medium text-gray-700 mb-1"
                inputClassName="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            ) : (
              <div>
                <label htmlFor="declared-year" className="block text-sm font-medium text-gray-700 mb-1">
                  {tr.activate.recruitmentYear}
                </label>
                <select
                  id="declared-year"
                  value={declaredYear}
                  onChange={(e) => setDeclaredYear(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="">{tr.activate.chooseYear}</option>
                  {yearOptions().map((year) => (
                    <option key={year} value={String(year)}>
                      {year}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">{tr.activate.yearIsEnough}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{tr.common.captchaLabel}</label>
              <div className="flex items-center gap-3 rounded-lg bg-blue-50 border border-blue-100 px-3 py-2.5 mb-2">
                <span className="flex-1 text-center text-lg font-bold text-accent tracking-wide select-none">
                  {session.captcha.question}
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
            {remainingAttempts !== null && (
              <p className="text-xs text-amber-700 text-center">{tr.activate.remainingAttempts(remainingAttempts)}</p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary text-white rounded-lg py-2.5 text-sm font-semibold hover:opacity-90 transition disabled:opacity-60"
            >
              {isSubmitting ? tr.activate.activating : tr.activate.confirm}
            </button>

            <button
              type="button"
              onClick={() => backToCredentials(null)}
              disabled={isSubmitting}
              className="w-full text-sm font-medium text-gray-500 hover:underline"
            >
              {tr.common.back}
            </button>

            <div className="border-t border-gray-100 pt-4">
              <p className="text-xs text-gray-500 text-center mb-2">{tr.activate.reviewHelp}</p>
              <button
                type="button"
                onClick={handleRequestReview}
                disabled={isSubmitting}
                className="w-full rounded-lg border border-accent text-accent py-2.5 text-sm font-semibold hover:bg-blue-50 transition disabled:opacity-60"
              >
                {isSubmitting ? tr.common.submitting : tr.activate.requestReview}
              </button>
            </div>
          </form>
        )}

        {step === 'review_requested' && (
          <div className="space-y-4">
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-center">
              <p className="text-xs uppercase tracking-wide text-gray-500">{tr.common.referenceLabel}</p>
              <p className="text-2xl font-bold text-accent mt-1 select-all">{reviewReference}</p>
            </div>

            <ol className="text-sm text-gray-700 space-y-2 list-decimal pl-5">
              <li>{tr.activate.reviewSteps.note}</li>
              <li>
                {tr.activate.reviewSteps.present}
                {' '}
                <strong>{matricule.trim()}</strong>.
              </li>
              <li>{tr.activate.reviewSteps.validated}</li>
            </ol>

            <button
              type="button"
              onClick={() => navigate('/login')}
              className="w-full bg-primary text-white rounded-lg py-2.5 text-sm font-semibold hover:opacity-90 transition"
            >
              {tr.common.goToLogin}
            </button>
          </div>
        )}

        <div className="text-center mt-5">
          <Link to="/login" className="text-sm font-medium text-accent hover:underline">
            {tr.activate.alreadyActivated}
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
          ? 'border-accent bg-primary text-white'
          : 'border-gray-300 bg-surface text-gray-600 hover:border-accent hover:text-accent'
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
        className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
      />
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}
