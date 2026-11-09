import { apiClient } from './client';

/**
 * Les réglages qui suivent le compte d'un appareil à l'autre.
 *
 * L'adresse du serveur en est exclue, des deux côtés : elle dépend du réseau où l'appareil
 * est branché (Wifi de la structure, maison, 4G), pas de la personne. Un compte dont le
 * téléphone aurait enregistré le réseau local ne pourrait plus se connecter ailleurs.
 */
export interface SyncedPreferences {
    lang: 'fr' | 'en';
    font_scale: 'sm' | 'md' | 'lg';
    font_family: 'system' | 'arial' | 'verdana' | 'georgia';
    theme: 'light' | 'dark' | 'system';
}

/** `null` : le compte n'a encore rien enregistré, l'appareil est seul juge. */
export async function fetchPreferences(): Promise<SyncedPreferences | null> {
    const { data } = await apiClient.get<{ preferences: SyncedPreferences | null }>('/preferences');

    return data.preferences ?? null;
}

export async function savePreferences(preferences: SyncedPreferences): Promise<SyncedPreferences | null> {
    const { data } = await apiClient.put<{ preferences: SyncedPreferences | null }>(
        '/preferences',
        { preferences },
    );

    return data.preferences ?? null;
}
