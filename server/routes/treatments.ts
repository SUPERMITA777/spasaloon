import { Router } from 'express';
import { db } from '../db/database.js';
import { v4 as uuidv4 } from 'uuid';

export const treatmentsRouter = Router();

// Listar todos los tratamientos con sus sub-tratamientos
treatmentsRouter.get('/', (req, res) => {
  try {
    const treatments = db.prepare(`SELECT * FROM treatments WHERE deleted_at IS NULL ORDER BY name ASC`).all() as any[];

    const result = treatments.map(t => {
      const subTreatments = db.prepare(`
        SELECT * FROM sub_treatments WHERE treatment_id = ? AND deleted_at IS NULL ORDER BY name ASC
      `).all(t.id) as any[];

      const formattedSubTreatments = subTreatments.map(st => {
        const supplies = db.prepare(`
          SELECT sts.*, p.name as product_name, p.unit 
          FROM sub_treatment_supplies sts
          JOIN products p ON sts.product_id = p.id
          WHERE sts.sub_treatment_id = ? AND sts.deleted_at IS NULL
        `).all(st.id);

        const marketingMedia = db.prepare(`
          SELECT * FROM marketing_media WHERE sub_treatment_id = ? AND deleted_at IS NULL
        `).all(st.id) as any[];

        return {
          ...st,
          allowed_days: JSON.parse(st.allowed_days_json || '[1,2,3,4,5,6]'),
          supplies,
          marketing_media: marketingMedia.map(m => ({
            ...m,
            hashtags: JSON.parse(m.hashtags_json || '[]'),
            suggested_stories: JSON.parse(m.suggested_stories_json || '[]'),
          })),
        };
      });

      const treatmentMedia = db.prepare(`
        SELECT * FROM marketing_media WHERE treatment_id = ? AND sub_treatment_id IS NULL AND deleted_at IS NULL
      `).all(t.id) as any[];

      return {
        ...t,
        sub_treatments: formattedSubTreatments,
        marketing_media: treatmentMedia.map(m => ({
          ...m,
          hashtags: JSON.parse(m.hashtags_json || '[]'),
          suggested_stories: JSON.parse(m.suggested_stories_json || '[]'),
        })),
      };
    });

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Crear categoría de tratamiento
treatmentsRouter.post('/', (req, res) => {
  try {
    const { name, category, description, color_code, icon_name } = req.body;
    const id = uuidv4();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO treatments (id, name, category, description, color_code, icon_name, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)
    `).run(id, name, category || 'facial', description || null, color_code || '#C59B7E', icon_name || 'Sparkles', now, now);

    const created = db.prepare(`SELECT * FROM treatments WHERE id = ?`).get(id);
    res.status(201).json(created);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Editar tratamiento
treatmentsRouter.put('/:id', (req, res) => {
  try {
    const { name, category, description, color_code, icon_name, is_active } = req.body;
    const now = new Date().toISOString();

    db.prepare(`
      UPDATE treatments 
      SET name = ?, category = ?, description = ?, color_code = ?, icon_name = ?, is_active = ?, updated_at = ?
      WHERE id = ? AND deleted_at IS NULL
    `).run(name, category, description || null, color_code, icon_name, is_active ? 1 : 0, now, req.params.id);

    const updated = db.prepare(`SELECT * FROM treatments WHERE id = ?`).get(req.params.id);
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Crear Sub-Tratamiento
treatmentsRouter.post('/:treatmentId/sub-treatments', (req, res) => {
  try {
    const { name, duration_minutes, base_price, allowed_days, allowed_start_time, allowed_end_time, supplies } = req.body;
    const id = uuidv4();
    const now = new Date().toISOString();

    const insert = db.transaction(() => {
      db.prepare(`
        INSERT INTO sub_treatments (id, treatment_id, name, duration_minutes, base_price, allowed_days_json, allowed_start_time, allowed_end_time, is_active, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
      `).run(
        id, req.params.treatmentId, name, duration_minutes || 45, base_price || 0,
        JSON.stringify(allowed_days || [1, 2, 3, 4, 5, 6]),
        allowed_start_time || '08:00',
        allowed_end_time || '21:00',
        now, now
      );

      if (Array.isArray(supplies)) {
        const insertSupply = db.prepare(`
          INSERT INTO sub_treatment_supplies (id, sub_treatment_id, product_id, quantity_consumed, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?)
        `);
        for (const s of supplies) {
          insertSupply.run(uuidv4(), id, s.product_id, s.quantity_consumed || 1, now, now);
        }
      }
    });

    insert();
    const created = db.prepare(`SELECT * FROM sub_treatments WHERE id = ?`).get(id);
    res.status(201).json(created);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Editar Sub-Tratamiento
treatmentsRouter.put('/sub-treatments/:subId', (req, res) => {
  try {
    const { name, duration_minutes, base_price, allowed_days, allowed_start_time, allowed_end_time, is_active, supplies } = req.body;
    const now = new Date().toISOString();

    const update = db.transaction(() => {
      db.prepare(`
        UPDATE sub_treatments 
        SET name = ?, duration_minutes = ?, base_price = ?, allowed_days_json = ?, allowed_start_time = ?, allowed_end_time = ?, is_active = ?, updated_at = ?
        WHERE id = ? AND deleted_at IS NULL
      `).run(
        name, duration_minutes, base_price,
        JSON.stringify(allowed_days || [1, 2, 3, 4, 5, 6]),
        allowed_start_time || '08:00',
        allowed_end_time || '21:00',
        is_active ? 1 : 0,
        now, req.params.subId
      );

      if (Array.isArray(supplies)) {
        db.prepare(`DELETE FROM sub_treatment_supplies WHERE sub_treatment_id = ?`).run(req.params.subId);
        const insertSupply = db.prepare(`
          INSERT INTO sub_treatment_supplies (id, sub_treatment_id, product_id, quantity_consumed, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?)
        `);
        for (const s of supplies) {
          insertSupply.run(uuidv4(), req.params.subId, s.product_id, s.quantity_consumed || 1, now, now);
        }
      }
    });

    update();
    const updated = db.prepare(`SELECT * FROM sub_treatments WHERE id = ?`).get(req.params.subId);
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Eliminar categoría de tratamiento (soft delete)
treatmentsRouter.delete('/:id', (req, res) => {
  try {
    const now = new Date().toISOString();
    const result = db.prepare(`
      UPDATE treatments SET deleted_at = ?, updated_at = ? WHERE id = ? AND deleted_at IS NULL
    `).run(now, now, req.params.id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Tratamiento no encontrado' });
    }

    // Desactivar también sus subtratamientos
    db.prepare(`
      UPDATE sub_treatments SET deleted_at = ?, updated_at = ? WHERE treatment_id = ? AND deleted_at IS NULL
    `).run(now, now, req.params.id);

    res.json({ success: true, message: 'Categoría de tratamiento eliminada correctamente' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Eliminar sub-tratamiento / servicio (soft delete)
treatmentsRouter.delete('/sub-treatments/:subId', (req, res) => {
  try {
    const now = new Date().toISOString();
    const result = db.prepare(`
      UPDATE sub_treatments SET deleted_at = ?, updated_at = ? WHERE id = ? AND deleted_at IS NULL
    `).run(now, now, req.params.subId);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Sub-tratamiento no encontrado' });
    }

    res.json({ success: true, message: 'Servicio eliminado correctamente' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Importación masiva de tratamientos y sub-tratamientos desde planilla
treatmentsRouter.post('/batch', (req, res) => {
  try {
    const items = req.body.items || req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Se requiere una lista de tratamientos válida.' });
    }

    const now = new Date().toISOString();
    let importedCount = 0;

    const defaultColors = ['#C59B7E', '#8B9D83', '#B47B82', '#A38F78', '#6B8E23', '#708090'];

    const insertBatch = db.transaction(() => {
      const getTreatment = db.prepare(`
        SELECT id FROM treatments WHERE LOWER(name) = LOWER(?) AND deleted_at IS NULL
      `);
      const insertTreatment = db.prepare(`
        INSERT INTO treatments (id, name, category, description, color_code, icon_name, is_active, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, 'Sparkles', 1, ?, ?)
      `);
      const insertSub = db.prepare(`
        INSERT INTO sub_treatments (
          id, treatment_id, name, duration_minutes, base_price, allowed_days_json,
          allowed_start_time, allowed_end_time, is_active, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, '[1,2,3,4,5,6]', '08:00', '21:00', 1, ?, ?)
      `);

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const subName = item.sub_name || item.name;
        if (!subName || !subName.trim()) continue;

        const categoryName = (item.category_name || item.category || 'General').trim();
        let treatmentRow = getTreatment.get(categoryName) as { id: string } | undefined;

        let treatmentId: string;
        if (treatmentRow) {
          treatmentId = treatmentRow.id;
        } else {
          treatmentId = uuidv4();
          const assignedColor = defaultColors[i % defaultColors.length];
          insertTreatment.run(treatmentId, categoryName, 'facial', item.description || null, assignedColor, now, now);
        }

        const subId = uuidv4();
        insertSub.run(
          subId,
          treatmentId,
          subName.trim(),
          Number(item.duration_minutes) || 45,
          Number(item.base_price) || 0,
          now,
          now
        );
        importedCount++;
      }
    });

    insertBatch();
    res.json({ success: true, count: importedCount, message: `Se importaron ${importedCount} servicios/tratamientos con éxito.` });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

