import { Router } from 'express';
import { checkForUpdates, getLocalVersion } from '../services/updater';

export const updaterRouter = Router();

// GET /api/system/check-updates
updaterRouter.get('/check-updates', async (req, res) => {
  try {
    const result = await checkForUpdates();
    res.json({
      success: true,
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
