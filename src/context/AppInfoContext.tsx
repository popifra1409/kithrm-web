import React, { createContext, useContext, useEffect, useState } from 'react';
import { fetchAppInfo } from '../api/appInfo';
import type { AppInfo } from '../api/appInfo';

interface AppInfoContextValue {
    appInfo: AppInfo | null;
    isLoading: boolean;
}

const AppInfoContext = createContext<AppInfoContextValue>({ appInfo: null, isLoading: true });

export function AppInfoProvider({ children }: { children: React.ReactNode }) {
    const [appInfo, setAppInfo] = useState<AppInfo | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const data = await fetchAppInfo();
                setAppInfo(data);

                // L'icône de l'onglet doit suivre le logo des « Infos de la structure » :
                // le <link> de index.html n'est qu'un repli tant que l'API n'a pas répondu.
                const iconUrl = data.favicon_url ?? data.logo_url;

                if (iconUrl) {
                    let link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");

                    if (!link) {
                        link = document.createElement('link');
                        link.rel = 'icon';
                        document.head.appendChild(link);
                    }

                    link.type = 'image/png';
                    link.href = iconUrl;
                }
            } catch {
                // Pas grave si ça échoue (ex: hors ligne) — l'app affichera un logo par défaut.
            } finally {
                setIsLoading(false);
            }
        })();
    }, []);

    return <AppInfoContext.Provider value={{ appInfo, isLoading }}>{children}</AppInfoContext.Provider>;
}

export function useAppInfo(): AppInfoContextValue {
    return useContext(AppInfoContext);
}