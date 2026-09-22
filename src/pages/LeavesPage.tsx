import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchLeaves } from '../api/leaves';
import type { LeaveSummary } from '../api/leaves';
import { extractApiError } from '../api/client';

const STATUS_STYLES: Record<LeaveSummary['status'], { bg: string; text: string; label: string }> = {
    pending: { bg: 'bg-amber-100', text: 'text-amber-800', label: 'En attente' },
    approved: { bg: 'bg-green-100', text: 'text-green-800', label: 'Approuvé' },
    rejected: { bg: 'bg-red-100', text: 'text-red-800', label: 'Rejeté' },
};

export default function LeavesPage() {
    const [leaves, setLeaves] = useState<LeaveSummary[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        load();
    }, []);

    async function load() {
        setIsLoading(true);
        try {
            const data = await fetchLeaves();
            setLeaves(data);
        } catch (error) {
            alert(extractApiError(error).message);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="max-w-3xl mx-auto p-4 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                <h1 className="text-lg font-bold text-gray-900">Mes Congés</h1>
                <Link
                    to="/leaves/new"
                    className="bg-[#1e3a5f] text-white rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90"
                >
                    + Nouvelle demande
                </Link>
            </div>

            {isLoading ? (
                <div className="flex justify-center p-10">
                    <div className="w-8 h-8 border-2 border-[#1e3a5f] border-t-transparent rounded-full animate-spin" />
                </div>
            ) : leaves.length === 0 ? (
                <p className="text-sm text-gray-500 text-center mt-10">Aucune demande de congé pour le moment.</p>
            ) : (
                <div className="space-y-3">
                    {leaves.map((leave) => {
                        const style = STATUS_STYLES[leave.status];
                        return (
                            <Link
                                key={leave.id}
                                to={`/leaves/${leave.id}`}
                                className="block bg-white rounded-xl border border-gray-200 p-4 hover:border-gray-300 transition"
                            >
                                <div className="flex items-start justify-between mb-1">
                                    <span className="font-semibold text-sm text-gray-900">{leave.leave_type}</span>
                                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${style.bg} ${style.text}`}>
                                        {style.label}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-600">
                                    {leave.start_date} → {leave.end_date} · {leave.total_days} j
                                    {leave.is_split ? ' (fractionné)' : ''}
                                </p>
                                {leave.status === 'pending' && leave.current_step && (
                                    <p className="text-xs text-amber-700 mt-1">Étape en cours : {leave.current_step}</p>
                                )}
                                {leave.status === 'approved' && (
                                    <p className="text-xs text-gray-500 mt-1">
                                        {leave.has_returned ? '✅ Retour enregistré' : '⏳ Retour non encore enregistré'}
                                    </p>
                                )}
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}