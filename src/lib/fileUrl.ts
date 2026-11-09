import { apiClient } from '../api/client';

/**
 * L'API renvoie ses pièces jointes (logo, photos, actes, diplômes, pièces de contrat) sous
 * forme de chemin relatif à l'application : « /storage/hospital/logo.png ».
 *
 * Ces fichiers sont servis par le serveur de l'API, pas par celui du front : le domaine
 * public de l'application web et l'adresse du réseau local ne désignent donc pas le même
 * hôte pour un chemin donné. Une URL absolue fabriquée côté serveur ne peut être correcte
 * que pour l'une des deux entrées d'accès — elle est résolue ici, contre l'adresse de l'API
 * telle que cet appareil l'a choisie.
 */
export function fileUrl(value: string | null | undefined): string | null {
    if (!value) return null;

    // Valeur héritée d'un réglage déjà absolu : transmise telle quelle.
    if (!value.startsWith('/')) return value;

    return apiFileHost() + value;
}

/** Racine du serveur d'API, la base courante débarrassée de son préfixe « /api ». */
export function apiFileHost(): string {
    const base = (apiClient.defaults.baseURL ?? '').replace(/\/+$/, '');

    return base.replace(/\/api$/, '');
}
