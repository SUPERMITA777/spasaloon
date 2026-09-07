import { Router } from 'express';
import { db } from '../db/database.js';
import { v4 as uuidv4 } from 'uuid';

export const facialChartsRouter = Router();

// Obtener fichas cosmetológicas de un cliente
facialChartsRouter.get('/client/:clientId', (req, res) => {
  try {
    const charts = db.prepare(`
      SELECT * FROM facial_charts 
      WHERE client_id = ? AND deleted_at IS NULL 
      ORDER BY date DESC
    `).all(req.params.clientId) as any[];

    const formatted = charts.map(c => ({
      ...c,
      zones: JSON.parse(c.zones_json || '[]'),
    }));

    res.json(formatted);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Guardar nueva ficha cosmetológica
facialChartsRouter.post('/', (req, res) => {
  try {
    const { client_id, session_id, date, skin_type, phototype, hydration_level, sensitivity_level, allergies, active_lesions, current_skincare_routine, zones, recommended_homecare } = req.body;
    const id = uuidv4();
    const now = new Date().toISOString();
    const chartDate = date || now.split('T')[0];

    db.prepare(`
      INSERT INTO facial_charts (id, client_id, session_id, date, skin_type, phototype, hydration_level, sensitivity_level, allergies, active_lesions, current_skincare_routine, zones_json, recommended_homecare, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, client_id, session_id || null, chartDate,
      skin_type || 'mixta', phototype || 'III', hydration_level || 'optima', sensitivity_level || 'normal',
      allergies || null, active_lesions || null, current_skincare_routine || null,
      JSON.stringify(zones || []), recommended_homecare || null,
      now, now
    );

    const created = db.prepare(`SELECT * FROM facial_charts WHERE id = ?`).get(id) as any;
    res.status(201).json({
      ...created,
      zones: JSON.parse(created.zones_json || '[]'),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
