import { Router } from 'express';
import {
  checkForUpdates,
  getLocalVersion,
  startDownloadUpdate,
  getDownloadProgress,
  cancelDownloadUpdate,
  launchInstallerAndExit,
} from '../services/updater';

export const updaterRouter = Router();

// GET /api/system/check-updates
updaterRouter.get('/check-updates', async (req, res) => {
  try {
    const result = await checkForUpdates();
    res.json({
      success: !result.error,
      ...result,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
      currentVersion: getLocalVersion(),
      updateAvailable: false,
    });
  }
});

// POST /api/system/download-update
updaterRouter.post('/download-update', async (req, res) => {
  try {
    const { url, fileName } = req.body;
    if (!url) {
      return res.status(400).json({ success: false, error: 'URL de descarga no provista.' });
    }
    const progress = startDownloadUpdate(url, fileName);
    res.json({ success: true, progress });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/system/download-progress
updaterRouter.get('/download-progress', (req, res) => {
  try {
    const progress = getDownloadProgress();
    res.json({ success: true, progress });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/system/cancel-download
updaterRouter.post('/cancel-download', (req, res) => {
  try {
    cancelDownloadUpdate();
    res.json({ success: true, message: 'Descarga cancelada.' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/system/install-update
updaterRouter.post('/install-update', (req, res) => {
  try {
    const { filePath } = req.body;
    res.json({ success: true, message: 'Ejecutando instalador y cerrando la app...' });
    // Lanzar instalador
    launchInstallerAndExit(filePath);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

