import { Router } from 'express';
import { db } from '../db/database.js';
import { v4 as uuidv4 } from 'uuid';
import { generateQrDataUrl, getLocalIpAddress } from '../services/network.js';

export const staffRouter = Router();

// Listar profesionales
staffRouter.get('/', async (req, res) => {
  try {
    const staffList = db.prepare(`SELECT * FROM staff WHERE deleted_at IS NULL ORDER BY first_name ASC`).all();
    const localIp = getLocalIpAddress();
    const port = process.env.PORT || 3100;

    const staffWithQr = await Promise.all(
      staffList.map(async (s: any) => {
        const qrUrl = `http://${localIp}:${port}/staff?token=${s.qr_token}`;
        const qrDataUrl = await generateQrDataUrl(qrUrl);
        const schedule = db.prepare(`SELECT * FROM staff_availability WHERE staff_id = ? AND deleted_at IS NULL`).all(s.id);
        const treatments = db.prepare(`
          SELECT st.*, sub.name as sub_treatment_name 
          FROM staff_treatments st
          JOIN sub_treatments sub ON st.sub_treatment_id = sub.id
          WHERE st.staff_id = ? AND st.deleted_at IS NULL
        `).all(s.id);

        return {
          ...s,
          qr_url: qrUrl,
          qr_image: qrDataUrl,
          schedule,
          treatments,
        };
      })
    );

    res.json(staffWithQr);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener staff por Token QR (utilizado por el portal móvil)
staffRouter.get('/by-token/:token', async (req, res) => {
  try {
    const staff = db.prepare(`SELECT * FROM staff WHERE qr_token = ? AND deleted_at IS NULL AND active = 1`).get(req.params.token) as any;
    if (!staff) {
      return res.status(404).json({ error: 'Token de profesional no válido o inactivo' });
    }

    // No retornar el PIN directamente
    res.json({
      id: staff.id,
      first_name: staff.first_name,
      last_name: staff.last_name,
      role: staff.role,
      color_code: staff.color_code,
      requires_pin: Boolean(staff.pin_code),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Validar PIN de acceso para el portal móvil
staffRouter.post('/verify-pin', (req, res) => {
  try {
    const { token, pin } = req.body;
    const staff = db.prepare(`SELECT * FROM staff WHERE qr_token = ? AND deleted_at IS NULL AND active = 1`).get(token) as any;
    if (!staff) {
      return res.status(404).json({ error: 'Profesional no encontrado' });
    }

    if (staff.pin_code && staff.pin_code !== pin) {
      return res.status(401).json({ error: 'PIN incorrecto' });
    }

    res.json({
      success: true,
      staff: {
        id: staff.id,
        first_name: staff.first_name,
        last_name: staff.last_name,
        role: staff.role,
        color_code: staff.color_code,
        token: staff.qr_token,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Crear profesional
staffRouter.post('/', (req, res) => {
  try {
    const { first_name, last_name, phone, email, role, commission_type, default_commission_rate, pin_code, color_code, schedule } = req.body;
    const id = uuidv4();
    const qr_token = `${first_name.toLowerCase().replace(/\s+/g, '')}-${uuidv4().substring(0, 8)}`;
    const now = new Date().toISOString();

    const insert = db.transaction(() => {
      db.prepare(`
        INSERT INTO staff (id, first_name, last_name, phone, email, role, commission_type, default_commission_rate, pin_code, qr_token, color_code, active, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
      `).run(id, first_name, last_name, phone, email || null, role || 'esteticista', commission_type || 'fixed_percent', default_commission_rate || 0, pin_code || '1234', qr_token, color_code || '#C59B7E', now, now);

      if (Array.isArray(schedule)) {
        const insertSchedule = db.prepare(`
          INSERT INTO staff_availability (id, staff_id, day_of_week, start_time, end_time, is_active, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);
        for (const s of schedule) {
          insertSchedule.run(uuidv4(), id, s.day_of_week, s.start_time, s.end_time, s.is_active ? 1 : 0, now, now);
        }
      }
    });

    insert();
    const created = db.prepare(`SELECT * FROM staff WHERE id = ?`).get(id);
    res.status(201).json(created);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Editar profesional
staffRouter.put('/:id', (req, res) => {
  try {
    const { first_name, last_name, phone, email, role, commission_type, default_commission_rate, pin_code, color_code, active, schedule } = req.body;
    const now = new Date().toISOString();

    const update = db.transaction(() => {
      db.prepare(`
        UPDATE staff 
        SET first_name = ?, last_name = ?, phone = ?, email = ?, role = ?, commission_type = ?, default_commission_rate = ?, pin_code = ?, color_code = ?, active = ?, updated_at = ?
        WHERE id = ? AND deleted_at IS NULL
      `).run(first_name, last_name, phone, email || null, role, commission_type, default_commission_rate, pin_code, color_code, active ? 1 : 0, now, req.params.id);

      if (Array.isArray(schedule)) {
        db.prepare(`DELETE FROM staff_availability WHERE staff_id = ?`).run(req.params.id);
        const insertSchedule = db.prepare(`
          INSERT INTO staff_availability (id, staff_id, day_of_week, start_time, end_time, is_active, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);
        for (const s of schedule) {
          insertSchedule.run(uuidv4(), req.params.id, s.day_of_week, s.start_time, s.end_time, s.is_active ? 1 : 0, now, now);
        }
      }
    });

    update();
    const updated = db.prepare(`SELECT * FROM staff WHERE id = ?`).get(req.params.id);
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Regenerar Token QR
staffRouter.post('/:id/regenerate-qr', (req, res) => {
  try {
    const staff = db.prepare(`SELECT * FROM staff WHERE id = ? AND deleted_at IS NULL`).get(req.params.id) as any;
    if (!staff) {
      return res.status(404).json({ error: 'Profesional no encontrado' });
    }

    const new_token = `${staff.first_name.toLowerCase().replace(/\s+/g, '')}-${uuidv4().substring(0, 8)}`;
    const now = new Date().toISOString();

    db.prepare(`UPDATE staff SET qr_token = ?, updated_at = ? WHERE id = ?`).run(new_token, now, req.params.id);
    res.json({ success: true, new_token });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Eliminar profesional (soft delete)
staffRouter.delete('/:id', (req, res) => {
  try {
    const now = new Date().toISOString();
    const result = db.prepare(`
      UPDATE staff SET deleted_at = ?, updated_at = ? WHERE id = ? AND deleted_at IS NULL
    `).run(now, now, req.params.id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Profesional no encontrado' });
    }

    res.json({ success: true, message: 'Profesional eliminado correctamente' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Importación masiva de personal/profesionales desde planilla
staffRouter.post('/batch', (req, res) => {
  try {
    const items = req.body.items || req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Se requiere una lista de profesionales válida.' });
    }

    const now = new Date().toISOString();
    let importedCount = 0;

    const defaultColors = ['#C59B7E', '#8B9D83', '#B47B82', '#A38F78', '#6B8E23', '#708090'];

    const insertBatch = db.transaction(() => {
      const stmt = db.prepare(`
        INSERT INTO staff (
          id, first_name, last_name, phone, email, role, commission_type,
          default_commission_rate, pin_code, qr_token, color_code, active,
          created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, 'fixed_percent', ?, ?, ?, ?, 1, ?, ?)
      `);

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (!item.first_name || !item.first_name.trim()) continue;
        const id = uuidv4();
        const cleanName = item.first_name.trim().toLowerCase().replace(/\s+/g, '');
        const qrToken = `${cleanName}-${uuidv4().substring(0, 8)}`;
        const assignedColor = item.color_code?.trim() || defaultColors[i % defaultColors.length];

        stmt.run(
          id,
          item.first_name.trim(),
          item.last_name?.trim() || '',
          item.phone?.trim() || '',
          item.email?.trim() || null,
          item.role?.trim() || 'esteticista',
          Number(item.default_commission_rate) || 30,
          item.pin_code?.trim() || '1234',
          qrToken,
          assignedColor,
          now,
          now
        );
        importedCount++;
      }
    });

    insertBatch();
    res.json({ success: true, count: importedCount, message: `Se importaron ${importedCount} profesionales con éxito.` });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

