import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { fetchCensusLockState } from '../api/census';
import type { CensusLockState } from '../api/census';

interface CensusLockValue extends CensusLockState {
  /** Tant que le premier état n'est pas revenu, les pages verrouillables attendent. */
  loading: boolean;
  /** Relire l'état après un envoi de recensement, sans recharger la page. */
  refresh: () => Promise<void>;
}

const OFF: CensusLockState = { campaign: null, submission_status: null, stage_label: null, locked: false };

const CensusLockContext = createContext<CensusLockValue>({ ...OFF, loading: true, refresh: async () => {} });

/**
 * Le verrou du recensement, lu une fois pour toute la navigation. Il est relu à chaque
 * changement de page : après un envoi, l'employé doit retrouver l'ajout direct sans
 * avoir à se déconnecter pour que l'état se rafraîchisse.
 */
export function CensusLockProvider({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const [state, setState] = useState<CensusLockState>(OFF);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      setState(await fetchCensusLockState());
    } catch {
      // Hors ligne ou serveur joint mais refuseur : rien n'est fermé. L'API garde le
      // même verrou à l'écriture, donc la tentative suivante expliquera le refus.
      setState(OFF);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [pathname, refresh]);

  const value = useMemo(() => ({ ...state, loading, refresh }), [state, loading, refresh]);

  return <CensusLockContext.Provider value={value}>{children}</CensusLockContext.Provider>;
}

export function useCensusLock(): CensusLockValue {
  return useContext(CensusLockContext);
}

/** Ce qu'on dit à l'employé qu'on renvoie au recensement — une seule fois, trois écrans. */
const LOCK_NOTICES: Record<'dependent' | 'diploma', string> = {
  dependent:
    "Tant que le recensement n'est pas validé, tes ayants droit se déclarent ici : une ligne ajoutée séparément " +
    "arriverait au dossier sans les actes de filiation que les RH sont en train de vérifier.",
  diploma:
    "Tant que le recensement n'est pas validé, tes diplômes se déclarent ici : une ligne ajoutée séparément " +
    'arriverait au dossier sans son document justificatif.',
};

export function lockNotice(kind: 'dependent' | 'diploma'): string {
  return LOCK_NOTICES[kind];
}
