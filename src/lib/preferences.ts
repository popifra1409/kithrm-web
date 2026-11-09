/**
 * Réglages d'affichage choisis par l'agent : thème, taille et famille de police.
 *
 * Les trois sont appliqués au document lui-même (attribut et styles en ligne sur `<html>`) et
 * gardés sur l'appareil ; la synchronisation par compte (lib/preferenceSync) en reporting une
 * copie. Aucun fichier de police n'est téléchargé : le portail doit rester identique sur une
 * machine du réseau local sans sortie Internet.
 *
 * La taille se règle sur la police racine, en pourcentage. Tous les espacements de
 * l'interface sont en `rem` (Tailwind), donc l'ensemble grandit avec le texte — boutons,
 * icônes et tableaux compris — et non le texte seul. Un pourcentage et non des pixels : la
 * taille « Normale » laisse la valeur choisie dans le navigateur comme point de départ, au
 * lieu de la remplacer par 16 px, ce qui rétrécirait l'interface d'un agent qui a déjà
 * grossi ses polices pour voir.
 *
 * Le thème n'écrit qu'un attribut `data-theme` : c'est la feuille de style qui retourne les
 * couleurs (voir index.css), y compris celles des contrôles natifs via `color-scheme`.
 */

export type FontScale = 'sm' | 'md' | 'lg';
export type FontFamily = 'system' | 'arial' | 'verdana' | 'georgia';
export type ThemeChoice = 'light' | 'dark' | 'system';

export const FONT_SCALE_KEY = 'kithrm_font_scale';
export const FONT_FAMILY_KEY = 'kithrm_font_family';
export const THEME_KEY = 'kithrm_theme';

/** `null` = aucune contrainte, le navigateur décide. */
const FONT_SCALE_CSS: Record<FontScale, string | null> = {
    sm: '93.75%',
    md: null,
    lg: '112.5%',
};

/**
 * `null` = la police par défaut du portail (celle de Tailwind). Les autres piles n'alignent
 * que des polices livrées avec Windows, macOS et Android : aucune ne doit être chargée.
 */
const FONT_FAMILY_STACK: Record<FontFamily, string | null> = {
    system: null,
    arial: 'Arial, "Helvetica Neue", Helvetica, sans-serif',
    verdana: 'Verdana, Tahoma, "DejaVu Sans", sans-serif',
    georgia: 'Georgia, "Times New Roman", serif',
};

export const FONT_SCALES: readonly FontScale[] = ['sm', 'md', 'lg'];
export const FONT_FAMILIES: readonly FontFamily[] = ['system', 'arial', 'verdana', 'georgia'];
export const THEME_CHOICES: readonly ThemeChoice[] = ['light', 'dark', 'system'];

/**
 * Signalé après chaque réglage écrit : c'est le seul endroit par lequel tous les
 * écrans qui changent l'apparence, la police ou la langue préviennent la synchronisation
 * par compte.
 */
export const PREFERENCES_CHANGED_EVENT = 'kithrm:preferences-changed';

export function announcePreferenceChange(): void {
    window.dispatchEvent(new Event(PREFERENCES_CHANGED_EVENT));
}

function readStoredChoice<T extends string>(key: string, allowed: readonly T[], fallback: T): T {
    let stored: string | null;

    try {
        stored = localStorage.getItem(key);
    } catch {
        // Navigation privée, stockage coupé par une extension : le réglage par défaut s'applique.
        return fallback;
    }

    return stored !== null && (allowed as readonly string[]).includes(stored) ? (stored as T) : fallback;
}

export function readFontScale(): FontScale {
    return readStoredChoice(FONT_SCALE_KEY, FONT_SCALES, 'md');
}

export function readFontFamily(): FontFamily {
    return readStoredChoice(FONT_FAMILY_KEY, FONT_FAMILIES, 'system');
}

export function readTheme(): ThemeChoice {
    return readStoredChoice(THEME_KEY, THEME_CHOICES, 'system');
}

/**
 * « Système » laisse la main à l'OS. Le choix réellement en service est ce que porte
 * `data-theme` : les couleurs sombres sont définies par cette seule valeur.
 */
export function resolveTheme(choice: ThemeChoice): 'light' | 'dark' {
    if (choice !== 'system') return choice;

    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function fontScaleCss(scale: FontScale): string | null {
    return FONT_SCALE_CSS[scale];
}

export function fontFamilyStack(family: FontFamily): string | null {
    return FONT_FAMILY_STACK[family];
}

/**
 * Applique un réglage au document. Séparé de l'enregistrement : un refus du stockage ne doit
 * pas empêcher le réglage d'être visible dans la minute, il empêche seulement de le conserver.
 */
export function applyFontScale(scale: FontScale): void {
    const value = FONT_SCALE_CSS[scale];

    if (value === null) {
        document.documentElement.style.removeProperty('font-size');
        return;
    }

    document.documentElement.style.fontSize = value;
}

/**
 * Le portail hérite de `--font-sans` (la pile par défaut de Tailwind sert à `<html>` via
 * `--default-font-family`) : changer cette seule variable habille toute l'interface, y compris
 * les éléments qui portent la classe `font-sans`.
 */
export function applyFontFamily(family: FontFamily): void {
    const stack = FONT_FAMILY_STACK[family];

    if (stack === null) {
        document.documentElement.style.removeProperty('--font-sans');
        return;
    }

    document.documentElement.style.setProperty('--font-sans', stack);
}

export function applyTheme(choice: ThemeChoice): void {
    document.documentElement.dataset.theme = resolveTheme(choice);
}

/**
 * À appeler avant le premier rendu : le thème et la police doivent être les bons dès le
 * premier affichage, sinon l'agent voit un flash de fond blanc sur un poste réglé en sombre.
 */
export function applyStoredPreferences(): void {
    applyTheme(readTheme());
    applyFontScale(readFontScale());
    applyFontFamily(readFontFamily());

    // Un seul écouteur, pour toute la vie de la page : « Système » doit suivre le réglage de
    // l'OS sans rechargement, les deux autres choix l'ignorent par construction.
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        applyTheme(readTheme());
    });
}

/** Faux quand le navigateur refuse le stockage : le réglage tient jusqu'à la fermeture. */
export function writeFontScale(scale: FontScale): boolean {
    return persist(FONT_SCALE_KEY, scale);
}

export function writeFontFamily(family: FontFamily): boolean {
    return persist(FONT_FAMILY_KEY, family);
}

export function writeTheme(choice: ThemeChoice): boolean {
    return persist(THEME_KEY, choice);
}

function persist(key: string, value: string): boolean {
    try {
        localStorage.setItem(key, value);
    } catch {
        return false;
    }

    // Rien à signaler quand le stockage a refusé : la synchronisation lirait les valeurs
    // par défaut et les écrirait sur le compte.
    announcePreferenceChange();

    return true;
}
