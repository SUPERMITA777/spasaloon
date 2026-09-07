import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { BackupItem, BackupConfig } from '../../types';
import {
  Database,
  HardDrive,
  FolderOpen,
  Folder,
  RefreshCw,
  Clock,
  ShieldCheck,
  AlertTriangle,
  Trash2,
  Download,
  RotateCcw,
  CheckCircle2,
  ExternalLink,
  Power,
  Info,
} from 'lucide-react';

declare global {
  interface Window {
    electronAPI?: {
      platform: string;
      isElectron: boolean;
      selectFolder: () => Promise<string | null>;
      openFolder: (folderPath: string) => Promise<boolean>;
      closeApp: () => Promise<void>;
    };
  }
}

export const BackupSettingsView: React.FC = () => {
  const { addToast } = useApp();

  const [config, setConfig] = useState<BackupConfig>({
    backupDirectory: '',
    backupOnClose: true,
    backupRetentionDays: 30,
  });
  const [backups, setBackups] = useState<BackupItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [creating, setCreating] = useState<boolean>(false);
  const [restoringFile, setRestoringFile] = useState<string | null>(null);
  const [confirmRestoreModal, setConfirmRestoreModal] = useState<string | null>(null);
  const [confirmDeleteModal, setConfirmDeleteModal] = useState<string | null>(null);
  const [isEditingFolder, setIsEditingFolder] = useState<boolean>(false);
  const [folderInput, setFolderInput] = useState<string>('');

  const isElectron = !!window.electronAPI?.isElectron;

  const loadData = async () => {
    try {
      setLoading(true);
      const [configRes, listRes] = await Promise.all([
        api.getBackupConfig(),
        api.getBackups(),
      ]);
      if (configRes.success) {
        setConfig(configRes.config);
        setFolderInput(configRes.config.backupDirectory);
      }
      if (listRes.success) {
        setBackups(listRes.backups);
      }
    } catch (error: any) {
      console.error('Error cargando datos de backup:', error);
      addToast({
        type: 'error',
        title: 'Error de conexión',
        message: 'No se pudieron cargar los datos de copias de seguridad.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Seleccionar carpeta
  const handleSelectFolder = async () => {
    if (isElectron && window.electronAPI?.selectFolder) {
      try {
        const selected = await window.electronAPI.selectFolder();
        if (selected) {
          await saveNewFolder(selected);
        }
      } catch (err) {
        console.error('Error en selector nativo:', err);
      }
    } else {
      setIsEditingFolder(true);
    }
  };

  const saveNewFolder = async (newPath: string) => {
    if (!newPath.trim()) return;
    try {
      const res = await api.updateBackupConfig({ backupDirectory: newPath.trim() });
      if (res.success) {
        setConfig(res.config);
        setFolderInput(res.config.backupDirectory);
        setIsEditingFolder(false);
        addToast({
          type: 'success',
          title: 'Carpeta actualizada',
          message: `Los backups se guardarán en: ${res.config.backupDirectory}`,
        });
        loadData();
      }
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Error al actualizar carpeta',
        message: err.message || 'Ruta no válida.',
      });
    }
  };

  // Abrir carpeta en explorador de Windows
  const handleOpenFolder = async () => {
    try {
      if (isElectron && window.electronAPI?.openFolder) {
        await window.electronAPI.openFolder(config.backupDirectory);
      } else {
        await api.openBackupFolder();
      }
      addToast({
        type: 'info',
        title: 'Explorador abierto',
        message: 'Se abrió la carpeta de copias de seguridad en tu equipo.',
      });
    } catch (err) {
      console.error('Error al abrir carpeta:', err);
    }
  };

  // Cambiar configuración
  const handleToggleOnClose = async () => {
    try {
      const updated = !config.backupOnClose;
      const res = await api.updateBackupConfig({ backupOnClose: updated });
      if (res.success) {
        setConfig(res.config);
        addToast({
          type: 'success',
          title: updated ? 'Backup al salir activado' : 'Backup al salir desactivado',
          message: updated
            ? 'Se generará una copia de seguridad cada vez que cierres el sistema.'
            : 'No se generarán copias automáticas al cerrar.',
        });
      }
    } catch (err: any) {
      addToast({ type: 'error', title: 'Error', message: err.message });
    }
  };

  const handleRetentionDaysChange = async (days: number) => {
    try {
      const res = await api.updateBackupConfig({ backupRetentionDays: days });
      if (res.success) {
        setConfig(res.config);
        addToast({
          type: 'success',
          title: 'Retención actualizada',
          message: `Se eliminarán copias de más de ${days} días.`,
        });
      }
    } catch (err: any) {
      addToast({ type: 'error', title: 'Error', message: err.message });
    }
  };

  // Crear backup manual
  const handleCreateBackup = async () => {
    try {
      setCreating(true);
      const res = await api.createBackup(false);
      if (res.success) {
        addToast({
          type: 'success',
          title: '✦ Copia de seguridad creada',
          message: `${res.backup.fileName} (${res.backup.sizeFormatted})`,
        });
        loadData();
      }
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Error creando copia',
        message: err.message || 'No se pudo generar el backup.',
      });
    } finally {
      setCreating(false);
    }
  };

  // Restaurar copia
  const handleExecuteRestore = async (fileName: string) => {
    try {
      setRestoringFile(fileName);
      setConfirmRestoreModal(null);
      const res = await api.restoreBackup(fileName);
      if (res.success) {
        addToast({
          type: 'success',
          title: '✦ Restauración Exitosa',
          message: 'La base de datos fue restaurada al punto de la copia seleccionada.',
        });
        // Recargar la página luego de un breve instante para refrescar datos en memoria
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      }
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Error de restauración',
        message: err.message || 'No se pudo restaurar la copia.',
      });
    } finally {
      setRestoringFile(null);
    }
  };

  // Eliminar copia
  const handleExecuteDelete = async (fileName: string) => {
    try {
      setConfirmDeleteModal(null);
      const res = await api.deleteBackup(fileName);
      if (res.success) {
        addToast({
          type: 'info',
          title: 'Copia eliminada',
          message: `Se eliminó el archivo ${fileName}.`,
        });
        loadData();
      }
    } catch (err: any) {
      addToast({ type: 'error', title: 'Error al eliminar', message: err.message });
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-rose-gold-200/50 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-rose-gold-500 to-rose-gold-300 text-white shadow-soft">
              <Database className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-serif font-bold text-graphite-900 tracking-tight">
              Copias de Seguridad (Backups)
            </h1>
          </div>
          <p className="text-xs text-graphite-600 mt-1">
            Resguardo automático de la base de datos de clientes, turnos, fichas y caja.
          </p>
        </div>

        {/* Botón de acción principal: Crear Backup Ahora */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleCreateBackup}
            disabled={creating}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-rose-gold-500 to-rose-gold-600 hover:from-rose-gold-600 hover:to-rose-gold-700 text-white text-xs font-semibold shadow-soft hover:shadow-soft-md transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${creating ? 'animate-spin' : ''}`} />
            <span>{creating ? 'Generando Copia...' : 'Crear Copia de Seguridad Ahora'}</span>
          </button>
        </div>
      </div>

      {/* Tarjeta Informativa Destacada: Restauración por Doble Clic */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-rose-blush-50 to-silk-100 border border-rose-gold-200 shadow-soft flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-rose-gold-100 text-rose-gold-700 shrink-0 mt-0.5">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h2 className="text-sm font-semibold text-graphite-900">
              ✦ Restauración Automática por Doble Clic en Windows
            </h2>
            <p className="text-xs text-graphite-600 leading-relaxed max-w-2xl">
              Cada vez que se genera un respaldo, el sistema crea un archivo ejecutable junto a la base de datos (por ejemplo, <span className="font-mono text-rose-gold-800 bg-white/80 px-1.5 py-0.5 rounded border border-rose-gold-200">Restaurar_Backup_FECHA.bat</span>). Si en algún momento necesitas volver a una fecha anterior o trasladar la copia a otra máquina, solo tienes que <strong>hacerle doble clic al archivo en Windows</strong> y el asistente restaurará todo de forma guiada y segura.
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenFolder}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-rose-gold-200 text-graphite-800 text-xs font-medium hover:bg-rose-gold-50 hover:border-rose-gold-300 shadow-sm transition-all shrink-0"
        >
          <FolderOpen className="w-4 h-4 text-rose-gold-600" />
          <span>Abrir Carpeta en Windows</span>
        </button>
      </div>

      {/* Grid de Configuración: Carpeta & Opciones Automáticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Columna 1 y 2: Carpeta de Destino */}
        <div className="md:col-span-2 p-5 rounded-2xl bg-white border border-rose-gold-200/70 shadow-soft space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Folder className="w-4 h-4 text-rose-gold-600" />
              <h2 className="text-sm font-bold text-graphite-900">Carpeta de Destino Configurable</h2>
            </div>
            <span className="text-[11px] text-sage-600 font-medium bg-sage-50 px-2 py-0.5 rounded-full border border-sage-200">
              Activa
            </span>
          </div>

          <p className="text-xs text-graphite-600">
            Define en qué carpeta de tu disco local, pendrive o disco externo se almacenarán todas las copias de seguridad:
          </p>

          {!isEditingFolder ? (
            <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-silk-50 border border-rose-gold-200/80">
              <div className="flex items-center gap-2 min-w-0">
                <HardDrive className="w-4 h-4 text-graphite-400 shrink-0" />
                <span className="font-mono text-xs text-graphite-800 truncate" title={config.backupDirectory}>
                  {config.backupDirectory || 'Cargando directorio...'}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleSelectFolder}
                  className="px-3 py-1.5 rounded-lg bg-white border border-rose-gold-200 text-rose-gold-700 text-xs font-semibold hover:bg-rose-gold-50 transition-colors shadow-sm"
                >
                  Cambiar Carpeta
                </button>
                <button
                  onClick={handleOpenFolder}
                  title="Abrir en Explorador de Windows"
                  className="p-1.5 rounded-lg bg-white border border-rose-gold-200 text-graphite-600 hover:text-graphite-900 hover:bg-silk-100 transition-colors shadow-sm"
                >
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 p-1">
              <input
                type="text"
                value={folderInput}
                onChange={(e) => setFolderInput(e.target.value)}
                placeholder="Ej: D:\HikariSuite_Backups"
                className="flex-1 px-3 py-2 text-xs font-mono rounded-xl border border-rose-gold-300 focus:outline-none focus:ring-2 focus:ring-rose-gold-400 bg-white"
              />
              <button
                onClick={() => saveNewFolder(folderInput)}
                className="px-4 py-2 rounded-xl bg-rose-gold-600 hover:bg-rose-gold-700 text-white text-xs font-semibold shadow-sm transition-colors"
              >
                Guardar
              </button>
              <button
                onClick={() => {
                  setIsEditingFolder(false);
                  setFolderInput(config.backupDirectory);
                }}
                className="px-3 py-2 rounded-xl bg-silk-200 hover:bg-silk-300 text-graphite-700 text-xs font-semibold transition-colors"
              >
                Cancelar
              </button>
            </div>
          )}

          <div className="flex items-center gap-2 text-[11px] text-graphite-500 pt-1">
            <Info className="w-3.5 h-3.5 text-rose-gold-500" />
            <span>
              Puedes colocar una carpeta sincronizada con Google Drive o OneDrive para tener resguardo automático en la nube.
            </span>
          </div>
        </div>

        {/* Columna 3: Opciones de Automatización */}
        <div className="p-5 rounded-2xl bg-white border border-rose-gold-200/70 shadow-soft space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-rose-gold-600" />
              <h2 className="text-sm font-bold text-graphite-900">Automatización & Cierre</h2>
            </div>

            {/* Toggle: Backup al cerrar */}
            <div className="flex items-start justify-between gap-3 pt-2">
              <div>
                <label className="text-xs font-semibold text-graphite-900 block">
                  Backup al cerrar el sistema
                </label>
                <span className="text-[11px] text-graphite-500 block leading-tight mt-0.5">
                  Crea una copia cada vez que sales de Hikari Suite.
                </span>
              </div>
              <button
                onClick={handleToggleOnClose}
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ease-in-out shrink-0 ${
                  config.backupOnClose ? 'bg-rose-gold-600' : 'bg-graphite-300'
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                    config.backupOnClose ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <hr className="border-rose-gold-100" />

            {/* Selector de retención: 30 días */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-graphite-900 block">
                Retención de copias antiguas
              </label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-graphite-600">Eliminar copias de más de:</span>
                <select
                  value={config.backupRetentionDays}
                  onChange={(e) => handleRetentionDaysChange(Number(e.target.value))}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-rose-gold-200 bg-white text-graphite-800 focus:outline-none focus:ring-1 focus:ring-rose-gold-400"
                >
                  <option value={7}>7 días</option>
                  <option value={15}>15 días</option>
                  <option value={30}>30 días (Recomendado)</option>
                  <option value={60}>60 días</option>
                  <option value={90}>90 días</option>
                  <option value={0}>No eliminar nunca</option>
                </select>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-sage-700 bg-sage-50/70 p-2 rounded-xl border border-sage-200/50">
            ✓ Las copias nunca se sobreescriben; cada una lleva fecha y hora exactas.
          </div>
        </div>
      </div>

      {/* Historial de Copias de Seguridad */}
      <div className="rounded-2xl bg-white border border-rose-gold-200/70 shadow-soft overflow-hidden">
        <div className="p-5 border-b border-rose-gold-100 flex items-center justify-between bg-silk-50/50">
          <div className="flex items-center gap-2.5">
            <Database className="w-4 h-4 text-rose-gold-600" />
            <h2 className="text-sm font-bold text-graphite-900">
              Copias de Seguridad Disponibles ({backups.length})
            </h2>
          </div>
          <button
            onClick={loadData}
            title="Actualizar lista"
            className="p-1.5 rounded-lg text-graphite-500 hover:text-graphite-800 hover:bg-silk-100 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-graphite-400 flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-rose-gold-500" />
            <span>Cargando copias de seguridad...</span>
          </div>
        ) : backups.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-gold-50 text-rose-gold-500 flex items-center justify-center mx-auto">
              <Database className="w-6 h-6" />
            </div>
            <div className="text-xs font-semibold text-graphite-800">
              Aún no hay copias de seguridad generadas.
            </div>
            <p className="text-[11px] text-graphite-500 max-w-sm mx-auto">
              Haz clic en el botón de arriba "Crear Copia de Seguridad Ahora" para generar la primera copia resguardada.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-rose-gold-100 bg-silk-100/60 text-graphite-600 font-semibold text-[11px]">
                  <th className="py-3 px-5">Fecha y Hora</th>
                  <th className="py-3 px-4">Archivo de Base de Datos (.db)</th>
                  <th className="py-3 px-4">Script Restaurador (.bat)</th>
                  <th className="py-3 px-4 text-right">Tamaño</th>
                  <th className="py-3 px-5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rose-gold-100">
                {backups.map((item, idx) => {
                  const dateObj = new Date(item.createdAt);
                  const formattedDate = dateObj.toLocaleDateString('es-AR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  });

                  const isRestoringThis = restoringFile === item.fileName;

                  return (
                    <tr
                      key={item.fileName}
                      className={`hover:bg-rose-blush-50/40 transition-colors ${
                        idx === 0 ? 'bg-rose-gold-50/20' : ''
                      }`}
                    >
                      <td className="py-3 px-5 font-medium text-graphite-900 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-sage-500"></span>
                          <span>{formattedDate}</span>
                          {idx === 0 && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-gold-100 text-rose-gold-800 uppercase tracking-wider">
                              Última
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4 font-mono text-[11px] text-graphite-700 whitespace-nowrap">
                        {item.fileName}
                      </td>

                      <td className="py-3 px-4 font-mono text-[11px] text-rose-gold-700 whitespace-nowrap">
                        <span className="flex items-center gap-1.5" title="Script ejecutable para Windows">
                          <span className="px-1.5 py-0.5 bg-rose-gold-100 rounded text-[10px] font-bold text-rose-gold-800">
                            BAT
                          </span>
                          {item.batName || 'Restaurar_Backup_...bat'}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right font-medium text-graphite-600 whitespace-nowrap">
                        {item.sizeFormatted}
                      </td>

                      <td className="py-3 px-5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setConfirmRestoreModal(item.fileName)}
                            disabled={isRestoringThis}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-gold-50 hover:bg-rose-gold-100 border border-rose-gold-200 text-rose-gold-800 font-semibold transition-colors disabled:opacity-50"
                            title="Restaurar esta versión en el sistema"
                          >
                            <RotateCcw className={`w-3.5 h-3.5 ${isRestoringThis ? 'animate-spin' : ''}`} />
                            <span>{isRestoringThis ? 'Restaurando...' : 'Restaurar'}</span>
                          </button>

                          <button
                            onClick={() => setConfirmDeleteModal(item.fileName)}
                            className="p-1.5 rounded-lg hover:bg-rose-100 text-graphite-400 hover:text-rose-600 transition-colors"
                            title="Eliminar este archivo de backup"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Confirmación para Restaurar */}
      {confirmRestoreModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-graphite-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-soft-lg border border-rose-gold-200 space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div>
              <h2 className="text-base font-bold text-graphite-900">
                ¿Confirmar Restauración de Datos?
              </h2>
              <p className="text-xs text-graphite-600 mt-1 leading-relaxed">
                Estás a punto de restaurar la base de datos a la copia:{' '}
                <strong className="font-mono text-graphite-900 block mt-1 bg-silk-100 p-1.5 rounded border border-rose-gold-200">
                  {confirmRestoreModal}
                </strong>
              </p>
            </div>

            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] leading-relaxed">
              ⚠️ <strong>Importante:</strong> Los datos agregados posteriormente a esta fecha serán reemplazados por los de la copia. Antes de sobrescribir, el sistema creará automáticamente un resguardo de emergencia de tu base actual.
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setConfirmRestoreModal(null)}
                className="px-4 py-2 rounded-xl border border-rose-gold-200 text-xs font-semibold text-graphite-700 hover:bg-silk-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleExecuteRestore(confirmRestoreModal)}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-sm transition-colors"
              >
                Sí, Restaurar Ahora
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmación para Eliminar */}
      {confirmDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-graphite-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-soft-lg border border-rose-gold-200 space-y-4">
            <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center">
              <Trash2 className="w-5 h-5" />
            </div>

            <div>
              <h2 className="text-sm font-bold text-graphite-900">
                ¿Eliminar copia de seguridad?
              </h2>
              <p className="text-xs text-graphite-600 mt-1">
                Se eliminará el archivo <span className="font-mono font-semibold">{confirmDeleteModal}</span> y su lanzador de restauración.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setConfirmDeleteModal(null)}
                className="px-3 py-1.5 rounded-xl border border-rose-gold-200 text-xs font-semibold text-graphite-700 hover:bg-silk-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleExecuteDelete(confirmDeleteModal)}
                className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition-colors"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
