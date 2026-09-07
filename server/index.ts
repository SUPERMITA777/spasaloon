import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDatabase } from './db/database.js';
import { seedDatabase } from './db/seed.js';
import { getLocalIpAddress } from './services/network.js';

// Rutas
import { clientsRouter } from './routes/clients.js';
import { staffRouter } from './routes/staff.js';
import { boxesRouter } from './routes/boxes.js';
import { treatmentsRouter } from './routes/treatments.js';
import { appointmentsRouter } from './routes/appointments.js';
import { productsRouter } from './routes/products.js';
import { bodyChartsRouter } from './routes/bodyCharts.js';
import { facialChartsRouter } from './routes/facialCharts.js';
import { consentsRouter } from './routes/consents.js';
import { cashRouter } from './routes/cash.js';
import { marketingRouter } from './routes/marketing.js';
import { backupRouter } from './routes/backup.js';
import { updaterRouter } from './routes/updater.js';
import { getBackupConfig, createBackup } from './services/backup.js';

export const app = express();
export const server = http.createServer(app);

export const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

const PORT = Number(process.env.PORT) || 3100;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Inicializar y poblar base de datos
initDatabase();
seedDatabase();

// Rutas API
app.use('/api/clients', clientsRouter);
app.use('/api/staff', staffRouter);
app.use('/api/boxes', boxesRouter);
app.use('/api/treatments', treatmentsRouter);
app.use('/api/appointments', appointmentsRouter);
app.use('/api/products', productsRouter);
app.use('/api/body-charts', bodyChartsRouter);
app.use('/api/facial-charts', facialChartsRouter);
app.use('/api/consents', consentsRouter);
app.use('/api/cash', cashRouter);
app.use('/api/marketing', marketingRouter);
app.use('/api/backup', backupRouter);
app.use('/api/system', updaterRouter);

// Ruta para cierre ordenado del sistema con backup
app.post('/api/system/shutdown', async (req, res) => {
  res.json({ success: true, message: 'Iniciando respaldo y apagado del sistema...' });
  setTimeout(async () => {
    try {
      const config = getBackupConfig();
      if (config.backupOnClose) {
        console.log('🔄 Ejecutando copia de seguridad de cierre...');
        await createBackup(true);
        console.log('✅ Copia de seguridad de cierre completada.');
      }
    } catch (err) {
      console.error('Error creando copia de cierre:', err);
    } finally {
      process.exit(0);
    }
  }, 300);
});

// Ruta de información de red y estado
app.get('/api/info', (req, res) => {
  const localIp = getLocalIpAddress();
  res.json({
    status: 'online',
    localIp,
    port: PORT,
    staffPortalUrl: `http://${localIp}:${PORT}/staff`,
  });
});

// WebSockets para sincronización bidireccional instantánea
io.on('connection', (socket) => {
  console.log('⚡ Cliente conectado por WebSocket:', socket.id);

  socket.on('disconnect', () => {
    console.log('🔌 Cliente desconectado:', socket.id);
  });
});

import fs from 'fs';

// Determinar ruta de archivos compilados del frontend (compatible con Electron empaquetado y dev)
function getDistPath(): string {
  if (process.env.HIKARI_DIST_PATH && fs.existsSync(process.env.HIKARI_DIST_PATH)) {
    return process.env.HIKARI_DIST_PATH;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const electron = require('electron');
    const app = electron.app || electron.remote?.app;
    if (app && typeof app.getAppPath === 'function') {
      const electronDist = path.join(app.getAppPath(), 'dist');
      if (fs.existsSync(electronDist)) {
        return electronDist;
      }
    }
  } catch (e) {}

  const relativeDist = path.resolve(__dirname, '../dist');
  if (fs.existsSync(relativeDist)) {
    return relativeDist;
  }

  return path.resolve(process.cwd(), 'dist');
}

const distPath = getDistPath();
app.use(express.static(distPath));

// Fallback para React Router y Portal Móvil
app.get('*', (req, res) => {
  const indexPath = path.join(distPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(200).send('Hikari Suite — Backend Online (Frontend compilándose o no encontrado)');
  }
});

let isListening = false;
export function startServer(): Promise<number> {
  return new Promise((resolve, reject) => {
    if (isListening) {
      resolve(PORT);
      return;
    }

    server.once('error', (err: any) => {
      if (err.code === 'EADDRINUSE') {
        console.log(`Puerto ${PORT} ya se encuentra ocupado. Reutilizando servidor existente.`);
        isListening = true;
        resolve(PORT);
      } else {
        console.error('Error al iniciar servidor HTTP:', err);
        reject(err);
      }
    });

    server.listen(PORT, '0.0.0.0', () => {
      isListening = true;
      const localIp = getLocalIpAddress();
      console.log(`\n======================================================`);
      console.log(`✦ HIKARI SUITE (v1.0.3) — SERVIDOR LOCAL INICIADO`);
      console.log(`💻 Acceso Local PC:   http://localhost:${PORT}`);
      console.log(`📱 Portal Móvil QR:   http://${localIp}:${PORT}/staff`);
      console.log(`======================================================\n`);
      resolve(PORT);
    });
  });
}

// Auto-start si se ejecuta directamente con node / tsx
if (process.argv[1] && (process.argv[1].endsWith('index.ts') || process.argv[1].endsWith('index.js'))) {
  startServer();
}

// Cierre elegante y copia de seguridad ante terminación de proceso
const gracefulShutdown = async (signal: string) => {
  console.log(`\nRecibida señal ${signal}. Cerrando servidor...`);
  try {
    const config = getBackupConfig();
    if (config.backupOnClose) {
      console.log('🔄 Ejecutando copia de seguridad de cierre...');
      await createBackup(true);
      console.log('✅ Copia de seguridad de cierre completada.');
    }
  } catch (err) {
    console.error('Error durante copia de seguridad al salir:', err);
  } finally {
    process.exit(0);
  }
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
