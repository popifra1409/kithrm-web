import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { createDiploma } from '../api/diplomas';
import type { NewDiplomaPayload } from '../api/diplomas';
import { extractApiError } from '../api/client';
import { useCensusLock } from '../context/CensusLockContext';
import { useLang } from '../context/LangContext';

const TYPES = [
    { value: 'recruitment_diploma', key: 'recruitment_diploma' },
    { value: 'highest_diploma', key: 'highest_diploma' },
    { value: 'training', key: 'training' },
] as const;

/** Refus produits ici, avant l'envoi : stockés par clé pour suivre la langue affichée. */
type ClientIssue = 'titleAndInstitution' | 'invalidYear' | 'documentRequired';

export default function AddDiplomaPage() {
    const navigate = useNavigate();
    const { tr } = useLang();
    const census = useCensusLock();

    const [type, setType] = useState<NewDiplomaPayload['type']>('training');
    const [title, setTitle] = useState('');
    const [institution, setInstitution] = useState('');
    const [year, setYear] = useState('');
    const [document, setDocument] = useState<File | null>(null);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState<ClientIssue | string | null>(null);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setErrorMessage(null);

        const yearNumber = parseInt(year.trim(), 10);
        const currentYear = new Date().getFullYear();

        if (!title.trim() || !institution.trim()) {
            setErrorMessage('titleAndInstitution');
            return;
        }
        if (!yearNumber || yearNumber < 1950 || yearNumber > currentYear) {
            setErrorMessage('invalidYear');
            return;
        }
        if (!document) {
            setErrorMessage('documentRequired');
            return;
        }

        setIsSubmitting(true);

        try {
            await createDiploma({
                type,
                title: title.trim(),
                institution: institution.trim(),
                year_obtained: yearNumber,
                documentFile: document,
            });

            navigate('/diplomas');
        } catch (error) {
            setErrorMessage(extractApiError(error, tr.api).message);
        } finally {
            setIsSubmitting(false);
        }
    }

    // Le verrou se place après les hooks du formulaire, sinon leur nombre changerait
    // d'un rendu à l'autre. Un lien périmé ou une URL saisie à la main doivent tomber
    // sur le recensement, pas sur un formulaire que le serveur refuserait d'enregistrer.
    if (census.loading) return null;
    if (census.locked) {
        return <Navigate to="/census" replace state={{ lockNoticeKind: 'diploma' }} />;
    }

    return (
        <div className="max-w-2xl mx-auto p-4 sm:p-8">
            <h1 className="text-lg font-bold text-gray-900 mb-6">{tr.diplomas.heading}</h1>

            <form onSubmit={handleSubmit} className="bg-surface rounded-xl border border-gray-200 p-6 space-y-5">
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">{tr.diplomas.typeField}</label>
                    <div className="flex flex-col gap-2">
                        {TYPES.map((t) => (
                            <button
                                type="button"
                                key={t.value}
                                onClick={() => setType(t.value)}
                                className={`px-3 py-2 rounded-lg text-sm text-left border ${type === t.value
                                        ? 'bg-primary text-white border-accent'
                                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                                    }`}
                            >
                                {tr.diplomas.types[t.key]}
                            </button>
                        ))}
                    </div>
                </div>

                <Field
                    label={tr.diplomas.titleField}
                    value={title}
                    onChange={setTitle}
                    placeholder={tr.diplomas.titlePlaceholder}
                />
                <Field label={tr.diplomas.institutionField} value={institution} onChange={setInstitution} />
                <Field label={tr.diplomas.yearField} value={year} onChange={setYear} type="number" placeholder="2020" />

                <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">{tr.diplomas.documentField}</label>
                    <input
                        type="file"
                        accept="application/pdf,image/*"
                        onChange={(e) => setDocument(e.target.files?.[0] ?? null)}
                        className="w-full text-sm"
                    />
                    {document && <p className="text-xs text-green-700 mt-1">{tr.common.attached(document.name)}</p>}
                </div>

                {errorMessage && (
                    <p className="text-sm text-red-600 text-center">
                        {typeof errorMessage === 'string'
                            ? errorMessage
                            : errorMessage === 'invalidYear'
                              ? tr.diplomas.errors.invalidYear(new Date().getFullYear())
                              : tr.diplomas.errors[errorMessage]}
                    </p>
                )}

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-primary text-white rounded-lg py-2.5 text-sm font-semibold hover:opacity-90 disabled:opacity-60"
                >
                    {isSubmitting ? tr.common.sending : tr.common.send}
                </button>
            </form>
        </div>
    );
}

function Field({
    label,
    value,
    onChange,
    placeholder,
    type = 'text',
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    type?: string;
}) {
    return (
        <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">{label}</label>
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
        </div>
    );
}
