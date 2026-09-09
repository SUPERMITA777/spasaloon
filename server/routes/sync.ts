import { Router } from 'express';
import QRCode from 'qrcode';
import { db } from '../db/database.js';
import { io } from '../index.js';
import { getLocalIpAddress } from '../services/network.js';

export const syncRouter = Router();

// GET /api/sync/mobile-app-info - Información de conexión y QR para iPhone y Android
syncRouter.get('/mobile-app-info', async (req, res) => {
  try {
    const localIp = getLocalIpAddress();
    const port = Number(process.env.PORT) || 3100;
    const mobileUrl = `http://${localIp}:${port}/mobile`;

    const qrCodeDataUrl = await QRCode.toDataURL(mobileUrl, {
      width: 320,
      margin: 2,
      color: {
        dark: '#4A3B32',
        light: '#FAF5EE',
      },
    });

    res.json({
      success: true,
      localIp,
      port,
      mobileUrl,
      qrCodeDataUrl,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/sync/snapshot - Retorna copia completa para sembrar el almacenamiento local del móvil
syncRouter.get('/snapshot', (req, res) => {
  try {
    const clients = db.prepare('SELECT * FROM clients').all();
    const treatments = db.prepare('SELECT * FROM treatments WHERE is_active = 1').all();
    const subTreatments = db.prepare('SELECT * FROM sub_treatments WHERE is_active = 1').all();
    const boxes = db.prepare('SELECT * FROM boxes WHERE is_active = 1').all();
    const staff = db.prepare('SELECT id, first_name, last_name, role, color_code, is_active FROM staff WHERE is_active = 1').all();
    const products = db.prepare('SELECT * FROM products WHERE is_active = 1').all();

    // Turnos de los últimos 30 días y próximos 90 días
    const appointments = db.prepare(`
      SELECT 
        a.*,
        c.first_name as client_first_name, c.last_name as client_last_name, c.phone as client_phone,
        s.first_name as staff_first_name, s.last_name as staff_last_name, s.color_code as staff_color,
        b.name as box_name, b.color_code as box_color,
        st.name as sub_treatment_name, t.name as treatment_name, t.color_code as treatment_color
      FROM appointments a
      LEFT JOIN clients c ON a.client_id = c.id
      LEFT JOIN staff s ON a.staff_id = s.id
      LEFT JOIN boxes b ON a.box_id = b.id
      LEFT JOIN sub_treatments st ON a.sub_treatment_id = st.id
      LEFT JOIN treatments t ON st.treatment_id = t.id
      ORDER BY a.start_time ASC
    `).all();

    // Formatear appointments anidando objetos relacionados
    const formattedAppts = appointments.map((a: any) => ({
      ...a,
      client: a.client_id ? { id: a.client_id, first_name: a.client_first_name, last_name: a.client_last_name, phone: a.client_phone } : null,
      staff: a.staff_id ? { id: a.staff_id, first_name: a.staff_first_name, last_name: a.staff_last_name, color_code: a.staff_color } : null,
      box: a.box_id ? { id: a.box_id, name: a.box_name, color_code: a.box_color } : null,
      sub_treatment: a.sub_treatment_id ? { id: a.sub_treatment_id, name: a.sub_treatment_name } : null,
      treatment: a.treatment_name ? { name: a.treatment_name, color_code: a.treatment_color } : null,
      cart_items: db.prepare('SELECT * FROM appointment_cart_items WHERE appointment_id = ?').all(a.id),
    }));

    // Formatear treatments con sub-tratamientos
    const formattedTreatments = treatments.map((t: any) => ({
      ...t,
      sub_treatments: subTreatments.filter((st: any) => st.treatment_id === t.id),
    }));

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      data: {
        clients,
        treatments: formattedTreatments,
        boxes,
        staff,
        products,
        appointments: formattedAppts,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/sync/batch - Procesa mutaciones generadas offline por el móvil
syncRouter.post('/batch', (req, res) => {
  const { mutations } = req.body;
  if (!Array.isArray(mutations)) {
    return res.status(400).json({ success: false, error: 'Se esperaba un array de mutaciones.' });
  }

  const processedIds: string[] = [];
  const conflicts: any[] = [];

  const executeBatch = db.transaction(() => {
    for (const m of mutations) {
      const { id, entity, action, entityId, data, clientTimestamp, lastSyncedAt } = m;

      if (entity === 'appointment') {
        if (action === 'create') {
          const existing = db.prepare('SELECT id FROM appointments WHERE id = ?').get(entityId);
          if (!existing) {
            db.prepare(`
              INSERT INTO appointments (
                id, client_id, staff_id, box_id, sub_treatment_id, start_time, end_time,
                service_price, deposit_amount, status, notes, created_at, updated_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).run(
              entityId,
              data.client_id,
              data.staff_id,
              data.box_id,
              data.sub_treatment_id,
              data.start_time,
              data.end_time,
              data.service_price || 0,
              data.deposit_amount || 0,
              data.status || 'scheduled',
              data.notes || '',
              data.created_at || clientTimestamp || new Date().toISOString(),
              data.updated_at || clientTimestamp || new Date().toISOString()
            );
          }
          processedIds.push(id);
        } else if (action === 'update') {
          const current: any = db.prepare('SELECT * FROM appointments WHERE id = ?').get(entityId);
          if (!current) {
            // El turno no existe en el servidor, no hay conflicto, se descarta o recrea
            processedIds.push(id);
            continue;
          }

          // Detección de discrepancias:
          // Si el registro del servidor fue modificado después de la última sincronización del móvil
          // y los datos difieren en campos clave (start_time, status, notes, staff_id)
          const serverUpdated = new Date(current.updated_at || current.created_at).getTime();
          const clientSynced = lastSyncedAt ? new Date(lastSyncedAt).getTime() : 0;

          const hasDiverged =
            (data.start_time && data.start_time !== current.start_time) ||
            (data.status && data.status !== current.status) ||
            (data.notes !== undefined && data.notes !== current.notes) ||
            (data.staff_id && data.staff_id !== current.staff_id);

          if (serverUpdated > clientSynced && hasDiverged) {
            // Registrar conflicto para consultar al operador
            conflicts.push({
              mutationId: id,
              entity: 'appointment',
              entityId,
              entityDescription: `Turno #${entityId.substring(0, 8)}`,
              mobileData: {
                ...current,
                ...data,
                clientTimestamp,
              },
              serverData: current,
              diffFields: [
                data.start_time !== current.start_time ? 'start_time' : null,
                data.status !== current.status ? 'status' : null,
                data.notes !== current.notes ? 'notes' : null,
                data.staff_id !== current.staff_id ? 'staff_id' : null,
              ].filter(Boolean),
            });
          } else {
            // No hay conflicto: aplicar actualización limpia
            const fields: string[] = [];
            const values: any[] = [];

            if (data.start_time) { fields.push('start_time = ?'); values.push(data.start_time); }
            if (data.end_time) { fields.push('end_time = ?'); values.push(data.end_time); }
            if (data.staff_id) { fields.push('staff_id = ?'); values.push(data.staff_id); }
            if (data.box_id) { fields.push('box_id = ?'); values.push(data.box_id); }
            if (data.status) { fields.push('status = ?'); values.push(data.status); }
            if (data.notes !== undefined) { fields.push('notes = ?'); values.push(data.notes); }
            fields.push('updated_at = ?');
            values.push(new Date().toISOString());

            values.push(entityId);
            db.prepare(`UPDATE appointments SET ${fields.join(', ')} WHERE id = ?`).run(...values);
            processedIds.push(id);
          }
        }
      } else if (entity === 'client') {
        if (action === 'create') {
          const existing = db.prepare('SELECT id FROM clients WHERE id = ?').get(entityId);
          if (!existing) {
            db.prepare(`
              INSERT INTO clients (
                id, first_name, last_name, phone, email, dni, notes, created_at, updated_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).run(
              entityId,
              data.first_name,
              data.last_name,
              data.phone || null,
              data.email || null,
              data.dni || null,
              data.notes || null,
              data.created_at || clientTimestamp || new Date().toISOString(),
              data.updated_at || clientTimestamp || new Date().toISOString()
            );
          }
          processedIds.push(id);
        } else if (action === 'update') {
          const current: any = db.prepare('SELECT * FROM clients WHERE id = ?').get(entityId);
          if (current) {
            const fields: string[] = [];
            const values: any[] = [];
            if (data.first_name) { fields.push('first_name = ?'); values.push(data.first_name); }
            if (data.last_name) { fields.push('last_name = ?'); values.push(data.last_name); }
            if (data.phone !== undefined) { fields.push('phone = ?'); values.push(data.phone); }
            if (data.email !== undefined) { fields.push('email = ?'); values.push(data.email); }
            if (data.notes !== undefined) { fields.push('notes = ?'); values.push(data.notes); }
            fields.push('updated_at = ?');
            values.push(new Date().toISOString());
            values.push(entityId);
            db.prepare(`UPDATE clients SET ${fields.join(', ')} WHERE id = ?`).run(...values);
          }
          processedIds.push(id);
        }
      }
    }
  });

  try {
    executeBatch();
    io.emit('data-sync-completed', { timestamp: new Date().toISOString() });
    res.json({
      success: true,
      processedIds,
      conflicts,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/sync/resolve-conflict - Resuelve una discrepancia según la elección del operador
syncRouter.post('/resolve-conflict', (req, res) => {
  const { entity, entityId, resolution, chosenData } = req.body;

  try {
    if (resolution === 'use_server') {
      // El operador decidió conservar lo que está en la computadora, no se altera el servidor
      io.emit('data-sync-completed', { timestamp: new Date().toISOString() });
      return res.json({ success: true, message: 'Datos del servidor conservados correctamente.' });
    }

    if (entity === 'appointment' && chosenData) {
      db.prepare(`
        UPDATE appointments SET
          start_time = COALESCE(?, start_time),
          end_time = COALESCE(?, end_time),
          staff_id = COALESCE(?, staff_id),
          box_id = COALESCE(?, box_id),
          status = COALESCE(?, status),
          notes = COALESCE(?, notes),
          updated_at = ?
        WHERE id = ?
      `).run(
        chosenData.start_time || null,
        chosenData.end_time || null,
        chosenData.staff_id || null,
        chosenData.box_id || null,
        chosenData.status || null,
        chosenData.notes !== undefined ? chosenData.notes : null,
        new Date().toISOString(),
        entityId
      );
    } else if (entity === 'client' && chosenData) {
      db.prepare(`
        UPDATE clients SET
          first_name = COALESCE(?, first_name),
          last_name = COALESCE(?, last_name),
          phone = COALESCE(?, phone),
          email = COALESCE(?, email),
          notes = COALESCE(?, notes),
          updated_at = ?
        WHERE id = ?
      `).run(
        chosenData.first_name || null,
        chosenData.last_name || null,
        chosenData.phone || null,
        chosenData.email || null,
        chosenData.notes !== undefined ? chosenData.notes : null,
        new Date().toISOString(),
        entityId
      );
    }

    io.emit('data-sync-completed', { timestamp: new Date().toISOString() });
    res.json({ success: true, message: 'Discrepancia resuelta y sincronizada.' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});
