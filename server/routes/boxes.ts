import { Router } from 'express';
import { db } from '../db/database.js';
import { v4 as uuidv4 } from 'uuid';

export const boxesRouter = Router();

// Listar boxes (con soporte para filtrar por fecha activa si es temporal)
boxesRouter.get('/', (req, res) => {
  try {
    const { date } = req.query;
    let query = `SELECT * FROM boxes WHERE deleted_at IS NULL`;
    const params: any[] = [];

    if (date) {
      query += ` AND (is_temporary = 0 OR (is_temporary = 1 AND (available_from IS NULL OR date(available_from) <= date(?)) AND (available_to IS NULL OR date(available_to) >= date(?))))`;
      params.push(date, date);
    }

    query += ` ORDER BY order_index ASC, number ASC`;
    const boxes = db.prepare(query).all(...params);

    const formatted = boxes.map((b: any) => ({
      ...b,
      is_temporary: Boolean(b.is_temporary),
      equipment: JSON.parse(b.equipment_json || '[]'),
    }));

    res.json(formatted);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Crear box
boxesRouter.post('/', (req, res) => {
  try {
    const { name, number, description, color_code, order_index, equipment, is_temporary, available_from, available_to, start_time, end_time } = req.body;
    const id = uuidv4();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO boxes (id, name, number, description, color_code, order_index, is_active, is_temporary, available_from, available_to, start_time, end_time, equipment_json, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, name, number || 1, description || null, color_code || '#C59B7E', order_index || 0,
      is_temporary ? 1 : 0,
      is_temporary ? (available_from || null) : null,
      is_temporary ? (available_to || null) : null,
      start_time || '08:00',
      end_time || '21:00',
      JSON.stringify(equipment || []),
      now, now
    );

    const created = db.prepare(`SELECT * FROM boxes WHERE id = ?`).get(id) as any;
    res.status(201).json({
      ...created,
      is_temporary: Boolean(created.is_temporary),
      equipment: JSON.parse(created.equipment_json || '[]'),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Editar box
boxesRouter.put('/:id', (req, res) => {
  try {
    const { name, number, description, color_code, order_index, is_active, equipment, is_temporary, available_from, available_to, start_time, end_time } = req.body;
    const now = new Date().toISOString();

    db.prepare(`
      UPDATE boxes 
      SET name = ?, number = ?, description = ?, color_code = ?, order_index = ?, is_active = ?, is_temporary = ?, available_from = ?, available_to = ?, start_time = ?, end_time = ?, equipment_json = ?, updated_at = ?
      WHERE id = ? AND deleted_at IS NULL
    `).run(
      name, number, description || null, color_code, order_index || 0, is_active !== false ? 1 : 0,
      is_temporary ? 1 : 0,
      is_temporary ? (available_from || null) : null,
      is_temporary ? (available_to || null) : null,
      start_time || '08:00',
      end_time || '21:00',
      JSON.stringify(equipment || []),
      now, req.params.id
    );

    const updated = db.prepare(`SELECT * FROM boxes WHERE id = ?`).get(req.params.id) as any;
    res.json({
      ...updated,
      is_temporary: Boolean(updated.is_temporary),
      equipment: JSON.parse(updated.equipment_json || '[]'),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Eliminar box (soft delete)
boxesRouter.delete('/:id', (req, res) => {
  try {
    const now = new Date().toISOString();
    db.prepare(`UPDATE boxes SET deleted_at = ?, updated_at = ? WHERE id = ?`).run(now, now, req.params.id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
