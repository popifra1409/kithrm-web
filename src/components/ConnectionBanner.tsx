import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchAppInfo } from '../api/appInfo';
import { useConnection } from '../lib/connection';
import { useLang } from '../context/LangContext';
import { currentApiBase } from '../lib/apiBase';
import { probeEndpoint, probeServer } from '../lib/serverProbe';
import type { Probe } from '../lib/serverProbe';

/**
 * Bandeau permanent tant que le serveur est injoignable, pour qu'un agent ne
 * croie pas que l'application est cassée alors que c'est la connexion.
 *
 * Une requête qui échoue sans réponse ne dit pourtant presque rien : le serveur peut être
 * muet, le réseau coupé, ou le navigateur avoir interdit la lecture d'une réponse bien
 * arrivée. La sonde d'adresse sépare ces cas — les mêmes que l'écran Préférences — et chacun a
 * sa phrase. Chercher une panne réseau là où le fichier de déploiement porte la mauvaise
 * adresse y laisserait l'agent sans solution.
 */
export default function ConnectionBanner() {
  const { online, browserOnline } = useConnection();
  const { tr } = useLang();
  const [retrying, setRetrying] = useState(false);
  const [probe, setProbe] = useState<Probe>({ kind: 'idle' });
  const explaining = useRef(false);

  const explain = useCallback(async () => {
    if (explaining.current) return;

    explaining.current = true;
    try {
      setProbe(await probeServer(probeEndpoint(currentApiBase())));
    } finally {
      explaining.current = false;
    }
  }, []);

  useEffect(() => {
    // Une panne qui commence mérite son explication. Rien à faire quand tout va bien : le
    // bandeau ne rend plus, et la panne suivante passera de nouveau par ici.
    // Le navigateur déclare-t-il la coupure ? La sonde échouerait pour la même raison et
    // apprendrait moins que « Connexion internet perdue ».
    if (!online && browserOnline) void explain();
  }, [online, browserOnline, explain]);

  async function retry() {
    setRetrying(true);
    try {
      await fetchAppInfo();
    } catch {
      // L'intercepteur a déjà signalé l'échec ; on cherche cette fois pourquoi.
      void explain();
    } finally {
      setRetrying(false);
    }
  }

  if (online) return null;

  function words(): { title: string; detail: string } {
    const s = tr.connection;

    if (!browserOnline) return { title: s.internetLost, detail: s.internetLostDetail };

    switch (probe.kind) {
      case 'blocked':
        return { title: s.mixedContent, detail: s.mixedContentDetail };
      case 'opaque':
        return { title: s.originBlocked, detail: s.originBlockedDetail };
      case 'http':
        return { title: s.serverAnswers, detail: s.serverAnswersDetail };
      default:
        return { title: s.serverUnreachable, detail: s.serverUnreachableDetail };
    }
  }

  const text = words();

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
          <p className="text-sm font-semibold">{text.title}</p>
          <p className="text-xs text-white/90 mt-0.5">{text.detail}</p>
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
