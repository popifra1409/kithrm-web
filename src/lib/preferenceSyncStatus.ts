/** L'état visible de la synchronisation par compte.
 *
 * `PreferencesSync` ne rend rien et travaille en silence : c'est volontaire, un agent qui
 * règle sa police n'a pas à attendre le serveur. Mais ce silence a un prix — quand l'envoi
 * échoue, l'appareil continue de marcher et personne ne sait que le compte, lui, n'a rien
 * reçu. Ce module porte donc l'état jusqu'à l'écran Préférences, où il devient une phrase.
 *
 * La logique d'échange reste dans `lib/preferenceSync.ts` et le composant : ici, uniquement
 * la mémoire de ce qui vient de se passer.
 */

export type SyncStatus =
    /** Rien à dire : aucune session en cours, ou première seconde avant la lecture du compte. */
    | { kind: 'idle' }
    | { kind: 'reading' }
    | { kind: 'queued' }
    | { kind: 'writing' }
    /** Dernier échange accepté par le compte. `sent` : c'est une écriture, pas seulement une lecture. */
    | { kind: 'synced'; at: number; sent: boolean }
    | { kind: 'offline' }
    /** L'API joignée ignore la route des réglages : page plus récente qu'elle. */
    | { kind: 'noRoute' }
    | { kind: 'refused'; status: number };

export const PREFERENCES_RETRY_EVENT = 'kithrm:preferences-retry';

/** À appeler par l'écran : relire le compte et pousser ce qui manque, sans recharger la page. */
export function requestSyncRetry(): void {
    window.dispatchEvent(new Event(PREFERENCES_RETRY_EVENT));
}

let status: SyncStatus = { kind: 'idle' };
const listeners = new Set<() => void>();

function same(one: SyncStatus, other: SyncStatus): boolean {
    if (one.kind !== other.kind) return false;

    if (one.kind === 'synced' && other.kind === 'synced') {
        return one.at === other.at && one.sent === other.sent;
    }

    if (one.kind === 'refused' && other.kind === 'refused') return one.status === other.status;

    return true;
}

/**
 * Publie un état. Comparé avant publication : `useSyncExternalStore` exige une référence
 * stable entre deux changements, sinon l'écran se repeint à chaque rendu.
 */
export function reportSyncStatus(next: SyncStatus): void {
    if (same(status, next)) return;

    status = next;

    for (const listener of listeners) listener();
}

export function readSyncStatus(): SyncStatus {
    return status;
}

export function subscribeSyncStatus(listener: () => void): () => void {
    listeners.add(listener);

    return () => listeners.delete(listener);
}

/** Un échec de requête n'a pas la même explication ni le même remède : on les sépare ici. */
export function syncStatusFromError(error: unknown): SyncStatus {
    if (typeof error !== 'object' || error === null) return { kind: 'offline' };

    const response = (error as { response?: { status?: number } }).response;

    if (response === undefined) return { kind: 'offline' };
    if (response.status === 404) return { kind: 'noRoute' };

    return { kind: 'refused', status: response.status ?? 0 };
}
