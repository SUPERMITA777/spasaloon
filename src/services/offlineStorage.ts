export interface OfflineMutation {
  id: string;
  entity: 'appointment' | 'client' | 'sub_treatment' | 'treatment' | 'price';
  action: 'create' | 'update' | 'delete' | 'update_price';
  entityId: string;
  data: any;
  clientTimestamp: string;
  lastSyncedAt?: string;
}

export interface OfflineSnapshot {
  clients: any[];
  appointments: any[];
  treatments: any[];
  boxes: any[];
  staff: any[];
  products: any[];
  lastSyncedAt: string;
}

const DB_NAME = 'HikariOfflineDB';
const DB_VERSION = 1;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      return reject(new Error('IndexedDB no soportado en este navegador'));
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: any) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('snapshot')) {
        db.createObjectStore('snapshot', { keyPath: 'key' });
      }
      if (!db.objectStoreNames.contains('mutations')) {
        db.createObjectStore('mutations', { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export const offlineStorage = {
  // Guardar copia local completa
  saveSnapshot: async (snapshot: Partial<OfflineSnapshot>): Promise<void> => {
    try {
      const db = await openDb();
      const current = (await offlineStorage.getSnapshot()) || {
        clients: [],
        appointments: [],
        treatments: [],
        boxes: [],
        staff: [],
        products: [],
        lastSyncedAt: new Date().toISOString(),
      };

      const updated: OfflineSnapshot = {
        ...current,
        ...snapshot,
        lastSyncedAt: new Date().toISOString(),
      };

      const tx = db.transaction('snapshot', 'readwrite');
      tx.objectStore('snapshot').put({ key: 'main_snapshot', data: updated });

      // Respaldo en localStorage para fallback ultra rápido
      try {
        localStorage.setItem('hikari_last_sync_timestamp', updated.lastSyncedAt);
      } catch (e) {}
    } catch (e) {
      console.warn('Error guardando en IndexedDB, fallback a localStorage:', e);
    }
  },

  // Obtener copia local completa
  getSnapshot: async (): Promise<OfflineSnapshot | null> => {
    try {
      const db = await openDb();
      return new Promise((resolve) => {
        const tx = db.transaction('snapshot', 'readonly');
        const req = tx.objectStore('snapshot').get('main_snapshot');
        req.onsuccess = () => {
          resolve(req.result ? req.result.data : null);
        };
        req.onerror = () => resolve(null);
      });
    } catch (e) {
      return null;
    }
  },

  // Encolar una mutación realizada offline
  queueMutation: async (mutation: OfflineMutation): Promise<void> => {
    try {
      const db = await openDb();
      const tx = db.transaction('mutations', 'readwrite');
      tx.objectStore('mutations').put(mutation);

      // También aplicar inmediatamente a la copia snapshot para que la UI se actualice
      await offlineStorage.applyMutationToLocalSnapshot(mutation);
    } catch (e) {
      console.error('Error encolando mutación offline:', e);
    }
  },

  // Obtener mutaciones pendientes
  getPendingMutations: async (): Promise<OfflineMutation[]> => {
    try {
      const db = await openDb();
      return new Promise((resolve) => {
        const tx = db.transaction('mutations', 'readonly');
        const req = tx.objectStore('mutations').getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve([]);
      });
    } catch (e) {
      return [];
    }
  },

  // Eliminar mutaciones ya procesadas
  removeProcessedMutations: async (ids: string[]): Promise<void> => {
    try {
      const db = await openDb();
      const tx = db.transaction('mutations', 'readwrite');
      const store = tx.objectStore('mutations');
      for (const id of ids) {
        store.delete(id);
      }
    } catch (e) {
      console.error('Error limpiando mutaciones procesadas:', e);
    }
  },

  // Aplica la mutación en la copia local para visualización instantánea offline
  applyMutationToLocalSnapshot: async (mutation: OfflineMutation): Promise<void> => {
    const snapshot = await offlineStorage.getSnapshot();
    if (!snapshot) return;

    if (mutation.entity === 'appointment') {
      if (mutation.action === 'create') {
        const existingIdx = snapshot.appointments.findIndex((a) => a.id === mutation.entityId);
        if (existingIdx >= 0) {
          snapshot.appointments[existingIdx] = { ...snapshot.appointments[existingIdx], ...mutation.data };
        } else {
          snapshot.appointments.push({
            id: mutation.entityId,
            ...mutation.data,
            created_at: mutation.clientTimestamp,
            updated_at: mutation.clientTimestamp,
          });
        }
      } else if (mutation.action === 'update') {
        snapshot.appointments = snapshot.appointments.map((a) =>
          a.id === mutation.entityId ? { ...a, ...mutation.data, updated_at: mutation.clientTimestamp } : a
        );
      }
    } else if (mutation.entity === 'client') {
      if (mutation.action === 'create') {
        const existingIdx = snapshot.clients.findIndex((c) => c.id === mutation.entityId);
        if (existingIdx >= 0) {
          snapshot.clients[existingIdx] = { ...snapshot.clients[existingIdx], ...mutation.data };
        } else {
          snapshot.clients.push({
            id: mutation.entityId,
            ...mutation.data,
            created_at: mutation.clientTimestamp,
            updated_at: mutation.clientTimestamp,
          });
        }
      } else if (mutation.action === 'update') {
        snapshot.clients = snapshot.clients.map((c) =>
          c.id === mutation.entityId ? { ...c, ...mutation.data, updated_at: mutation.clientTimestamp } : c
        );
      }
    }

    await offlineStorage.saveSnapshot(snapshot);
  },
};
