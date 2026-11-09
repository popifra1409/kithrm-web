import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { createDependent } from '../api/dependents';
import type { NewDependentPayload } from '../api/dependents';
import { extractApiError } from '../api/client';
import { useCensusLock } from '../context/CensusLockContext';
import { useLang } from '../context/LangContext';
import DateInput from '../components/DateInput';
import PhotoCaptureInput from '../components/PhotoCaptureInput';

const RELATIONSHIPS = [
    { value: 'spouse', key: 'spouse' },
    { value: 'child', key: 'child' },
    { value: 'father', key: 'father' },
    { value: 'mother', key: 'mother' },
] as const;

/** Refus produits ici, avant l'envoi : stockés par clé pour qu'un changement de langue
    les traduise aussitôt, contrairement au message du serveur. */
type ClientIssue = 'nameAndBirthDate' | 'invalidBirthDate' | 'birthCertificateRequired' | 'marriageCertificateRequired';

export default function AddDependentPage() {
    const navigate = useNavigate();
    const { tr } = useLang();
    const census = useCensusLock();

    const [relationship, setRelationship] = useState<NewDependentPayload['relationship']>('child');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [birthDate, setBirthDate] = useState('');
    const [birthPlace, setBirthPlace] = useState('');
    const [gender, setGender] = useState<'M' | 'F'>('M');
    const [phone, setPhone] = useState('');

    const [photo, setPhoto] = useState<File | null>(null);
    const [birthCertificate, setBirthCertificate] = useState<File | null>(null);
    const [marriageCertificate, setMarriageCertificate] = useState<File | null>(null);
    const [idCard, setIdCard] = useState<File | null>(null);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState<ClientIssue | string | null>(null);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setErrorMessage(null);

        if (!lastName.trim() || !birthDate.trim()) {
            setErrorMessage('nameAndBirthDate');
            return;
        }
        if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate.trim())) {
            setErrorMessage('invalidBirthDate');
            return;
        }
        if (!birthCertificate) {
            setErrorMessage('birthCertificateRequired');
            return;
        }
        if (relationship === 'spouse' && !marriageCertificate) {
            setErrorMessage('marriageCertificateRequired');
            return;
        }

        setIsSubmitting(true);

        try {
            await createDependent({
                relationship,
                first_name: firstName.trim() || undefined,
                last_name: lastName.trim(),
                birth_date: birthDate.trim(),
                birth_place: birthPlace.trim() || undefined,
                gender,
                phone: phone.trim() || undefined,
                photoFile: photo ?? undefined,
                birthCertificateFile: birthCertificate,
                marriageCertificateFile: marriageCertificate ?? undefined,
                idCardFile: idCard ?? undefined,
            });

            navigate('/dependents');
        } catch (error) {
            setErrorMessage(extractApiError(error, tr.api).message);
        } finally {
            setIsSubmitting(false);
        }
    }

    // Après les hooks, sinon leur nombre changerait d'un rendu à l'autre. Le formulaire
    // n'est pas rendu un instant : un lien périmé mène au recensement, pas à une
    // déclaration que le serveur refuserait d'enregistrer.
    if (census.loading) return null;
    if (census.locked) {
        return <Navigate to="/census" replace state={{ lockNoticeKind: 'dependent' }} />;
    }

    return (
        <div className="max-w-2xl mx-auto p-4 sm:p-8">
            <h1 className="text-lg font-bold text-gray-900 mb-6">{tr.dependents.heading}</h1>

            <form onSubmit={handleSubmit} className="bg-surface rounded-xl border border-gray-200 p-6 space-y-5">
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        {tr.dependents.relationshipField}
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {RELATIONSHIPS.map((r) => (
                            <button
                                type="button"
                                key={r.value}
                                onClick={() => setRelationship(r.value)}
                                className={`px-3 py-1.5 rounded-full text-sm border ${relationship === r.value
                                        ? 'bg-primary text-white border-accent'
                                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                                    }`}
                            >
                                {tr.dependents.relationships[r.key]}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label={tr.dependents.lastName} value={lastName} onChange={setLastName} />
                    <Field label={tr.dependents.firstName} value={firstName} onChange={setFirstName} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <DateInput label={tr.dependents.birthDate} value={birthDate} onChange={setBirthDate} />
                    <Field label={tr.dependents.birthPlace} value={birthPlace} onChange={setBirthPlace} />
                </div>

                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">{tr.dependents.genderField}</label>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => setGender('M')}
                            className={`px-3 py-1.5 rounded-full text-sm border ${gender === 'M' ? 'bg-primary text-white border-accent' : 'border-gray-300 text-gray-700'}`}
                        >
                            {tr.dependents.male}
                        </button>
                        <button
                            type="button"
                            onClick={() => setGender('F')}
                            className={`px-3 py-1.5 rounded-full text-sm border ${gender === 'F' ? 'bg-primary text-white border-accent' : 'border-gray-300 text-gray-700'}`}
                        >
                            {tr.dependents.female}
                        </button>
                    </div>
                </div>

                <Field label={tr.dependents.phone} value={phone} onChange={setPhone} type="tel" />

                <PhotoCaptureInput label={tr.dependents.photo} file={photo} onChange={setPhoto} />

                <h2 className="text-sm font-bold text-accent pt-2">{tr.common.supportingDocuments}</h2>

                <FileField label={tr.dependents.birthCertificate} file={birthCertificate} onChange={setBirthCertificate} />
                {relationship === 'spouse' && (
                    <FileField label={tr.dependents.marriageCertificate} file={marriageCertificate} onChange={setMarriageCertificate} />
                )}
                <FileField label={tr.dependents.idCard} file={idCard} onChange={setIdCard} />

                {errorMessage && (
                    <p className="text-sm text-red-600 text-center">
                        {typeof errorMessage === 'string' ? errorMessage : tr.dependents.errors[errorMessage]}
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

function FileField({
    label,
    file,
    onChange,
}: {
    label: string;
    file: File | null;
    onChange: (f: File | null) => void;
}) {
    const { tr } = useLang();
    return (
        <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">{label}</label>
            <input
                type="file"
                accept="application/pdf,image/*"
                onChange={(e) => onChange(e.target.files?.[0] ?? null)}
                className="w-full text-sm"
            />
            {file && <p className="text-xs text-green-700 mt-1">{tr.common.attached(file.name)}</p>}
        </div>
    );
}
