import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchLeaves } from '../api/leaves';
import type { LeaveSummary } from '../api/leaves';
import { extractApiError } from '../api/client';
import { useLang } from '../context/LangContext';
import { isoToFr } from '../lib/dates';

const STATUS_STYLES: Record<LeaveSummary['status'], { bg: string; text: string }> = {
    pending: { bg: 'bg-amber-100', text: 'text-amber-800' },
    approved: { bg: 'bg-green-100', text: 'text-green-800' },
    rejected: { bg: 'bg-red-100', text: 'text-red-800' },
};

export default function LeavesPage() {
    const { tr } = useLang();
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
            alert(extractApiError(error, tr.api).message);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="max-w-3xl mx-auto p-4 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                <h1 className="text-lg font-bold text-gray-900">{tr.leaves.title}</h1>
                <Link
                    to="/leaves/new"
                    className="bg-primary text-white rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90"
                >
                    {tr.leaves.add}
                </Link>
            </div>

            {isLoading ? (
                <div className="flex justify-center p-10">
                    <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                </div>
            ) : leaves.length === 0 ? (
                <p className="text-sm text-gray-500 text-center mt-10">{tr.leaves.empty}</p>
            ) : (
                <div className="space-y-3">
                    {leaves.map((leave) => {
                        const style = STATUS_STYLES[leave.status];
                        return (
                            <Link
                                key={leave.id}
                                to={`/leaves/${leave.id}`}
                                className="block bg-surface rounded-xl border border-gray-200 p-4 hover:border-gray-300 transition"
                            >
                                <div className="flex items-start justify-between mb-1">
                                    <span className="font-semibold text-sm text-gray-900">{leave.leave_type}</span>
                                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${style.bg} ${style.text}`}>
                                        {tr.leaves.status[leave.status]}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-600">
                                    {tr.leaves.range(isoToFr(leave.start_date), isoToFr(leave.end_date))} ·{' '}
                                    {tr.leaves.days(leave.total_days)}
                                    {leave.is_split ? tr.leaves.split : ''}
                                </p>
                                {leave.status === 'pending' && leave.current_step && (
                                    <p className="text-xs text-amber-700 mt-1">{tr.leaves.currentStep(leave.current_step)}</p>
                                )}
                                {leave.status === 'approved' && (
                                    <p className="text-xs text-gray-500 mt-1">
                                        {leave.has_returned ? tr.leaves.returnRecorded : tr.leaves.returnPending}
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