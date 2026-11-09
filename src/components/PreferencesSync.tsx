import { useCallback, useEffect, useRef, useState } from 'react';
import { TOKEN_STORAGE_KEY } from '../api/client';
import { fetchPreferences, savePreferences } from '../api/preferences';
import type { SyncedPreferences } from '../api/preferences';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';
import { PREFERENCES_CHANGED_EVENT } from '../lib/preferences';
import { applySynced, collectSynced, fingerprint, mergeWithLocalEdits } from '../lib/preferenceSync';
import { PREFERENCES_RETRY_EVENT, reportSyncStatus, syncStatusFromError } from '../lib/preferenceSyncStatus';

/**
 * Une écriture par réglage, pas par clic : l'agent qui ajuste sa taille de police en
 * trois coups ne va pas envoyer trois requêtes.
 */
const PUSH_DEBOUNCE_MS = 800;

function isSignedIn(): boolean {
    return Boolean(localStorage.getItem(TOKEN_STORAGE_KEY));
}

/**
 * Fait suivre les réglages de l'agent d'un appareil à l'autre, sans écran à ouvrir :
 * ce composant ne rend rien.
 *
 * À la connexion, le compte reprend la main sur ce que l'appareil traîne — sauf ce que
 * l'onglet a changé depuis son ouverture, qui reste le choix en cours. Ensuite, chaque
 * réglage touché est repoussé vers le compte, une fois le calme revenu.
 *
 * L'échange reste silencieux à l'usage, mais pas muet : chaque étape est publiée dans
 * `lib/preferenceSyncStatus`, que l'écran Préférences affiche. Le travail se poursuit sans
 * le serveur — un envoi manqué ne coûte que la fidélité entre appareils, et l'agent doit
 * pouvoir le savoir, sinon il croit ses réglages partis alors qu'ils sont restés ici.
 *
 * L'adresse du serveur n'est jamais de la partie : elle regarde le réseau de l'appareil,
 * pas la personne (voir lib/apiBase.ts).
 */
export default function PreferencesSync() {
    const { user } = useAuth();
    const { setLang } = useLang();

    const hydratedFor = useRef<number | null>(null);
    const lastSent = useRef<string>('');
    const lastExchange = useRef<number | null>(null);
    const timer = useRef<number | null>(null);

    // L'état de l'appareil à l'ouverture de l'onglet : la borne de l'arbitrage.
    const [bootSnapshot] = useState(collectSynced);

    const pushIfChanged = useCallback(async () => {
        // Ni compte, ni hydratation : toute écriture ici écraserait le compte avec des
        // valeurs que l'agent n'a pas encore eues l'occasion de choisir.
        if (!isSignedIn() || hydratedFor.current === null) return;

        const snapshot = collectSynced();
        const printed = fingerprint(snapshot);

        if (printed === lastSent.current) {
            // Rien à envoyer : le compte et cet appareil sont d'accord, la dernière
            // échéance en date reste celle qu'on affiche.
            reportSyncStatus({ kind: 'synced', at: lastExchange.current ?? Date.now(), sent: false });

            return;
        }

        const previous = lastSent.current;
        lastSent.current = printed;
        reportSyncStatus({ kind: 'writing' });

        try {
            await savePreferences(snapshot);
            lastExchange.current = Date.now();
            reportSyncStatus({ kind: 'synced', at: lastExchange.current, sent: true });
        } catch (error) {
            // Le serveur n'a pas la copie : on laisse la comparaison en arrière pour
            // qu'un prochain réglage, ou la reprise demandée à l'écran, retente l'écriture.
            lastSent.current = previous;
            reportSyncStatus(syncStatusFromError(error));
        }
    }, []);

    /** Relit le compte, applique sa copie, puis pousse ce qu'il ignore encore. */
    const hydrate = useCallback(async (userId: number) => {
        hydratedFor.current = userId;
        reportSyncStatus({ kind: 'reading' });

        const local = collectSynced();
        let remote: SyncedPreferences | null;

        try {
            remote = await fetchPreferences();
        } catch (error) {
            reportSyncStatus(syncStatusFromError(error));

            return;
        }

        // Une réponse qui arrive après une reconnexion, ou après la déconnexion, ne doit
        // rien appliquer : les réglages qu'elle porte ne sont plus ceux de cette session.
        if (hydratedFor.current !== userId) return;

        const merged = remote === null ? local : mergeWithLocalEdits(remote, bootSnapshot, local);

        // La référence se place avant l'application : celle-ci signale le changement,
        // et le minuteur qui suit ne doit pousser que ce que le compte ignore encore.
        lastSent.current = fingerprint(remote);
        lastExchange.current = Date.now();
        applySynced(merged, setLang);
        void pushIfChanged();
    }, [bootSnapshot, pushIfChanged, setLang]);

    useEffect(() => {
        const userId = user?.id ?? null;

        if (userId === null) {
            hydratedFor.current = null;
            lastSent.current = '';

            if (timer.current !== null) {
                window.clearTimeout(timer.current);
                timer.current = null;
            }

            reportSyncStatus({ kind: 'idle' });

            return;
        }

        if (hydratedFor.current === userId) return;

        void hydrate(userId);
    }, [user?.id, hydrate]);

    // « Synchroniser maintenant » à l'écran Préférences : la même lecture que la connexion,
    // provoquée sans recharger la page.
    useEffect(() => {
        function onRetry() {
            const userId = user?.id ?? null;

            if (userId === null) return;

            hydratedFor.current = null;
            lastSent.current = '';
            void hydrate(userId);
        }

        window.addEventListener(PREFERENCES_RETRY_EVENT, onRetry);

        return () => window.removeEventListener(PREFERENCES_RETRY_EVENT, onRetry);
    }, [hydrate, user?.id]);

    useEffect(() => {
        function schedulePush() {
            if (timer.current !== null) window.clearTimeout(timer.current);

            reportSyncStatus({ kind: 'queued' });

            timer.current = window.setTimeout(() => {
                timer.current = null;
                void pushIfChanged();
            }, PUSH_DEBOUNCE_MS);
        }

        window.addEventListener(PREFERENCES_CHANGED_EVENT, schedulePush);

        return () => {
            window.removeEventListener(PREFERENCES_CHANGED_EVENT, schedulePush);

            if (timer.current !== null) {
                window.clearTimeout(timer.current);
                timer.current = null;
            }
        };
    }, [pushIfChanged]);

    return null;
}
