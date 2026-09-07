import { Router } from 'express';
import { db } from '../db/database.js';
import { v4 as uuidv4 } from 'uuid';

export const clientsRouter = Router();

// Listar clientes con búsqueda y totales
clientsRouter.get('/', (req, res) => {
  try {
    const search = req.query.search ? `%${req.query.search}%` : null;
    let query = `
      SELECT c.*, 
        (SELECT COUNT(*) FROM sessions s WHERE s.client_id = c.id AND s.deleted_at IS NULL) as total_sessions_count,
        (SELECT MAX(session_date) FROM sessions s WHERE s.client_id = c.id AND s.deleted_at IS NULL) as last_session_date
      FROM clients c 
      WHERE c.deleted_at IS NULL
    `;
    const params: any[] = [];

    if (search) {
      query += ` AND (c.first_name LIKE ? OR c.last_name LIKE ? OR c.phone LIKE ? OR c.email LIKE ? OR c.dni LIKE ?)`;
      params.push(search, search, search, search, search);
    }

    query += ` ORDER BY c.first_name ASC, c.last_name ASC`;
    const rows = db.prepare(query).all(...params);
    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener cliente por ID con historial completo
clientsRouter.get('/:id', (req, res) => {
  try {
    const client = db.prepare(`SELECT * FROM clients WHERE id = ? AND deleted_at IS NULL`).get(req.params.id);
    if (!client) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    const appointments = db.prepare(`
      SELECT a.*, st.name as sub_treatment_name, t.name as treatment_name, t.color_code as treatment_color,
             s.first_name as staff_first_name, s.last_name as staff_last_name, b.name as box_name
      FROM appointments a
      JOIN sub_treatments st ON a.sub_treatment_id = st.id
      JOIN treatments t ON st.treatment_id = t.id
      JOIN staff s ON a.staff_id = s.id
      JOIN boxes b ON a.box_id = b.id
      WHERE a.client_id = ? AND a.deleted_at IS NULL
      ORDER BY a.start_time DESC
    `).all(req.params.id);

    const bodyCharts = db.prepare(`
      SELECT * FROM body_charts WHERE client_id = ? AND deleted_at IS NULL ORDER BY date DESC
    `).all(req.params.id);

    const facialCharts = db.prepare(`
      SELECT * FROM facial_charts WHERE client_id = ? AND deleted_at IS NULL ORDER BY date DESC
    `).all(req.params.id);

    const informedConsents = db.prepare(`
      SELECT ic.*, t.name as treatment_name 
      FROM informed_consents ic
      JOIN treatments t ON ic.treatment_id = t.id
      WHERE ic.client_id = ? AND ic.deleted_at IS NULL ORDER BY ic.signed_at DESC
    `).all(req.params.id);

    res.json({
      ...client,
      appointments,
      bodyCharts: bodyCharts.map((bc: any) => ({
        ...bc,
        points: JSON.parse(bc.points_json || '[]'),
        measurements: JSON.parse(bc.measurements_json || '{}'),
        clinical_contraindications: JSON.parse(bc.clinical_contraindications_json || '[]'),
      })),
      facialCharts: facialCharts.map((fc: any) => ({
        ...fc,
        zones: JSON.parse(fc.zones_json || '[]'),
      })),
      informedConsents,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Crear cliente
clientsRouter.post('/', (req, res) => {
  try {
    const { first_name, last_name, phone, email, birth_date, dni, notes, profile_photo_url } = req.body;
    if (!first_name || !last_name || !phone) {
      return res.status(400).json({ error: 'Nombre, apellido y teléfono son obligatorios' });
    }

    const id = uuidv4();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO clients (id, first_name, last_name, phone, email, birth_date, dni, notes, profile_photo_url, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, first_name, last_name, phone, email || null, birth_date || null, dni || null, notes || null, profile_photo_url || null, now, now);

    const created = db.prepare(`SELECT * FROM clients WHERE id = ?`).get(id);
    res.status(201).json(created);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Editar cliente
clientsRouter.put('/:id', (req, res) => {
  try {
    const { first_name, last_name, phone, email, birth_date, dni, notes, profile_photo_url } = req.body;
    const now = new Date().toISOString();

    const result = db.prepare(`
      UPDATE clients 
      SET first_name = ?, last_name = ?, phone = ?, email = ?, birth_date = ?, dni = ?, notes = ?, profile_photo_url = ?, updated_at = ?
      WHERE id = ? AND deleted_at IS NULL
    `).run(first_name, last_name, phone, email || null, birth_date || null, dni || null, notes || null, profile_photo_url || null, now, req.params.id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    const updated = db.prepare(`SELECT * FROM clients WHERE id = ?`).get(req.params.id);
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Eliminar cliente (soft delete)
clientsRouter.delete('/:id', (req, res) => {
  try {
    const now = new Date().toISOString();
    const result = db.prepare(`
      UPDATE clients SET deleted_at = ?, updated_at = ? WHERE id = ? AND deleted_at IS NULL
    `).run(now, now, req.params.id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }
    res.json({ success: true, message: 'Cliente eliminado correctamente' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Importación masiva de clientes desde planilla
clientsRouter.post('/batch', (req, res) => {
  try {
    const items = req.body.items || req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Se requiere una lista de clientes válida.' });
    }

    const now = new Date().toISOString();
    let importedCount = 0;

    const insertBatch = db.transaction(() => {
      const stmt = db.prepare(`
        INSERT INTO clients (
          id, first_name, last_name, phone, email, birth_date, dni, notes, profile_photo_url, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?)
      `);

      for (const item of items) {
        if (!item.first_name || !item.first_name.trim()) continue;
        const id = uuidv4();
        stmt.run(
          id,
          item.first_name.trim(),
          item.last_name?.trim() || '',
          item.phone?.trim() || '',
          item.email?.trim() || null,
          item.birth_date?.trim() || null,
          item.dni?.trim() || null,
          item.notes?.trim() || null,
          now,
          now
        );
        importedCount++;
      }
    });

    insertBatch();
    res.json({ success: true, count: importedCount, message: `Se importaron ${importedCount} clientes con éxito.` });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

