export interface OfflineMutation {
  id: string;
  entity:
    | 'appointment'
    | 'client'
    | 'sub_treatment'
    | 'treatment'
    | 'price'
    | 'product'
    | 'cash_transaction'
    | 'cash_shift'
    | 'body_chart'
    | 'facial_chart'
    | 'box'
    | 'staff';
  action: 'create' | 'update' | 'delete' | 'update_price' | 'update_stock' | 'open' | 'close';
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
  cash_shifts: any[];
  cash_transactions: any[];
  body_charts: any[];
  facial_charts: any[];
  lastSyncedAt: string;
}

const DB_NAME = 'HikariOfflineDB';
const DB_VERSION = 2;

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
        cash_shifts: [],
        cash_transactions: [],
        body_charts: [],
        facial_charts: [],
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
    } else if (mutation.entity === 'product') {
      if (!snapshot.products) snapshot.products = [];
      if (mutation.action === 'create') {
        snapshot.products.push({ id: mutation.entityId, ...mutation.data });
      } else if (mutation.action === 'update' || mutation.action === 'update_stock') {
        snapshot.products = snapshot.products.map((p) =>
          p.id === mutation.entityId ? { ...p, ...mutation.data } : p
        );
      }
    } else if (mutation.entity === 'sub_treatment' || mutation.entity === 'price') {
      if (mutation.action === 'update_price') {
        snapshot.treatments = (snapshot.treatments || []).map((t) => ({
          ...t,
          sub_treatments: t.sub_treatments?.map((st: any) =>
            st.id === mutation.entityId ? { ...st, price: mutation.data.price } : st
          ),
        }));
      }
    } else if (mutation.entity === 'cash_transaction') {
      if (!snapshot.cash_transactions) snapshot.cash_transactions = [];
      snapshot.cash_transactions.unshift({
        id: mutation.entityId,
        ...mutation.data,
        created_at: mutation.clientTimestamp,
      });
    } else if (mutation.entity === 'cash_shift') {
      if (!snapshot.cash_shifts) snapshot.cash_shifts = [];
      if (mutation.action === 'open') {
        snapshot.cash_shifts.unshift({
          id: mutation.entityId,
          ...mutation.data,
          status: 'open',
          created_at: mutation.clientTimestamp,
        });
      } else if (mutation.action === 'close') {
        snapshot.cash_shifts = snapshot.cash_shifts.map((s) =>
          s.id === mutation.entityId ? { ...s, ...mutation.data, status: 'closed' } : s
        );
      }
    } else if (mutation.entity === 'body_chart') {
      if (!snapshot.body_charts) snapshot.body_charts = [];
      const idx = snapshot.body_charts.findIndex((b) => b.id === mutation.entityId);
      if (idx >= 0) {
        snapshot.body_charts[idx] = { ...snapshot.body_charts[idx], ...mutation.data };
      } else {
        snapshot.body_charts.unshift({ id: mutation.entityId, ...mutation.data });
      }
    } else if (mutation.entity === 'facial_chart') {
      if (!snapshot.facial_charts) snapshot.facial_charts = [];
      const idx = snapshot.facial_charts.findIndex((f) => f.id === mutation.entityId);
      if (idx >= 0) {
        snapshot.facial_charts[idx] = { ...snapshot.facial_charts[idx], ...mutation.data };
      } else {
        snapshot.facial_charts.unshift({ id: mutation.entityId, ...mutation.data });
      }
    }

    await offlineStorage.saveSnapshot(snapshot);
  },

  // Exportar base de datos local completa a formato JSON
  exportBackupJson: async (): Promise<string> => {
    const snapshot = await offlineStorage.getSnapshot();
    const mutations = await offlineStorage.getPendingMutations();
    const backupObj = {
      app: 'Hikari Suite Mobile',
      version: '1.0.15',
      exportedAt: new Date().toISOString(),
      snapshot: snapshot || {},
      pendingMutations: mutations || [],
    };
    return JSON.stringify(backupObj, null, 2);
  },

  // Descargar archivo de respaldo JSON directamente al almacenamiento del teléfono
  downloadBackupJson: async (): Promise<void> => {
    const jsonStr = await offlineStorage.exportBackupJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const dateStr = new Date().toISOString().split('T')[0];
    a.href = url;
    a.download = `HikariSuite_Respaldo_Movil_${dateStr}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },
};
