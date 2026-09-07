import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import Database from 'better-sqlite3';
import { db, DB_PATH, DB_DIR, getSetting, setSetting, initDatabase, getBackupDirectory } from '../db/database.js';

export interface BackupItem {
  fileName: string;
  filePath: string;
  batName: string;
  batPath: string;
  sizeBytes: number;
  sizeFormatted: string;
  createdAt: string;
  isAutomatic?: boolean;
}

export interface BackupConfig {
  backupDirectory: string;
  backupOnClose: boolean;
  backupRetentionDays: number;
}

export function getBackupConfig(): BackupConfig {
  const defaultDir = getBackupDirectory();
  const backupDirectory = getSetting('backup_directory', defaultDir);
  const backupOnClose = getSetting('backup_on_close', 'true') === 'true';
  const backupRetentionDays = parseInt(getSetting('backup_retention_days', '30'), 10) || 30;

  if (!fs.existsSync(backupDirectory)) {
    try {
      fs.mkdirSync(backupDirectory, { recursive: true });
    } catch (e) {
      console.error('Error creando directorio de backups:', e);
    }
  }

  return {
    backupDirectory,
    backupOnClose,
    backupRetentionDays,
  };
}

export function updateBackupConfig(config: Partial<BackupConfig>): BackupConfig {
  if (config.backupDirectory !== undefined) {
    const resolved = path.resolve(config.backupDirectory);
    if (!fs.existsSync(resolved)) {
      fs.mkdirSync(resolved, { recursive: true });
    }
    setSetting('backup_directory', resolved);
  }

  if (config.backupOnClose !== undefined) {
    setSetting('backup_on_close', config.backupOnClose ? 'true' : 'false');
  }

  if (config.backupRetentionDays !== undefined) {
    setSetting('backup_retention_days', config.backupRetentionDays.toString());
  }

  return getBackupConfig();
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function padZero(num: number): string {
  return num < 10 ? '0' + num : num.toString();
}

export function generateTimestampString(date = new Date()): string {
  const YYYY = date.getFullYear();
  const MM = padZero(date.getMonth() + 1);
  const DD = padZero(date.getDate());
  const HH = padZero(date.getHours());
  const mm = padZero(date.getMinutes());
  const ss = padZero(date.getSeconds());
  return `${YYYY}-${MM}-${DD}_${HH}-${mm}-${ss}`;
}

export function generateBatchRestoreScript(
  backupFileName: string,
  backupFilePath: string,
  targetDbPath: string
): string {
  const appRootDir = process.cwd();
  return `@echo off
chcp 65001 >nul
title Hikari Suite — Restauración de Copia de Seguridad
color 0B

echo =====================================================================
echo    ✦ HIKARI SUITE — ASISTENTE DE RESTAURACIÓN DE BASE DE DATOS
echo =====================================================================
echo.
echo  Copia a restaurar: %~dp0${backupFileName}
echo  Base de datos destino: ${targetDbPath.replace(/\//g, '\\')}
echo.
echo  [!] ADVERTENCIA: Esta acción restaurará la base de datos (clientes,
echo      turnos, caja, fichas, etc.) al momento exacto de esta copia.
echo      Los datos generados posteriormente a esta fecha serán reemplazados.
echo.
echo =====================================================================
set /p RESP="¿Estás seguro de que deseas restaurar esta copia? (S/N): "

if /i "%RESP%" NEQ "S" (
    echo.
    echo  Operación cancelada por el usuario. No se modificó nada.
    echo.
    pause
    exit /b
)

echo.
echo  [1/4] Cerrando instancias activas de Hikari Suite para liberar el archivo...
taskkill /F /IM "HikariSuite.exe" >nul 2>&1
taskkill /F /IM "Hikari Suite.exe" >nul 2>&1
taskkill /F /IM "AuraSuite.exe" >nul 2>&1
taskkill /F /IM "Aura Suite.exe" >nul 2>&1
taskkill /F /IM "EsteticaPro.exe" >nul 2>&1
timeout /t 1 /nobreak >nul

set "TARGET_DB=${targetDbPath.replace(/\//g, '\\')}"
set "BACKUP_SRC=%~dp0${backupFileName}"

:: Si no existe en la ruta fija, buscar relativa a la aplicación
if not exist "%TARGET_DB%" (
    if exist "${path.resolve(appRootDir, 'data', 'salon.db').replace(/\//g, '\\')}" (
        set "TARGET_DB=${path.resolve(appRootDir, 'data', 'salon.db').replace(/\//g, '\\')}"
    )
)

echo  [2/4] Creando copia de seguridad preventiva de la base de datos actual...
if exist "%TARGET_DB%" (
    copy /Y "%TARGET_DB%" "%TARGET_DB%.pre_restore_seguridad.bak" >nul
    echo       Resguardo previo creado en: %TARGET_DB%.pre_restore_seguridad.bak
)

echo  [3/4] Restaurando copia de seguridad...
copy /Y "%BACKUP_SRC%" "%TARGET_DB%" >nul
if errorlevel 1 (
    echo.
    echo  [ERROR] No se pudo copiar el archivo de base de datos.
    echo  Verifica que no haya ningún programa bloqueando "%TARGET_DB%".
    echo.
    pause
    exit /b
)

:: Limpiar temporales WAL si existieran para evitar desincronizaciones
if exist "%TARGET_DB%-wal" del /F /Q "%TARGET_DB%-wal" >nul 2>&1
if exist "%TARGET_DB%-shm" del /F /Q "%TARGET_DB%-shm" >nul 2>&1

color 0A
echo.
echo =====================================================================
echo  [OK] ¡Base de datos restaurada con éxito!
echo =====================================================================
echo.
set /p START_APP="¿Deseas iniciar Hikari Suite ahora mismo? (S/N): "
if /i "%START_APP%" EQU "S" (
    cd /d "${appRootDir.replace(/\//g, '\\')}"
    if exist "HikariSuite.exe" (
        start "" "HikariSuite.exe"
    ) else if exist "AuraSuite.exe" (
        start "" "AuraSuite.exe"
    ) else if exist "INICIAR_APP_ESCRITORIO.bat" (
        start "" "INICIAR_APP_ESCRITORIO.bat"
    ) else (
        start http://localhost:3100
    )
)
`;
}

function generateMasterRestoreScript(targetDbPath: string): string {
  const appRootDir = process.cwd();
  return `@echo off
chcp 65001 >nul
title Hikari Suite — Restaurar Copia de Seguridad
color 0D

echo =====================================================================
echo    ✦ HIKARI SUITE — SELECCIONAR COPIA DE SEGURIDAD A RESTAURAR
echo =====================================================================
echo.
echo  Buscando copias de seguridad en esta carpeta...
echo.

setlocal enabledelayedexpansion
set count=0

for %%F in ("%~dp0Backup_HikariSuite_*.db" "%~dp0Backup_AuraSuite_*.db") do (
    set /a count+=1
    set "file_!count!=%%~nxF"
    echo   [!count!] %%~nxF (%%~zF bytes)
)

if %count% EQU 0 (
    echo  No se encontraron copias de seguridad en esta carpeta.
    echo.
    pause
    exit /b
)

echo.
echo =====================================================================
set /p CHOICE="Ingresa el número de la copia que deseas restaurar (1-%count%) o 'C' para cancelar: "

if /i "%CHOICE%" EQU "C" (
    echo Cancelado.
    exit /b
)

set "SELECTED_FILE=!file_%CHOICE%!"
if "%SELECTED_FILE%"=="" (
    echo Opción inválida.
    pause
    exit /b
)

set "BAT_CORRESPONDIENTE=Restaurar_%SELECTED_FILE:.db=.bat%"
if exist "%~dp0%BAT_CORRESPONDIENTE%" (
    call "%~dp0%BAT_CORRESPONDIENTE%"
) else (
    echo Restaurando %SELECTED_FILE%...
    taskkill /F /IM "HikariSuite.exe" >nul 2>&1
    taskkill /F /IM "Hikari Suite.exe" >nul 2>&1
    taskkill /F /IM "AuraSuite.exe" >nul 2>&1
    taskkill /F /IM "Aura Suite.exe" >nul 2>&1
    copy /Y "%~dp0%SELECTED_FILE%" "${targetDbPath.replace(/\//g, '\\')}"
    del /F /Q "${targetDbPath.replace(/\//g, '\\')}-wal" >nul 2>&1
    del /F /Q "${targetDbPath.replace(/\//g, '\\')}-shm" >nul 2>&1
    echo [OK] Restaurado correctamente.
    pause
)
`;
}

export async function createBackup(isAutomatic = false): Promise<BackupItem> {
  const config = getBackupConfig();
  const timestamp = generateTimestampString();
  const fileName = `Backup_HikariSuite_${timestamp}.db`;
  const batName = `Restaurar_Backup_${timestamp}.bat`;

  const filePath = path.join(config.backupDirectory, fileName);
  const batPath = path.join(config.backupDirectory, batName);

  // Asegurar que la base de datos guarde transacciones pendientes
  try {
    db.pragma('wal_checkpoint(TRUNCATE)');
  } catch (e) {
    console.warn('Advertencia en wal_checkpoint:', e);
  }

  // Copia online consistente de SQLite
  await db.backup(filePath);

  // Crear el script ejecutable para restaurar por doble clic en Windows
  const batContent = generateBatchRestoreScript(fileName, filePath, DB_PATH);
  fs.writeFileSync(batPath, batContent, 'utf-8');

  // Crear o actualizar el script interactivo maestro
  const masterBatPath = path.join(config.backupDirectory, 'Restaurar_Cualquier_Backup.bat');
  fs.writeFileSync(masterBatPath, generateMasterRestoreScript(DB_PATH), 'utf-8');

  // Obtener tamaño del archivo generado
  const stats = fs.statSync(filePath);

  // Limpiar copias con más de N días de antigüedad
  cleanOldBackups(config.backupRetentionDays);

  return {
    fileName,
    filePath,
    batName,
    batPath,
    sizeBytes: stats.size,
    sizeFormatted: formatBytes(stats.size),
    createdAt: new Date().toISOString(),
    isAutomatic,
  };
}

export function listBackups(): BackupItem[] {
  const config = getBackupConfig();
  if (!fs.existsSync(config.backupDirectory)) {
    return [];
  }

  try {
    const files = fs.readdirSync(config.backupDirectory);
    const dbFiles = files.filter(
      (f) => (f.startsWith('Backup_HikariSuite_') || f.startsWith('Backup_AuraSuite_')) && f.endsWith('.db')
    );

    const items: BackupItem[] = [];

    for (const fileName of dbFiles) {
      const filePath = path.join(config.backupDirectory, fileName);
      const batName = fileName.replace(/^Backup_(HikariSuite|AuraSuite)_/, 'Restaurar_Backup_').replace('.db', '.bat');
      const batPath = path.join(config.backupDirectory, batName);

      try {
        const stats = fs.statSync(filePath);
        items.push({
          fileName,
          filePath,
          batName: fs.existsSync(batPath) ? batName : '',
          batPath: fs.existsSync(batPath) ? batPath : '',
          sizeBytes: stats.size,
          sizeFormatted: formatBytes(stats.size),
          createdAt: stats.mtime.toISOString(),
        });
      } catch (e) {
        // Ignorar si hay error de lectura
      }
    }

    // Ordenar de más reciente a más antiguo
    return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    console.error('Error listando backups:', error);
    return [];
  }
}

export function cleanOldBackups(retentionDays = 30): { deletedCount: number; deletedFiles: string[] } {
  const config = getBackupConfig();
  if (!fs.existsSync(config.backupDirectory) || retentionDays <= 0) {
    return { deletedCount: 0, deletedFiles: [] };
  }

  const now = Date.now();
  const maxAgeMs = retentionDays * 24 * 60 * 60 * 1000;
  const deletedFiles: string[] = [];

  try {
    const files = fs.readdirSync(config.backupDirectory);

    for (const f of files) {
      if (!f.startsWith('Backup_HikariSuite_') && !f.startsWith('Backup_AuraSuite_') && !f.startsWith('Restaurar_Backup_')) {
        continue;
      }

      const fullPath = path.join(config.backupDirectory, f);
      try {
        const stats = fs.statSync(fullPath);
        const age = now - stats.mtimeMs;

        if (age > maxAgeMs) {
          fs.unlinkSync(fullPath);
          deletedFiles.push(f);
          console.log(`[Backup Clean] Eliminado backup con más de ${retentionDays} días: ${f}`);
        }
      } catch (err) {
        console.error(`Error al verificar/eliminar archivo ${f}:`, err);
      }
    }
  } catch (err) {
    console.error('Error en cleanOldBackups:', err);
  }

  return { deletedCount: deletedFiles.length, deletedFiles };
}

export async function restoreBackup(fileName: string): Promise<{ success: boolean; message: string }> {
  const config = getBackupConfig();
  const sourcePath = path.join(config.backupDirectory, fileName);

  if (!fs.existsSync(sourcePath)) {
    throw new Error(`El archivo de backup no existe: ${fileName}`);
  }

  // 1. Crear backup de emergencia del estado actual antes de sobrescribir
  const emergencyBackup = `${DB_PATH}.pre_restore_${generateTimestampString()}.bak`;
  try {
    await db.backup(emergencyBackup);
  } catch (e) {
    console.warn('No se pudo crear backup de emergencia:', e);
  }

  // 2. Restaurar usando SQLite Online Backup API (atómico, seguro y sin bloqueos de archivo)
  let sourceDb: any = null;
  try {
    sourceDb = new Database(sourcePath);
    await sourceDb.backup(DB_PATH);

    // Checkpoint y re-verificar base de datos
    try {
      db.pragma('wal_checkpoint(TRUNCATE)');
    } catch (e) {}

    initDatabase();

    return {
      success: true,
      message: `Copia ${fileName} restaurada exitosamente. Se creó un resguardo previo en ${emergencyBackup}`,
    };
  } catch (error: any) {
    console.error('Error restaurando base de datos:', error);
    throw new Error(`Fallo al restaurar la base de datos: ${error.message}`);
  } finally {
    if (sourceDb) {
      try {
        sourceDb.close();
      } catch (e) {}
    }
  }
}

export function openBackupFolderInExplorer(): Promise<boolean> {
  const config = getBackupConfig();
  return new Promise((resolve) => {
    const cmd = process.platform === 'win32'
      ? `explorer.exe "${config.backupDirectory}"`
      : process.platform === 'darwin'
      ? `open "${config.backupDirectory}"`
      : `xdg-open "${config.backupDirectory}"`;

    exec(cmd, (err) => {
      if (err) {
        console.error('Error al abrir la carpeta de backups:', err);
        resolve(false);
      } else {
        resolve(true);
      }
    });
  });
}
