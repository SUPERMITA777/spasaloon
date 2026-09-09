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
} from 'lucide-react';

interface Props {
  conflicts: SyncConflict[];
  onClose?: () => void;
}

export const ConflictResolutionModal: React.FC<Props> = ({ conflicts, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isResolving, setIsResolving] = useState<boolean>(false);

  if (!conflicts || conflicts.length === 0) return null;

  const current = conflicts[Math.min(currentIndex, conflicts.length - 1)];

  const handleResolve = async (resolution: 'use_mobile' | 'use_server') => {
    try {
      setIsResolving(true);
      await syncService.resolveConflict(current, resolution);
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
    <div className="fixed inset-0 z-[99999] bg-graphite-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border-2 border-amber-400 overflow-hidden animate-scale-up flex flex-col my-6 text-xs">
        {/* Header con advertencia */}
        <div className="p-4 bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-2xl bg-white/20 shadow-inner">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-sm">
                Confirmación en Servidor: Discrepancia desde la App Móvil
              </h3>
              <p className="text-[11px] text-white/90">
                Discrepancia {currentIndex + 1} de {conflicts.length} — {current.entityDescription}
              </p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-white/20 text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Explicación al operador */}
        <div className="p-4 bg-amber-50/80 border-b border-amber-200/80 text-amber-900">
          <p className="leading-relaxed">
            Se recibieron modificaciones desde el <strong>teléfono celular</strong> que difieren de los datos actuales en esta computadora. Como operador del sistema central, confirma cuál es el dato definitivo:
          </p>
        </div>

        {/* Comparador Lado a Lado (Móvil vs Computadora) */}
        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Columna 1: Versión Móvil */}
          <div className="p-4 rounded-2xl border-2 border-rose-gold-300 bg-silk-50/70 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center gap-2 pb-2 border-b border-rose-gold-200 text-rose-gold-800 font-bold">
                <Smartphone className="w-4 h-4" />
                <span className="text-xs">Enviado desde el Celular</span>
              </div>
              <p className="text-[10px] text-graphite-500 mt-1">
                Editado: {formatDateTime(current.mobileData?.clientTimestamp)}
              </p>

              {/* Campos dinámicos según entidad */}
              <div className="space-y-2 mt-3 text-[11px]">
                {current.entity === 'appointment' && (
                  <>
                    <div className={`p-2 rounded-xl border ${isDiff('start_time') ? 'bg-amber-100/80 border-amber-400 font-semibold text-amber-950' : 'bg-white border-rose-gold-100'}`}>
                      <span className="text-graphite-500 block text-[10px]">Horario:</span>
                      <span>{formatDateTime(current.mobileData?.start_time)}</span>
                    </div>
                    <div className={`p-2 rounded-xl border ${isDiff('status') ? 'bg-amber-100/80 border-amber-400 font-semibold text-amber-950' : 'bg-white border-rose-gold-100'}`}>
                      <span className="text-graphite-500 block text-[10px]">Estado:</span>
                      <span className="capitalize">{current.mobileData?.status || 'Agendado'}</span>
                    </div>
                    <div className={`p-2 rounded-xl border ${isDiff('service_price') ? 'bg-amber-100/80 border-amber-400 font-semibold text-amber-950' : 'bg-white border-rose-gold-100'}`}>
                      <span className="text-graphite-500 block text-[10px]">Precio del Servicio:</span>
                      <span>${Number(current.mobileData?.service_price || 0).toLocaleString('es-AR')}</span>
                    </div>
                    <div className={`p-2 rounded-xl border ${isDiff('notes') ? 'bg-amber-100/80 border-amber-400 font-semibold text-amber-950' : 'bg-white border-rose-gold-100'}`}>
                      <span className="text-graphite-500 block text-[10px]">Observaciones:</span>
                      <span className="italic">{current.mobileData?.notes || '(Sin notas)'}</span>
                    </div>
                  </>
                )}

                {current.entity === 'client' && (
                  <>
                    <div className={`p-2 rounded-xl border ${isDiff('first_name') || isDiff('last_name') ? 'bg-amber-100/80 border-amber-400 font-semibold text-amber-950' : 'bg-white border-rose-gold-100'}`}>
                      <span className="text-graphite-500 block text-[10px]">Nombre y Apellido:</span>
                      <span>{current.mobileData?.first_name} {current.mobileData?.last_name}</span>
                    </div>
                    <div className={`p-2 rounded-xl border ${isDiff('phone') ? 'bg-amber-100/80 border-amber-400 font-semibold text-amber-950' : 'bg-white border-rose-gold-100'}`}>
                      <span className="text-graphite-500 block text-[10px]">Teléfono:</span>
                      <span>{current.mobileData?.phone || '(Sin teléfono)'}</span>
                    </div>
                    <div className={`p-2 rounded-xl border ${isDiff('email') ? 'bg-amber-100/80 border-amber-400 font-semibold text-amber-950' : 'bg-white border-rose-gold-100'}`}>
                      <span className="text-graphite-500 block text-[10px]">Email:</span>
                      <span>{current.mobileData?.email || '(Sin email)'}</span>
                    </div>
                  </>
                )}

                {(current.entity === 'sub_treatment' || current.entity === 'price') && (
                  <>
                    <div className={`p-2 rounded-xl border ${isDiff('price') ? 'bg-amber-100/80 border-amber-400 font-semibold text-amber-950' : 'bg-white border-rose-gold-100'}`}>
                      <span className="text-graphite-500 block text-[10px]">Precio del Servicio:</span>
                      <span className="text-sm font-mono font-bold text-rose-gold-900">
                        ${Number(current.mobileData?.price || 0).toLocaleString('es-AR')}
                      </span>
                    </div>
                    <div className={`p-2 rounded-xl border ${isDiff('name') ? 'bg-amber-100/80 border-amber-400 font-semibold text-amber-950' : 'bg-white border-rose-gold-100'}`}>
                      <span className="text-graphite-500 block text-[10px]">Nombre:</span>
                      <span>{current.mobileData?.name}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            <button
              onClick={() => handleResolve('use_mobile')}
              disabled={isResolving}
              className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-rose-gold-600 to-rose-gold-700 hover:from-rose-gold-700 hover:to-rose-gold-800 text-white font-bold text-xs shadow-soft transition-all flex items-center justify-center gap-1.5 active:scale-[0.98]"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Aceptar y Aplicar Cambio del Móvil</span>
            </button>
          </div>

          {/* Columna 2: Versión Computadora (Servidor) */}
          <div className="p-4 rounded-2xl border-2 border-sky-300 bg-sky-50/50 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center gap-2 pb-2 border-b border-sky-200 text-sky-800 font-bold">
                <Monitor className="w-4 h-4" />
                <span className="text-xs">Registrado en la Computadora</span>
              </div>
              <p className="text-[10px] text-graphite-500 mt-1">
                Editado: {formatDateTime(current.serverData?.updated_at || current.serverData?.created_at)}
              </p>

              {/* Campos dinámicos según entidad */}
              <div className="space-y-2 mt-3 text-[11px]">
                {current.entity === 'appointment' && (
                  <>
                    <div className={`p-2 rounded-xl border ${isDiff('start_time') ? 'bg-amber-100/80 border-amber-400 font-semibold text-amber-950' : 'bg-white border-sky-100'}`}>
                      <span className="text-graphite-500 block text-[10px]">Horario:</span>
                      <span>{formatDateTime(current.serverData?.start_time)}</span>
                    </div>
                    <div className={`p-2 rounded-xl border ${isDiff('status') ? 'bg-amber-100/80 border-amber-400 font-semibold text-amber-950' : 'bg-white border-sky-100'}`}>
                      <span className="text-graphite-500 block text-[10px]">Estado:</span>
                      <span className="capitalize">{current.serverData?.status || 'Agendado'}</span>
                    </div>
                    <div className={`p-2 rounded-xl border ${isDiff('service_price') ? 'bg-amber-100/80 border-amber-400 font-semibold text-amber-950' : 'bg-white border-sky-100'}`}>
                      <span className="text-graphite-500 block text-[10px]">Precio del Servicio:</span>
                      <span>${Number(current.serverData?.service_price || 0).toLocaleString('es-AR')}</span>
                    </div>
                    <div className={`p-2 rounded-xl border ${isDiff('notes') ? 'bg-amber-100/80 border-amber-400 font-semibold text-amber-950' : 'bg-white border-sky-100'}`}>
                      <span className="text-graphite-500 block text-[10px]">Observaciones:</span>
                      <span className="italic">{current.serverData?.notes || '(Sin notas)'}</span>
                    </div>
                  </>
                )}

                {current.entity === 'client' && (
                  <>
                    <div className={`p-2 rounded-xl border ${isDiff('first_name') || isDiff('last_name') ? 'bg-amber-100/80 border-amber-400 font-semibold text-amber-950' : 'bg-white border-sky-100'}`}>
                      <span className="text-graphite-500 block text-[10px]">Nombre y Apellido:</span>
                      <span>{current.serverData?.first_name} {current.serverData?.last_name}</span>
                    </div>
                    <div className={`p-2 rounded-xl border ${isDiff('phone') ? 'bg-amber-100/80 border-amber-400 font-semibold text-amber-950' : 'bg-white border-sky-100'}`}>
                      <span className="text-graphite-500 block text-[10px]">Teléfono:</span>
                      <span>{current.serverData?.phone || '(Sin teléfono)'}</span>
                    </div>
                    <div className={`p-2 rounded-xl border ${isDiff('email') ? 'bg-amber-100/80 border-amber-400 font-semibold text-amber-950' : 'bg-white border-sky-100'}`}>
                      <span className="text-graphite-500 block text-[10px]">Email:</span>
                      <span>{current.serverData?.email || '(Sin email)'}</span>
                    </div>
                  </>
                )}

                {(current.entity === 'sub_treatment' || current.entity === 'price') && (
                  <>
                    <div className={`p-2 rounded-xl border ${isDiff('price') ? 'bg-amber-100/80 border-amber-400 font-semibold text-amber-950' : 'bg-white border-sky-100'}`}>
                      <span className="text-graphite-500 block text-[10px]">Precio del Servicio:</span>
                      <span className="text-sm font-mono font-bold text-sky-900">
                        ${Number(current.serverData?.price || 0).toLocaleString('es-AR')}
                      </span>
                    </div>
                    <div className={`p-2 rounded-xl border ${isDiff('name') ? 'bg-amber-100/80 border-amber-400 font-semibold text-amber-950' : 'bg-white border-sky-100'}`}>
                      <span className="text-graphite-500 block text-[10px]">Nombre:</span>
                      <span>{current.serverData?.name}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            <button
              onClick={() => handleResolve('use_server')}
              disabled={isResolving}
              className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-sky-600 to-sky-700 hover:from-sky-700 hover:to-sky-800 text-white font-bold text-xs shadow-soft transition-all flex items-center justify-center gap-1.5 active:scale-[0.98]"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Conservar Datos de la Computadora</span>
            </button>
          </div>
        </div>

        {/* Footer info */}
        <div className="p-3.5 bg-silk-100/80 border-t border-rose-gold-200/60 flex items-center justify-between text-[11px] text-graphite-500">
          <span>* La opción elegida en este servidor se guardará en SQLite y se transmitirá a la app móvil automáticamente.</span>
        </div>
      </div>
    </div>,
    document.body
  );
};
