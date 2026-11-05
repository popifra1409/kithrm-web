import { useLang } from '../context/LangContext';
import type { Lang } from '../context/LangContext';

const OPTIONS: { code: Lang; short: string }[] = [
    { code: 'fr', short: 'FR' },
    { code: 'en', short: 'EN' },
];

/**
 * Deux boutons plutôt qu'un menu déroulant : changer de langue est un geste qu'on fait
 * une fois, il doit rester visible sans ouvrir quoi que ce soit.
 */
export default function LanguageSwitcher({ tone = 'light' }: { tone?: 'light' | 'dark' }) {
    const { lang, setLang, tr } = useLang();
    const fullName: Record<Lang, string> = { fr: tr.switcher.fr, en: tr.switcher.en };

    return (
        <div
            role="group"
            aria-label={tr.switcher.fieldset}
            className={`inline-flex shrink-0 rounded-lg border p-0.5 ${
                tone === 'dark' ? 'border-white/25' : 'border-gray-200'
            }`}
        >
            {OPTIONS.map((option) => {
                const isActive = lang === option.code;
                return (
                    <button
                        key={option.code}
                        type="button"
                        onClick={() => setLang(option.code)}
                        aria-pressed={isActive}
                        title={fullName[option.code]}
                        className={`px-2 py-1 rounded-md text-[11px] font-bold tracking-wide transition ${
                            isActive
                                ? tone === 'dark'
                                    ? 'bg-white text-[#1e3a5f]'
                                    : 'bg-[#1e3a5f] text-white'
                                : tone === 'dark'
                                  ? 'text-white/70 hover:text-white'
                                  : 'text-gray-500 hover:text-[#1e3a5f]'
                        }`}
                    >
                        {option.short}
                    </button>
                );
            })}
        </div>
    );
}
