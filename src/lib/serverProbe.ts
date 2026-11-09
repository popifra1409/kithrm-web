import type { AppInfo } from '../api/appInfo';

/**
 * Sonde d'adresse : « ce serveur répond-il, et ce navigateur a-t-il le droit d'en lire la
 * réponse ? ». Les deux questions comptent — une adresse joignable mais illisible ne vaut
 * rien pour l'application, et les deux se ressemblent depuis la page.
 *
 * Elle vit ici parce que deux écrans ont besoin de la même réponse : Préférences, qui la
 * demande explicitement, et le bandeau de connexion, qui l'emploie pour expliquer une panne
 * au lieu de renvoyer l'agent chercher une coupure réseau là où c'est un réglage du serveur.
 */

/** Au-delà, on le dit : un serveur qui met plus de temps reste un serveur qu'on ne peut pas utiliser. */
export const PROBE_TIMEOUT_MS = 3000;

export type Probe =
    | { kind: 'idle' }
    | { kind: 'pending' }
    | { kind: 'ok'; ms: number; name: string | null }
    | { kind: 'http'; status: number }
    | { kind: 'opaque'; ms: number }
    | { kind: 'timeout' }
    | { kind: 'blocked' }
    | { kind: 'unreachable' };

/** Le point d'entrée testé : la base, + l'appel public qui répond le plus vite et le plus petit. */
export function probeEndpoint(base: string): string {
    return new URL(`${base}/app-info`, document.baseURI).href;
}

/**
 * Une page servie en https ne peut pas appeler une adresse en http : le navigateur coupe la
 * requête avant son départ. Se vérifier soi-même évite d'envoyer une requête certaine d'échouer
 * et de lire son erreur brute comme une panne du serveur.
 */
export function isBlockedByProtocol(url: string): boolean {
    return window.location.protocol === 'https:' && url.startsWith('http://');
}

type Attempt =
    | { status: 'answered'; response: Response; ms: number }
    | { status: 'timeout' }
    | { status: 'error' };

async function attempt(url: string, mode: RequestMode, deadline: number): Promise<Attempt> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), Math.max(0, deadline - performance.now()));
    const startedAt = performance.now();

    try {
        const response = await fetch(url, {
            mode,
            cache: 'no-store',
            signal: controller.signal,
            headers: { Accept: 'application/json' },
        });

        return { status: 'answered', response, ms: Math.round(performance.now() - startedAt) };
    } catch {
        return { status: performance.now() >= deadline ? 'timeout' : 'error' };
    } finally {
        clearTimeout(timer);
    }
}

export async function probeServer(url: string): Promise<Probe> {
    if (isBlockedByProtocol(url)) return { kind: 'blocked' };

    const deadline = performance.now() + PROBE_TIMEOUT_MS;
    const cors = await attempt(url, 'cors', deadline);

    if (cors.status === 'timeout') return { kind: 'timeout' };

    if (cors.status === 'answered') {
        if (!cors.response.ok) return { kind: 'http', status: cors.response.status };

        const info = (await cors.response.json().catch(() => null)) as AppInfo | null;

        return { kind: 'ok', ms: cors.ms, name: info?.hospital_name ?? null };
    }

    // La requête a échoué sans réponse exploitable. Reste à séparer deux cas que la page
    // confondrait : le serveur est muet, ou il a répondu et le navigateur interdit seulement
    // d'en lire le contenu. En mode « no-cors », une réponse opaque est acceptée — si elle
    // arrive, le serveur est donc vivant, et le lui dire évite de chercher une panne réseau
    // là où c'est un réglage du serveur d'API qu'il faut changer.
    const opaque = await attempt(url, 'no-cors', deadline);

    if (opaque.status === 'answered') return { kind: 'opaque', ms: opaque.ms };
    if (opaque.status === 'timeout') return { kind: 'timeout' };

    return { kind: 'unreachable' };
}
