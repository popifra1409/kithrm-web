import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchLeaveTypes, fetchLeaveBalance, createLeave } from '../api/leaves';
import type { LeaveType, LeaveBalance } from '../api/leaves';
import { extractApiError } from '../api/client';

export default function NewLeaveRequestPage() {
    const navigate = useNavigate();

    const [types, setTypes] = useState<LeaveType[]>([]);
    const [isLoadingTypes, setIsLoadingTypes] = useState(true);
    const [selectedTypeId, setSelectedTypeId] = useState<number | null>(null);
    const [balance, setBalance] = useState<LeaveBalance | null>(null);
    const [isLoadingBalance, setIsLoadingBalance] = useState(false);

    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [isSplit, setIsSplit] = useState(false);
    const [startDate2, setStartDate2] = useState('');
    const [endDate2, setEndDate2] = useState('');
    const [reason, setReason] = useState('');
    const [destination, setDestination] = useState('');
    const [address, setAddress] = useState('');
    const [childrenUnder6, setChildrenUnder6] = useState('');
    const [document, setDocument] = useState<File | null>(null);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        (async () => {
            try {
                const data = await fetchLeaveTypes();
                setTypes(data);
                if (data.length > 0) setSelectedTypeId(data[0].id);
            } catch (error) {
                alert(extractApiError(error).message);
            } finally {
                setIsLoadingTypes(false);
            }
        })();
    }, []);

    useEffect(() => {
        if (!selectedTypeId) return;
        setIsLoadingBalance(true);
        fetchLeaveBalance(selectedTypeId)
            .then(setBalance)
            .catch(() => setBalance(null))
            .finally(() => setIsLoadingBalance(false));
    }, [selectedTypeId]);

    const selectedType = types.find((t) => t.id === selectedTypeId);
    const isPermission = selectedType?.code === 'PERM';
    const showChildrenField = selectedType?.code === 'CA' || selectedType?.code === 'CMAT';

    function isValidDate(value: string): boolean {
        return /^\d{4}-\d{2}-\d{2}$/.test(value.trim());
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setErrorMessage(null);

        if (!selectedTypeId) {
            setErrorMessage('Sélectionnez un type de congé.');
            return;
        }
        if (!isValidDate(startDate) || !isValidDate(endDate)) {
            setErrorMessage('Format de date attendu : AAAA-MM-JJ.');
            return;
        }
        if (isSplit && (!isValidDate(startDate2) || !isValidDate(endDate2))) {
            setErrorMessage('Renseignez des dates valides pour la 2ème prise.');
            return;
        }
        if (!reason.trim()) {
            setErrorMessage('Le motif est obligatoire.');
            return;
        }
        if (selectedType?.requires_document && !document) {
            setErrorMessage('Un document justificatif est requis pour ce type de congé.');
            return;
        }

        setIsSubmitting(true);

        try {
            const created = await createLeave({
                leave_type_id: selectedTypeId,
                start_date: startDate.trim(),
                end_date: endDate.trim(),
                is_split: isSplit,
                start_date_2: isSplit ? startDate2.trim() : undefined,
                end_date_2: isSplit ? endDate2.trim() : undefined,
                reason: reason.trim(),
                destination: isPermission ? destination.trim() || undefined : undefined,
                address_during_leave: !isPermission ? address.trim() || undefined : undefined,
                children_under_6_at_request: showChildrenField && childrenUnder6 ? parseInt(childrenUnder6, 10) : undefined,
                documentFile: document ?? undefined,
            });

            navigate(`/leaves/${created.id}`);
        } catch (error) {
            setErrorMessage(extractApiError(error).message);
        } finally {
            setIsSubmitting(false);
        }
    }

    if (isLoadingTypes) {
        return (
            <div className="flex justify-center p-10">
                <div className="w-8 h-8 border-2 border-[#1e3a5f] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto p-4 sm:p-8">
            <h1 className="text-lg font-bold text-gray-900 mb-6">Nouvelle Demande de Congé</h1>

            <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Type de congé</label>
                    <div className="flex flex-wrap gap-2">
                        {types.map((t) => (
                            <button
                                type="button"
                                key={t.id}
                                onClick={() => setSelectedTypeId(t.id)}
                                className={`px-3 py-1.5 rounded-full text-sm border ${selectedTypeId === t.id
                                        ? 'bg-[#1e3a5f] text-white border-[#1e3a5f]'
                                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                                    }`}
                            >
                                {t.name}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="bg-blue-50 rounded-lg p-3 min-h-[20px] flex items-center">
                    {isLoadingBalance ? (
                        <span className="text-xs text-blue-700">Chargement du solde...</span>
                    ) : balance ? (
                        balance.eligible === false ? (
                            <span className="text-xs text-amber-700">
                                ⚠️ Pas encore éligible{balance.next_eligibility_date ? ` (à partir du ${balance.next_eligibility_date})` : ''}.
                            </span>
                        ) : balance.available !== undefined ? (
                            <span className="text-xs text-blue-700">
                                Solde : {balance.available} j disponible(s) sur {balance.entitlement} (cycle en cours)
                            </span>
                        ) : (
                            <span className="text-xs text-blue-700">{balance.message ?? 'Pas de solde applicable pour ce type.'}</span>
                        )
                    ) : null}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Date de début (1ère prise) *" value={startDate} onChange={setStartDate} placeholder="2026-07-01" />
                    <Field label="Date de fin (1ère prise) *" value={endDate} onChange={setEndDate} placeholder="2026-07-15" />
                </div>

                <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input type="checkbox" checked={isSplit} onChange={(e) => setIsSplit(e.target.checked)} className="rounded" />
                    Fractionner en 2 prises
                </label>

                {isSplit && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field label="Date de début (2ème prise) *" value={startDate2} onChange={setStartDate2} placeholder="2026-09-01" />
                        <Field label="Date de fin (2ème prise) *" value={endDate2} onChange={setEndDate2} placeholder="2026-09-08" />
                    </div>
                )}

                {isPermission ? (
                    <Field label="Destination" value={destination} onChange={setDestination} />
                ) : (
                    <Field label="Adresse pendant le congé" value={address} onChange={setAddress} />
                )}

                {showChildrenField && (
                    <Field
                        label="Enfants < 6 ans (femme salariée)"
                        value={childrenUnder6}
                        onChange={setChildrenUnder6}
                        type="number"
                    />
                )}

                <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Motif *</label>
                    <textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        rows={3}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
                    />
                </div>

                <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">
                        Document justificatif {selectedType?.requires_document ? '*' : '(optionnel)'}
                    </label>
                    <p className="text-xs text-gray-400 mb-1">Décision signée, planning de service, ou autre justificatif</p>
                    <input
                        type="file"
                        accept="application/pdf,image/*"
                        onChange={(e) => setDocument(e.target.files?.[0] ?? null)}
                        className="w-full text-sm"
                    />
                </div>

                {errorMessage && <p className="text-sm text-red-600 text-center">{errorMessage}</p>}

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-[#1e3a5f] text-white rounded-lg py-2.5 text-sm font-semibold hover:opacity-90 disabled:opacity-60"
                >
                    {isSubmitting ? 'Envoi...' : 'Soumettre la demande'}
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