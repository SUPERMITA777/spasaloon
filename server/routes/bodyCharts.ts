import { Router } from 'express';
import { db } from '../db/database.js';
import { v4 as uuidv4 } from 'uuid';

export const bodyChartsRouter = Router();

// Obtener fichas corporales de un cliente
bodyChartsRouter.get('/client/:clientId', (req, res) => {
  try {
    const charts = db.prepare(`
      SELECT * FROM body_charts 
      WHERE client_id = ? AND deleted_at IS NULL 
      ORDER BY date DESC
    `).all(req.params.clientId) as any[];

    const formatted = charts.map(c => ({
      ...c,
      points: JSON.parse(c.points_json || '[]'),
      measurements: JSON.parse(c.measurements_json || '{}'),
      clinical_contraindications: JSON.parse(c.clinical_contraindications_json || '[]'),
    }));

    res.json(formatted);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Guardar nueva ficha corporal
bodyChartsRouter.post('/', (req, res) => {
  try {
    const { client_id, session_id, date, points, measurements, clinical_contraindications, notes } = req.body;
    const id = uuidv4();
    const now = new Date().toISOString();
    const chartDate = date || now.split('T')[0];

    db.prepare(`
      INSERT INTO body_charts (id, client_id, session_id, date, points_json, measurements_json, clinical_contraindications_json, notes, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, client_id, session_id || null, chartDate,
      JSON.stringify(points || []),
      JSON.stringify(measurements || {}),
      JSON.stringify(clinical_contraindications || []),
      notes || null,
      now, now
    );

    const created = db.prepare(`SELECT * FROM body_charts WHERE id = ?`).get(id) as any;
    res.status(201).json({
      ...created,
      points: JSON.parse(created.points_json || '[]'),
      measurements: JSON.parse(created.measurements_json || '{}'),
      clinical_contraindications: JSON.parse(created.clinical_contraindications_json || '[]'),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
