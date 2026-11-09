import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchLeave } from '../api/leaves';
import type { LeaveDetail, LeaveStep } from '../api/leaves';
import { extractApiError } from '../api/client';
import { useLang } from '../context/LangContext';
import { isoToFr } from '../lib/dates';

export default function LeaveDetailPage() {
    const { id } = useParams<{ id: string }>();
    const { tr } = useLang();
    const [leave, setLeave] = useState<LeaveDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (id) load(Number(id));
    }, [id]);

    async function load(leaveId: number) {
        setIsLoading(true);
        try {
            const data = await fetchLeave(leaveId);
            setLeave(data);
        } catch (error) {
            alert(extractApiError(error, tr.api).message);
        } finally {
            setIsLoading(false);
        }
    }

    if (isLoading) {
        return (
            <div className="flex justify-center p-10">
                <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!leave) {
        return <div className="p-10 text-gray-500">{tr.leaves.loadFailed}</div>;
    }

    return (
        <div className="max-w-2xl mx-auto p-4 sm:p-8">
            <div className="bg-surface rounded-xl border border-gray-200 p-6 mb-4">
                <h1 className="text-lg font-bold text-accent">{leave.leave_type}</h1>
                <p className="text-sm text-gray-700 mt-1">
                    {tr.leaves.range(isoToFr(leave.start_date), isoToFr(leave.end_date))} ({tr.leaves.daysLong(leave.total_days)})
                </p>
                {leave.is_split && leave.start_date_2 && leave.end_date_2 && (
                    <p className="text-sm text-gray-500 mt-1">
                        {tr.leaves.secondTake(isoToFr(leave.start_date_2), isoToFr(leave.end_date_2))}
                    </p>
                )}

                <DetailRow label={tr.leaves.reasonField} value={leave.reason} />
                {leave.destination && <DetailRow label={tr.leaves.destination} value={leave.destination} />}
                {leave.address_during_leave && (
                    <DetailRow label={tr.leaves.addressDuringLeave} value={leave.address_during_leave} />
                )}
                {leave.replacement && <DetailRow label={tr.leaves.replacement} value={leave.replacement} />}
            </div>

            {leave.status === 'rejected' && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
                    <p className="font-semibold text-sm text-red-800">{tr.leaves.rejectedTitle}</p>
                    {leave.rejection_reason && <p className="text-sm text-red-700 mt-1">{leave.rejection_reason}</p>}
                </div>
            )}

            {leave.status === 'approved' && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
                    <p className="font-semibold text-sm text-green-800">{tr.leaves.approvedTitle}</p>
                    <p className="text-sm text-green-700 mt-1">
                        {leave.has_returned ? tr.leaves.returnedYes : tr.leaves.returnedNo}
                    </p>
                </div>
            )}

            <div className="bg-surface rounded-xl border border-gray-200 p-6">
                <h2 className="text-sm font-bold text-accent mb-4">{tr.leaves.circuitTitle}</h2>
                {leave.steps.map((step, index) => (
                    <StepRow key={step.order} step={step} isLast={index === leave.steps.length - 1} />
                ))}
            </div>
        </div>
    );
}

function DetailRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="mt-3">
            <p className="text-xs font-semibold text-gray-500">{label}</p>
            <p className="text-sm text-gray-900 mt-0.5">{value}</p>
        </div>
    );
}

function StepRow({ step, isLast }: { step: LeaveStep; isLast: boolean }) {
    const { tr } = useLang();
    const config = {
        approved: { color: 'text-green-600', icon: '✅' },
        rejected: { color: 'text-red-600', icon: '❌' },
        pending: { color: 'text-amber-600', icon: '⏳' },
        skipped: { color: 'text-gray-400', icon: '➖' },
    }[step.status];

    return (
        <div className="flex gap-3">
            <div className="flex flex-col items-center">
                <span className={config.color}>{config.icon}</span>
                {!isLast && <div className="w-px flex-1 bg-gray-200 my-1" />}
            </div>
            <div className="pb-4">
                <p className={`text-sm font-semibold ${config.color}`}>{step.name}</p>
                {step.resolved_by && <p className="text-xs text-gray-400 mt-0.5">{tr.leaves.actedBy(step.resolved_by)}</p>}
                {step.acted_at && <p className="text-xs text-gray-400">{step.acted_at}</p>}
                {step.comments && <p className="text-sm text-gray-700 mt-1 italic">{step.comments}</p>}
            </div>
        </div>
    );
}
