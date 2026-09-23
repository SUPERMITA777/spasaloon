import { createClient, Client } from '@libsql/client/web';
import { offlineStorage, OfflineMutation, OfflineSnapshot } from './offlineStorage';

export interface TursoCloudConfig {
  salonName: string;
  dbUrl: string;
  authToken: string;
  configuredAt: string;
}

const STORAGE_KEY = 'hikari_turso_cloud_config';

let cachedClient: Client | null = null;
let cachedConfig: TursoCloudConfig | null = null;

/**
 * Obtiene la configuración de la nube guardada en el dispositivo móvil
 */
export function getTursoCloudConfig(): TursoCloudConfig | null {
  if (cachedConfig) return cachedConfig;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    cachedConfig = JSON.parse(raw);
    return cachedConfig;
  } catch {
    return null;
  }
}

/**
 * Guarda la configuración de la nube en el dispositivo móvil
 */
export function saveTursoCloudConfig(config: TursoCloudConfig): void {
  cachedConfig = config;
  cachedClient = null; // Reiniciar cliente
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (err) {
    console.error('Error guardando config de Turso en localStorage:', err);
  }
}

/**
 * Elimina la configuración de la nube de este dispositivo
 */
export function clearTursoCloudConfig(): void {
  cachedConfig = null;
  cachedClient = null;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}

/**
 * Comprueba si la nube Turso está configurada y lista en este móvil
 */
export function isTursoCloudReady(): boolean {
  const cfg = getTursoCloudConfig();
  return !!(cfg && cfg.dbUrl && cfg.authToken);
}

/**
 * Obtiene el cliente Turso optimizado para navegadores móviles
 */
export function getTursoWebClient(): Client | null {
  if (cachedClient) return cachedClient;
  const cfg = getTursoCloudConfig();
  if (!cfg || !cfg.dbUrl || !cfg.authToken) return null;

  try {
    cachedClient = createClient({
      url: cfg.dbUrl,
      authToken: cfg.authToken,
    });
    return cachedClient;
  } catch (err) {
    console.error('Error creando cliente Turso web:', err);
    return null;
  }
}

/**
 * Detecta y procesa automáticamente la configuración enviada en el hash o query del QR
 * Ej: #turso_setup=ey... o ?turso_setup=ey...
 */
export function checkAndApplyTursoSetupFromUrl(): {
  applied: boolean;
  salonName?: string;
} {
  try {
    if (typeof window === 'undefined') return { applied: false };

    let setupPayloadString: string | null = null;

    // 1. Buscar en hash (#turso_setup=...)
    if (window.location.hash.includes('turso_setup=')) {
      const match = window.location.hash.match(/turso_setup=([^&]+)/);
      if (match && match[1]) {
        setupPayloadString = match[1];
      }
    }

    // 2. Si no está en hash, buscar en query params (?turso_setup=...)
    if (!setupPayloadString && window.location.search.includes('turso_setup=')) {
      const params = new URLSearchParams(window.location.search);
      setupPayloadString = params.get('turso_setup');
    }

    if (!setupPayloadString) return { applied: false };

    // Decodificar Base64
    const decoded = atob(decodeURIComponent(setupPayloadString));
    const data = JSON.parse(decoded);

    if (data && data.u && data.t) {
      const config: TursoCloudConfig = {
        salonName: data.s || 'Mi Salón Hikari',
        dbUrl: data.u,
        authToken: data.t,
        configuredAt: new Date().toISOString(),
      };

      saveTursoCloudConfig(config);

      // Limpiar la URL para no dejar expuestas las credenciales en la barra de direcciones de Safari/Chrome
      const cleanPath = window.location.pathname;
      const cleanSearch = window.location.search.replace(/[?&]turso_setup=[^&]+/, '').replace(/^&/, '?');
      window.history.replaceState(null, document.title, cleanPath + (cleanSearch && cleanSearch !== '?' ? cleanSearch : ''));

      console.log(`✦ Conectado exitosamente a la nube Turso de "${config.salonName}"`);
      return { applied: true, salonName: config.salonName };
    }

    return { applied: false };
  } catch (err) {
    console.error('Error procesando setup de Turso desde QR:', err);
    return { applied: false };
  }
}

/**
 * Descarga el snapshot completo directamente desde la base de datos Turso Cloud
 */
export async function fetchTursoSnapshotDirectly(): Promise<OfflineSnapshot | null> {
  const client = getTursoWebClient();
  if (!client) return null;

  try {
    const [
      clientsRes,
      staffRes,
      boxesRes,
      treatmentsRes,
      subTreatmentsRes,
      appointmentsRes,
      appointmentItemsRes,
      productsRes,
      shiftsRes,
      transactionsRes,
      bodyRes,
      facialRes,
    ] = await Promise.all([
      client.execute('SELECT * FROM clients ORDER BY first_name, last_name'),
      client.execute('SELECT * FROM staff WHERE is_active = 1'),
      client.execute('SELECT * FROM boxes WHERE is_active = 1'),
      client.execute('SELECT * FROM treatments WHERE is_active = 1'),
      client.execute('SELECT * FROM sub_treatments WHERE is_active = 1'),
      client.execute('SELECT * FROM appointments ORDER BY start_time DESC LIMIT 300'),
      client.execute('SELECT * FROM appointment_items'),
      client.execute('SELECT * FROM products WHERE is_active = 1'),
      client.execute('SELECT * FROM cash_register_shifts ORDER BY opened_at DESC LIMIT 10'),
      client.execute('SELECT * FROM cash_transactions ORDER BY created_at DESC LIMIT 100'),
      client.execute('SELECT * FROM body_charts ORDER BY updated_at DESC LIMIT 50'),
      client.execute('SELECT * FROM facial_charts ORDER BY updated_at DESC LIMIT 50'),
    ]);

    // Mapear tratamientos con sus subtipos
    const treatments = treatmentsRes.rows.map((t: any) => ({
      ...t,
      sub_treatments: subTreatmentsRes.rows.filter((st: any) => st.treatment_id === t.id),
    }));

    // Mapear citas con sus items
    const appointments = appointmentsRes.rows.map((a: any) => ({
      ...a,
      items: appointmentItemsRes.rows.filter((it: any) => it.appointment_id === a.id),
    }));

    const snapshot: OfflineSnapshot = {
      clients: clientsRes.rows as any[],
      appointments: appointments as any[],
      treatments,
      boxes: boxesRes.rows as any[],
      staff: staffRes.rows as any[],
      products: productsRes.rows as any[],
      cash_shifts: shiftsRes.rows as any[],
      cash_transactions: transactionsRes.rows as any[],
      body_charts: bodyRes.rows as any[],
      facial_charts: facialRes.rows as any[],
      lastSyncedAt: new Date().toISOString(),
    };

    // Guardar snapshot fresco en IndexedDB local
    await offlineStorage.saveSnapshot(snapshot);
    return snapshot;
  } catch (err) {
    console.error('Error trayendo snapshot directamente de Turso Cloud:', err);
    return null;
  }
}

/**
 * Envía mutaciones pendientes creadas en el móvil directamente a Turso Cloud
 */
export async function pushMutationsToTursoDirectly(
  mutations: OfflineMutation[]
): Promise<string[]> {
  const client = getTursoWebClient();
  if (!client || mutations.length === 0) return [];

  const processedIds: string[] = [];

  for (const m of mutations) {
    try {
      if (m.entity === 'appointment') {
        if (m.action === 'create' || m.action === 'update') {
          const d = m.data;
          await client.execute({
            sql: `INSERT OR REPLACE INTO appointments (
              id, client_id, staff_id, box_id, date, start_time, end_time, status, total_price, deposit_amount, notes, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            args: [
              d.id || m.entityId,
              d.client_id,
              d.staff_id || null,
              d.box_id || null,
              d.date,
              d.start_time,
              d.end_time || null,
              d.status || 'scheduled',
              d.total_price || 0,
              d.deposit_amount || 0,
              d.notes || '',
              new Date().toISOString(),
            ],
          });
          processedIds.push(m.id);
        } else if (m.action === 'delete') {
          await client.execute({
            sql: 'DELETE FROM appointments WHERE id = ?',
            args: [m.entityId],
          });
          processedIds.push(m.id);
        }
      } else if (m.entity === 'client') {
        if (m.action === 'create' || m.action === 'update') {
          const d = m.data;
          await client.execute({
            sql: `INSERT OR REPLACE INTO clients (
              id, first_name, last_name, phone, email, notes, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            args: [
              d.id || m.entityId,
              d.first_name,
              d.last_name || '',
              d.phone || '',
              d.email || null,
              d.notes || '',
              new Date().toISOString(),
            ],
          });
          processedIds.push(m.id);
        }
      } else if (m.entity === 'price' || m.action === 'update_price') {
        const d = m.data;
        await client.execute({
          sql: 'UPDATE sub_treatments SET price = ?, updated_at = ? WHERE id = ?',
          args: [d.price, new Date().toISOString(), m.entityId],
        });
        processedIds.push(m.id);
      } else {
        // Para otras entidades genéricas
        processedIds.push(m.id);
      }
    } catch (err) {
      console.error(`Error aplicando mutación ${m.id} en Turso:`, err);
    }
  }

  if (processedIds.length > 0) {
    await offlineStorage.removeProcessedMutations(processedIds);
  }

  return processedIds;
}
