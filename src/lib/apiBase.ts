import { apiClient } from '../api/client';

/**
 * Adresse de l'API, décidée à l'exécution et non au build.
 *
 * Le même paquet est servi depuis deux machines qui joignent le même serveur de
 * l'application : le domaine public, où l'API répond sur un hôte séparé, et le serveur du
 * réseau local, où page et API partent de la même origine. Une adresse gravée au build
 * obligait à deux builds — donc à deux artefacts à ne pas confondre.
 *
 * Ordre de priorité :
 *   1. le réglage choisi par l'agent (Préférences), si elle en a enregistré un ;
 *   2. le fichier « config.json » posé à la racine du dossier servi ;
 *   3. la valeur embarquée au build (VITE_API_BASE_URL), repli du poste de développement.
 *
 * En mode développement, le point 2 est ignoré : Vite sert le « public/ » du dépôt, et la
 * copie destinée à la production ferait pointer le poste de travail sur l'API réelle.
 *
 * La base comprend le préfixe sous lequel l'API est montée (« /api », ou
 * « https://api.example.com/api ») : les appels du client sont relatifs à cette base.
 */

/** Clé du réglage saisi dans Préférences. */
export const API_BASE_OVERRIDE_KEY = 'kithrm_api_base';

/** Base gravée au build : le repli quand rien n'est réglé ni déployé. */
export const BUILD_TIME_API_BASE: string = import.meta.env.VITE_API_BASE_URL ?? '';

export type ApiBaseOrigin = 'override' | 'config' | 'build';

export interface ApiBaseResolution {
    /** Base retenue, sans « / » final. Une valeur relative vaut même origine que la page. */
    base: string;
    origin: ApiBaseOrigin;
    /** Le fichier de déploiement était-il présent et exploitable (false s'il est absent). */
    configReadable: boolean;
}

let lastResolution: ApiBaseResolution | null = null;

/**
 * Une base d'API acceptée : relative mais complète (« /api » — même origine que la page), ou
 * une URL absolue http/https. Renvoie null pour une saisie impossible à utiliser — une faute de
 * frappe ne doit pas devenir une adresse que l'application essaierait en silence.
 *
 * Une saisie vide est refusée, alors qu'elle est techniquement une base : les appels du client
 * commencent par « /app-info », donc une base vide les enverrait à la racine du site, là où
 * l'API n'est pas montée. Ce que fait alors l'application ne ressemble plus à une erreur de
 * réglage mais à une API cassée.
 */
export function normalizeApiBase(raw: unknown): string | null {
    if (typeof raw !== 'string') return null;

    const value = raw.trim().replace(/\/+$/, '');

    if (value.startsWith('/')) return value;
    if (/^https?:\/\/[^\s]+$/i.test(value)) return value;

    return null;
}

export function readApiBaseOverride(): string | null {
    let stored: string | null;

    try {
        stored = localStorage.getItem(API_BASE_OVERRIDE_KEY);
    } catch {
        // Navigation privée, stockage désactivé par une extension : on ignore le réglage.
        return null;
    }

    return stored === null ? null : normalizeApiBase(stored);
}

/** `null` efface le réglage et rend la main au fichier de déploiement. Faux si la saisie est refusée. */
export function writeApiBaseOverride(value: string | null): boolean {
    try {
        if (value === null) {
            localStorage.removeItem(API_BASE_OVERRIDE_KEY);
            return true;
        }

        const normalized = normalizeApiBase(value);

        if (normalized === null) return false;

        localStorage.setItem(API_BASE_OVERRIDE_KEY, normalized);
        return true;
    } catch {
        return false;
    }
}

async function readDeployedConfig(timeoutMs = 2000): Promise<string | null> {
    const url = new URL('config.json', document.baseURI).href;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetch(url, {
            signal: controller.signal,
            cache: 'no-store',
            headers: { Accept: 'application/json' },
        });

        if (!response.ok) return null;

        // Là où le fichier n'a pas été copié, le serveur du front renvoie index.html avec
        // un 200 (réécriture systématique vers la page) : sans ce contrôle, la page
        // d'accueil serait analysée comme une configuration et rien ne distinguerait les deux.
        if (!(response.headers.get('content-type') ?? '').includes('json')) return null;

        const config: unknown = await response.json();

        if (!config || typeof config !== 'object') return null;

        return normalizeApiBase((config as { apiBaseUrl?: unknown }).apiBaseUrl);
    } catch {
        return null;
    } finally {
        clearTimeout(timer);
    }
}

export async function resolveApiBase(): Promise<ApiBaseResolution> {
    const override = readApiBaseOverride();

    if (override !== null) {
        return { base: override, origin: 'override', configReadable: false };
    }

    if (!import.meta.env.DEV) {
        const deployed = await readDeployedConfig();

        if (deployed !== null) {
            return { base: deployed, origin: 'config', configReadable: true };
        }
    }

    return { base: BUILD_TIME_API_BASE.replace(/\/+$/, ''), origin: 'build', configReadable: false };
}

/** Base effectivement utilisée par le client, telle que l'ont réglée les étapes précédentes. */
export function currentApiBase(): string {
    return normalizeApiBase(apiClient.defaults.baseURL) ?? '';
}

/** Dernier arbitrage connu, pour l'écran qui affiche l'adresse en service. */
export function apiBaseStatus(): ApiBaseResolution | null {
    return lastResolution;
}

export function applyApiBase(base: string): void {
    apiClient.defaults.baseURL = base;
}

/** À appeler avant le premier rendu : les écrans demandent leurs données dès leur montage. */
export async function initApiBase(): Promise<ApiBaseResolution> {
    lastResolution = await resolveApiBase();
    applyApiBase(lastResolution.base);

    return lastResolution;
}
