import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createDiploma } from '../api/diplomas';
import type { NewDiplomaPayload } from '../api/diplomas';
import { extractApiError } from '../api/client';

const TYPES: { value: NewDiplomaPayload['type']; label: string }[] = [
    { value: 'recruitment_diploma', label: 'Diplôme de Recrutement' },
    { value: 'highest_diploma', label: 'Diplôme le Plus Élevé' },
    { value: 'training', label: 'Formation' },
];

export default function AddDiplomaPage() {
    const navigate = useNavigate();

    const [type, setType] = useState<NewDiplomaPayload['type']>('training');
    const [title, setTitle] = useState('');
    const [institution, setInstitution] = useState('');
    const [year, setYear] = useState('');
    const [document, setDocument] = useState<File | null>(null);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setErrorMessage(null);

        const yearNumber = parseInt(year.trim(), 10);
        const currentYear = new Date().getFullYear();

        if (!title.trim() || !institution.trim()) {
            setErrorMessage("L'intitulé et l'établissement sont obligatoires.");
            return;
        }
        if (!yearNumber || yearNumber < 1950 || yearNumber > currentYear) {
            setErrorMessage(`Année invalide (entre 1950 et ${currentYear}).`);
            return;
        }
        if (!document) {
            setErrorMessage('Le document justificatif est obligatoire.');
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
            setErrorMessage(extractApiError(error).message);
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="max-w-2xl mx-auto p-4 sm:p-8">
            <h1 className="text-lg font-bold text-gray-900 mb-6">Nouveau Diplôme / Formation</h1>

            <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Type</label>
                    <div className="flex flex-col gap-2">
                        {TYPES.map((t) => (
                            <button
                                type="button"
                                key={t.value}
                                onClick={() => setType(t.value)}
                                className={`px-3 py-2 rounded-lg text-sm text-left border ${type === t.value
                                        ? 'bg-[#1e3a5f] text-white border-[#1e3a5f]'
                                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                                    }`}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>
                </div>

                <Field label="Intitulé *" value={title} onChange={setTitle} placeholder="Ex: Licence en Sciences Infirmières" />
                <Field label="École / Université / Organisme *" value={institution} onChange={setInstitution} />
                <Field label="Année d'obtention *" value={year} onChange={setYear} type="number" placeholder="2020" />

                <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Document justificatif *</label>
                    <input
                        type="file"
                        accept="application/pdf,image/*"
                        onChange={(e) => setDocument(e.target.files?.[0] ?? null)}
                        className="w-full text-sm"
                    />
                    {document && <p className="text-xs text-green-700 mt-1">✅ {document.name}</p>}
                </div>

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