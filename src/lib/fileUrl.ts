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

/**
 * Charge l'URL pour savoir si le fichier existe réellement, et la renvoie seulement dans ce cas.
 *
 * Un chemin présent en base n'est pas la preuve que l'objet est sur le disque : le réglage du
 * logo a survécu à la perte du fichier qu'il nommait. Pire, là où le serveur du front réécrit
 * toute demande vers « index.html », un fichier absent répond 200 avec du HTML — le chargement
 * réussit et l'image reste vide. D'où le contrôle sur « naturalWidth », qui ne peut être nul
 * que pour un fichier que le navigateur n'a pas su décoder comme image.
 *
 * Réservé aux URL que rien n'affiche et qui ne peuvent donc pas s'écrouler d'elles-mêmes : le
 * favicon de l'onglet. Pour une image montée dans la page, « onError » suffit et coûte un
 * aller-retour de moins — voir le composant StructureLogo.
 */
export function loadableFileUrl(value: string | null | undefined, timeoutMs = 10000): Promise<string | null> {
    const url = fileUrl(value);

    if (!url) return Promise.resolve(null);

    return new Promise((resolve) => {
        const image = new Image();

        const settle = (usable: boolean) => {
            clearTimeout(timer);
            image.onload = null;
            image.onerror = null;
            resolve(usable ? url : null);
        };

        const timer = setTimeout(() => settle(false), timeoutMs);

        image.onload = () => settle(image.naturalWidth > 0);
        image.onerror = () => settle(false);
        image.src = url;
    });
}
