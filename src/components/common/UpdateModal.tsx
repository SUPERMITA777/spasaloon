import React, { useState, useEffect } from 'react';
import {
  Download,
  Sparkles,
  ExternalLink,
  X,
  CheckCircle2,
  CloudDownload,
  Loader2,
  RefreshCw,
  AlertTriangle,
  FolderOpen
} from 'lucide-react';
import { api } from '../../services/api';

export interface UpdateInfo {
  updateAvailable: boolean;
  currentVersion: string;
  latestVersion: string;
  downloadUrl: string;
  directDownloadUrl?: string;
  installerFileName: string;
  changelog: string;
  releaseDate?: string;
}

interface UpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  updateInfo: UpdateInfo | null;
}

export const UpdateModal: React.FC<UpdateModalProps> = ({
  isOpen,
  onClose,
  updateInfo,
}) => {
  const [downloadState, setDownloadState] = useState<'idle' | 'downloading' | 'completed' | 'error'>('idle');
  const [percent, setPercent] = useState<number>(0);
  const [downloadedBytes, setDownloadedBytes] = useState<number>(0);
  const [totalBytes, setTotalBytes] = useState<number>(0);
  const [filePath, setFilePath] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isInstalling, setIsInstalling] = useState<boolean>(false);

  // Polling del progreso de descarga mientras esté activa
  useEffect(() => {
    let interval: any = null;

    if (downloadState === 'downloading') {
      interval = setInterval(async () => {
        try {
          const res = await api.getDownloadProgress();
          if (res.success && res.progress) {
            setPercent(res.progress.percent);
            setDownloadedBytes(res.progress.receivedBytes);
            setTotalBytes(res.progress.totalBytes);

            if (res.progress.status === 'completed') {
              setDownloadState('completed');
              setFilePath(res.progress.filePath || '');
              clearInterval(interval);
            } else if (res.progress.status === 'error') {
              setDownloadState('error');
              setErrorMessage(res.progress.error || 'Error durante la descarga.');
              clearInterval(interval);
            }
          }
        } catch (e) {
          // Ignorar fallo transitorio
        }
      }, 500);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [downloadState]);

  if (!isOpen || !updateInfo) return null;

  const handleStartAutoUpdate = async () => {
    setErrorMessage('');
    const downloadTarget =
      updateInfo.directDownloadUrl ||
      `https://github.com/SUPERMITA777/spasaloon/releases/download/v${updateInfo.latestVersion}/${updateInfo.installerFileName.replace(/\s+/g, '.')}` ||
      updateInfo.downloadUrl;

    try {
      setDownloadState('downloading');
      setPercent(0);
      const res = await api.startDownloadUpdate(downloadTarget, updateInfo.installerFileName);
      if (!res.success) {
        setDownloadState('error');
        setErrorMessage('No se pudo iniciar la descarga automática.');
      }
    } catch (err: any) {
      setDownloadState('error');
      setErrorMessage(err.message || 'Error de conexión al iniciar la descarga.');
    }
  };

  const handleInstallNow = async () => {
    try {
      setIsInstalling(true);
      await api.installUpdate(filePath);
    } catch (err: any) {
      setIsInstalling(false);
      setErrorMessage(err.message || 'Error al ejecutar el instalador.');
    }
  };

  const handleOpenGoogleDriveFallback = () => {
    const url = updateInfo.downloadUrl || 'https://drive.google.com/drive/u/0/folders/157PVYzZe5ObkAYwC26DOwbr88YGyGAwc';
    if ((window as any).electronAPI?.openFolder) {
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleOpenGitHub = () => {
    const repoUrl = 'https://github.com/SUPERMITA777/spasaloon';
    window.open(repoUrl, '_blank', 'noopener,noreferrer');
  };

  const formatSize = (bytes: number) => {
    if (!bytes) return '0 MB';
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-graphite-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-soft-2xl border border-rose-gold-200/90 overflow-hidden animate-scale-up">
        {/* Cabecera elegante con degradé en oro rosado */}
        <div className="relative p-6 bg-gradient-to-br from-rose-gold-600 via-rose-gold-500 to-rose-gold-700 text-white overflow-hidden">
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />

          {downloadState !== 'downloading' && !isInstalling && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/10 hover:bg-black/20 flex items-center justify-center text-white transition-colors"
              title="Cerrar"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
              {downloadState === 'downloading' ? (
                <Loader2 className="w-6 h-6 text-white animate-spin" />
              ) : downloadState === 'completed' ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-300" />
              ) : (
                <CloudDownload className="w-6 h-6 text-white animate-bounce" />
              )}
            </div>
            <div>
              <span className="text-[10px] font-bold tracking-[0.2em] uppercase bg-white/20 px-2 py-0.5 rounded-full">
                {downloadState === 'completed'
                  ? 'Listo para Instalar'
                  : downloadState === 'downloading'
                  ? 'Descarga Desatendida'
                  : 'Actualización Disponible'}
              </span>
              <h2 className="text-xl font-serif font-bold text-white mt-1 leading-tight">
                {downloadState === 'completed'
                  ? '¡Descarga Finalizada!'
                  : downloadState === 'downloading'
                  ? 'Descargando Sistema...'
                  : '¡Nueva Versión Detectada!'}
              </h2>
            </div>
          </div>
        </div>

        {/* Cuerpo del Modal */}
        <div className="p-6 space-y-5 bg-silk-50/40 text-graphite-800">
          {/* Comparador de versiones */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white border border-rose-gold-200/70 shadow-xs">
            <div className="text-center flex-1">
              <span className="text-[10px] uppercase font-bold text-graphite-400 block">
                Tu Versión Actual
              </span>
              <span className="text-sm font-mono font-bold text-graphite-700">
                v{updateInfo.currentVersion}
              </span>
            </div>

            <div className="w-8 h-8 rounded-full bg-rose-gold-50 border border-rose-gold-200 flex items-center justify-center text-rose-gold-600 shrink-0">
              ➜
            </div>

            <div className="text-center flex-1">
              <span className="text-[10px] uppercase font-bold text-rose-gold-600 block">
                Nueva Versión
              </span>
              <span className="text-base font-mono font-bold text-rose-gold-800 flex items-center justify-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                v{updateInfo.latestVersion}
              </span>
            </div>
          </div>

          {/* Estado 1: Inicial (Listo para descargar automáticamente) */}
          {downloadState === 'idle' && (
            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-2xl bg-white border border-rose-gold-100 shadow-2xs space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-semibold text-graphite-700">
                  <span>Instalador:</span>
                  <span className="font-mono text-rose-gold-700">{updateInfo.installerFileName}</span>
                </div>
                {updateInfo.changelog && (
                  <p className="text-[11px] text-graphite-600 leading-relaxed border-t border-rose-gold-100/60 pt-1.5">
                    {updateInfo.changelog}
                  </p>
                )}
              </div>

              <p className="text-[11px] text-graphite-500 leading-tight flex items-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  No necesitas entrar a Google Drive. El sistema descargará y aplicará los cambios manteniendo intacta toda tu base de datos y configuración.
                </span>
              </p>

              {/* Botón Principal: Auto-actualizar en 1 clic */}
              <button
                onClick={handleStartAutoUpdate}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-rose-gold-500 via-rose-gold-600 to-rose-gold-700 hover:from-rose-gold-600 hover:to-rose-gold-800 text-white font-semibold text-xs shadow-soft hover:shadow-soft-md transition-all group mt-2"
              >
                <Download className="w-4 h-4 transition-transform group-hover:-translate-y-0.5" />
                <span>Actualizar Automáticamente Ahora</span>
              </button>
            </div>
          )}

          {/* Estado 2: Descarga en Progreso */}
          {downloadState === 'downloading' && (
            <div className="space-y-4 p-4 rounded-2xl bg-white border border-rose-gold-200/80 shadow-xs">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-graphite-700 flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-gold-600" />
                  Descargando actualización...
                </span>
                <span className="font-mono font-bold text-rose-gold-700">{percent}%</span>
              </div>

              {/* Barra de progreso */}
              <div className="w-full bg-silk-200/70 h-3 rounded-full overflow-hidden p-0.5 border border-rose-gold-200/50 shadow-inner">
                <div
                  className="bg-gradient-to-r from-rose-gold-400 via-rose-gold-500 to-rose-gold-600 h-full rounded-full transition-all duration-300 ease-out shadow-xs"
                  style={{ width: `${Math.max(4, percent)}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[10px] text-graphite-400 font-mono">
                <span>{formatSize(downloadedBytes)} descargados</span>
                <span>{totalBytes > 0 ? formatSize(totalBytes) : 'Obteniendo tamaño...'}</span>
              </div>

              <p className="text-[11px] text-graphite-500 text-center italic">
                Por favor, espera unos instantes mientras se prepara la nueva versión.
              </p>
            </div>
          )}

          {/* Estado 3: Descarga Completada -> Reiniciar e Instalar */}
          {downloadState === 'completed' && (
            <div className="space-y-4 p-4 rounded-2xl bg-white border border-emerald-200 shadow-xs">
              <div className="flex items-center gap-2 text-emerald-700 font-semibold text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>El instalador de la v{updateInfo.latestVersion} se descargó con éxito.</span>
              </div>

              <p className="text-[11px] text-graphite-600 leading-relaxed">
                Al hacer clic en el botón, Hikari Suite realizará una copia de seguridad preventiva automática, se cerrará y ejecutará el instalador para actualizar el sistema.
              </p>

              <button
                onClick={handleInstallNow}
                disabled={isInstalling}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-semibold text-xs shadow-soft transition-all"
              >
                {isInstalling ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Iniciando Instalador...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    <span>Reiniciar e Instalar Actualización</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Estado 4: Error durante la descarga con Fallback */}
          {downloadState === 'error' && (
            <div className="space-y-3 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs">
              <div className="flex items-start gap-2 text-rose-800 font-semibold">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{errorMessage || 'Ocurrió un inconveniente con la descarga automática directa.'}</span>
              </div>

              <p className="text-[11px] text-graphite-600">
                Puedes reintentar la descarga automática o abrir la carpeta de Google Drive como método alternativo:
              </p>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleStartAutoUpdate}
                  className="flex-1 py-2 px-3 rounded-xl bg-rose-gold-600 hover:bg-rose-gold-700 text-white font-semibold text-[11px] flex items-center justify-center gap-1 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Reintentar
                </button>
                <button
                  onClick={handleOpenGoogleDriveFallback}
                  className="flex-1 py-2 px-3 rounded-xl bg-white border border-rose-gold-300 hover:bg-rose-gold-50 text-rose-gold-800 font-semibold text-[11px] flex items-center justify-center gap-1 transition-colors"
                >
                  <FolderOpen className="w-3.5 h-3.5" />
                  Carpeta Google Drive
                </button>
              </div>
            </div>
          )}

          {/* Pie de modal con accesos secundarios */}
          <div className="flex items-center justify-between pt-2 border-t border-rose-gold-100">
            <button
              onClick={handleOpenGitHub}
              className="text-[11px] font-medium text-graphite-500 hover:text-graphite-800 flex items-center gap-1 transition-colors"
            >
              <span>Ver en GitHub</span>
              <ExternalLink className="w-3 h-3" />
            </button>

            {downloadState !== 'downloading' && (
              <button
                onClick={handleOpenGoogleDriveFallback}
                className="text-[11px] font-medium text-rose-gold-600 hover:text-rose-gold-800 flex items-center gap-1 transition-colors"
              >
                <span>Acceso manual a Drive</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            )}

            {downloadState !== 'downloading' && !isInstalling && (
              <button
                onClick={onClose}
                className="text-[11px] font-semibold text-graphite-500 hover:text-rose-gold-800 transition-colors"
              >
                Cerrar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

