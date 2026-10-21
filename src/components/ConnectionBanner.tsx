import { useState } from 'react';
import { fetchAppInfo } from '../api/appInfo';
import { useConnection } from '../lib/connection';

/**
 * Bandeau permanent tant que le serveur est injoignable, pour qu'un agent ne
 * croie pas que l'application est cassée alors que c'est la connexion.
 */
export default function ConnectionBanner() {
  const { online, browserOnline } = useConnection();
  const [retrying, setRetrying] = useState(false);

  if (online) return null;

  async function retry() {
    setRetrying(true);
    try {
      await fetchAppInfo();
    } catch {
      // L'intercepteur a déjà signalé l'échec ; le bandeau reste affiché.
    } finally {
      setRetrying(false);
    }
  }

  return (
    <div
      role="alert"
      className={`sticky top-0 z-50 px-4 py-2.5 text-white ${browserOnline ? 'bg-amber-600' : 'bg-red-600'}`}
    >
      <div className="max-w-2xl mx-auto flex items-start gap-3">
        <span className="text-lg leading-none mt-0.5" aria-hidden>
          {browserOnline ? '⚠️' : '📶'}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">
            {browserOnline
              ? 'Le serveur de la RH est injoignable'
              : 'Connexion internet perdue'}
          </p>
          <p className="text-xs text-white/90 mt-0.5">
            {browserOnline
              ? 'Ton réseau fonctionne, mais le serveur ne répond pas. Réessaie dans un instant.'
              : 'Vérifie le Wi-Fi ou les données mobiles de l’appareil.'}
          </p>
          <p className="text-xs text-white/90 mt-0.5">
            Tes informations déjà saisies restent enregistrées sur cet appareil.
          </p>
        </div>
        <button
          onClick={retry}
          disabled={retrying}
          className="shrink-0 text-xs font-semibold bg-white/20 hover:bg-white/30 disabled:opacity-60 rounded-lg px-3 py-1.5 transition"
        >
          {retrying ? 'Test…' : 'Réessayer'}
        </button>
      </div>
    </div>
  );
}
