import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchDiplomas, deleteDiploma } from '../api/diplomas';
import type { Diploma } from '../api/diplomas';
import { extractApiError } from '../api/client';
import StatusBadge from '../components/StatusBadge';

export default function DiplomasPage() {
    const [diplomas, setDiplomas] = useState<Diploma[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        load();
    }, []);

    async function load() {
        setIsLoading(true);
        try {
            const data = await fetchDiplomas();
            setDiplomas(data);
        } catch (error) {
            alert(extractApiError(error).message);
        } finally {
            setIsLoading(false);
        }
    }

    async function handleDelete(diploma: Diploma) {
        if (diploma.validation_status === 'validated') {
            alert('Ce diplôme a déjà été validé et ne peut plus être retiré ici.');
            return;
        }
        if (!confirm(`Retirer "${diploma.title}" ?`)) return;

        try {
            await deleteDiploma(diploma.id);
            load();
        } catch (error) {
            alert(extractApiError(error).message);
        }
    }

    return (
        <div className="max-w-3xl mx-auto p-4 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                <h1 className="text-lg font-bold text-gray-900">Diplômes & Formations</h1>
                <Link
                    to="/diplomas/new"
                    className="bg-[#1e3a5f] text-white rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90"
                >
                    + Ajouter
                </Link>
            </div>

            {isLoading ? (
                <div className="flex justify-center p-10">
                    <div className="w-8 h-8 border-2 border-[#1e3a5f] border-t-transparent rounded-full animate-spin" />
                </div>
            ) : diplomas.length === 0 ? (
                <p className="text-sm text-gray-500 text-center mt-10">Aucun diplôme ou formation renseigné pour le moment.</p>
            ) : (
                <div className="space-y-3">
                    {diplomas.map((dip) => (
                        <div key={dip.id} className="bg-white rounded-xl border border-gray-200 p-4">
                            <div className="flex items-start justify-between mb-1">
                                <span className="font-semibold text-sm text-gray-900">{dip.title}</span>
                                <StatusBadge status={dip.validation_status} label={dip.validation_status_label} />
                            </div>
                            <p className="text-xs font-semibold text-[#1e3a5f]">{dip.type_label}</p>
                            <p className="text-sm text-gray-600">{dip.institution} · {dip.year_obtained}</p>
                            {dip.validation_status === 'rejected' && dip.rejection_reason && (
                                <p className="text-xs text-red-600 mt-1">Motif : {dip.rejection_reason}</p>
                            )}
                            {dip.validation_status !== 'validated' && (
                                <button
                                    onClick={() => handleDelete(dip)}
                                    className="text-xs font-semibold text-red-600 hover:underline mt-2"
                                >
                                    Retirer
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}