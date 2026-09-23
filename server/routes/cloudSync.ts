import { Router } from 'express';
import {
  getTursoConfig,
  saveTursoConfig,
  testTursoConnection,
  performTursoSync,
} from '../services/tursoSync.js';

export const cloudSyncRouter = Router();

// GET /api/cloud-sync/status - Obtiene estado actual de la sincronización en la nube
cloudSyncRouter.get('/status', (req, res) => {
  try {
    const config = getTursoConfig();
    res.json({ success: true, config });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/cloud-sync/config - Guarda credenciales y preferencias de Turso Cloud
cloudSyncRouter.post('/config', (req, res) => {
  try {
    const updated = saveTursoConfig(req.body);
    res.json({ success: true, config: updated, message: 'Configuración guardada exitosamente.' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/cloud-sync/test - Prueba conexión a Turso LibSQL
cloudSyncRouter.post('/test', async (req, res) => {
  try {
    const { dbUrl, authToken } = req.body;
    const result = await testTursoConnection(dbUrl, authToken);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/cloud-sync/sync - Ejecuta sincronización inmediata bidireccional
cloudSyncRouter.post('/sync', async (req, res) => {
  try {
    const result = await performTursoSync();
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});
