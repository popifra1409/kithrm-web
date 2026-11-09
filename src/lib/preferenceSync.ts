import { readStoredLang } from '../context/LangContext';
import type { Lang } from '../context/LangContext';
import type { SyncedPreferences } from '../api/preferences';
import {
    applyFontFamily,
    applyFontScale,
    applyTheme,
    readFontFamily,
    readFontScale,
    readTheme,
    writeFontFamily,
    writeFontScale,
    writeTheme,
} from './preferences';

/**
 * Allers-retours entre les réglages de l'appareil (localStorage + style du document) et
 * la copie du compte. Le composant `PreferencesSync` seul les orchestre : ici, pas de
 * réseau, juste la lecture, l'écriture et l'arbitrage.
 */

export function collectSynced(): SyncedPreferences {
    return {
        lang: readStoredLang(),
        font_scale: readFontScale(),
        font_family: readFontFamily(),
        theme: readTheme(),
    };
}

/**
 * Empreinte de comparaison : ce que le serveur a en main. `null` (compte neuf) et une
 * empreinte vide sont la même chose — tout réglage local mérite alors d'être monté au compte.
 */
export function fingerprint(preferences: SyncedPreferences | null): string {
    if (preferences === null) return '';

    const { lang, font_scale: scale, font_family: family, theme } = preferences;

    return `${lang}/${scale}/${family}/${theme}`;
}

/**
 * Ce que le compte impose à cet appareil, à une exception près : ce que l'onglet a changé
 * depuis son ouverture. Un agent qui passe en anglais sur l'écran de connexion, puis se
 * connecte, ne doit pas voir son choix annulé par la valeur enregistrée la dernière fois —
 * c'est justement le geste qu'il est en train de faire. En revanche, une valeur que cet
 * appareil traîne sans que personne ne l'ait touchée ici cède la main au compte.
 */
export function mergeWithLocalEdits(
    remote: SyncedPreferences,
    localAtBoot: SyncedPreferences,
    localNow: SyncedPreferences,
): SyncedPreferences {
    const merged: SyncedPreferences = { ...remote };

    if (localNow.lang !== localAtBoot.lang) merged.lang = localNow.lang;
    if (localNow.font_scale !== localAtBoot.font_scale) merged.font_scale = localNow.font_scale;
    if (localNow.font_family !== localAtBoot.font_family) merged.font_family = localNow.font_family;
    if (localNow.theme !== localAtBoot.theme) merged.theme = localNow.theme;

    return merged;
}

/** Écrit l'empreinte reçue sur l'appareil, et seulement ce qui diffère encore. */
export function applySynced(preferences: SyncedPreferences, setLang: (lang: Lang) => void): void {
    if (readStoredLang() !== preferences.lang) setLang(preferences.lang);

    if (readFontScale() !== preferences.font_scale) {
        applyFontScale(preferences.font_scale);
        writeFontScale(preferences.font_scale);
    }

    if (readFontFamily() !== preferences.font_family) {
        applyFontFamily(preferences.font_family);
        writeFontFamily(preferences.font_family);
    }

    if (readTheme() !== preferences.theme) {
        applyTheme(preferences.theme);
        writeTheme(preferences.theme);
    }
}
