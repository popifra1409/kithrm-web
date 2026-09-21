type Status = 'pending' | 'validated' | 'rejected';

const STYLES: Record<Status, { bg: string; text: string }> = {
    pending: { bg: 'bg-amber-100', text: 'text-amber-800' },
    validated: { bg: 'bg-green-100', text: 'text-green-800' },
    rejected: { bg: 'bg-red-100', text: 'text-red-800' },
};

export default function StatusBadge({ status, label }: { status: Status; label: string }) {
    const style = STYLES[status] ?? STYLES.pending;

    return (
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${style.bg} ${style.text}`}>
            {label}
        </span>
    );
}