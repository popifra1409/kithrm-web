/**
 * Brouillon de recensement conservé sur l'appareil (IndexedDB, contrairement à
 * localStorage qui refuse les File). Une coupure réseau au milieu de la saisie
 * ne doit jamais faire perdre une photo ou un champ déjà tapé.
 */

import type { CensusDraft } from '../api/census';

const DB_NAME = 'kithrm';
const DB_VERSION = 1;
const STORE = 'census_draft';
const RECORD_KEY = 'current';

/** Étapes du formulaire telles qu'elles sont mémorisées sur l'appareil. */
export type DraftStage = 'identity' | 'pay' | 'org' | 'family';

export interface StoredCensusDraft {
  campaignId: number;
  campaignName: string;
  /**
   * Propriétaire du brouillon. Un poste informatique d'hôpital est partagé : sans
   * cette clé, le collègue suivant retrouverait les saisies (et les photos) d'avant.
   */
  userId: number;
  /** Étape où l'employé s'est arrêté, pour qu'il reprenne exactement là. */
  stage: DraftStage;
  savedAt: string;
  draft: CensusDraft;
}

function openDb(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    if (typeof indexedDB === 'undefined') return resolve(null);

    let request: IDBOpenDBRequest;
    try {
      request = indexedDB.open(DB_NAME, DB_VERSION);
    } catch {
      return resolve(null);
    }

    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE)) {
        request.result.createObjectStore(STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => resolve(null);
  });
}

export async function saveCensusDraft(entry: StoredCensusDraft): Promise<void> {
  const db = await openDb();
  if (!db) return;

  await new Promise<void>((resolve) => {
    try {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put(entry, RECORD_KEY);
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        resolve();
      };
      tx.onabort = () => {
        db.close();
        resolve();
      };
    } catch {
      db.close();
      resolve();
    }
  });
}

export async function loadCensusDraft(): Promise<StoredCensusDraft | null> {
  const db = await openDb();
  if (!db) return null;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE, 'readonly');
      const request = tx.objectStore(STORE).get(RECORD_KEY);
      request.onsuccess = () => {
        db.close();
        resolve((request.result as StoredCensusDraft | undefined) ?? null);
      };
      request.onerror = () => {
        db.close();
        resolve(null);
      };
    } catch {
      db.close();
      resolve(null);
    }
  });
}

export async function clearCensusDraft(): Promise<void> {
  const db = await openDb();
  if (!db) return;

  await new Promise<void>((resolve) => {
    try {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).delete(RECORD_KEY);
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => {
        db.close();
        resolve();
      };
    } catch {
      db.close();
      resolve();
    }
  });
}
