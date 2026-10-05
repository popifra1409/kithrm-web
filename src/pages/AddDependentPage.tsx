import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createDependent } from '../api/dependents';
import type { NewDependentPayload } from '../api/dependents';
import { extractApiError } from '../api/client';
import DateInput from '../components/DateInput';
import PhotoCaptureInput from '../components/PhotoCaptureInput';

const RELATIONSHIPS: { value: NewDependentPayload['relationship']; label: string }[] = [
    { value: 'spouse', label: 'Conjoint(e)' },
    { value: 'child', label: 'Enfant' },
    { value: 'father', label: 'Père' },
    { value: 'mother', label: 'Mère' },
];

export default function AddDependentPage() {
    const navigate = useNavigate();

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
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setErrorMessage(null);

        if (!lastName.trim() || !birthDate.trim()) {
            setErrorMessage('Le nom et la date de naissance sont obligatoires.');
            return;
        }
        if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate.trim())) {
            setErrorMessage('Date de naissance invalide. Format attendu : JJ-MM-AAAA.');
            return;
        }
        if (!birthCertificate) {
            setErrorMessage("L'acte de naissance est obligatoire.");
            return;
        }
        if (relationship === 'spouse' && !marriageCertificate) {
            setErrorMessage("L'acte de mariage est obligatoire pour un(e) conjoint(e).");
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
            setErrorMessage(extractApiError(error).message);
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="max-w-2xl mx-auto p-4 sm:p-8">
            <h1 className="text-lg font-bold text-gray-900 mb-6">Déclarer un Ayant Droit</h1>

            <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Lien de parenté</label>
                    <div className="flex flex-wrap gap-2">
                        {RELATIONSHIPS.map((r) => (
                            <button
                                type="button"
                                key={r.value}
                                onClick={() => setRelationship(r.value)}
                                className={`px-3 py-1.5 rounded-full text-sm border ${relationship === r.value
                                        ? 'bg-[#1e3a5f] text-white border-[#1e3a5f]'
                                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                                    }`}
                            >
                                {r.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Nom *" value={lastName} onChange={setLastName} />
                    <Field label="Prénom(s)" value={firstName} onChange={setFirstName} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <DateInput label="Date de naissance *" value={birthDate} onChange={setBirthDate} />
                    <Field label="Lieu de naissance" value={birthPlace} onChange={setBirthPlace} />
                </div>

                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Sexe</label>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => setGender('M')}
                            className={`px-3 py-1.5 rounded-full text-sm border ${gender === 'M' ? 'bg-[#1e3a5f] text-white border-[#1e3a5f]' : 'border-gray-300 text-gray-700'}`}
                        >
                            Masculin
                        </button>
                        <button
                            type="button"
                            onClick={() => setGender('F')}
                            className={`px-3 py-1.5 rounded-full text-sm border ${gender === 'F' ? 'bg-[#1e3a5f] text-white border-[#1e3a5f]' : 'border-gray-300 text-gray-700'}`}
                        >
                            Féminin
                        </button>
                    </div>
                </div>

                <Field label="Téléphone" value={phone} onChange={setPhone} type="tel" />

                <PhotoCaptureInput label="Photo" file={photo} onChange={setPhoto} />

                <h2 className="text-sm font-bold text-[#1e3a5f] pt-2">Documents justificatifs</h2>

                <FileField label="Acte de naissance *" file={birthCertificate} onChange={setBirthCertificate} />
                {relationship === 'spouse' && (
                    <FileField label="Acte de mariage *" file={marriageCertificate} onChange={setMarriageCertificate} />
                )}
                <FileField label="Carte d'identité (optionnel)" file={idCard} onChange={setIdCard} />

                {errorMessage && <p className="text-sm text-red-600 text-center">{errorMessage}</p>}

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-[#1e3a5f] text-white rounded-lg py-2.5 text-sm font-semibold hover:opacity-90 disabled:opacity-60"
                >
                    {isSubmitting ? 'Envoi...' : 'Envoyer'}
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
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
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
    return (
        <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">{label}</label>
            <input
                type="file"
                accept="application/pdf,image/*"
                onChange={(e) => onChange(e.target.files?.[0] ?? null)}
                className="w-full text-sm"
            />
            {file && <p className="text-xs text-green-700 mt-1">✅ {file.name}</p>}
        </div>
    );
}