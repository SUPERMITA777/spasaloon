import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { spawn } from 'child_process';

export interface RemoteVersionInfo {
  version: string;
  appName?: string;
  releaseDate?: string;
  downloadUrl: string;
  directDownloadUrl?: string;
  installerFileName?: string;
  changelog?: string;
}

export interface UpdateCheckResult {
  updateAvailable: boolean;
  currentVersion: string;
  latestVersion: string;
  downloadUrl: string;
  directDownloadUrl?: string;
  installerFileName: string;
  changelog: string;
  releaseDate?: string;
  error?: string;
}

export interface DownloadProgress {
  status: 'idle' | 'downloading' | 'completed' | 'error';
  receivedBytes: number;
  totalBytes: number;
  percent: number;
  filePath?: string;
  error?: string;
}

const GITHUB_RAW_URL = 'https://raw.githubusercontent.com/SUPERMITA777/spasaloon/main/version.json';
const DEFAULT_GDRIVE_URL = 'https://drive.google.com/drive/u/0/folders/157PVYzZe5ObkAYwC26DOwbr88YGyGAwc';

let currentDownload: DownloadProgress = {
  status: 'idle',
  receivedBytes: 0,
  totalBytes: 0,
  percent: 0,
};

let activeDownloadReq: http.ClientRequest | null = null;

const COMPILED_FALLBACK_VERSION = '1.0.7';

/**
 * Lee la versión local actual con múltiples alternativas de resolución
 * (Variable de entorno de Electron, package.json, version.json o fallback compilado)
 */
export function getLocalVersion(): string {
  if (process.env.APP_VERSION && process.env.APP_VERSION.trim() !== '') {
    return process.env.APP_VERSION.trim();
  }

  const candidatePaths = [
    path.resolve(process.cwd(), 'package.json'),
    path.resolve(process.cwd(), 'version.json'),
    path.resolve(__dirname, '../../package.json'),
    path.resolve(__dirname, '../../version.json'),
    path.resolve(__dirname, '../package.json'),
    path.resolve(__dirname, '../version.json'),
    path.resolve(__dirname, 'version.json'),
    path.resolve((process as any).resourcesPath || '', 'app.asar/package.json'),
    path.resolve((process as any).resourcesPath || '', 'app.asar/version.json'),
    path.resolve((process as any).resourcesPath || '', 'app/package.json'),
    path.resolve((process as any).resourcesPath || '', 'package.json'),
  ];

  for (const filePath of candidatePaths) {
    try {
      if (fs.existsSync(filePath)) {
        const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        if (content.version) {
          return content.version;
        }
      }
    } catch {
      // Continuar al siguiente candidato
    }
  }

  return COMPILED_FALLBACK_VERSION;
}

/**
 * Normaliza versiones para evitar trampas semánticas con builds experimentales pasados
 * (ej. 1.1.0 que fue un salto erróneo de 1.0.10, y 1.1.1 que fue una prueba)
 */
function normalizeVersionParts(v: string): number[] {
  const clean = v.replace(/^v/, '').trim();
  if (clean === '1.1.0') return [1, 0, 10];
  if (clean === '1.1.1') return [1, 0, 12];
  return clean.split('.').map(Number);
}

/**
 * Compara dos versiones de Hikari Suite
 * Retorna:
 *  1 si v1 > v2 (hay actualización)
 * -1 si v1 < v2
 *  0 si son iguales
 */
export function compareVersions(v1: string, v2: string): number {
  const parts1 = normalizeVersionParts(v1);
  const parts2 = normalizeVersionParts(v2);

  const len = Math.max(parts1.length, parts2.length);
  for (let i = 0; i < len; i++) {
    const num1 = parts1[i] || 0;
    const num2 = parts2[i] || 0;
    if (num1 > num2) return 1;
    if (num1 < num2) return -1;
  }
  return 0;
}

/**
 * Realiza la petición HTTP a GitHub / CDN con timeout para no bloquear
 */
function fetchRemoteVersion(url: string, timeoutMs = 5000): Promise<RemoteVersionInfo> {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https');
    const client = isHttps ? https : http;
    const req = client.get(
      url,
      {
        headers: {
          'User-Agent': 'Hikari-Suite-Update-Checker',
          'Accept': 'application/vnd.github.v3+json, application/json, text/plain',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
      },
      (res) => {
        if (res.statusCode === 404) {
          return reject(new Error('El archivo de versión aún no está publicado en la rama main de GitHub.'));
        }
        if (res.statusCode && (res.statusCode < 200 || res.statusCode >= 300)) {
          return reject(new Error(`Respuesta del servidor HTTP ${res.statusCode}`));
        }

        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            if (parsed.content && parsed.encoding === 'base64') {
              const decoded = Buffer.from(parsed.content, 'base64').toString('utf8');
              return resolve(JSON.parse(decoded));
            }
            resolve(parsed);
          } catch (e: any) {
            reject(new Error(`Error parseando JSON: ${e.message}`));
          }
        });
      }
    );

    req.setTimeout(timeoutMs, () => {
      req.destroy();
      reject(new Error('Tiempo de espera agotado al consultar versión remota.'));
    });

    req.on('error', (err) => {
      reject(err);
    });
  });
}

const GITHUB_API_URL = 'https://api.github.com/repos/SUPERMITA777/spasaloon/contents/version.json';
const JSDELIVR_CDN_URL = 'https://cdn.jsdelivr.net/gh/SUPERMITA777/spasaloon@main/version.json';

/**
 * Consulta en GitHub / CDN si existe una versión más nueva que la local
 * Implementa estrategia de triple redundancia:
 * 1. GitHub REST API (directo, 0s delay)
 * 2. jsDelivr CDN (alta velocidad global, anti 503)
 * 3. GitHub Raw (fallback con cache-buster)
 */
export async function checkForUpdates(): Promise<UpdateCheckResult> {
  const currentVersion = getLocalVersion();

  try {
    let remoteInfo: RemoteVersionInfo;
    try {
      // 1. Intentar API directa de GitHub (0s delay de caché)
      remoteInfo = await fetchRemoteVersion(GITHUB_API_URL, 5000);
    } catch {
      try {
        // 2. Intentar jsDelivr CDN con cache-buster (inmune a errores de Fastly en GitHub Raw)
        const cdnUrl = `${JSDELIVR_CDN_URL}?_t=${Date.now()}`;
        remoteInfo = await fetchRemoteVersion(cdnUrl, 5000);
      } catch {
        // 3. Fallback a GitHub Raw
        const cacheBusterUrl = `${GITHUB_RAW_URL}?_t=${Date.now()}`;
        remoteInfo = await fetchRemoteVersion(cacheBusterUrl, 6000);
      }
    }

    const latestVersion = remoteInfo.version || currentVersion;
    const updateAvailable = compareVersions(latestVersion, currentVersion) > 0;

    return {
      updateAvailable,
      currentVersion,
      latestVersion,
      downloadUrl: remoteInfo.downloadUrl || DEFAULT_GDRIVE_URL,
      directDownloadUrl: remoteInfo.directDownloadUrl,
      installerFileName: remoteInfo.installerFileName || `Hikari Suite Setup ${latestVersion}.exe`,
      changelog: remoteInfo.changelog || 'Actualización y mejoras en Hikari Suite.',
      releaseDate: remoteInfo.releaseDate,
    };
  } catch (error: any) {
    return {
      updateAvailable: false,
      currentVersion,
      latestVersion: currentVersion,
      downloadUrl: DEFAULT_GDRIVE_URL,
      installerFileName: `Hikari Suite Setup ${currentVersion}.exe`,
      changelog: '',
      error: error.message,
    };
  }
}

/**
 * Retorna el progreso actual de descarga
 */
export function getDownloadProgress(): DownloadProgress {
  return currentDownload;
}

/**
 * Inicia la descarga en streaming del instalador con soporte para redirecciones (HTTP 301, 302, 307)
 */
export function startDownloadUpdate(targetUrl: string, fileName?: string): Promise<DownloadProgress> {
  if (currentDownload.status === 'downloading') {
    return Promise.resolve(currentDownload);
  }

  const safeFileName = fileName || `Hikari_Suite_Setup_Update.exe`;
  const tempDir = os.tmpdir();
  const destPath = path.join(tempDir, safeFileName);

  currentDownload = {
    status: 'downloading',
    receivedBytes: 0,
    totalBytes: 0,
    percent: 0,
    filePath: destPath,
  };

  const downloadFileWithRedirects = (url: string, maxRedirects = 6) => {
    if (maxRedirects <= 0) {
      currentDownload.status = 'error';
      currentDownload.error = 'Demasiadas redirecciones durante la descarga.';
      return;
    }

    const client = url.startsWith('https') ? https : http;
    const req = client.get(
      url,
      {
        headers: {
          'User-Agent': 'Hikari-Suite-Downloader/1.0',
        },
      },
      (res) => {
        // Manejar redirecciones (GitHub Releases usa AWS S3 con 302 redirect)
        if (res.statusCode && [301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
          return downloadFileWithRedirects(res.headers.location, maxRedirects - 1);
        }

        if (res.statusCode && (res.statusCode < 200 || res.statusCode >= 300)) {
          currentDownload.status = 'error';
          currentDownload.error = `Error de servidor HTTP ${res.statusCode}`;
          return;
        }

        const total = parseInt(res.headers['content-length'] || '0', 10);
        currentDownload.totalBytes = total;

        const fileStream = fs.createWriteStream(destPath);
        res.on('data', (chunk: Buffer) => {
          currentDownload.receivedBytes += chunk.length;
          if (currentDownload.totalBytes > 0) {
            currentDownload.percent = Math.min(
              100,
              Math.round((currentDownload.receivedBytes / currentDownload.totalBytes) * 100)
            );
          }
        });

        res.pipe(fileStream);

        fileStream.on('finish', () => {
          fileStream.close();
          currentDownload.status = 'completed';
          currentDownload.percent = 100;
          activeDownloadReq = null;
        });

        fileStream.on('error', (err) => {
          fs.unlink(destPath, () => {});
          currentDownload.status = 'error';
          currentDownload.error = err.message;
          activeDownloadReq = null;
        });
      }
    );

    req.on('error', (err) => {
      currentDownload.status = 'error';
      currentDownload.error = err.message;
      activeDownloadReq = null;
    });

    activeDownloadReq = req;
  };

  downloadFileWithRedirects(targetUrl);
  return Promise.resolve(currentDownload);
}

/**
 * Cancela una descarga activa
 */
export function cancelDownloadUpdate(): void {
  if (activeDownloadReq) {
    activeDownloadReq.destroy();
    activeDownloadReq = null;
  }
  if (currentDownload.filePath && fs.existsSync(currentDownload.filePath)) {
    try {
      fs.unlinkSync(currentDownload.filePath);
    } catch (e) {}
  }
  currentDownload = {
    status: 'idle',
    receivedBytes: 0,
    totalBytes: 0,
    percent: 0,
  };
}

/**
 * Ejecuta el instalador descargado en segundo plano de manera desatendida y cierra la app actual
 */
export function launchInstallerAndExit(filePath?: string): boolean {
  const targetFile = filePath || currentDownload.filePath;
  if (!targetFile || !fs.existsSync(targetFile)) {
    throw new Error('El archivo del instalador no existe o no se ha completado la descarga.');
  }

  // Lanzar el ejecutable de instalación de forma desacoplada
  const child = spawn(`"${targetFile}"`, [], {
    detached: true,
    stdio: 'ignore',
    shell: true,
  });

  child.unref();

  // Esperar 1 segundo para asegurar que el proceso se desprendió y salir
  setTimeout(() => {
    process.exit(0);
  }, 1000);

  return true;
}

