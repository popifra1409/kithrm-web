import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchDiplomas, deleteDiploma } from '../api/diplomas';
import type { Diploma } from '../api/diplomas';
import { extractApiError } from '../api/client';
import { useCensusLock } from '../context/CensusLockContext';
import { useLang } from '../context/LangContext';
import StatusBadge from '../components/StatusBadge';

export default function DiplomasPage() {
    const { tr } = useLang();
    const [diplomas, setDiplomas] = useState<Diploma[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const census = useCensusLock();

    useEffect(() => {
        load();
    }, []);

    async function load() {
        setIsLoading(true);
        try {
            const data = await fetchDiplomas();
            setDiplomas(data);
        } catch (error) {
            alert(extractApiError(error, tr.api).message);
        } finally {
            setIsLoading(false);
        }
    }

    async function handleDelete(diploma: Diploma) {
        if (diploma.validation_status === 'validated') {
            alert(tr.diplomas.alreadyValidated);
            return;
        }
        if (!confirm(tr.common.removeConfirm(diploma.title))) return;

        try {
            await deleteDiploma(diploma.id);
            load();
        } catch (error) {
            alert(extractApiError(error, tr.api).message);
        }
    }

    return (
        <div className="max-w-3xl mx-auto p-4 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                <h1 className="text-lg font-bold text-gray-900">{tr.diplomas.title}</h1>
                {/* Rien pendant la lecture de l'état : un bouton « Ajouter » qui
                    apparaîtrait puis se transformerait serait cliquable entre les deux. */}
                {!census.loading &&
                    (census.locked ? (
                        <Link
                            to="/census"
                            className="bg-surface border border-accent text-accent rounded-lg px-4 py-2 text-sm font-semibold hover:bg-primary hover:text-white transition"
                        >
                            {tr.censusLock.cta}
                        </Link>
                    ) : (
                        <Link
                            to="/diplomas/new"
                            className="bg-primary text-white rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90"
                        >
                            {tr.diplomas.add}
                        </Link>
                    ))}
            </div>

            {census.locked && (
                <p className="text-xs text-accent bg-primary/5 border border-accent/20 rounded-lg p-3 mb-4">
                    {tr.censusLock.diploma}
                </p>
            )}

            {isLoading ? (
                <div className="flex justify-center p-10">
                    <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                </div>
            ) : diplomas.length === 0 ? (
                <p className="text-sm text-gray-500 text-center mt-10">{tr.diplomas.empty}</p>
            ) : (
                <div className="space-y-3">
                    {diplomas.map((dip) => (
                        <div key={dip.id} className="bg-surface rounded-xl border border-gray-200 p-4">
                            <div className="flex items-start justify-between mb-1">
                                <span className="font-semibold text-sm text-gray-900">{dip.title}</span>
                                <StatusBadge status={dip.validation_status} label={dip.validation_status_label} />
                            </div>
                            <p className="text-xs font-semibold text-accent">{dip.type_label}</p>
                            <p className="text-sm text-gray-600">{dip.institution} · {dip.year_obtained}</p>
                            {dip.validation_status === 'rejected' && dip.rejection_reason && (
                                <p className="text-xs text-red-600 mt-1">{tr.common.reason(dip.rejection_reason)}</p>
                            )}
                            {dip.validation_status !== 'validated' && (
                                <button
                                    onClick={() => handleDelete(dip)}
                                    className="text-xs font-semibold text-red-600 hover:underline mt-2"
                                >
                                    {tr.common.remove}
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
