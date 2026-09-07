import { Router } from 'express';
import { db } from '../db/database.js';
import { v4 as uuidv4 } from 'uuid';
import { io } from '../index.js';
import { getLocalIpAddress } from '../services/network.js';
import QRCode from 'qrcode';

export const consentsRouter = Router();

// Obtener QR para firma móvil de consentimiento
consentsRouter.get('/qr-url', async (req, res) => {
  try {
    const { clientId, treatmentId, subTreatmentId, type } = req.query;
    const localIp = getLocalIpAddress();
    const port = Number(process.env.PORT) || 3100;

    let url = `http://${localIp}:${port}/consent/sign?clientId=${clientId || ''}&type=${type || 'facial'}`;
    if (treatmentId) url += `&treatmentId=${treatmentId}`;
    if (subTreatmentId) url += `&subTreatmentId=${subTreatmentId}`;

    const qrImage = await QRCode.toDataURL(url, {
      margin: 1,
      color: {
        dark: '#2D2926',
        light: '#FAF7F2',
      },
      width: 320,
    });

    res.json({
      url,
      qrImage,
      localIp,
      port,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Listar consentimientos de un cliente
consentsRouter.get('/client/:clientId', (req, res) => {
  try {
    const consents = db.prepare(`
      SELECT ic.*, t.name as treatment_name, st.name as sub_treatment_name
      FROM informed_consents ic
      LEFT JOIN treatments t ON ic.treatment_id = t.id
      LEFT JOIN sub_treatments st ON ic.sub_treatment_id = st.id
      WHERE ic.client_id = ? AND ic.deleted_at IS NULL
      ORDER BY ic.signed_at DESC
    `).all(req.params.clientId);

    const formatted = consents.map((c: any) => ({
      ...c,
      form_data: c.form_data_json ? JSON.parse(c.form_data_json) : null,
    }));

    res.json(formatted);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Guardar consentimiento firmado (desde PC o desde Móvil)
consentsRouter.post('/', (req, res) => {
  try {
    const {
      client_id,
      treatment_id,
      sub_treatment_id,
      title,
      content_text,
      client_dni,
      client_full_name,
      signature_image_base64,
      witness_name,
      form_data,
    } = req.body;

    const id = uuidv4();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO informed_consents (
        id, client_id, treatment_id, sub_treatment_id, title, content_text,
        client_dni, client_full_name, signature_image_base64, signed_at, witness_name,
        form_data_json, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      client_id,
      treatment_id || null,
      sub_treatment_id || null,
      title || 'Cuidado Facial y de la Piel — Formulario de Consulta & Consentimiento Informado',
      content_text || '',
      client_dni || '',
      client_full_name || '',
      signature_image_base64,
      now,
      witness_name || null,
      form_data ? JSON.stringify(form_data) : null,
      now,
      now
    );

    const created = db.prepare(`SELECT * FROM informed_consents WHERE id = ?`).get(id) as any;
    const formatted = {
      ...created,
      form_data: created.form_data_json ? JSON.parse(created.form_data_json) : null,
    };

    // Emitir evento WebSocket para actualización instantánea en la app de escritorio
    io.emit('consent:signed', formatted);

    res.status(201).json(formatted);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
