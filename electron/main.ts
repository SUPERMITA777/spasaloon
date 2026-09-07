import { app, BrowserWindow, dialog, ipcMain, shell } from 'electron';
import path from 'path';
import http from 'http';
import { startServer } from '../server/index.js';

// Establecer carpeta de datos de usuario en AppData para evitar errores de permisos/cache
app.setPath('userData', path.join(app.getPath('appData'), 'HikariSuite'));

// Parámetros de Chromium para suprimir logs y errores de GPU cache en consolas
app.commandLine.appendSwitch('disable-gpu-shader-disk-cache');
app.commandLine.appendSwitch('log-level', '3');

let mainWindow: BrowserWindow | null = null;

// Control de instancia única (evita múltiples ventanas y bloqueos de cache)
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

function isServerRunning(port = 3100): Promise<boolean> {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${port}/api/info`, (res) => {
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(500, () => {
      req.destroy();
      resolve(false);
    });
  });
}

function waitForServer(port = 3100, maxRetries = 40): Promise<void> {
  return new Promise((resolve, reject) => {
    let retries = 0;
    const check = async () => {
      const running = await isServerRunning(port);
      if (running) {
        resolve();
      } else {
        retries++;
        if (retries >= maxRetries) {
          reject(new Error('Tiempo de espera agotado esperando el servidor local.'));
        } else {
          setTimeout(check, 150);
        }
      }
    };
    check();
  });
}

async function startInternalServer() {
  const alreadyRunning = await isServerRunning(3100);
  if (alreadyRunning) {
    console.log('Servidor ya activo en puerto 3100.');
    return;
  }

  try {
    console.log('Iniciando servidor local interno de Hikari Suite...');
    await startServer();
    console.log('Servidor local interno iniciado con éxito.');
  } catch (err) {
    console.error('Error al iniciar servidor local interno:', err);
  }
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1360,
    height: 860,
    minWidth: 1100,
    minHeight: 700,
    title: 'Hikari Suite — Sistema Integral de Gestión',
    backgroundColor: '#FAF5EE',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs'),
    },
    autoHideMenuBar: true,
    show: false, // Ocultar hasta que esté listo para mostrarse sin parpadeos
  });

  const startUrl = process.env.ELECTRON_START_URL || 'http://localhost:3100';

  mainWindow.once('ready-to-show', () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });

  try {
    await waitForServer(3100);
    await mainWindow.loadURL(startUrl);
  } catch (err: any) {
    try {
      if (mainWindow) await mainWindow.loadURL(startUrl);
    } catch (e) {
      dialog.showErrorBox('Hikari Suite', 'No se pudo conectar con el servidor local interno.');
    }
  }

  let isQuitting = false;
  mainWindow.on('close', async (e) => {
    if (isQuitting) return;
    e.preventDefault();
    isQuitting = true;
    try {
      await triggerBackupOnQuit();
    } catch (err) {}
    if (mainWindow) {
      mainWindow.destroy();
      mainWindow = null;
    }
    app.quit();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

async function triggerBackupOnQuit(): Promise<void> {
  return new Promise((resolve) => {
    const postData = JSON.stringify({ isAutomatic: true });
    const req = http.request(
      {
        hostname: 'localhost',
        port: 3100,
        path: '/api/backup/create',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
        },
        timeout: 4000,
      },
      () => resolve()
    );
    req.on('error', () => resolve());
    req.on('timeout', () => {
      req.destroy();
      resolve();
    });
    req.write(postData);
    req.end();
  });
}

app.whenReady().then(async () => {
  // IPC Handlers para selector de carpetas y explorador
  ipcMain.handle('select-folder', async () => {
    if (!mainWindow) return null;
    const res = await dialog.showOpenDialog(mainWindow, {
      title: 'Seleccionar Carpeta para Copias de Seguridad',
      properties: ['openDirectory', 'createDirectory'],
    });
    if (res.canceled || res.filePaths.length === 0) return null;
    return res.filePaths[0];
  });

  ipcMain.handle('open-folder', async (_, folderPath: string) => {
    if (!folderPath) return false;
    await shell.openPath(folderPath);
    return true;
  });

  ipcMain.handle('close-app', async () => {
    try {
      await triggerBackupOnQuit();
    } catch (err) {}
    if (mainWindow) {
      mainWindow.destroy();
      mainWindow = null;
    }
    app.quit();
  });

  await startInternalServer();
  await createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

