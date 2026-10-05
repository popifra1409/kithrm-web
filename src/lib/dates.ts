/**
 * Dates au format francophone JJ-MM-AAAA à l'écran. L'API, elle, échange toujours
 * du AAAA-MM-JJ (ISO) : ces fonctions font le pont, sans aucune dépendance.
 */

/** 'AAAA-MM-JJ' (ou date-heure ISO) → 'JJ-MM-AAAA'. Renvoie '' si vide ou invalide. */
export function isoToFr(iso: string | null | undefined): string {
    if (!iso) return '';

    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
    return match ? `${match[3]}-${match[2]}-${match[1]}` : '';
}

/**
 * 'JJ-MM-AAAA' → 'AAAA-MM-JJ', uniquement si c'est une vraie date du calendrier
 * (le 31-02 ou le 29-02 d'une année non bissextile sont refusés), sinon null.
 * Tolère aussi / . ou espace comme séparateur.
 */
export function frToIso(fr: string): string | null {
    const match = /^(\d{1,2})[-/. ](\d{1,2})[-/. ](\d{4})$/.exec(fr.trim());
    if (!match) return null;

    const day = Number(match[1]);
    const month = Number(match[2]);
    const year = Number(match[3]);

    const date = new Date(Date.UTC(year, month - 1, day));
    const isRealDate =
        date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;

    if (!isRealDate) return null;

    const pad = (n: number, size = 2) => String(n).padStart(size, '0');
    return `${pad(year, 4)}-${pad(month)}-${pad(day)}`;
}

/**
 * Met en forme au fil de la frappe : ne garde que les chiffres et insère les tirets
 * (« 14091977 » → « 14-09-1977 »). Effacer reste naturel : le tiret n'est ajouté
 * qu'à la frappe du chiffre suivant.
 */
export function maskFrDate(input: string): string {
    const digits = input.replace(/\D/g, '').slice(0, 8);

    if (digits.length <= 2) return digits;
    if (digits.length <= 4) return `${digits.slice(0, 2)}-${digits.slice(2)}`;

    return `${digits.slice(0, 2)}-${digits.slice(2, 4)}-${digits.slice(4)}`;
}

/** Date du jour (fuseau local) au format ISO. */
export function todayIso(): string {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');

    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}