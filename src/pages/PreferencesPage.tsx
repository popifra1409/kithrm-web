import { useEffect, useState, useSyncExternalStore } from 'react';
import type { ReactNode } from 'react';
import { useLang } from '../context/LangContext';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { PROBE_TIMEOUT_MS, probeEndpoint, probeServer } from '../lib/serverProbe';
import type { Probe } from '../lib/serverProbe';
import { readSyncStatus, requestSyncRetry, subscribeSyncStatus } from '../lib/preferenceSyncStatus';
import {
    apiBaseStatus,
    applyApiBase,
    currentApiBase,
    initApiBase,
    normalizeApiBase,
    readApiBaseOverride,
    writeApiBaseOverride,
} from '../lib/apiBase';
import type { ApiBaseResolution } from '../lib/apiBase';
import { PREFERENCES_CHANGED_EVENT, FONT_FAMILIES, FONT_SCALES, THEME_CHOICES,
    applyFontFamily,
    applyFontScale,
    applyTheme,
    fontFamilyStack,
    readFontFamily,
    readFontScale,
    readTheme,
    writeFontFamily,
    writeFontScale,
    writeTheme,
} from '../lib/preferences';
import type { FontFamily, FontScale, ThemeChoice } from '../lib/preferences';

type AddressFeedback = 'saved' | 'cleared' | 'invalid' | 'empty' | 'notStored' | null;


function Section({ title, children }: { title: string; children: ReactNode }) {
    return (
        <section className="bg-surface rounded-xl border border-gray-200 p-6 mb-6">
            <h2 className="text-sm font-bold text-accent mb-3">{title}</h2>
            {children}
        </section>
    );
}

function OptionRow({ legend, hint, children }: { legend: string; hint?: string; children: ReactNode }) {
    return (
        <div className="mb-5 last:mb-0">
            <p className="text-sm font-medium text-gray-700 mb-1">{legend}</p>
            {hint && <p className="text-xs text-gray-500 mb-2">{hint}</p>}
            <div className="flex flex-wrap gap-2">{children}</div>
        </div>
    );
}

function ChoiceButton({
    active,
    onClick,
    style,
    children,
}: {
    active: boolean;
    onClick: () => void;
    style?: React.CSSProperties;
    children: ReactNode;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-pressed={active}
            style={style}
            className={`px-4 py-2 rounded-lg border text-sm transition ${
                active
                    ? 'bg-primary text-white border-accent font-semibold'
                    : 'bg-surface text-gray-700 border-gray-300 hover:border-accent'
            }`}
        >
            {children}
        </button>
    );
}

export default function PreferencesPage() {
    const { tr } = useLang();
    const t = tr.preferences;

    const [fontScale, setFontScale] = useState<FontScale>(readFontScale);
    const [fontFamily, setFontFamily] = useState<FontFamily>(readFontFamily);
    const [theme, setTheme] = useState<ThemeChoice>(readTheme);
    const [storageRefused, setStorageRefused] = useState(false);

    const [resolution, setResolution] = useState<ApiBaseResolution | null>(apiBaseStatus);
    const [addressDraft, setAddressDraft] = useState(() => readApiBaseOverride() ?? '');
    const [addressFeedback, setAddressFeedback] = useState<AddressFeedback>(null);

    const [probe, setProbe] = useState<Probe>({ kind: 'idle' });

    // L'état de la synchronisation vit dans `lib/preferenceSyncStatus` : c'est le composant
    // `PreferencesSync`, hors de cet écran, qui le publie.
    const syncStatus = useSyncExternalStore(subscribeSyncStatus, readSyncStatus);

    // La synchronisation par compte applique des valeurs pendant que cet écran est ouvert :
    // sans relecture, les boutons resteraient enfoncés sur la valeur d'ouverture et
    // contrediraient ce que l'agent est en train de voir.
    useEffect(() => {
        function reReadDeviceSettings() {
            setFontScale(readFontScale());
            setFontFamily(readFontFamily());
            setTheme(readTheme());
        }

        window.addEventListener(PREFERENCES_CHANGED_EVENT, reReadDeviceSettings);

        return () => window.removeEventListener(PREFERENCES_CHANGED_EVENT, reReadDeviceSettings);
    }, []);

    // Un changement de thème ou de police se voit tout de suite : l'application est immédiate,
    // l'enregistrement n'est que la promesse de la retrouver à la prochaine ouverture.
    function chooseTheme(next: ThemeChoice) {
        applyTheme(next);
        setTheme(next);
        setStorageRefused(!writeTheme(next));
    }

    function chooseFontScale(next: FontScale) {
        applyFontScale(next);
        setFontScale(next);
        setStorageRefused(!writeFontScale(next));
    }

    function chooseFontFamily(next: FontFamily) {
        applyFontFamily(next);
        setFontFamily(next);
        setStorageRefused(!writeFontFamily(next));
    }

    /** Relit le réglage avec la même règle qu'au démarrage : on affiche ce qui sert, pas ce qu'on a voulu écrire. */
    async function reapplyBase(): Promise<ApiBaseResolution> {
        const next = await initApiBase();
        setResolution(next);
        setProbe({ kind: 'idle' });

        return next;
    }

    async function saveAddress() {
        const raw = addressDraft.trim();

        if (raw === '') {
            setAddressFeedback('empty');
            return;
        }

        const normalized = normalizeApiBase(raw);

        if (normalized === null) {
            setAddressFeedback('invalid');
            return;
        }

        const stored = writeApiBaseOverride(normalized);

        if (!stored) {
            // Le navigateur refuse tout : la saisie était bonne, donc c'est le stockage qui
            // lâche. On applique pour cet onglet et on le dit, au lieu d'un faux « enregistré ».
            applyApiBase(normalized);
            setResolution({ base: normalized, origin: 'override', configReadable: false });
            setProbe({ kind: 'idle' });
            setAddressFeedback('notStored');
            return;
        }

        await reapplyBase();
        setAddressFeedback('saved');
    }

    async function clearAddress() {
        writeApiBaseOverride(null);
        await reapplyBase();
        setAddressDraft('');
        setAddressFeedback('cleared');
    }

    async function runProbe() {
        // La sonde connaît le cas de la page sécurisée appelant une adresse non sécurisée :
        // elle le signale avant d'envoyer une requête certaine d'échouer.
        setProbe({ kind: 'pending' });
        setProbe(await probeServer(probeEndpoint(currentApiBase())));
    }

    /**
     * Ce que la synchronisation par compte est en train de faire, ou pourquoi elle ne l'a pas
     * faite. Le composant qui synchronise travaille en silence par nature : sans cette phrase,
     * un agent dont le compte n'a rien reçu croirait ses réglages partis alors qu'ils sont
     * restés sur l'appareil.
     */
    function syncMessage(): { text: string; tone: string } | null {
        const s = t.sync.states;

        switch (syncStatus.kind) {
            case 'idle':
                return null;
            case 'reading':
                return { text: s.reading, tone: 'text-gray-600' };
            case 'queued':
                return { text: s.queued, tone: 'text-gray-600' };
            case 'writing':
                return { text: s.writing, tone: 'text-gray-600' };
            case 'synced':
                return { text: syncStatus.sent ? s.syncedJustNow : s.syncedAligned, tone: 'text-emerald-700' };
            case 'offline':
                return { text: s.offline, tone: 'text-amber-700' };
            case 'noRoute':
                return { text: s.noRoute, tone: 'text-amber-700' };
            case 'refused':
                return { text: s.refused(syncStatus.status), tone: 'text-amber-700' };
        }
    }

    const syncResult = syncMessage();
    const syncBusy = syncStatus.kind === 'reading' || syncStatus.kind === 'queued' || syncStatus.kind === 'writing';
    // L'heure suit la langue de l'interface, non le réglage du poste : un ordinateur configuré
    // en anglais écrirait « 7:20:05 PM » sur un écran français.
    const lastExchange =
        syncStatus.kind === 'synced'
            ? new Intl.DateTimeFormat(tr.date.locale, {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                  hour12: false,
              }).format(new Date(syncStatus.at))
            : null;

    const base = resolution?.base ?? currentApiBase();
    const originLabel = resolution ? t.server.origins[resolution.origin] : null;

    function probeMessage(): { text: string; tone: string } | null {
        const s = t.server;

        switch (probe.kind) {
            case 'idle':
                return null;
            case 'pending':
                return { text: s.testing, tone: 'text-gray-600' };
            case 'ok':
                return {
                    text: probe.name ? s.ok(probe.ms, probe.name) : s.okNoName(probe.ms),
                    tone: 'text-emerald-700',
                };
            case 'http':
                return { text: s.http(probe.status), tone: 'text-amber-700' };
            case 'opaque':
                return { text: s.opaque, tone: 'text-amber-700' };
            case 'timeout':
                return { text: s.timeout(Math.round(PROBE_TIMEOUT_MS / 1000)), tone: 'text-amber-700' };
            case 'blocked':
                return { text: `${s.mixedContent} ${s.mixedContentHowTo}`, tone: 'text-red-700' };
            case 'unreachable':
                return { text: s.unreachable, tone: 'text-red-700' };
        }
    }

    const probeResult = probeMessage();
    const feedbackMessage =
        addressFeedback === 'saved'
            ? t.server.saved
            : addressFeedback === 'cleared'
              ? t.server.cleared
              : addressFeedback === 'invalid'
                ? t.server.invalidAddress
                : addressFeedback === 'empty'
                  ? t.server.emptyAddress
                  : addressFeedback === 'notStored'
                    ? t.server.notStoredAddress
                    : null;

    return (
        <div className="max-w-3xl mx-auto p-4 sm:p-8">
            <h1 className="text-xl font-bold text-gray-900 mb-1">{t.title}</h1>
            <p className="text-sm text-gray-500 mb-6">{t.intro}</p>

            {storageRefused && <p className="text-sm text-amber-700 mb-6">{t.storageRefused}</p>}

            <Section title={t.theme.section}>
                <OptionRow legend={t.theme.label} hint={t.theme.hint}>
                    {THEME_CHOICES.map((choice) => (
                        <ChoiceButton key={choice} active={theme === choice} onClick={() => chooseTheme(choice)}>
                            {t.theme.options[choice]}
                        </ChoiceButton>
                    ))}
                </OptionRow>
            </Section>

            <Section title={t.font.section}>
                <OptionRow legend={t.font.sizeLabel} hint={t.font.sizeHint}>
                    {FONT_SCALES.map((scale) => (
                        <ChoiceButton
                            key={scale}
                            active={fontScale === scale}
                            onClick={() => chooseFontScale(scale)}
                        >
                            {t.font.sizeOptions[scale]}
                        </ChoiceButton>
                    ))}
                </OptionRow>

                <OptionRow legend={t.font.familyLabel} hint={t.font.familyHint}>
                    {FONT_FAMILIES.map((family) => (
                        <ChoiceButton
                            key={family}
                            active={fontFamily === family}
                            onClick={() => chooseFontFamily(family)}
                            style={{ fontFamily: fontFamilyStack(family) ?? undefined }}
                        >
                            {t.font.familyOptions[family]}
                        </ChoiceButton>
                    ))}
                </OptionRow>
            </Section>

            <Section title={t.language.section}>
                <p className="text-xs text-gray-500 mb-3">{t.language.hint}</p>
                <LanguageSwitcher />
            </Section>

            <Section title={t.server.section}>
                <div className="flex flex-wrap items-baseline gap-2 mb-1">
                    <p className="text-sm font-medium text-gray-700">{t.server.currentLabel}</p>
                    <span className="text-sm font-mono text-accent break-all">{base === '' ? '/' : base}</span>
                    {base.startsWith('/') && <span className="text-xs text-gray-500">({t.server.sameOrigin})</span>}
                </div>
                {originLabel && <p className="text-xs text-gray-500 mb-4">{t.server.currentHint(originLabel)}</p>}

                <button
                    type="button"
                    onClick={runProbe}
                    disabled={probe.kind === 'pending'}
                    className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:opacity-90 transition disabled:opacity-50"
                >
                    {probe.kind === 'idle' ? t.server.testButton : t.server.testAgainButton}
                </button>

                {probeResult && <p className={`text-sm mt-3 ${probeResult.tone}`}>{probeResult.text}</p>}

                <div className="mt-6 pt-5 border-t border-gray-100">
                    <p className="text-sm font-medium text-gray-700 mb-1">{t.server.overrideTitle}</p>
                    <p className="text-xs text-gray-500 mb-3">{t.server.overrideHint}</p>

                    <div className="flex flex-wrap gap-2">
                        <input
                            type="text"
                            value={addressDraft}
                            onChange={(event) => {
                                setAddressDraft(event.target.value);
                                setAddressFeedback(null);
                            }}
                            placeholder={t.server.overridePlaceholder}
                            spellCheck={false}
                            autoComplete="off"
                            className="flex-1 min-w-52 px-3 py-2 rounded-lg border border-gray-300 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                        <button
                            type="button"
                            onClick={saveAddress}
                            className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:opacity-90 transition"
                        >
                            {t.server.save}
                        </button>
                        <button
                            type="button"
                            onClick={clearAddress}
                            className="px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 hover:border-accent transition"
                        >
                            {t.server.clear}
                        </button>
                    </div>

                    {feedbackMessage && <p className="text-sm mt-3 text-gray-700">{feedbackMessage}</p>}
                </div>
            </Section>

            {syncResult && (
                <Section title={t.sync.section}>
                    <p className={`text-sm ${syncResult.tone}`}>{syncResult.text}</p>

                    {lastExchange !== null && (
                        <p className="text-xs text-gray-500 mt-1">{t.sync.states.lastExchangeAt(lastExchange)}</p>
                    )}

                    <button
                        type="button"
                        onClick={requestSyncRetry}
                        disabled={syncBusy}
                        className="mt-4 px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 hover:border-accent transition disabled:opacity-50"
                    >
                        {t.sync.retry}
                    </button>

                    <p className="text-xs text-gray-500 mt-2">{t.sync.retryHint}</p>
                    <p className="text-xs text-gray-500 mt-3">{t.sync.note}</p>
                </Section>
            )}
        </div>
    );
}
