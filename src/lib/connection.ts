/**
 * État de la connexion, sans dépendance : combine l'indicateur du navigateur
 * (`navigator.onLine`) et la réalité des appels API, car un Wi-Fi associé sans
 * sortie internet laisse `navigator.onLine` à true.
 */

import { useEffect, useState } from 'react';
import { NETWORK_DOWN_EVENT, NETWORK_UP_EVENT } from '../api/client';

export interface Connection {
  /** true seulement si le navigateur ET l'API sont joignables. */
  online: boolean;
  /** false dès que le navigateur déclare la coupure. */
  browserOnline: boolean;
}

export function useConnection(): Connection {
  const [browserOnline, setBrowserOnline] = useState(() => navigator.onLine);
  const [apiReachable, setApiReachable] = useState(true);

  useEffect(() => {
    const up = () => setBrowserOnline(true);
    const down = () => setBrowserOnline(false);
    const apiUp = () => setApiReachable(true);
    const apiDown = () => setApiReachable(false);

    window.addEventListener('online', up);
    window.addEventListener('offline', down);
    window.addEventListener(NETWORK_UP_EVENT, apiUp);
    window.addEventListener(NETWORK_DOWN_EVENT, apiDown);

    return () => {
      window.removeEventListener('online', up);
      window.removeEventListener('offline', down);
      window.removeEventListener(NETWORK_UP_EVENT, apiUp);
      window.removeEventListener(NETWORK_DOWN_EVENT, apiDown);
    };
  }, []);

  return { online: browserOnline && apiReachable, browserOnline };
}
