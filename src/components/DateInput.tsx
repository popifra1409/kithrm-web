import { useEffect, useState } from 'react';
import { frToIso, isoToFr, maskFrDate } from '../lib/dates';

interface DateInputProps {
    label: string;
    /** Date au format ISO (AAAA-MM-JJ) ou '' : c'est ce que l'API attend et renvoie. */
    value: string;
    onChange: (iso: string) => void;
    labelClassName?: string;
    inputClassName?: string;
    /** Champ renvoyé par les Ressources Humaines : à corriger en priorité. */
    flagged?: boolean;
}

const DEFAULT_LABEL = 'block text-xs font-semibold text-gray-500 mb-1';
const DEFAULT_INPUT =
    'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]';
const FLAGGED_INPUT =
    'w-full rounded-lg border border-red-400 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400';

/**
 * Saisie de date au format francophone JJ-MM-AAAA (les tirets se placent tout seuls).
 * Le formulaire hôte continue de manipuler une date ISO : `onChange` reçoit
 * 'AAAA-MM-JJ' quand la date est complète et réelle, et '' tant qu'elle ne l'est pas.
 */
export default function DateInput({
    label,
    value,
    onChange,
    flagged = false,
    labelClassName = DEFAULT_LABEL,
    inputClassName = flagged ? FLAGGED_INPUT : DEFAULT_INPUT,
}: DateInputProps) {
    const [text, setText] = useState(isoToFr(value));

    // Le texte n'est resynchronisé que si la valeur du parent diffère de ce qu'il
    // représente déjà : sinon une saisie en cours (date incomplète = '') serait effacée.
    useEffect(() => {
        if ((frToIso(text) ?? '') !== value) setText(isoToFr(value));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value]);

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
        const masked = maskFrDate(e.target.value);
        setText(masked);
        onChange(frToIso(masked) ?? '');
    }

    const isInvalid = text.length === 10 && frToIso(text) === null;

    return (
        <div>
            <label className={labelClassName}>{label}</label>
            <input
                type="text"
                inputMode="numeric"
                value={text}
                onChange={handleChange}
                placeholder="JJ-MM-AAAA"
                maxLength={10}
                autoComplete="off"
                className={isInvalid ? inputClassName.replace('border-gray-300', 'border-red-500') : inputClassName}
            />
            {isInvalid && <p className="text-xs text-red-600 mt-1">Date invalide. Format attendu : JJ-MM-AAAA.</p>}
            {flagged && !isInvalid && (
                <p className="text-[11px] font-semibold text-red-600 mt-1">↩️ À corriger — demandé par les RH</p>
            )}
        </div>
    );
}