import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchDependents, deleteDependent } from '../api/dependents';
import type { Dependent } from '../api/dependents';
import { extractApiError } from '../api/client';
import StatusBadge from '../components/StatusBadge';

export default function DependentsPage() {
    const [dependents, setDependents] = useState<Dependent[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        load();
    }, []);

    async function load() {
        setIsLoading(true);
        try {
            const data = await fetchDependents();
            setDependents(data);
        } catch (error) {
            alert(extractApiError(error).message);
        } finally {
            setIsLoading(false);
        }
    }

    async function handleDelete(dependent: Dependent) {
        if (dependent.validation_status !== 'pending') {
            alert('Cet ayant droit a déjà été traité par les RH et ne peut plus être retiré ici.');
            return;
        }
        if (!confirm(`Retirer ${dependent.full_name} ?`)) return;

        try {
            await deleteDependent(dependent.id);
            load();
        } catch (error) {
            alert(extractApiError(error).message);
        }
    }

    return (
        <div className="max-w-3xl mx-auto p-4 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                <h1 className="text-lg font-bold text-gray-900">Ayants Droit</h1>
                <Link
                    to="/dependents/new"
                    className="bg-[#1e3a5f] text-white rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90"
                >
                    + Déclarer un ayant droit
                </Link>
            </div>

            {isLoading ? (
                <div className="flex justify-center p-10">
                    <div className="w-8 h-8 border-2 border-[#1e3a5f] border-t-transparent rounded-full animate-spin" />
                </div>
            ) : dependents.length === 0 ? (
                <p className="text-sm text-gray-500 text-center mt-10">Aucun ayant droit déclaré pour le moment.</p>
            ) : (
                <div className="space-y-3">
                    {dependents.map((dep) => (
                        <div key={dep.id} className="bg-white rounded-xl border border-gray-200 p-4 flex gap-3">
                            {dep.photo_url ? (
                                <img src={dep.photo_url} alt="" className="w-12 h-12 rounded-full object-cover shrink-0" />
                            ) : (
                                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 shrink-0">
                                    👤
                                </div>
                            )}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between mb-1">
                                    <span className="font-semibold text-sm text-gray-900">{dep.full_name}</span>
                                    <StatusBadge status={dep.validation_status} label={dep.validation_status_label} />
                                </div>
                                <p className="text-sm text-gray-600">
                                    {dep.relationship_label}
                                    {dep.age !== null ? ` · ${dep.age} ans` : ''}
                                </p>
                                {dep.validation_status === 'rejected' && dep.rejection_reason && (
                                    <p className="text-xs text-red-600 mt-1">Motif : {dep.rejection_reason}</p>
                                )}
                                {dep.validation_status === 'pending' && (
                                    <button
                                        onClick={() => handleDelete(dep)}
                                        className="text-xs font-semibold text-red-600 hover:underline mt-2"
                                    >
                                        Retirer
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}