import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import {
  getBackupConfig,
  updateBackupConfig,
  createBackup,
  listBackups,
  restoreBackup,
  openBackupFolderInExplorer,
} from '../services/backup.js';

export const backupRouter = Router();

// 1. Obtener configuración actual
backupRouter.get('/config', (req, res) => {
  try {
    const config = getBackupConfig();
    res.json({ success: true, config });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 2. Actualizar configuración
backupRouter.post('/config', (req, res) => {
  try {
    const { backupDirectory, backupOnClose, backupRetentionDays } = req.body;
    const updated = updateBackupConfig({
      backupDirectory,
      backupOnClose: typeof backupOnClose === 'boolean' ? backupOnClose : undefined,
      backupRetentionDays: typeof backupRetentionDays === 'number' ? backupRetentionDays : undefined,
    });
    res.json({ success: true, config: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 3. Listar copias de seguridad existentes
backupRouter.get('/list', (req, res) => {
  try {
    const backups = listBackups();
    res.json({ success: true, backups });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 4. Crear una copia de seguridad manualmente
backupRouter.post('/create', async (req, res) => {
  try {
    const isAutomatic = req.body.isAutomatic === true;
    const backup = await createBackup(isAutomatic);
    res.json({ success: true, backup });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 5. Restaurar copia de seguridad específica
backupRouter.post('/restore', async (req, res) => {
  try {
    const { fileName } = req.body;
    if (!fileName) {
      return res.status(400).json({ success: false, error: 'Nombre de archivo requerido' });
    }
    const result = await restoreBackup(fileName);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 6. Abrir carpeta de backups en el Explorador de Windows
backupRouter.post('/open-folder', async (req, res) => {
  try {
    const opened = await openBackupFolderInExplorer();
    res.json({ success: opened });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 7. Eliminar una copia de seguridad individual
backupRouter.delete('/:fileName', (req, res) => {
  try {
    const { fileName } = req.params;
    const config = getBackupConfig();
    const filePath = path.join(config.backupDirectory, fileName);
    const batName = fileName.replace(/^Backup_(HikariSuite|AuraSuite)_/, 'Restaurar_Backup_').replace('.db', '.bat');
    const batPath = path.join(config.backupDirectory, batName);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    if (fs.existsSync(batPath)) {
      fs.unlinkSync(batPath);
    }

    res.json({ success: true, message: `Copia ${fileName} eliminada.` });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});
