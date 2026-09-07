import React from 'react';
import { Download, Sparkles, ExternalLink, X, CheckCircle2, CloudDownload } from 'lucide-react';
import { HikariLogo } from './HikariLogo';

export interface UpdateInfo {
  updateAvailable: boolean;
  currentVersion: string;
  latestVersion: string;
  downloadUrl: string;
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
  if (!isOpen || !updateInfo) return null;

  const handleOpenDownload = () => {
    const url = updateInfo.downloadUrl || 'https://drive.google.com/drive/u/0/folders/157PVYzZe5ObkAYwC26DOwbr88YGyGAwc';
    
    // Si estamos en entorno Electron
    if ((window as any).electronAPI?.openExternal) {
      (window as any).electronAPI.openExternal(url);
    } else {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleOpenGitHub = () => {
    const repoUrl = 'https://github.com/SUPERMITA777/spasaloon';
    if ((window as any).electronAPI?.openExternal) {
      (window as any).electronAPI.openExternal(repoUrl);
    } else {
      window.open(repoUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-graphite-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-soft-2xl border border-rose-gold-200/90 overflow-hidden animate-scale-up">
        {/* Cabecera elegante con degradé en oro rosado */}
        <div className="relative p-6 bg-gradient-to-br from-rose-gold-600 via-rose-gold-500 to-rose-gold-700 text-white overflow-hidden">
          {/* Destellos de fondo */}
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/10 hover:bg-black/20 flex items-center justify-center text-white transition-colors"
            title="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
              <CloudDownload className="w-6 h-6 text-white animate-bounce" />
            </div>
            <div>
              <span className="text-[10px] font-bold tracking-[0.2em] uppercase bg-white/20 px-2 py-0.5 rounded-full">
                Actualización de Sistema
              </span>
              <h2 className="text-xl font-serif font-bold text-white mt-1 leading-tight">
                ¡Nueva Versión Disponible!
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

          {/* Información del Instalador */}
          <div className="space-y-2 text-xs">
            <div className="p-3 rounded-2xl bg-white border border-rose-gold-100 shadow-2xs space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-semibold text-graphite-700">
                <span>Archivo disponible en Google Drive:</span>
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
                Al descargar la nueva versión, tus datos de turnos, clientes y caja se mantendrán intactos.
              </span>
            </p>
          </div>

          {/* Botones de acción */}
          <div className="space-y-2 pt-2 border-t border-rose-gold-100">
            <button
              onClick={handleOpenDownload}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-gradient-to-r from-rose-gold-500 via-rose-gold-600 to-rose-gold-700 hover:from-rose-gold-600 hover:to-rose-gold-800 text-white font-semibold text-xs shadow-soft hover:shadow-soft-md transition-all group"
            >
              <Download className="w-4 h-4 transition-transform group-hover:-translate-y-0.5" />
              <span>Descargar Nueva Versión desde Google Drive</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-80" />
            </button>

            <div className="flex items-center justify-between pt-1">
              <button
                onClick={handleOpenGitHub}
                className="text-[11px] font-medium text-graphite-500 hover:text-graphite-800 flex items-center gap-1 transition-colors"
              >
                <span>Ver repositorio GitHub</span>
                <ExternalLink className="w-3 h-3" />
              </button>

              <button
                onClick={onClose}
                className="text-[11px] font-semibold text-graphite-500 hover:text-rose-gold-800 transition-colors"
              >
                Recordar más tarde
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
