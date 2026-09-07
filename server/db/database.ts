import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

export function getDataDirectory(): string {
  if (process.env.HIKARI_DATA_DIR) {
    return process.env.HIKARI_DATA_DIR;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const electron = require('electron');
    const app = electron.app || electron.remote?.app;
    if (app && typeof app.getPath === 'function') {
      return path.join(app.getPath('userData'), 'data');
    }
  } catch (e) {}

  return path.resolve(process.cwd(), 'data');
}

export function getBackupDirectory(): string {
  if (process.env.HIKARI_BACKUP_DIR) {
    return process.env.HIKARI_BACKUP_DIR;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const electron = require('electron');
    const app = electron.app || electron.remote?.app;
    if (app && typeof app.getPath === 'function') {
      return path.join(app.getPath('userData'), 'backups');
    }
  } catch (e) {}

  return path.resolve(process.cwd(), 'backups');
}

const DB_DIR = getDataDirectory();
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const DB_PATH = path.join(DB_DIR, 'salon.db');

// Si no existe salon.db en DB_DIR pero sí en el directorio raíz (desarrollo o migración), copiarla
if (!fs.existsSync(DB_PATH)) {
  const localDb = path.resolve(process.cwd(), 'data', 'salon.db');
  if (fs.existsSync(localDb) && localDb !== DB_PATH) {
    try {
      fs.copyFileSync(localDb, DB_PATH);
    } catch (e) {}
  }
}

export const db = new Database(DB_PATH);

// Habilitar claves foráneas y modo WAL para máximo rendimiento concurrente
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDatabase() {
  db.exec(`
    -- 1. Clientes
    CREATE TABLE IF NOT EXISTS clients (
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
    );

    -- 2. Personal / Profesionales
    CREATE TABLE IF NOT EXISTS staff (
      id TEXT PRIMARY KEY,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT,
      role TEXT NOT NULL,
      commission_type TEXT NOT NULL,
      default_commission_rate REAL NOT NULL DEFAULT 0,
      pin_code TEXT NOT NULL,
      qr_token TEXT NOT NULL UNIQUE,
      color_code TEXT NOT NULL,
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT,
      synced_at TEXT
    );

    CREATE TABLE IF NOT EXISTS staff_availability (
      id TEXT PRIMARY KEY,
      staff_id TEXT NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
      day_of_week INTEGER NOT NULL, -- 0=Dom, 1=Lun, ..., 6=Sab
      start_time TEXT NOT NULL, -- "09:00"
      end_time TEXT NOT NULL,   -- "19:00"
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT,
      synced_at TEXT
    );

    -- 3. Boxes / Salas
    CREATE TABLE IF NOT EXISTS boxes (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      number INTEGER NOT NULL,
      description TEXT,
      color_code TEXT NOT NULL,
      order_index INTEGER NOT NULL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1,
      is_temporary INTEGER NOT NULL DEFAULT 0,
      available_from TEXT,
      available_to TEXT,
      equipment_json TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT,
      synced_at TEXT
    );

    -- 4. Tratamientos y Sub-tratamientos
    CREATE TABLE IF NOT EXISTS treatments (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT,
      color_code TEXT NOT NULL,
      icon_name TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT,
      synced_at TEXT
    );

    CREATE TABLE IF NOT EXISTS sub_treatments (
      id TEXT PRIMARY KEY,
      treatment_id TEXT NOT NULL REFERENCES treatments(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      duration_minutes INTEGER NOT NULL,
      base_price REAL NOT NULL,
      allowed_days_json TEXT NOT NULL DEFAULT '[1,2,3,4,5,6]',
      allowed_start_time TEXT NOT NULL DEFAULT '08:00',
      allowed_end_time TEXT NOT NULL DEFAULT '21:00',
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT,
      synced_at TEXT
    );

    CREATE TABLE IF NOT EXISTS staff_treatments (
      id TEXT PRIMARY KEY,
      staff_id TEXT NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
      sub_treatment_id TEXT NOT NULL REFERENCES sub_treatments(id) ON DELETE CASCADE,
      custom_commission_rate REAL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT,
      synced_at TEXT
    );

    -- 5. Productos & Insumos
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      barcode TEXT,
      sku TEXT,
      category TEXT NOT NULL,
      brand TEXT,
      cost_price REAL NOT NULL DEFAULT 0,
      sale_price REAL NOT NULL DEFAULT 0,
      stock_quantity REAL NOT NULL DEFAULT 0,
      min_stock_alert REAL NOT NULL DEFAULT 5,
      unit TEXT NOT NULL DEFAULT 'unidad',
      is_internal_supply INTEGER NOT NULL DEFAULT 0,
      is_for_sale INTEGER NOT NULL DEFAULT 1,
      supplier TEXT,
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT,
      synced_at TEXT
    );

    CREATE TABLE IF NOT EXISTS sub_treatment_supplies (
      id TEXT PRIMARY KEY,
      sub_treatment_id TEXT NOT NULL REFERENCES sub_treatments(id) ON DELETE CASCADE,
      product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      quantity_consumed REAL NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT,
      synced_at TEXT
    );

    CREATE TABLE IF NOT EXISTS stock_movements (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      movement_type TEXT NOT NULL, -- 'purchase', 'sale', 'session_consumption', 'adjustment'
      quantity REAL NOT NULL,
      unit_cost REAL NOT NULL DEFAULT 0,
      reference_id TEXT,
      notes TEXT,
      created_by TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT,
      synced_at TEXT
    );

    -- 6. Turnos / Citas (Agenda)
    CREATE TABLE IF NOT EXISTS appointments (
      id TEXT PRIMARY KEY,
      client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
      staff_id TEXT NOT NULL REFERENCES staff(id) ON DELETE RESTRICT,
      sub_treatment_id TEXT NOT NULL REFERENCES sub_treatments(id) ON DELETE RESTRICT,
      box_id TEXT NOT NULL REFERENCES boxes(id) ON DELETE RESTRICT,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'scheduled',
      deposit_amount REAL NOT NULL DEFAULT 0,
      deposit_payment_method TEXT,
      service_price REAL NOT NULL,
      notes TEXT,
      whatsapp_reminder_status TEXT NOT NULL DEFAULT 'pending',
      whatsapp_reminder_sent_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT,
      synced_at TEXT
    );

    -- Carrito de compras asociado al turno
    CREATE TABLE IF NOT EXISTS appointment_cart_items (
      id TEXT PRIMARY KEY,
      appointment_id TEXT NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
      item_type TEXT NOT NULL, -- 'sub_treatment' | 'product'
      item_id TEXT NOT NULL,
      name TEXT NOT NULL,
      quantity REAL NOT NULL DEFAULT 1,
      unit_price REAL NOT NULL,
      subtotal REAL NOT NULL,
      added_by_staff_id TEXT REFERENCES staff(id),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT,
      synced_at TEXT
    );

    -- 7. Historia Clínica / Sesiones Realizadas
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      appointment_id TEXT REFERENCES appointments(id),
      client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
      staff_id TEXT NOT NULL REFERENCES staff(id),
      box_id TEXT REFERENCES boxes(id),
      sub_treatment_id TEXT NOT NULL REFERENCES sub_treatments(id),
      session_date TEXT NOT NULL,
      actual_start TEXT NOT NULL,
      actual_end TEXT NOT NULL,
      actual_duration_minutes INTEGER NOT NULL,
      observations TEXT NOT NULL,
      reactions TEXT,
      products_used_notes TEXT,
      is_locked INTEGER NOT NULL DEFAULT 1,
      audit_history_json TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT,
      synced_at TEXT
    );

    -- 8. Ficha Corporal
    CREATE TABLE IF NOT EXISTS body_charts (
      id TEXT PRIMARY KEY,
      client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
      session_id TEXT REFERENCES sessions(id),
      date TEXT NOT NULL,
      points_json TEXT NOT NULL DEFAULT '[]',
      measurements_json TEXT NOT NULL DEFAULT '{}',
      clinical_contraindications_json TEXT NOT NULL DEFAULT '[]',
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT,
      synced_at TEXT
    );

    -- 9. Ficha Cosmetológica / Facial
    CREATE TABLE IF NOT EXISTS facial_charts (
      id TEXT PRIMARY KEY,
      client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
      session_id TEXT REFERENCES sessions(id),
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
    );

    -- 10. Fotos de Seguimiento
    CREATE TABLE IF NOT EXISTS session_photos (
      id TEXT PRIMARY KEY,
      client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
      session_id TEXT REFERENCES sessions(id),
      photo_type TEXT NOT NULL, -- 'before', 'during', 'after'
      image_url TEXT NOT NULL,
      tag TEXT NOT NULL,
      notes TEXT,
      taken_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT,
      synced_at TEXT
    );

    -- 11. Consentimientos Informados
    CREATE TABLE IF NOT EXISTS informed_consents (
      id TEXT PRIMARY KEY,
      client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
      treatment_id TEXT REFERENCES treatments(id),
      sub_treatment_id TEXT REFERENCES sub_treatments(id),
      title TEXT NOT NULL,
      content_text TEXT NOT NULL,
      client_dni TEXT,
      client_full_name TEXT NOT NULL,
      signature_image_base64 TEXT NOT NULL,
      signed_at TEXT NOT NULL,
      witness_name TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT,
      synced_at TEXT
    );

    -- 12. Caja y Facturación
    CREATE TABLE IF NOT EXISTS cash_register_shifts (
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
    );

    CREATE TABLE IF NOT EXISTS cash_transactions (
      id TEXT PRIMARY KEY,
      shift_id TEXT NOT NULL REFERENCES cash_register_shifts(id) ON DELETE CASCADE,
      appointment_id TEXT REFERENCES appointments(id),
      client_id TEXT REFERENCES clients(id),
      type TEXT NOT NULL, -- 'income' | 'expense'
      category TEXT NOT NULL,
      amount REAL NOT NULL,
      payment_method TEXT NOT NULL, -- 'cash', 'card_debit', 'card_credit', 'transfer', 'qr_mercadopago'
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT,
      synced_at TEXT
    );

    CREATE TABLE IF NOT EXISTS receipts (
      id TEXT PRIMARY KEY,
      receipt_number TEXT NOT NULL UNIQUE,
      appointment_id TEXT REFERENCES appointments(id),
      client_id TEXT NOT NULL REFERENCES clients(id),
      client_name TEXT NOT NULL,
      client_dni TEXT,
      total_amount REAL NOT NULL,
      items_summary TEXT NOT NULL,
      payment_method TEXT NOT NULL,
      pdf_path TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT,
      synced_at TEXT
    );

    -- 13. Comisiones
    CREATE TABLE IF NOT EXISTS staff_commissions (
      id TEXT PRIMARY KEY,
      staff_id TEXT NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
      session_id TEXT REFERENCES sessions(id),
      appointment_id TEXT REFERENCES appointments(id),
      service_name TEXT NOT NULL,
      service_price REAL NOT NULL,
      commission_rate REAL NOT NULL,
      amount_calculated REAL NOT NULL,
      period_date TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'paid'
      paid_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT,
      synced_at TEXT
    );

    -- 14. Marketing & Publicaciones
    CREATE TABLE IF NOT EXISTS marketing_media (
      id TEXT PRIMARY KEY,
      treatment_id TEXT REFERENCES treatments(id) ON DELETE CASCADE,
      sub_treatment_id TEXT REFERENCES sub_treatments(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      media_type TEXT NOT NULL, -- 'image' | 'video'
      file_url TEXT NOT NULL,
      thumbnail_url TEXT,
      caption_template TEXT NOT NULL,
      hashtags_json TEXT NOT NULL DEFAULT '[]',
      suggested_stories_json TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT,
      synced_at TEXT
    );

    CREATE TABLE IF NOT EXISTS marketing_posts (
      id TEXT PRIMARY KEY,
      treatment_id TEXT REFERENCES treatments(id),
      sub_treatment_id TEXT REFERENCES sub_treatments(id),
      title TEXT NOT NULL,
      caption TEXT NOT NULL,
      hashtags_json TEXT NOT NULL DEFAULT '[]',
      media_files_json TEXT NOT NULL DEFAULT '[]',
      target_channels_json TEXT NOT NULL DEFAULT '["instagram", "whatsapp_status"]',
      scheduled_for TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft', -- 'draft', 'scheduled', 'published', 'failed', 'manual_ready'
      published_at TEXT,
      log TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT,
      synced_at TEXT
    );

    -- 15. Configuraciones del Sistema (Backups, Rutas, etc.)
    CREATE TABLE IF NOT EXISTS system_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  // Inicializar configuraciones por defecto si no existen
  const defaultBackupDir = getBackupDirectory();
  const defaults: Record<string, string> = {
    backup_directory: defaultBackupDir,
    backup_on_close: 'true',
    backup_retention_days: '30',
  };

  const checkSetting = db.prepare(`SELECT value FROM system_settings WHERE key = ?`);
  const insertSetting = db.prepare(`INSERT INTO system_settings (key, value, updated_at) VALUES (?, ?, ?)`);

  for (const [key, val] of Object.entries(defaults)) {
    const existing = checkSetting.get(key);
    if (!existing) {
      insertSetting.run(key, val, new Date().toISOString());
    }
  }

  // Migraciones automáticas seguras
  try {
    const tableInfo = db.prepare(`PRAGMA table_info(boxes)`).all() as any[];
    const colNames = tableInfo.map(c => c.name);
    if (!colNames.includes('is_temporary')) {
      db.exec(`ALTER TABLE boxes ADD COLUMN is_temporary INTEGER NOT NULL DEFAULT 0;`);
    }
    if (!colNames.includes('available_from')) {
      db.exec(`ALTER TABLE boxes ADD COLUMN available_from TEXT;`);
    }
    if (!colNames.includes('available_to')) {
      db.exec(`ALTER TABLE boxes ADD COLUMN available_to TEXT;`);
    }

    const consentTableInfo = db.prepare(`PRAGMA table_info(informed_consents)`).all() as any[];
    const consentColNames = consentTableInfo.map(c => c.name);
    if (!consentColNames.includes('form_data_json')) {
      db.exec(`ALTER TABLE informed_consents ADD COLUMN form_data_json TEXT;`);
    }

    // Migración: hacer treatment_id y client_dni nullable en informed_consents
    // SQLite no soporta ALTER COLUMN, así que recreamos la tabla
    const treatmentCol = consentTableInfo.find((c: any) => c.name === 'treatment_id');
    if (treatmentCol && treatmentCol.notnull === 1) {
      console.log('🔄 Migrando informed_consents: treatment_id → nullable...');
      db.exec(`
        CREATE TABLE IF NOT EXISTS informed_consents_new (
          id TEXT PRIMARY KEY,
          client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
          treatment_id TEXT REFERENCES treatments(id),
          sub_treatment_id TEXT REFERENCES sub_treatments(id),
          title TEXT NOT NULL,
          content_text TEXT NOT NULL,
          client_dni TEXT,
          client_full_name TEXT NOT NULL,
          signature_image_base64 TEXT NOT NULL,
          signed_at TEXT NOT NULL,
          witness_name TEXT,
          form_data_json TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          deleted_at TEXT,
          synced_at TEXT
        );
        INSERT INTO informed_consents_new SELECT
          id, client_id, treatment_id, sub_treatment_id, title, content_text,
          client_dni, client_full_name, signature_image_base64, signed_at, witness_name,
          form_data_json, created_at, updated_at, deleted_at, synced_at
        FROM informed_consents;
        DROP TABLE informed_consents;
        ALTER TABLE informed_consents_new RENAME TO informed_consents;
      `);
      console.log('✅ Migración informed_consents completada.');
    }
  } catch (err) {
    console.log('Migración de base de datos ya aplicada.');
  }

  console.log('✅ Base de datos SQLite inicializada correctamente.');
}

export { DB_DIR, DB_PATH };

export function getSetting(key: string, defaultValue = ''): string {
  try {
    const row = db.prepare(`SELECT value FROM system_settings WHERE key = ?`).get(key) as { value: string } | undefined;
    return row ? row.value : defaultValue;
  } catch (e) {
    return defaultValue;
  }
}

export function setSetting(key: string, value: string): void {
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO system_settings (key, value, updated_at)
    VALUES (?, ?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
  `).run(key, value, now);
}

export function getAllSettings(): Record<string, string> {
  try {
    const rows = db.prepare(`SELECT key, value FROM system_settings`).all() as { key: string; value: string }[];
    const res: Record<string, string> = {};
    for (const r of rows) {
      res[r.key] = r.value;
    }
    return res;
  } catch (e) {
    return {};
  }
}
