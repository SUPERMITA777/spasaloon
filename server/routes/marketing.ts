import { Router } from 'express';
import { db } from '../db/database.js';
import { v4 as uuidv4 } from 'uuid';

export const marketingRouter = Router();

// Listar recursos multimedia de marketing
marketingRouter.get('/media', (req, res) => {
  try {
    const { treatment_id, sub_treatment_id } = req.query;
    let query = `
      SELECT mm.*, t.name as treatment_name, st.name as sub_treatment_name
      FROM marketing_media mm
      LEFT JOIN treatments t ON mm.treatment_id = t.id
      LEFT JOIN sub_treatments st ON mm.sub_treatment_id = st.id
      WHERE mm.deleted_at IS NULL
    `;
    const params: any[] = [];

    if (treatment_id) {
      query += ` AND mm.treatment_id = ?`;
      params.push(treatment_id);
    }
    if (sub_treatment_id) {
      query += ` AND mm.sub_treatment_id = ?`;
      params.push(sub_treatment_id);
    }

    query += ` ORDER BY mm.created_at DESC`;
    const rows = db.prepare(query).all(...params) as any[];

    const formatted = rows.map(r => ({
      ...r,
      hashtags: JSON.parse(r.hashtags_json || '[]'),
      suggested_stories: JSON.parse(r.suggested_stories_json || '[]'),
    }));

    res.json(formatted);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Guardar nuevo recurso multimedia
marketingRouter.post('/media', (req, res) => {
  try {
    const { treatment_id, sub_treatment_id, title, media_type, file_url, thumbnail_url, caption_template, hashtags, suggested_stories } = req.body;
    const id = uuidv4();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO marketing_media (id, treatment_id, sub_treatment_id, title, media_type, file_url, thumbnail_url, caption_template, hashtags_json, suggested_stories_json, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, treatment_id || null, sub_treatment_id || null,
      title, media_type || 'image', file_url, thumbnail_url || null,
      caption_template || '',
      JSON.stringify(hashtags || []),
      JSON.stringify(suggested_stories || []),
      now, now
    );

    const created = db.prepare(`SELECT * FROM marketing_media WHERE id = ?`).get(id) as any;
    res.status(201).json({
      ...created,
      hashtags: JSON.parse(created.hashtags_json || '[]'),
      suggested_stories: JSON.parse(created.suggested_stories_json || '[]'),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Listar publicaciones programadas
marketingRouter.get('/posts', (req, res) => {
  try {
    const posts = db.prepare(`
      SELECT mp.*, t.name as treatment_name, st.name as sub_treatment_name
      FROM marketing_posts mp
      LEFT JOIN treatments t ON mp.treatment_id = t.id
      LEFT JOIN sub_treatments st ON mp.sub_treatment_id = st.id
      WHERE mp.deleted_at IS NULL
      ORDER BY mp.scheduled_for DESC
    `).all() as any[];

    const formatted = posts.map(p => ({
      ...p,
      hashtags: JSON.parse(p.hashtags_json || '[]'),
      media_files: JSON.parse(p.media_files_json || '[]'),
      target_channels: JSON.parse(p.target_channels_json || '["instagram", "whatsapp_status"]'),
    }));

    res.json(formatted);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Programar nueva publicación
marketingRouter.post('/posts', (req, res) => {
  try {
    const { treatment_id, sub_treatment_id, title, caption, hashtags, media_files, target_channels, scheduled_for } = req.body;
    const id = uuidv4();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO marketing_posts (id, treatment_id, sub_treatment_id, title, caption, hashtags_json, media_files_json, target_channels_json, scheduled_for, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'scheduled', ?, ?)
    `).run(
      id, treatment_id || null, sub_treatment_id || null,
      title, caption,
      JSON.stringify(hashtags || []),
      JSON.stringify(media_files || []),
      JSON.stringify(target_channels || ['instagram', 'whatsapp_status']),
      scheduled_for || now,
      now, now
    );

    const created = db.prepare(`SELECT * FROM marketing_posts WHERE id = ?`).get(id) as any;
    res.status(201).json({
      ...created,
      hashtags: JSON.parse(created.hashtags_json || '[]'),
      media_files: JSON.parse(created.media_files_json || '[]'),
      target_channels: JSON.parse(created.target_channels_json || '[]'),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Marcar publicación como publicada / ejecutar publicación manual
marketingRouter.post('/posts/:id/publish', (req, res) => {
  try {
    const now = new Date().toISOString();
    db.prepare(`
      UPDATE marketing_posts
      SET status = 'published', published_at = ?, updated_at = ?
      WHERE id = ?
    `).run(now, now, req.params.id);

    const updated = db.prepare(`SELECT * FROM marketing_posts WHERE id = ?`).get(req.params.id) as any;
    res.json({
      ...updated,
      hashtags: JSON.parse(updated.hashtags_json || '[]'),
      media_files: JSON.parse(updated.media_files_json || '[]'),
      target_channels: JSON.parse(updated.target_channels_json || '[]'),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
