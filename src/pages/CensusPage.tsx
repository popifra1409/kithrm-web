import { useEffect, useState } from 'react';
import {
    fetchCurrentCensus,
    submitCensus,
    buildInitialDraft,
} from '../api/census';
import type { CensusDraft, CensusCurrentResponse, CensusDraftDependent, CensusDraftDiploma } from '../api/census';
import { extractApiError } from '../api/client';

const RELATIONSHIP_LABELS: Record<string, string> = {
    spouse: 'Conjoint(e)',
    child: 'Enfant',
    father: 'Père',
    mother: 'Mère',
};

const DIPLOMA_TYPE_LABELS: Record<string, string> = {
    recruitment_diploma: 'Diplôme de Recrutement',
    highest_diploma: 'Diplôme le Plus Élevé',
    training: 'Formation',
};

const EMPTY_DEPENDENT: CensusDraftDependent = {
    existing_id: null,
    relationship: 'child',
    first_name: '',
    last_name: '',
    birth_date: '',
    birth_place: '',
    gender: 'M',
    phone: '',
    email: '',
    address: '',
    removed: false,
    documents: {},
};

const EMPTY_DIPLOMA: CensusDraftDiploma = {
    existing_id: null,
    type: 'training',
    title: '',
    institution: '',
    year_obtained: '',
    removed: false,
    document: null,
};

export default function CensusPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [current, setCurrent] = useState<CensusCurrentResponse | null>(null);
    const [draft, setDraft] = useState<CensusDraft | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [editingDependentIndex, setEditingDependentIndex] = useState<number | null | 'new'>(null);
    const [editingDiplomaIndex, setEditingDiplomaIndex] = useState<number | null | 'new'>(null);

    useEffect(() => {
        load();
    }, []);

    async function load() {
        setIsLoading(true);
        try {
            const data = await fetchCurrentCensus();
            setCurrent(data);
            if (data.campaign) setDraft(buildInitialDraft(data));
        } catch (error) {
            alert(extractApiError(error).message);
        } finally {
            setIsLoading(false);
        }
    }

    function updatePersonal(field: keyof CensusDraft['personal'], value: string) {
        setDraft((d) => (d ? { ...d, personal: { ...d.personal, [field]: value } } : d));
    }

    function toggleRemoveDependent(index: number) {
        setDraft((d) =>
            d
                ? { ...d, dependents: d.dependents.map((dep, i) => (i === index ? { ...dep, removed: !dep.removed } : dep)) }
                : d
        );
    }

    function toggleRemoveDiploma(index: number) {
        setDraft((d) =>
            d ? { ...d, diplomas: d.diplomas.map((dip, i) => (i === index ? { ...dip, removed: !dip.removed } : dip)) } : d
        );
    }

    function saveDependent(item: CensusDraftDependent) {
        setDraft((d) => {
            if (!d) return d;
            if (editingDependentIndex === 'new') {
                return { ...d, dependents: [...d.dependents, item] };
            }
            return { ...d, dependents: d.dependents.map((dep, i) => (i === editingDependentIndex ? item : dep)) };
        });
        setEditingDependentIndex(null);
    }

    function saveDiploma(item: CensusDraftDiploma) {
        setDraft((d) => {
            if (!d) return d;
            if (editingDiplomaIndex === 'new') {
                return { ...d, diplomas: [...d.diplomas, item] };
            }
            return { ...d, diplomas: d.diplomas.map((dip, i) => (i === editingDiplomaIndex ? item : dip)) };
        });
        setEditingDiplomaIndex(null);
    }

    async function handleSubmit() {
        if (!current?.campaign || !draft) return;

        const activeDependents = draft.dependents.filter((d) => !d.removed);
        const activeDiplomas = draft.diplomas.filter((d) => !d.removed);

        if (activeDependents.some((d) => !d.existing_id && !d.documents.birth_certificate)) {
            alert("Un acte de naissance est requis pour chaque nouvel ayant droit.");
            return;
        }
        if (activeDiplomas.some((d) => !d.existing_id && !d.document)) {
            alert('Un document justificatif est requis pour chaque nouveau diplôme.');
            return;
        }
        if (!confirm("Une fois soumis, vous ne pourrez plus modifier votre recensement tant qu'il est en attente. Continuer ?")) {
            return;
        }

        setIsSubmitting(true);
        try {
            await submitCensus(current.campaign.id, draft);
            alert('Votre recensement a été soumis pour validation.');
            load();
        } catch (error) {
            alert(extractApiError(error).message);
        } finally {
            setIsSubmitting(false);
        }
    }

    if (isLoading) {
        return (
            <div className="flex justify-center p-10">
                <div className="w-8 h-8 border-2 border-[#1e3a5f] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!current?.campaign) {
        return (
            <div className="p-10 text-center text-gray-500">
                <p className="text-4xl mb-3">📋</p>
                <p>Aucune campagne de recensement n'est actuellement ouverte.</p>
            </div>
        );
    }

    if (current.submission_status === 'submitted') {
        return (
            <div className="p-10 text-center">
                <p className="text-4xl mb-3">⏳</p>
                <p className="font-bold text-gray-900">Recensement soumis</p>
                <p className="text-sm text-gray-500 mt-1">En attente de validation par les RH.</p>
            </div>
        );
    }

    if (current.submission_status === 'validated') {
        return (
            <div className="p-10 text-center">
                <p className="text-4xl mb-3">✅</p>
                <p className="font-bold text-gray-900">Recensement validé</p>
                <p className="text-sm text-gray-500 mt-1">Vos informations ont été mises à jour.</p>
            </div>
        );
    }

    if (!draft) return null;

    return (
        <div className="max-w-2xl mx-auto p-4 sm:p-8">
            <h1 className="text-lg font-bold text-[#1e3a5f]">{current.campaign.name}</h1>
            {current.campaign.description && <p className="text-sm text-gray-500 mt-1 mb-4">{current.campaign.description}</p>}

            {current.submission_status === 'rejected' && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
                    <p className="font-semibold text-sm text-red-800">❌ Recensement rejeté</p>
                    {current.rejection_reason && <p className="text-sm text-red-700 mt-1">{current.rejection_reason}</p>}
                    <p className="text-xs text-red-600 mt-1 italic">Corrigez ci-dessous et resoumettez.</p>
                </div>
            )}

            <Section title="Informations Personnelles">
                <div className="space-y-3">
                    <Field label="Téléphone" value={draft.personal.phone} onChange={(v) => updatePersonal('phone', v)} />
                    <Field label="Email" value={draft.personal.email} onChange={(v) => updatePersonal('email', v)} />
                    <Field label="Adresse" value={draft.personal.address} onChange={(v) => updatePersonal('address', v)} />
                    <Field label="Ville" value={draft.personal.city} onChange={(v) => updatePersonal('city', v)} />
                </div>
            </Section>

            <Section
                title="Ayants Droit"
                action={
                    <button onClick={() => setEditingDependentIndex('new')} className="text-sm font-semibold text-[#1e3a5f] hover:underline">
                        + Ajouter
                    </button>
                }
            >
                {draft.dependents.length === 0 ? (
                    <p className="text-sm text-gray-400 italic">Aucun ayant droit déclaré.</p>
                ) : (
                    <div className="space-y-2">
                        {draft.dependents.map((dep, index) => (
                            <div key={index} className={`bg-gray-50 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${dep.removed ? 'opacity-50' : ''}`}>
                                <div>
                                    <p className={`text-sm font-semibold ${dep.removed ? 'line-through' : ''} text-gray-900`}>
                                        {dep.first_name} {dep.last_name}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {RELATIONSHIP_LABELS[dep.relationship]} {dep.existing_id ? '' : '· nouveau'}
                                    </p>
                                </div>
                                <div className="flex gap-3">
                                    {!dep.removed && (
                                        <button onClick={() => setEditingDependentIndex(index)} className="text-xs font-semibold text-[#1e3a5f] hover:underline">
                                            Modifier
                                        </button>
                                    )}
                                    <button
                                        onClick={() => toggleRemoveDependent(index)}
                                        className={`text-xs font-semibold hover:underline ${dep.removed ? 'text-green-600' : 'text-red-600'}`}
                                    >
                                        {dep.removed ? 'Rétablir' : 'Retirer'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Section>

            <Section
                title="Diplômes & Formations"
                action={
                    <button onClick={() => setEditingDiplomaIndex('new')} className="text-sm font-semibold text-[#1e3a5f] hover:underline">
                        + Ajouter
                    </button>
                }
            >
                {draft.diplomas.length === 0 ? (
                    <p className="text-sm text-gray-400 italic">Aucun diplôme/formation déclaré.</p>
                ) : (
                    <div className="space-y-2">
                        {draft.diplomas.map((dip, index) => (
                            <div key={index} className={`bg-gray-50 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${dip.removed ? 'opacity-50' : ''}`}>
                                <div>
                                    <p className={`text-sm font-semibold ${dip.removed ? 'line-through' : ''} text-gray-900`}>{dip.title}</p>
                                    <p className="text-xs text-gray-500">
                                        {DIPLOMA_TYPE_LABELS[dip.type]} · {dip.institution} ({dip.year_obtained}) {dip.existing_id ? '' : '· nouveau'}
                                    </p>
                                </div>
                                <div className="flex gap-3">
                                    {!dip.removed && (
                                        <button onClick={() => setEditingDiplomaIndex(index)} className="text-xs font-semibold text-[#1e3a5f] hover:underline">
                                            Modifier
                                        </button>
                                    )}
                                    <button
                                        onClick={() => toggleRemoveDiploma(index)}
                                        className={`text-xs font-semibold hover:underline ${dip.removed ? 'text-green-600' : 'text-red-600'}`}
                                    >
                                        {dip.removed ? 'Rétablir' : 'Retirer'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Section>

            <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full bg-[#1e3a5f] text-white rounded-lg py-3 text-sm font-bold hover:opacity-90 disabled:opacity-60 mt-2"
            >
                {isSubmitting ? 'Envoi...' : 'Soumettre le recensement'}
            </button>
            <p className="text-xs text-gray-400 text-center mt-3">
                ⚠️ Ne rechargez pas cette page avant d'avoir soumis, vous perdriez vos modifications.
            </p>

            {editingDependentIndex !== null && (
                <DependentModal
                    initial={editingDependentIndex === 'new' ? EMPTY_DEPENDENT : draft.dependents[editingDependentIndex]}
                    onCancel={() => setEditingDependentIndex(null)}
                    onSave={saveDependent}
                />
            )}

            {editingDiplomaIndex !== null && (
                <DiplomaModal
                    initial={editingDiplomaIndex === 'new' ? EMPTY_DIPLOMA : draft.diplomas[editingDiplomaIndex]}
                    onCancel={() => setEditingDiplomaIndex(null)}
                    onSave={saveDiploma}
                />
            )}
        </div>
    );
}

function Section({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
    return (
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
            <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-[#1e3a5f]">{title}</h2>
                {action}
            </div>
            {children}
        </div>
    );
}

function Field({ label, value, onChange, placeholder, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
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

function Modal({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
                <h3 className="font-bold text-gray-900 mb-4">{title}</h3>
                {children}
            </div>
        </div>
    );
}

function DependentModal({
    initial,
    onCancel,
    onSave,
}: {
    initial: CensusDraftDependent;
    onCancel: () => void;
    onSave: (item: CensusDraftDependent) => void;
}) {
    const [item, setItem] = useState<CensusDraftDependent>(initial);

    function handleSave() {
        if (!item.last_name.trim() || !item.birth_date.trim()) {
            alert('Le nom et la date de naissance sont obligatoires.');
            return;
        }
        if (!/^\d{4}-\d{2}-\d{2}$/.test(item.birth_date.trim())) {
            alert('Format de date attendu : AAAA-MM-JJ.');
            return;
        }
        if (!item.existing_id && !item.documents.birth_certificate) {
            alert("L'acte de naissance est obligatoire pour un nouvel ayant droit.");
            return;
        }
        if (item.relationship === 'spouse' && !item.existing_id && !item.documents.marriage_certificate) {
            alert("L'acte de mariage est obligatoire pour un(e) conjoint(e).");
            return;
        }
        onSave(item);
    }

    return (
        <Modal title="Ayant Droit">
            <div className="space-y-3">
                <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Lien de parenté</label>
                    <div className="flex flex-wrap gap-2">
                        {(['spouse', 'child', 'father', 'mother'] as const).map((r) => (
                            <button
                                key={r}
                                onClick={() => setItem((p) => ({ ...p, relationship: r }))}
                                className={`px-2.5 py-1 rounded-full text-xs border ${item.relationship === r ? 'bg-[#1e3a5f] text-white border-[#1e3a5f]' : 'border-gray-300 text-gray-700'}`}
                            >
                                {RELATIONSHIP_LABELS[r]}
                            </button>
                        ))}
                    </div>
                </div>
                <Field label="Prénom(s)" value={item.first_name} onChange={(v) => setItem((p) => ({ ...p, first_name: v }))} />
                <Field label="Nom *" value={item.last_name} onChange={(v) => setItem((p) => ({ ...p, last_name: v }))} />
                <Field label="Date de naissance * (AAAA-MM-JJ)" value={item.birth_date} onChange={(v) => setItem((p) => ({ ...p, birth_date: v }))} placeholder="2018-02-10" />
                <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Sexe</label>
                    <div className="flex gap-2">
                        <button onClick={() => setItem((p) => ({ ...p, gender: 'M' }))} className={`px-2.5 py-1 rounded-full text-xs border ${item.gender === 'M' ? 'bg-[#1e3a5f] text-white border-[#1e3a5f]' : 'border-gray-300'}`}>Masculin</button>
                        <button onClick={() => setItem((p) => ({ ...p, gender: 'F' }))} className={`px-2.5 py-1 rounded-full text-xs border ${item.gender === 'F' ? 'bg-[#1e3a5f] text-white border-[#1e3a5f]' : 'border-gray-300'}`}>Féminin</button>
                    </div>
                </div>

                <FileField
                    label={`Acte de naissance ${item.existing_id ? '(joindre si changement)' : '*'}`}
                    file={item.documents.birth_certificate ?? null}
                    onChange={(f) => setItem((p) => ({ ...p, documents: { ...p.documents, birth_certificate: f } }))}
                />
                {item.relationship === 'spouse' && (
                    <FileField
                        label={`Acte de mariage ${item.existing_id ? '(joindre si changement)' : '*'}`}
                        file={item.documents.marriage_certificate ?? null}
                        onChange={(f) => setItem((p) => ({ ...p, documents: { ...p.documents, marriage_certificate: f } }))}
                    />
                )}

                <div className="flex gap-3 pt-2">
                    <button onClick={onCancel} className="flex-1 border border-gray-300 rounded-lg py-2 text-sm font-medium text-gray-700">Annuler</button>
                    <button onClick={handleSave} className="flex-1 bg-[#1e3a5f] text-white rounded-lg py-2 text-sm font-semibold">Enregistrer</button>
                </div>
            </div>
        </Modal>
    );
}

function DiplomaModal({
    initial,
    onCancel,
    onSave,
}: {
    initial: CensusDraftDiploma;
    onCancel: () => void;
    onSave: (item: CensusDraftDiploma) => void;
}) {
    const [item, setItem] = useState<CensusDraftDiploma>(initial);

    function handleSave() {
        const year = parseInt(item.year_obtained.trim(), 10);
        if (!item.title.trim() || !item.institution.trim()) {
            alert("L'intitulé et l'établissement sont obligatoires.");
            return;
        }
        if (!year || year < 1950 || year > new Date().getFullYear()) {
            alert('Année invalide.');
            return;
        }
        if (!item.existing_id && !item.document) {
            alert('Un document justificatif est obligatoire pour un nouveau diplôme.');
            return;
        }
        onSave(item);
    }

    return (
        <Modal title="Diplôme / Formation">
            <div className="space-y-3">
                <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Type</label>
                    <div className="flex flex-col gap-2">
                        {(['recruitment_diploma', 'highest_diploma', 'training'] as const).map((t) => (
                            <button
                                key={t}
                                onClick={() => setItem((p) => ({ ...p, type: t }))}
                                className={`px-3 py-1.5 rounded-lg text-sm text-left border ${item.type === t ? 'bg-[#1e3a5f] text-white border-[#1e3a5f]' : 'border-gray-300 text-gray-700'}`}
                            >
                                {DIPLOMA_TYPE_LABELS[t]}
                            </button>
                        ))}
                    </div>
                </div>
                <Field label="Intitulé *" value={item.title} onChange={(v) => setItem((p) => ({ ...p, title: v }))} />
                <Field label="Établissement *" value={item.institution} onChange={(v) => setItem((p) => ({ ...p, institution: v }))} />
                <Field label="Année *" value={item.year_obtained} onChange={(v) => setItem((p) => ({ ...p, year_obtained: v }))} type="number" />

                <FileField
                    label={`Document justificatif ${item.existing_id ? '(joindre si changement)' : '*'}`}
                    file={item.document ?? null}
                    onChange={(f) => setItem((p) => ({ ...p, document: f }))}
                />

                <div className="flex gap-3 pt-2">
                    <button onClick={onCancel} className="flex-1 border border-gray-300 rounded-lg py-2 text-sm font-medium text-gray-700">Annuler</button>
                    <button onClick={handleSave} className="flex-1 bg-[#1e3a5f] text-white rounded-lg py-2 text-sm font-semibold">Enregistrer</button>
                </div>
            </div>
        </Modal>
    );
}

function FileField({ label, file, onChange }: { label: string; file: File | null; onChange: (f: File | null) => void }) {
    return (
        <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">{label}</label>
            <input type="file" accept="application/pdf,image/*" onChange={(e) => onChange(e.target.files?.[0] ?? null)} className="w-full text-xs" />
            {file && <p className="text-xs text-green-700 mt-1">✅ {file.name}</p>}
        </div>
    );
}