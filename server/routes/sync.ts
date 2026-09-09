import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import QRCode from 'qrcode';
import { db } from '../db/database.js';
import { io } from '../index.js';
import { getLocalIpAddress } from '../services/network.js';

export const syncRouter = Router();

// Estado del túnel para conexión a distancia
let activeTunnel: any = null;
let activeTunnelUrl: string | null = null;

// Cola de conflictos pendientes para ser revisados y confirmados en el servidor
interface PendingConflict {
  id: string;
  mutationId: string;
  entity: 'appointment' | 'client' | 'sub_treatment' | 'treatment' | 'price';
  entityId: string;
  entityDescription: string;
  mobileData: any;
  serverData: any;
  diffFields: string[];
  createdAt: string;
}

const pendingConflictsMap = new Map<string, PendingConflict>();

// GET /api/sync/mobile-app-info - Información de conexión y QR para iPhone y Android
syncRouter.get('/mobile-app-info', async (req, res) => {
  try {
    const localIp = getLocalIpAddress();
    const port = Number(process.env.PORT) || 3100;
    const localMobileUrl = `http://${localIp}:${port}/mobile`;

    const localQrCodeDataUrl = await QRCode.toDataURL(localMobileUrl, {
      width: 320,
      margin: 2,
      color: {
        dark: '#4A3B32',
        light: '#FAF5EE',
      },
    });

    let remoteQrCodeDataUrl: string | null = null;
    if (activeTunnelUrl) {
      remoteQrCodeDataUrl = await QRCode.toDataURL(`${activeTunnelUrl}/mobile`, {
        width: 320,
        margin: 2,
        color: {
          dark: '#935F4C',
          light: '#FAF5EE',
        },
      });
    }

    res.json({
      success: true,
      localIp,
      port,
      mobileUrl: activeTunnelUrl ? `${activeTunnelUrl}/mobile` : localMobileUrl,
      localMobileUrl,
      localQrCodeDataUrl,
      isTunnelActive: !!activeTunnelUrl,
      remoteMobileUrl: activeTunnelUrl ? `${activeTunnelUrl}/mobile` : null,
      remoteQrCodeDataUrl,
      pendingConflictsCount: pendingConflictsMap.size,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/sync/ios-profile - Descarga de perfil de configuración WebClip para iOS (instalación nativa autónoma)
syncRouter.get('/ios-profile', (req, res) => {
  try {
    const localIp = getLocalIpAddress();
    const port = Number(process.env.PORT) || 3100;
    const targetUrl = activeTunnelUrl ? `${activeTunnelUrl}/mobile` : `http://${localIp}:${port}/mobile`;

    let iconBase64 = '';
    const iconPath = path.resolve(process.cwd(), 'public/apple-touch-icon.png');
    if (fs.existsSync(iconPath)) {
      iconBase64 = fs.readFileSync(iconPath).toString('base64');
    }

    const mobileConfigXml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>PayloadContent</key>
    <array>
        <dict>
            <key>FullScreen</key>
            <true/>
            <key>IsRemovable</key>
            <true/>
            ${iconBase64 ? `<key>Icon</key>\n            <data>\n${iconBase64}\n            </data>` : ''}
            <key>Label</key>
            <string>Hikari Suite</string>
            <key>PayloadDescription</key>
            <string>Acceso autónomo a Hikari Suite en la pantalla de inicio sin barras de navegador.</string>
            <key>PayloadDisplayName</key>
            <string>Hikari Suite</string>
            <key>PayloadIdentifier</key>
            <string>com.hikari.suite.webclip</string>
            <key>PayloadType</key>
            <string>com.apple.webClip.managed</string>
            <key>PayloadUUID</key>
            <string>e7c8e762-23c2-4889-b883-fa4c88db9a11</string>
            <key>PayloadVersion</key>
            <integer>1</integer>
            <key>Precomposed</key>
            <true/>
            <key>URL</key>
            <string>${targetUrl}</string>
        </dict>
    </array>
    <key>PayloadDisplayName</key>
    <string>Hikari Suite — App Móvil</string>
    <key>PayloadIdentifier</key>
    <string>com.hikari.suite.profile</string>
    <key>PayloadRemovalDisallowed</key>
    <false/>
    <key>PayloadType</key>
    <string>Configuration</string>
    <key>PayloadUUID</key>
    <string>9a71b238-1644-4824-8b64-8ff1f618bcf3</string>
    <key>PayloadVersion</key>
    <integer>1</integer>
</dict>
</plist>`;

    res.setHeader('Content-Type', 'application/x-apple-as-profile; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="HikariSuite.mobileconfig"');
    res.send(mobileConfigXml);
  } catch (error: any) {
    res.status(500).send(error.message);
  }
});

// POST /api/sync/toggle-remote-tunnel - Activa o desactiva la conexión a distancia
syncRouter.post('/toggle-remote-tunnel', async (req, res) => {
  try {
    const port = Number(process.env.PORT) || 3100;

    if (activeTunnel) {
      try {
        if (typeof activeTunnel.stop === 'function') {
          activeTunnel.stop();
        } else if (typeof activeTunnel.close === 'function') {
          activeTunnel.close();
        }
      } catch {}
      activeTunnel = null;
      activeTunnelUrl = null;
      io.emit('sync:tunnel-status', { isTunnelActive: false, remoteMobileUrl: null });
      return res.json({ success: true, isTunnelActive: false, message: 'Túnel a distancia desconectado.' });
    }

    let url: string | null = null;
    let tunnelInstance: any = null;

    // 1. Prioridad: Cloudflare Quick Tunnel (sin pantallas de advertencia/IP de loca.lt, HTTPS nativo y validado)
    try {
      const { Tunnel } = await import('cloudflared');
      const cfTunnel = Tunnel.quick(`http://localhost:${port}`);

      url = await new Promise<string>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Cloudflare tunnel timeout (12s)'));
        }, 12000);

        cfTunnel.once('url', (tunnelUrl: string) => {
          clearTimeout(timeout);
          resolve(tunnelUrl);
        });

        cfTunnel.once('error', (err: any) => {
          clearTimeout(timeout);
          reject(err);
        });

        cfTunnel.once('exit', (code: any) => {
          clearTimeout(timeout);
          if (!url) reject(new Error(`Cloudflare tunnel cerró con código ${code}`));
        });
      });

      tunnelInstance = cfTunnel;
      cfTunnel.on('exit', () => {
        activeTunnel = null;
        activeTunnelUrl = null;
        io.emit('sync:tunnel-status', { isTunnelActive: false, remoteMobileUrl: null });
      });
    } catch (cfErr) {
      console.warn('Cloudflare tunnel falló o tardó demasiado, usando fallback localtunnel:', cfErr);
      const localtunnel = (await import('localtunnel')).default;
      const ltTunnel = await localtunnel({ port });
      url = ltTunnel.url;
      tunnelInstance = ltTunnel;

      ltTunnel.on('close', () => {
        activeTunnel = null;
        activeTunnelUrl = null;
        io.emit('sync:tunnel-status', { isTunnelActive: false, remoteMobileUrl: null });
      });
    }

    activeTunnel = tunnelInstance;
    activeTunnelUrl = url;

    const remoteQrCodeDataUrl = await QRCode.toDataURL(`${activeTunnelUrl}/mobile`, {
      width: 320,
      margin: 2,
      color: {
        dark: '#935F4C',
        light: '#FAF5EE',
      },
    });

    io.emit('sync:tunnel-status', {
      isTunnelActive: true,
      remoteMobileUrl: `${activeTunnelUrl}/mobile`,
    });

    res.json({
      success: true,
      isTunnelActive: true,
      remoteMobileUrl: `${activeTunnelUrl}/mobile`,
      remoteQrCodeDataUrl,
      message: 'Conexión a distancia activada con éxito.',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/sync/pending-conflicts - Lista los conflictos pendientes para confirmación en el servidor
syncRouter.get('/pending-conflicts', (req, res) => {
  res.json({
    success: true,
    conflicts: Array.from(pendingConflictsMap.values()),
  });
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

    const formattedAppts = appointments.map((a: any) => ({
      ...a,
      client: a.client_id ? { id: a.client_id, first_name: a.client_first_name, last_name: a.client_last_name, phone: a.client_phone } : null,
      staff: a.staff_id ? { id: a.staff_id, first_name: a.staff_first_name, last_name: a.staff_last_name, color_code: a.staff_color } : null,
      box: a.box_id ? { id: a.box_id, name: a.box_name, color_code: a.box_color } : null,
      sub_treatment: a.sub_treatment_id ? { id: a.sub_treatment_id, name: a.sub_treatment_name } : null,
      treatment: a.treatment_name ? { name: a.treatment_name, color_code: a.treatment_color } : null,
      cart_items: db.prepare('SELECT * FROM appointment_cart_items WHERE appointment_id = ?').all(a.id),
    }));

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
        sub_treatments: subTreatments,
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
  const newConflicts: PendingConflict[] = [];

  const executeBatch = db.transaction(() => {
    for (const m of mutations) {
      const { id, entity, action, entityId, data, clientTimestamp, lastSyncedAt } = m;

      // 1. GESTIÓN DE CITAS / TURNOS
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
            processedIds.push(id);
            continue;
          }

          const serverUpdated = new Date(current.updated_at || current.created_at).getTime();
          const clientSynced = lastSyncedAt ? new Date(lastSyncedAt).getTime() : 0;

          const hasDiverged =
            (data.start_time && data.start_time !== current.start_time) ||
            (data.status && data.status !== current.status) ||
            (data.notes !== undefined && data.notes !== current.notes) ||
            (data.staff_id && data.staff_id !== current.staff_id) ||
            (data.box_id && data.box_id !== current.box_id) ||
            (data.service_price !== undefined && Number(data.service_price) !== Number(current.service_price));

          if (serverUpdated > clientSynced && hasDiverged) {
            // Se detectó discrepancia: Registrar para confirmación en el servidor
            const conflict: PendingConflict = {
              id: `conflict-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
              mutationId: id,
              entity: 'appointment',
              entityId,
              entityDescription: `Cita #${entityId.substring(0, 8)} (${data.start_time || current.start_time})`,
              mobileData: { ...current, ...data, clientTimestamp },
              serverData: current,
              diffFields: [
                data.start_time !== current.start_time ? 'start_time' : null,
                data.status !== current.status ? 'status' : null,
                data.notes !== current.notes ? 'notes' : null,
                data.staff_id !== current.staff_id ? 'staff_id' : null,
                data.service_price !== current.service_price ? 'service_price' : null,
              ].filter(Boolean) as string[],
              createdAt: new Date().toISOString(),
            };

            pendingConflictsMap.set(conflict.id, conflict);
            newConflicts.push(conflict);
          } else {
            // Sin conflicto: aplicar actualización directamente
            const fields: string[] = [];
            const values: any[] = [];

            if (data.start_time) { fields.push('start_time = ?'); values.push(data.start_time); }
            if (data.end_time) { fields.push('end_time = ?'); values.push(data.end_time); }
            if (data.staff_id) { fields.push('staff_id = ?'); values.push(data.staff_id); }
            if (data.box_id) { fields.push('box_id = ?'); values.push(data.box_id); }
            if (data.status) { fields.push('status = ?'); values.push(data.status); }
            if (data.notes !== undefined) { fields.push('notes = ?'); values.push(data.notes); }
            if (data.service_price !== undefined) { fields.push('service_price = ?'); values.push(data.service_price); }
            if (data.deposit_amount !== undefined) { fields.push('deposit_amount = ?'); values.push(data.deposit_amount); }
            fields.push('updated_at = ?');
            values.push(new Date().toISOString());

            values.push(entityId);
            db.prepare(`UPDATE appointments SET ${fields.join(', ')} WHERE id = ?`).run(...values);
            processedIds.push(id);
          }
        } else if (action === 'delete') {
          db.prepare('UPDATE appointments SET status = "cancelled", updated_at = ? WHERE id = ?').run(
            new Date().toISOString(),
            entityId
          );
          processedIds.push(id);
        }
      }

      // 2. GESTIÓN DE CLIENTES
      else if (entity === 'client') {
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
            const serverUpdated = new Date(current.updated_at || current.created_at).getTime();
            const clientSynced = lastSyncedAt ? new Date(lastSyncedAt).getTime() : 0;

            const hasDiverged =
              (data.first_name && data.first_name !== current.first_name) ||
              (data.last_name && data.last_name !== current.last_name) ||
              (data.phone !== undefined && data.phone !== current.phone) ||
              (data.email !== undefined && data.email !== current.email);

            if (serverUpdated > clientSynced && hasDiverged) {
              const conflict: PendingConflict = {
                id: `conflict-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
                mutationId: id,
                entity: 'client',
                entityId,
                entityDescription: `Cliente: ${data.first_name || current.first_name} ${data.last_name || current.last_name}`,
                mobileData: { ...current, ...data, clientTimestamp },
                serverData: current,
                diffFields: [
                  data.first_name !== current.first_name ? 'first_name' : null,
                  data.last_name !== current.last_name ? 'last_name' : null,
                  data.phone !== current.phone ? 'phone' : null,
                  data.email !== current.email ? 'email' : null,
                ].filter(Boolean) as string[],
                createdAt: new Date().toISOString(),
              };

              pendingConflictsMap.set(conflict.id, conflict);
              newConflicts.push(conflict);
            } else {
              const fields: string[] = [];
              const values: any[] = [];
              if (data.first_name) { fields.push('first_name = ?'); values.push(data.first_name); }
              if (data.last_name) { fields.push('last_name = ?'); values.push(data.last_name); }
              if (data.phone !== undefined) { fields.push('phone = ?'); values.push(data.phone); }
              if (data.email !== undefined) { fields.push('email = ?'); values.push(data.email); }
              if (data.dni !== undefined) { fields.push('dni = ?'); values.push(data.dni); }
              if (data.notes !== undefined) { fields.push('notes = ?'); values.push(data.notes); }
              fields.push('updated_at = ?');
              values.push(new Date().toISOString());
              values.push(entityId);
              db.prepare(`UPDATE clients SET ${fields.join(', ')} WHERE id = ?`).run(...values);
              processedIds.push(id);
            }
          } else {
            processedIds.push(id);
          }
        }
      }

      // 3. GESTIÓN DE PRECIOS Y SUB-TRATAMIENTOS
      else if (entity === 'sub_treatment' || entity === 'price') {
        if (action === 'update' || action === 'update_price') {
          const current: any = db.prepare('SELECT * FROM sub_treatments WHERE id = ?').get(entityId);
          if (current) {
            const serverUpdated = new Date(current.updated_at || current.created_at || '2026-01-01').getTime();
            const clientSynced = lastSyncedAt ? new Date(lastSyncedAt).getTime() : 0;

            const hasDiverged =
              (data.price !== undefined && Number(data.price) !== Number(current.price)) ||
              (data.name && data.name !== current.name) ||
              (data.duration_minutes !== undefined && Number(data.duration_minutes) !== Number(current.duration_minutes));

            if (serverUpdated > clientSynced && hasDiverged) {
              const conflict: PendingConflict = {
                id: `conflict-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
                mutationId: id,
                entity: 'sub_treatment',
                entityId,
                entityDescription: `Servicio / Precio: ${current.name}`,
                mobileData: { ...current, ...data, clientTimestamp },
                serverData: current,
                diffFields: [
                  data.price !== current.price ? 'price' : null,
                  data.name !== current.name ? 'name' : null,
                  data.duration_minutes !== current.duration_minutes ? 'duration_minutes' : null,
                ].filter(Boolean) as string[],
                createdAt: new Date().toISOString(),
              };

              pendingConflictsMap.set(conflict.id, conflict);
              newConflicts.push(conflict);
            } else {
              const fields: string[] = [];
              const values: any[] = [];
              if (data.price !== undefined) { fields.push('price = ?'); values.push(data.price); }
              if (data.name) { fields.push('name = ?'); values.push(data.name); }
              if (data.duration_minutes !== undefined) { fields.push('duration_minutes = ?'); values.push(data.duration_minutes); }
              if (data.description !== undefined) { fields.push('description = ?'); values.push(data.description); }
              fields.push('updated_at = ?');
              values.push(new Date().toISOString());
              values.push(entityId);
              db.prepare(`UPDATE sub_treatments SET ${fields.join(', ')} WHERE id = ?`).run(...values);
              processedIds.push(id);
            }
          } else {
            processedIds.push(id);
          }
        } else if (action === 'create') {
          const existing = db.prepare('SELECT id FROM sub_treatments WHERE id = ?').get(entityId);
          if (!existing) {
            db.prepare(`
              INSERT INTO sub_treatments (
                id, treatment_id, name, description, duration_minutes, price, is_active, created_at, updated_at
              ) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)
            `).run(
              entityId,
              data.treatment_id,
              data.name,
              data.description || null,
              data.duration_minutes || 60,
              data.price || 0,
              data.created_at || new Date().toISOString(),
              data.updated_at || new Date().toISOString()
            );
          }
          processedIds.push(id);
        }
      }

      // 4. GESTIÓN DE TRATAMIENTOS / CATEGORÍAS
      else if (entity === 'treatment') {
        if (action === 'create') {
          const existing = db.prepare('SELECT id FROM treatments WHERE id = ?').get(entityId);
          if (!existing) {
            db.prepare(`
              INSERT INTO treatments (id, name, description, color_code, is_active, created_at, updated_at)
              VALUES (?, ?, ?, ?, 1, ?, ?)
            `).run(
              entityId,
              data.name,
              data.description || null,
              data.color_code || '#D4AF37',
              data.created_at || new Date().toISOString(),
              data.updated_at || new Date().toISOString()
            );
          }
          processedIds.push(id);
        } else if (action === 'update') {
          const fields: string[] = [];
          const values: any[] = [];
          if (data.name) { fields.push('name = ?'); values.push(data.name); }
          if (data.description !== undefined) { fields.push('description = ?'); values.push(data.description); }
          if (data.color_code) { fields.push('color_code = ?'); values.push(data.color_code); }
          fields.push('updated_at = ?');
          values.push(new Date().toISOString());
          values.push(entityId);
          db.prepare(`UPDATE treatments SET ${fields.join(', ')} WHERE id = ?`).run(...values);
          processedIds.push(id);
        }
      }
    }
  });

  try {
    executeBatch();

    // Notificar al servidor central de cualquier conflicto nuevo para que el operador los confirme
    if (newConflicts.length > 0) {
      io.emit('sync:conflict-detected', {
        conflicts: Array.from(pendingConflictsMap.values()),
        newConflicts,
      });
    }

    // Emitir refresco de datos en tiempo real
    io.emit('data-sync-completed', { timestamp: new Date().toISOString() });

    res.json({
      success: true,
      processedIds,
      conflicts: newConflicts,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/sync/resolve-conflict - Resuelve una discrepancia según la elección del operador en el servidor
syncRouter.post('/resolve-conflict', (req, res) => {
  const { conflictId, entity, entityId, resolution, chosenData } = req.body;

  try {
    // Si viene conflictId, removerlo de la lista pendiente del servidor
    if (conflictId && pendingConflictsMap.has(conflictId)) {
      pendingConflictsMap.delete(conflictId);
    }

    if (resolution === 'use_server') {
      // El operador en la computadora decidió conservar los datos locales de la PC
      io.emit('sync:conflict-resolved', {
        conflictId,
        entity,
        entityId,
        resolution: 'use_server',
      });
      io.emit('data-sync-completed', { timestamp: new Date().toISOString() });
      return res.json({ success: true, message: 'Datos de la computadora conservados correctamente.' });
    }

    // El operador en la computadora autorizó aplicar los cambios que envió el móvil
    if (entity === 'appointment' && chosenData) {
      db.prepare(`
        UPDATE appointments SET
          start_time = COALESCE(?, start_time),
          end_time = COALESCE(?, end_time),
          staff_id = COALESCE(?, staff_id),
          box_id = COALESCE(?, box_id),
          status = COALESCE(?, status),
          service_price = COALESCE(?, service_price),
          deposit_amount = COALESCE(?, deposit_amount),
          notes = COALESCE(?, notes),
          updated_at = ?
        WHERE id = ?
      `).run(
        chosenData.start_time || null,
        chosenData.end_time || null,
        chosenData.staff_id || null,
        chosenData.box_id || null,
        chosenData.status || null,
        chosenData.service_price !== undefined ? chosenData.service_price : null,
        chosenData.deposit_amount !== undefined ? chosenData.deposit_amount : null,
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
    } else if ((entity === 'sub_treatment' || entity === 'price') && chosenData) {
      db.prepare(`
        UPDATE sub_treatments SET
          price = COALESCE(?, price),
          name = COALESCE(?, name),
          duration_minutes = COALESCE(?, duration_minutes),
          updated_at = ?
        WHERE id = ?
      `).run(
        chosenData.price !== undefined ? chosenData.price : null,
        chosenData.name || null,
        chosenData.duration_minutes !== undefined ? chosenData.duration_minutes : null,
        new Date().toISOString(),
        entityId
      );
    }

    io.emit('sync:conflict-resolved', {
      conflictId,
      entity,
      entityId,
      resolution: 'use_mobile',
      chosenData,
    });
    io.emit('data-sync-completed', { timestamp: new Date().toISOString() });

    res.json({ success: true, message: 'Discrepancia confirmada y aplicada en el servidor.' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});
