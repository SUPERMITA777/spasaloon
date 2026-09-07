import https from 'https';
import fs from 'fs';
import path from 'path';

export interface RemoteVersionInfo {
  version: string;
  appName?: string;
  releaseDate?: string;
  downloadUrl: string;
  installerFileName?: string;
  changelog?: string;
}

export interface UpdateCheckResult {
  updateAvailable: boolean;
  currentVersion: string;
  latestVersion: string;
  downloadUrl: string;
  installerFileName: string;
  changelog: string;
  releaseDate?: string;
  error?: string;
}

const GITHUB_RAW_URL = 'https://raw.githubusercontent.com/SUPERMITA777/spasaloon/main/version.json';
const DEFAULT_GDRIVE_URL = 'https://drive.google.com/drive/u/0/folders/157PVYzZe5ObkAYwC26DOwbr88YGyGAwc';

/**
 * Lee la versión local actual desde package.json
 */
export function getLocalVersion(): string {
  try {
    const pkgPath = path.resolve(process.cwd(), 'package.json');
    if (fs.existsSync(pkgPath)) {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
      return pkg.version || '1.0.3';
    }
  } catch (e) {
    console.error('Error leyendo versión local:', e);
  }
  return '1.0.3';
}

/**
 * Compara dos versiones semánticas (ej. "1.0.3" vs "1.0.2")
 * Retorna:
 *  1 si v1 > v2
 * -1 si v1 < v2
 *  0 si son iguales
 */
export function compareVersions(v1: string, v2: string): number {
  const parts1 = v1.replace(/^v/, '').split('.').map(Number);
  const parts2 = v2.replace(/^v/, '').split('.').map(Number);

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
 * Realiza la petición HTTP a GitHub con timeout para no bloquear
 */
function fetchRemoteVersion(url: string, timeoutMs = 5000): Promise<RemoteVersionInfo> {
  return new Promise((resolve, reject) => {
    const req = https.get(
      url,
      {
        headers: {
          'User-Agent': 'Hikari-Suite-Update-Checker',
          'Cache-Control': 'no-cache',
        },
      },
      (res) => {
        if (res.statusCode === 404) {
          return reject(new Error('El archivo de versión aún no está publicado en la rama main de GitHub.'));
        }
        if (res.statusCode && (res.statusCode < 200 || res.statusCode >= 300)) {
          return reject(new Error(`Respuesta del servidor GitHub HTTP ${res.statusCode}`));
        }

        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            resolve(parsed);
          } catch (e: any) {
            reject(new Error(`Error parseando JSON de GitHub: ${e.message}`));
          }
        });
      }
    );

    req.setTimeout(timeoutMs, () => {
      req.destroy();
      reject(new Error('Tiempo de espera agotado al consultar GitHub.'));
    });

    req.on('error', (err) => {
      reject(err);
    });
  });
}

/**
 * Consulta en GitHub si existe una versión más nueva que la local
 */
export async function checkForUpdates(): Promise<UpdateCheckResult> {
  const currentVersion = getLocalVersion();

  try {
    const remoteInfo = await fetchRemoteVersion(GITHUB_RAW_URL, 6000);
    const latestVersion = remoteInfo.version || currentVersion;
    const updateAvailable = compareVersions(latestVersion, currentVersion) > 0;

    return {
      updateAvailable,
      currentVersion,
      latestVersion,
      downloadUrl: remoteInfo.downloadUrl || DEFAULT_GDRIVE_URL,
      installerFileName: remoteInfo.installerFileName || `Hikari Suite Setup ${latestVersion}.exe`,
      changelog: remoteInfo.changelog || 'Actualización y mejoras en Hikari Suite.',
      releaseDate: remoteInfo.releaseDate,
    };
  } catch (error: any) {
    // Si la repo aún no tiene el commit o no hay internet, no interrumpir la experiencia
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
