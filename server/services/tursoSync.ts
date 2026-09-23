import { createClient, Client } from '@libsql/client';
import { db } from '../db/database.js';
import { io } from '../index.js';

export interface TursoConfig {
  salonName: string;
  dbUrl: string;
  authToken: string;
  syncEnabled: boolean;
  lastSyncAt: string | null;
  status: 'disconnected' | 'connected' | 'syncing' | 'error';
  errorMessage?: string;
}

// Cliente en memoria
let tursoClient: Client | null = null;
let isSyncing = false;

/**
 * Obtiene la configuración guardada en system_settings
 */
export function getTursoConfig(): TursoConfig {
  const getSetting = (key: string, defaultVal: string = ''): string => {
    try {
      const row: any = db.prepare('SELECT value FROM system_settings WHERE key = ?').get(key);
      return (row && row.value !== null && row.value !== undefined) ? String(row.value) : defaultVal;
    } catch {
      return defaultVal;
    }
  };

  const salonName = getSetting('turso_salon_name', 'Mi Salón Hikari');
  const dbUrl = getSetting('turso_db_url', '');
  const authToken = getSetting('turso_auth_token', '');
  const syncEnabled = getSetting('turso_sync_enabled', 'false') === 'true';
  let lastSyncAt: string | null = null;
  try {
    const row: any = db.prepare('SELECT value FROM system_settings WHERE key = ?').get('turso_last_sync_at');
    if (row && row.value) lastSyncAt = String(row.value);
  } catch {}

  let status: TursoConfig['status'] = 'disconnected';
  if (dbUrl && authToken) {
    status = syncEnabled ? 'connected' : 'disconnected';
  }

  return {
    salonName,
    dbUrl,
    authToken,
    syncEnabled,
    lastSyncAt,
    status: isSyncing ? 'syncing' : status,
  };
}

/**
 * Guarda la configuración en system_settings
 */
export function saveTursoConfig(config: Partial<TursoConfig>): TursoConfig {
  const now = new Date().toISOString();
  const setSetting = (key: string, value: string) => {
    db.prepare(`
      INSERT INTO system_settings (key, value, updated_at)
      VALUES (?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
    `).run(key, value, now);
  };

  if (config.salonName !== undefined) setSetting('turso_salon_name', config.salonName.trim());
  if (config.dbUrl !== undefined) setSetting('turso_db_url', config.dbUrl.trim());
  if (config.authToken !== undefined) setSetting('turso_auth_token', config.authToken.trim());
  if (config.syncEnabled !== undefined) setSetting('turso_sync_enabled', config.syncEnabled ? 'true' : 'false');
  if (config.lastSyncAt !== undefined) setSetting('turso_last_sync_at', config.lastSyncAt || '');

  // Resetear cliente activo si cambiaron las credenciales
  tursoClient = null;

  return getTursoConfig();
}

/**
 * Crea o retorna el cliente Turso LibSQL configurado
 */
export function getActiveTursoClient(): Client | null {
  if (tursoClient) return tursoClient;

  const cfg = getTursoConfig();
  if (!cfg.dbUrl || !cfg.authToken) return null;

  try {
    tursoClient = createClient({
      url: cfg.dbUrl,
      authToken: cfg.authToken,
    });
    return tursoClient;
  } catch (err) {
    console.error('Error al inicializar cliente Turso:', err);
    return null;
  }
}

/**
 * Prueba la conexión directa a Turso
 */
export async function testTursoConnection(url?: string, authToken?: string): Promise<{ success: boolean; message: string }> {
  const targetUrl = url || getTursoConfig().dbUrl;
  const targetToken = authToken || getTursoConfig().authToken;

  if (!targetUrl || !targetToken) {
    return { success: false, message: 'Se requiere la URL de la base de datos y el Token de autenticación de Turso.' };
  }

  try {
    const testClient = createClient({
      url: targetUrl,
      authToken: targetToken,
    });

    const res = await testClient.execute('SELECT 1 as test');
    if (res.rows && res.rows.length > 0) {
      return { success: true, message: '¡Conexión exitosa a la base de datos en la nube Turso!' };
    }
    return { success: false, message: 'La consulta de prueba no retornó resultados.' };
  } catch (err: any) {
    return { success: false, message: `Error de conexión: ${err.message || err}` };
  }
}

/**
 * Inicializa las tablas necesarias en la base de datos Turso Cloud si no existen
 */
export async function initTursoCloudSchema(client: Client): Promise<void> {
  const schemaStatements = [
    `CREATE TABLE IF NOT EXISTS clients (
      id TEXT PRIMARY KEY,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT,
      birth_date TEXT,
      dni TEXT,
      notes TEXT,
      profile_photo_url TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT,
      synced_at TEXT
    );`,
    `CREATE TABLE IF NOT EXISTS staff (
      id TEXT PRIMARY KEY,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT,
      role TEXT NOT NULL,
      commission_type TEXT NOT NULL,
      default_commission_rate REAL NOT NULL DEFAULT 0,
      pin_code TEXT NOT NULL,
      qr_token TEXT NOT NULL,
      color_code TEXT NOT NULL,
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT,
      synced_at TEXT
    );`,
    `CREATE TABLE IF NOT EXISTS boxes (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      color_code TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      is_temporary INTEGER NOT NULL DEFAULT 0,
      available_from TEXT,
      available_to TEXT,
      start_time TEXT DEFAULT '08:00',
      end_time TEXT DEFAULT '21:00',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT,
      synced_at TEXT
    );`,
    `CREATE TABLE IF NOT EXISTS treatments (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      color_code TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT,
      synced_at TEXT
    );`,
    `CREATE TABLE IF NOT EXISTS sub_treatments (
      id TEXT PRIMARY KEY,
      treatment_id TEXT NOT NULL,
      name TEXT NOT NULL,
      duration_minutes INTEGER NOT NULL,
      price REAL NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT,
      synced_at TEXT
    );`,
    `CREATE TABLE IF NOT EXISTS appointments (
      id TEXT PRIMARY KEY,
      client_id TEXT NOT NULL,
      staff_id TEXT NOT NULL,
      box_id TEXT NOT NULL,
      sub_treatment_id TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      service_price REAL NOT NULL DEFAULT 0,
      deposit_amount REAL NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'scheduled',
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT,
      synced_at TEXT
    );`,
    `CREATE TABLE IF NOT EXISTS appointment_items (
      id TEXT PRIMARY KEY,
      appointment_id TEXT NOT NULL,
      item_type TEXT NOT NULL,
      item_id TEXT NOT NULL,
      name TEXT NOT NULL,
      quantity REAL NOT NULL DEFAULT 1,
      unit_price REAL NOT NULL,
      subtotal REAL NOT NULL,
      added_by_staff_id TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT,
      synced_at TEXT
    );`,
    `CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      barcode TEXT,
      category TEXT NOT NULL,
      cost_price REAL NOT NULL DEFAULT 0,
      sale_price REAL NOT NULL DEFAULT 0,
      stock_quantity INTEGER NOT NULL DEFAULT 0,
      min_stock_alert INTEGER NOT NULL DEFAULT 3,
      is_for_sale INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT,
      synced_at TEXT
    );`,
    `CREATE TABLE IF NOT EXISTS cash_register_shifts (
      id TEXT PRIMARY KEY,
      opened_at TEXT NOT NULL,
      closed_at TEXT,
      initial_cash REAL NOT NULL DEFAULT 0,
      total_incomes REAL NOT NULL DEFAULT 0,
      total_expenses REAL NOT NULL DEFAULT 0,
      expected_cash REAL NOT NULL DEFAULT 0,
      actual_cash REAL,
      difference REAL,
      status TEXT NOT NULL DEFAULT 'open',
      opened_by TEXT NOT NULL,
      closed_by TEXT,
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT,
      synced_at TEXT
    );`,
    `CREATE TABLE IF NOT EXISTS cash_transactions (
      id TEXT PRIMARY KEY,
      shift_id TEXT NOT NULL,
      appointment_id TEXT,
      client_id TEXT,
      type TEXT NOT NULL,
      category TEXT NOT NULL,
      amount REAL NOT NULL,
      payment_method TEXT NOT NULL,
      card_brand TEXT,
      surcharge_percentage REAL,
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT,
      synced_at TEXT
    );`,
    `CREATE TABLE IF NOT EXISTS body_charts (
      id TEXT PRIMARY KEY,
      client_id TEXT NOT NULL,
      session_id TEXT,
      date TEXT NOT NULL,
      points_json TEXT NOT NULL DEFAULT '[]',
      measurements_json TEXT NOT NULL DEFAULT '{}',
      clinical_contraindications_json TEXT NOT NULL DEFAULT '[]',
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT,
      synced_at TEXT
    );`,
    `CREATE TABLE IF NOT EXISTS facial_charts (
      id TEXT PRIMARY KEY,
      client_id TEXT NOT NULL,
      session_id TEXT,
      date TEXT NOT NULL,
      skin_type TEXT NOT NULL,
      phototype TEXT NOT NULL,
      hydration_level TEXT NOT NULL,
      sensitivity_level TEXT NOT NULL,
      allergies TEXT,
      active_lesions TEXT,
      current_skincare_routine TEXT,
      zones_json TEXT NOT NULL DEFAULT '[]',
      recommended_homecare TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT,
      synced_at TEXT
    );`
  ];

  for (const sql of schemaStatements) {
    try {
      await client.execute(sql);
    } catch (e: any) {
      console.warn('Advertencia al crear tabla en Turso Cloud:', e.message);
    }
  }
}

/**
 * Ejecuta una sincronización bidireccional completa entre SQLite Local y Turso Cloud
 */
export async function performTursoSync(): Promise<{
  success: boolean;
  pushedCount: number;
  pulledCount: number;
  timestamp: string;
  message: string;
}> {
  if (isSyncing) {
    return { success: false, pushedCount: 0, pulledCount: 0, timestamp: new Date().toISOString(), message: 'Sincronización ya en curso.' };
  }

  const client = getActiveTursoClient();
  if (!client) {
    return { success: false, pushedCount: 0, pulledCount: 0, timestamp: new Date().toISOString(), message: 'Turso Cloud no está configurado.' };
  }

  isSyncing = true;
  io.emit('turso:sync-started', { timestamp: new Date().toISOString() });

  try {
    // 1. Asegurar esquema en la nube
    await initTursoCloudSchema(client);

    const tables = [
      'clients',
      'staff',
      'boxes',
      'treatments',
      'sub_treatments',
      'appointments',
      'appointment_items',
      'products',
      'cash_register_shifts',
      'cash_transactions',
      'body_charts',
      'facial_charts',
    ];

    let totalPushed = 0;
    let totalPulled = 0;
    const now = new Date().toISOString();

    for (const table of tables) {
      // PUSH: Leer registros locales
      const localRows: any[] = db.prepare(`SELECT * FROM ${table}`).all();

      for (const row of localRows) {
        const columns = Object.keys(row);
        const placeholders = columns.map(() => '?').join(', ');
        const values = Object.values(row);

        try {
          await client.execute({
            sql: `INSERT OR REPLACE INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`,
            args: values as any[],
          });
          totalPushed++;
        } catch (e) {
          // Continuar con los siguientes registros
        }
      }

      // PULL: Obtener registros de la nube
      try {
        const cloudRowsRes = await client.execute(`SELECT * FROM ${table}`);
        const cloudRows = cloudRowsRes.rows || [];

        const insertLocal = db.transaction(() => {
          for (const cRow of cloudRows) {
            const columns = Object.keys(cRow);
            const placeholders = columns.map(() => '?').join(', ');
            const values = Object.values(cRow);

            try {
              db.prepare(`
                INSERT OR REPLACE INTO ${table} (${columns.join(', ')})
                VALUES (${placeholders})
              `).run(...values);
              totalPulled++;
            } catch (err) {}
          }
        });

        insertLocal();
      } catch (e) {
        // Ignorar fallo puntual de lectura
      }
    }

    // Actualizar fecha de última sincronización
    saveTursoConfig({ lastSyncAt: now });

    io.emit('turso:sync-completed', {
      timestamp: now,
      pushedCount: totalPushed,
      pulledCount: totalPulled,
    });
    io.emit('data-sync-completed', { timestamp: now });

    return {
      success: true,
      pushedCount: totalPushed,
      pulledCount: totalPulled,
      timestamp: now,
      message: `¡Sincronización Cloud completada! (${totalPushed} subidos / ${totalPulled} verificados)`,
    };
  } catch (error: any) {
    console.error('Error durante performTursoSync:', error);
    io.emit('turso:sync-error', { error: error.message });
    return {
      success: false,
      pushedCount: 0,
      pulledCount: 0,
      timestamp: new Date().toISOString(),
      message: `Error en sincronización: ${error.message || error}`,
    };
  } finally {
    isSyncing = false;
  }
}
