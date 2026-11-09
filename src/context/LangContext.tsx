import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { fr } from '../i18n/fr';
import type { Dict } from '../i18n/fr';
import { en } from '../i18n/en';
import { announcePreferenceChange } from '../lib/preferences';

export type Lang = 'fr' | 'en';

export const LANG_STORAGE_KEY = 'kithrm_lang';

interface LangValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  /** Le dictionnaire entier de la langue courante : `tr.login.submit`, pas de clé en chaîne. */
  tr: Dict;
}

/** Valeur de l'appareil, telle qu'elle est stockée — la lit aussi la synchronisation par compte. */
export function readStoredLang(): Lang {
  // Tout ce qui n'est pas « en » retombe sur le français : la langue par défaut du
  // portail, y compris si la touche a été écrite par une autre application.
  return localStorage.getItem(LANG_STORAGE_KEY) === 'en' ? 'en' : 'fr';
}

const LangContext = createContext<LangValue>({ lang: 'fr', setLang: () => {}, tr: fr });

/**
 * Langue de l'interface, choisie par l'employé et gardée sur l'appareil. Le français
 * reste la valeur par défaut : personne ne découvre l'anglais par accident.
 */
export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(readStoredLang);

  const setLang = useCallback((next: Lang) => {
    localStorage.setItem(LANG_STORAGE_KEY, next);
    setLangState(next);
    announcePreferenceChange();
  }, []);

  // Les lecteurs d'écran et le navigateur prononcent les étiquettes selon cette valeur ;
  // l'onglet suit, sinon un espace « Employee space » s'appelle « Espace personnel ».
  useEffect(() => {
    document.documentElement.lang = lang;
    document.title = (lang === 'en' ? en : fr).doc.title;
  }, [lang]);

  const value = useMemo(() => ({ lang, setLang, tr: lang === 'en' ? en : fr }), [lang, setLang]);

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang(): LangValue {
  return useContext(LangContext);
}
