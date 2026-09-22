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