import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { SyncConflict, syncService } from '../../services/syncService';
import {
  AlertTriangle,
  Smartphone,
  Monitor,
  Check,
  Clock,
  User,
  CheckCircle2,
  X,
  DollarSign,
  Tag,
  Edit3,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Save,
  RotateCcw,
} from 'lucide-react';

interface Props {
  conflicts: SyncConflict[];
  onClose?: () => void;
}

export const ConflictResolutionModal: React.FC<Props> = ({ conflicts, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isResolving, setIsResolving] = useState<boolean>(false);

  // Estado para el modo de edición manual
  const [isEditingCustom, setIsEditingCustom] = useState<boolean>(false);
  const [customForm, setCustomForm] = useState<any>({});

  if (!conflicts || conflicts.length === 0) return null;

  const current = conflicts[Math.min(currentIndex, conflicts.length - 1)];

  // Inicializar o cambiar datos del formulario cuando cambia el conflicto
  const initCustomForm = () => {
    // Mezcla inicial: prioriza móvil pero con base en servidor
    setCustomForm({
      ...current.serverData,
      ...current.mobileData,
    });
    setIsEditingCustom(true);
  };

  const handleResolve = async (
    resolution: 'keep_server' | 'keep_mobile' | 'modify' | 'delete',
    dataToSave?: any
  ) => {
    try {
      setIsResolving(true);
      await syncService.resolveConflict(current, resolution, dataToSave);
      setIsEditingCustom(false);

      if (currentIndex >= conflicts.length - 1) {
        setCurrentIndex(0);
        if (onClose) onClose();
      } else {
        setCurrentIndex((prev) => prev + 1);
      }
    } catch (e) {
      console.error('Error al resolver conflicto:', e);
    } finally {
      setIsResolving(false);
    }
  };

  const formatDateTime = (iso?: string) => {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleString('es-AR', {
        dateStyle: 'short',
        timeStyle: 'short',
      });
    } catch {
      return iso;
    }
  };

  const isDiff = (field: string) => {
    return current.diffFields?.includes(field);
  };

  return createPortal(
    <div className="fixed inset-0 z-[99999] bg-graphite-950/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border-2 border-amber-400 overflow-hidden animate-scale-up flex flex-col my-6 text-xs">
        {/* Header con advertencia */}
        <div className="p-4 bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-white/20 shadow-inner">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif font-bold text-sm">
                  Control Central: Discrepancia Detectada desde App Móvil
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-white/20 font-mono font-bold">
                  {currentIndex + 1} de {conflicts.length}
                </span>
              </div>
              <p className="text-[11px] text-white/90">
                {current.entityDescription || `Registro #${current.entityId.substring(0, 8)}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {conflicts.length > 1 && (
              <div className="flex items-center gap-1 mr-2">
                <button
                  disabled={currentIndex === 0}
                  onClick={() => {
                    setCurrentIndex((p) => Math.max(0, p - 1));
                    setIsEditingCustom(false);
                  }}
                  className="p-1.5 rounded-lg bg-white/15 hover:bg-white/25 disabled:opacity-30 text-white"
                  title="Anterior discrepancia"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  disabled={currentIndex >= conflicts.length - 1}
                  onClick={() => {
                    setCurrentIndex((p) => Math.min(conflicts.length - 1, p + 1));
                    setIsEditingCustom(false);
                  }}
                  className="p-1.5 rounded-lg bg-white/15 hover:bg-white/25 disabled:opacity-30 text-white"
                  title="Siguiente discrepancia"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
            {onClose && (
              <button
                onClick={onClose}
                className="p-1 rounded-lg hover:bg-white/20 text-white transition-colors"
                title="Cerrar modal"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Explicación al operador */}
        <div className="p-3.5 bg-amber-50/90 border-b border-amber-200 text-amber-950 flex items-center justify-between">
          <p className="leading-snug text-xs">
            Se recibieron modificaciones desde el <strong>teléfono celular</strong> que difieren de los datos guardados en esta computadora. Como operador del servidor central, decide la acción a tomar:
          </p>
        </div>

        {/* ========================================================================= */}
        {/* MODO 1: COMPARACIÓN LADO A LADO (MÓVIL vs SERVIDOR)                       */}
        {/* ========================================================================= */}
        {!isEditingCustom ? (
          <div className="p-5 space-y-4 overflow-y-auto max-h-[60vh]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Columna 1: Versión Móvil */}
              <div className="p-4 rounded-2xl border-2 border-rose-gold-300 bg-silk-50/70 flex flex-col justify-between space-y-3 shadow-xs">
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-rose-gold-200 text-rose-gold-900 font-bold">
                    <div className="flex items-center gap-1.5">
                      <Smartphone className="w-4 h-4 text-rose-gold-600" />
                      <span className="text-xs">Versión Enviada por el Celular</span>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-gold-100 font-mono">Móvil</span>
                  </div>
                  <p className="text-[10px] text-graphite-500 mt-1">
                    Registrado: {formatDateTime(current.mobileData?.clientTimestamp)}
                  </p>

                  <div className="space-y-2 mt-3 text-[11px]">
                    {current.entity === 'appointment' && (
                      <>
                        <div className={`p-2 rounded-xl border ${isDiff('start_time') ? 'bg-amber-100 border-amber-400 font-bold text-amber-950' : 'bg-white border-rose-gold-100'}`}>
                          <span className="text-graphite-500 block text-[10px]">Horario:</span>
                          <span>{formatDateTime(current.mobileData?.start_time)}</span>
                        </div>
                        <div className={`p-2 rounded-xl border ${isDiff('status') ? 'bg-amber-100 border-amber-400 font-bold text-amber-950' : 'bg-white border-rose-gold-100'}`}>
                          <span className="text-graphite-500 block text-[10px]">Estado:</span>
                          <span className="capitalize">{current.mobileData?.status || 'Agendado'}</span>
                        </div>
                        <div className={`p-2 rounded-xl border ${isDiff('service_price') ? 'bg-amber-100 border-amber-400 font-bold text-amber-950' : 'bg-white border-rose-gold-100'}`}>
                          <span className="text-graphite-500 block text-[10px]">Precio del Servicio:</span>
                          <span>${Number(current.mobileData?.service_price || 0).toLocaleString('es-AR')}</span>
                        </div>
                        <div className={`p-2 rounded-xl border ${isDiff('notes') ? 'bg-amber-100 border-amber-400 font-bold text-amber-950' : 'bg-white border-rose-gold-100'}`}>
                          <span className="text-graphite-500 block text-[10px]">Observaciones:</span>
                          <span className="italic">{current.mobileData?.notes || '(Sin notas)'}</span>
                        </div>
                      </>
                    )}

                    {current.entity === 'client' && (
                      <>
                        <div className={`p-2 rounded-xl border ${isDiff('first_name') || isDiff('last_name') ? 'bg-amber-100 border-amber-400 font-bold text-amber-950' : 'bg-white border-rose-gold-100'}`}>
                          <span className="text-graphite-500 block text-[10px]">Nombre:</span>
                          <span>{current.mobileData?.first_name} {current.mobileData?.last_name}</span>
                        </div>
                        <div className={`p-2 rounded-xl border ${isDiff('phone') ? 'bg-amber-100 border-amber-400 font-bold text-amber-950' : 'bg-white border-rose-gold-100'}`}>
                          <span className="text-graphite-500 block text-[10px]">Teléfono:</span>
                          <span>{current.mobileData?.phone || '(Sin teléfono)'}</span>
                        </div>
                        <div className={`p-2 rounded-xl border ${isDiff('email') ? 'bg-amber-100 border-amber-400 font-bold text-amber-950' : 'bg-white border-rose-gold-100'}`}>
                          <span className="text-graphite-500 block text-[10px]">Email:</span>
                          <span>{current.mobileData?.email || '(Sin email)'}</span>
                        </div>
                      </>
                    )}

                    {(current.entity === 'sub_treatment' || current.entity === 'price') && (
                      <>
                        <div className={`p-2 rounded-xl border ${isDiff('price') ? 'bg-amber-100 border-amber-400 font-bold text-amber-950' : 'bg-white border-rose-gold-100'}`}>
                          <span className="text-graphite-500 block text-[10px]">Precio del Servicio:</span>
                          <span className="text-sm font-mono font-bold text-rose-gold-900">
                            ${Number(current.mobileData?.price || 0).toLocaleString('es-AR')}
                          </span>
                        </div>
                        <div className={`p-2 rounded-xl border ${isDiff('name') ? 'bg-amber-100 border-amber-400 font-bold text-amber-950' : 'bg-white border-rose-gold-100'}`}>
                          <span className="text-graphite-500 block text-[10px]">Nombre:</span>
                          <span>{current.mobileData?.name}</span>
                        </div>
                      </>
                    )}

                    {current.entity === 'product' && (
                      <>
                        <div className="p-2 rounded-xl border bg-white border-rose-gold-100">
                          <span className="text-graphite-500 block text-[10px]">Stock en Móvil:</span>
                          <span className="font-bold">{current.mobileData?.stock_quantity}</span>
                        </div>
                        <div className="p-2 rounded-xl border bg-white border-rose-gold-100">
                          <span className="text-graphite-500 block text-[10px]">Precio Venta:</span>
                          <span>${Number(current.mobileData?.sale_price || 0).toLocaleString('es-AR')}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => handleResolve('keep_mobile')}
                  disabled={isResolving}
                  className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-rose-gold-600 to-rose-gold-700 hover:from-rose-gold-700 hover:to-rose-gold-800 text-white font-bold text-xs shadow-soft transition-all flex items-center justify-center gap-1.5 active:scale-[0.98]"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Mantener Datos del Móvil</span>
                </button>
              </div>

              {/* Columna 2: Versión Servidor (PC) */}
              <div className="p-4 rounded-2xl border-2 border-sky-300 bg-sky-50/50 flex flex-col justify-between space-y-3 shadow-xs">
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-sky-200 text-sky-900 font-bold">
                    <div className="flex items-center gap-1.5">
                      <Monitor className="w-4 h-4 text-sky-600" />
                      <span className="text-xs">Versión Actual en Computadora</span>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-100 font-mono">Servidor</span>
                  </div>
                  <p className="text-[10px] text-graphite-500 mt-1">
                    Último cambio: {formatDateTime(current.serverData?.updated_at || current.serverData?.created_at)}
                  </p>

                  <div className="space-y-2 mt-3 text-[11px]">
                    {current.entity === 'appointment' && (
                      <>
                        <div className={`p-2 rounded-xl border ${isDiff('start_time') ? 'bg-amber-100 border-amber-400 font-bold text-amber-950' : 'bg-white border-sky-100'}`}>
                          <span className="text-graphite-500 block text-[10px]">Horario:</span>
                          <span>{formatDateTime(current.serverData?.start_time)}</span>
                        </div>
                        <div className={`p-2 rounded-xl border ${isDiff('status') ? 'bg-amber-100 border-amber-400 font-bold text-amber-950' : 'bg-white border-sky-100'}`}>
                          <span className="text-graphite-500 block text-[10px]">Estado:</span>
                          <span className="capitalize">{current.serverData?.status || 'Agendado'}</span>
                        </div>
                        <div className={`p-2 rounded-xl border ${isDiff('service_price') ? 'bg-amber-100 border-amber-400 font-bold text-amber-950' : 'bg-white border-sky-100'}`}>
                          <span className="text-graphite-500 block text-[10px]">Precio del Servicio:</span>
                          <span>${Number(current.serverData?.service_price || 0).toLocaleString('es-AR')}</span>
                        </div>
                        <div className={`p-2 rounded-xl border ${isDiff('notes') ? 'bg-amber-100 border-amber-400 font-bold text-amber-950' : 'bg-white border-sky-100'}`}>
                          <span className="text-graphite-500 block text-[10px]">Observaciones:</span>
                          <span className="italic">{current.serverData?.notes || '(Sin notas)'}</span>
                        </div>
                      </>
                    )}

                    {current.entity === 'client' && (
                      <>
                        <div className={`p-2 rounded-xl border ${isDiff('first_name') || isDiff('last_name') ? 'bg-amber-100 border-amber-400 font-bold text-amber-950' : 'bg-white border-sky-100'}`}>
                          <span className="text-graphite-500 block text-[10px]">Nombre:</span>
                          <span>{current.serverData?.first_name} {current.serverData?.last_name}</span>
                        </div>
                        <div className={`p-2 rounded-xl border ${isDiff('phone') ? 'bg-amber-100 border-amber-400 font-bold text-amber-950' : 'bg-white border-sky-100'}`}>
                          <span className="text-graphite-500 block text-[10px]">Teléfono:</span>
                          <span>{current.serverData?.phone || '(Sin teléfono)'}</span>
                        </div>
                        <div className={`p-2 rounded-xl border ${isDiff('email') ? 'bg-amber-100 border-amber-400 font-bold text-amber-950' : 'bg-white border-sky-100'}`}>
                          <span className="text-graphite-500 block text-[10px]">Email:</span>
                          <span>{current.serverData?.email || '(Sin email)'}</span>
                        </div>
                      </>
                    )}

                    {(current.entity === 'sub_treatment' || current.entity === 'price') && (
                      <>
                        <div className={`p-2 rounded-xl border ${isDiff('price') ? 'bg-amber-100 border-amber-400 font-bold text-amber-950' : 'bg-white border-sky-100'}`}>
                          <span className="text-graphite-500 block text-[10px]">Precio del Servicio:</span>
                          <span className="text-sm font-mono font-bold text-sky-900">
                            ${Number(current.serverData?.price || 0).toLocaleString('es-AR')}
                          </span>
                        </div>
                        <div className={`p-2 rounded-xl border ${isDiff('name') ? 'bg-amber-100 border-amber-400 font-bold text-amber-950' : 'bg-white border-sky-100'}`}>
                          <span className="text-graphite-500 block text-[10px]">Nombre:</span>
                          <span>{current.serverData?.name}</span>
                        </div>
                      </>
                    )}

                    {current.entity === 'product' && (
                      <>
                        <div className="p-2 rounded-xl border bg-white border-sky-100">
                          <span className="text-graphite-500 block text-[10px]">Stock en Servidor:</span>
                          <span className="font-bold">{current.serverData?.stock_quantity}</span>
                        </div>
                        <div className="p-2 rounded-xl border bg-white border-sky-100">
                          <span className="text-graphite-500 block text-[10px]">Precio Venta:</span>
                          <span>${Number(current.serverData?.sale_price || 0).toLocaleString('es-AR')}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => handleResolve('keep_server')}
                  disabled={isResolving}
                  className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-sky-600 to-sky-700 hover:from-sky-700 hover:to-sky-800 text-white font-bold text-xs shadow-soft transition-all flex items-center justify-center gap-1.5 active:scale-[0.98]"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Mantener Datos del Servidor (PC)</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* MODO 2: FORMULARIO INTERACTIVO PARA MODIFICAR CAMPOS MANUALMENTE          */
          /* ========================================================================= */
          <div className="p-5 space-y-4 overflow-y-auto max-h-[60vh]">
            <div className="p-3 bg-silk-100 rounded-2xl border border-rose-gold-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-rose-gold-700" />
                <span className="font-bold text-graphite-800 text-xs">
                  Modificando valores para: {current.entityDescription}
                </span>
              </div>
              <button
                onClick={() => setIsEditingCustom(false)}
                className="text-xs text-rose-gold-700 font-bold hover:underline flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Volver a comparar</span>
              </button>
            </div>

            <div className="space-y-3">
              {current.entity === 'appointment' && (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-graphite-700 mb-1">Fecha y Hora</label>
                      <input
                        type="datetime-local"
                        value={customForm.start_time?.substring(0, 16) || ''}
                        onChange={(e) => setCustomForm({ ...customForm, start_time: e.target.value })}
                        className="w-full p-2 bg-silk-50 rounded-xl border border-rose-gold-200 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-graphite-700 mb-1">Estado</label>
                      <select
                        value={customForm.status || 'scheduled'}
                        onChange={(e) => setCustomForm({ ...customForm, status: e.target.value })}
                        className="w-full p-2 bg-silk-50 rounded-xl border border-rose-gold-200 text-xs"
                      >
                        <option value="scheduled">Agendado</option>
                        <option value="in_progress">En Curso</option>
                        <option value="completed">Cobrado</option>
                        <option value="cancelled">Cancelado</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-graphite-700 mb-1">Precio Total ($)</label>
                      <input
                        type="number"
                        min="0"
                        value={customForm.service_price || 0}
                        onChange={(e) => setCustomForm({ ...customForm, service_price: Number(e.target.value) })}
                        className="w-full p-2 bg-silk-50 rounded-xl border border-rose-gold-200 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-graphite-700 mb-1">Seña ($)</label>
                      <input
                        type="number"
                        min="0"
                        value={customForm.deposit_amount || 0}
                        onChange={(e) => setCustomForm({ ...customForm, deposit_amount: Number(e.target.value) })}
                        className="w-full p-2 bg-silk-50 rounded-xl border border-rose-gold-200 text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-graphite-700 mb-1">Notas / Observaciones</label>
                    <textarea
                      rows={2}
                      value={customForm.notes || ''}
                      onChange={(e) => setCustomForm({ ...customForm, notes: e.target.value })}
                      className="w-full p-2 bg-silk-50 rounded-xl border border-rose-gold-200 text-xs resize-none"
                    />
                  </div>
                </>
              )}

              {current.entity === 'client' && (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-graphite-700 mb-1">Nombre</label>
                      <input
                        type="text"
                        value={customForm.first_name || ''}
                        onChange={(e) => setCustomForm({ ...customForm, first_name: e.target.value })}
                        className="w-full p-2 bg-silk-50 rounded-xl border border-rose-gold-200 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-graphite-700 mb-1">Apellido</label>
                      <input
                        type="text"
                        value={customForm.last_name || ''}
                        onChange={(e) => setCustomForm({ ...customForm, last_name: e.target.value })}
                        className="w-full p-2 bg-silk-50 rounded-xl border border-rose-gold-200 text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-graphite-700 mb-1">Teléfono</label>
                      <input
                        type="tel"
                        value={customForm.phone || ''}
                        onChange={(e) => setCustomForm({ ...customForm, phone: e.target.value })}
                        className="w-full p-2 bg-silk-50 rounded-xl border border-rose-gold-200 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-graphite-700 mb-1">Email</label>
                      <input
                        type="email"
                        value={customForm.email || ''}
                        onChange={(e) => setCustomForm({ ...customForm, email: e.target.value })}
                        className="w-full p-2 bg-silk-50 rounded-xl border border-rose-gold-200 text-xs"
                      />
                    </div>
                  </div>
                </>
              )}

              {(current.entity === 'sub_treatment' || current.entity === 'price') && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-graphite-700 mb-1">Nombre Servicio</label>
                    <input
                      type="text"
                      value={customForm.name || ''}
                      onChange={(e) => setCustomForm({ ...customForm, name: e.target.value })}
                      className="w-full p-2 bg-silk-50 rounded-xl border border-rose-gold-200 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-graphite-700 mb-1">Precio Definitivo ($)</label>
                    <input
                      type="number"
                      min="0"
                      value={customForm.price || 0}
                      onChange={(e) => setCustomForm({ ...customForm, price: Number(e.target.value) })}
                      className="w-full p-2 bg-silk-50 rounded-xl border border-rose-gold-200 text-xs font-mono font-bold"
                    />
                  </div>
                </div>
              )}

              {current.entity === 'product' && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-graphite-700 mb-1">Stock Definitivo</label>
                    <input
                      type="number"
                      value={customForm.stock_quantity || 0}
                      onChange={(e) => setCustomForm({ ...customForm, stock_quantity: Number(e.target.value) })}
                      className="w-full p-2 bg-silk-50 rounded-xl border border-rose-gold-200 text-xs font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-graphite-700 mb-1">Precio Venta ($)</label>
                    <input
                      type="number"
                      value={customForm.sale_price || 0}
                      onChange={(e) => setCustomForm({ ...customForm, sale_price: Number(e.target.value) })}
                      className="w-full p-2 bg-silk-50 rounded-xl border border-rose-gold-200 text-xs font-mono font-bold"
                    />
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => handleResolve('modify', customForm)}
              disabled={isResolving}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>Guardar Valores Modificados en la Base de Datos</span>
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* BARRA INFERIOR DE DECISIÓN DEL OPERADOR                                    */}
        {/* ========================================================================= */}
        <div className="p-4 bg-silk-100/90 border-t border-rose-gold-200/80 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {!isEditingCustom && (
              <button
                type="button"
                onClick={initCustomForm}
                disabled={isResolving}
                className="px-3.5 py-2 rounded-xl bg-white border border-rose-gold-300 text-rose-gold-800 font-bold text-xs hover:bg-rose-gold-50 shadow-xs flex items-center gap-1.5 transition-all"
              >
                <Edit3 className="w-3.5 h-3.5 text-rose-gold-600" />
                <span>Modificar Valores Manualmente</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                const conf = window.confirm(
                  `¿Estás seguro de ELIMINAR / ANULAR este registro (${current.entityDescription}) de la base de datos central?`
                );
                if (conf) handleResolve('delete');
              }}
              disabled={isResolving}
              className="px-3.5 py-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 font-bold text-xs hover:bg-rose-100 shadow-xs flex items-center gap-1.5 transition-all"
              title="Eliminar o anular el registro de la base de datos"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              <span>Eliminar Registro</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-graphite-700 hover:bg-graphite-800 text-white font-semibold text-xs transition-colors"
          >
            Revisar Más Tarde
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
