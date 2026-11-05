import { useState } from 'react';
import { fetchAppInfo } from '../api/appInfo';
import { useConnection } from '../lib/connection';
import { useLang } from '../context/LangContext';

/**
 * Bandeau permanent tant que le serveur est injoignable, pour qu'un agent ne
 * croie pas que l'application est cassée alors que c'est la connexion.
 */
export default function ConnectionBanner() {
  const { online, browserOnline } = useConnection();
  const { tr } = useLang();
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
            {browserOnline ? tr.connection.serverUnreachable : tr.connection.internetLost}
          </p>
          <p className="text-xs text-white/90 mt-0.5">
            {browserOnline ? tr.connection.serverUnreachableDetail : tr.connection.internetLostDetail}
          </p>
          <p className="text-xs text-white/90 mt-0.5">{tr.connection.draftKept}</p>
        </div>
        <button
          onClick={retry}
          disabled={retrying}
          className="shrink-0 text-xs font-semibold bg-white/20 hover:bg-white/30 disabled:opacity-60 rounded-lg px-3 py-1.5 transition"
        >
          {retrying ? tr.connection.retrying : tr.connection.retry}
        </button>
      </div>
    </div>
  );
}
