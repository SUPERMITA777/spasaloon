import React, { useState, useEffect } from 'react';
import {
  X,
  QrCode,
  Smartphone,
  Copy,
  Check,
  ExternalLink,
  Wifi,
  CloudOff,
  RefreshCw,
  Apple,
} from 'lucide-react';
import { HikariLogo } from '../common/HikariLogo';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileQrModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [info, setInfo] = useState<{ mobileUrl: string; qrCodeDataUrl: string; localIp: string } | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [platformTab, setPlatformTab] = useState<'ios' | 'android'>('ios');

  useEffect(() => {
    if (isOpen) {
      loadInfo();
    }
  }, [isOpen]);

  const loadInfo = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/sync/mobile-app-info');
      const data = await res.json();
      if (data.success) {
        setInfo(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (info?.mobileUrl) {
      navigator.clipboard.writeText(info.mobileUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-60 bg-graphite-950/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-rose-gold-200 overflow-hidden animate-scale-up flex flex-col my-6 text-xs">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-rose-gold-600 via-rose-gold-500 to-rose-gold-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-white/20 backdrop-blur-md">
              <Smartphone className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-serif font-bold text-base">
                App Móvil para iPhone y Android
              </h2>
              <p className="text-[11px] text-white/90">
                Instalación mediante código QR & Sincronización Automática Offline
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5 overflow-y-auto max-h-[80vh] bg-silk-50/40">
          {/* Card Central QR */}
          <div className="bg-white p-5 rounded-3xl border border-rose-gold-200 shadow-soft flex flex-col items-center text-center space-y-3">
            <span className="text-[11px] font-bold text-rose-gold-800 uppercase tracking-wider">
              Escanea con la cámara de tu celular
            </span>

            {loading ? (
              <div className="w-64 h-64 flex flex-col items-center justify-center gap-2 bg-silk-100 rounded-2xl">
                <RefreshCw className="w-6 h-6 animate-spin text-rose-gold-500" />
                <span className="text-graphite-500 text-xs">Generando código QR seguro...</span>
              </div>
            ) : info?.qrCodeDataUrl ? (
              <div className="p-3 bg-white rounded-2xl border-2 border-rose-gold-300 shadow-md">
                <img
                  src={info.qrCodeDataUrl}
                  alt="QR Hikari Suite Móvil"
                  className="w-56 h-56 object-contain rounded-xl"
                />
              </div>
            ) : (
              <div className="p-8 text-rose-600 font-semibold">
                No se pudo obtener la IP local del servidor.
              </div>
            )}

            {/* Enlace y botón copiar */}
            <div className="w-full max-w-sm pt-1">
              <div className="flex items-center gap-1.5 p-1.5 bg-silk-100 rounded-xl border border-rose-gold-200">
                <input
                  type="text"
                  readOnly
                  value={info?.mobileUrl || 'Cargando...'}
                  className="flex-1 bg-transparent px-2 text-[11px] font-mono text-graphite-700 outline-none truncate"
                />
                <button
                  type="button"
                  onClick={handleCopy}
                  className="px-3 py-1.5 rounded-lg bg-white hover:bg-rose-gold-50 border border-rose-gold-200 text-rose-gold-800 font-bold text-[11px] transition-all flex items-center gap-1 shadow-xs"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? 'Copiado' : 'Copiar'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => window.open(info?.mobileUrl, '_blank')}
                  className="p-1.5 rounded-lg bg-rose-gold-600 hover:bg-rose-gold-700 text-white transition-colors"
                  title="Abrir en nueva pestaña"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Selector de Plataforma: iOS vs Android */}
          <div className="space-y-2">
            <div className="flex bg-silk-200 p-1 rounded-2xl border border-rose-gold-200/80">
              <button
                type="button"
                onClick={() => setPlatformTab('ios')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  platformTab === 'ios'
                    ? 'bg-white text-rose-gold-800 shadow-sm border border-rose-gold-200'
                    : 'text-graphite-600 hover:text-graphite-900'
                }`}
              >
                <span>🍏 iPhone / iPad (iOS)</span>
              </button>
              <button
                type="button"
                onClick={() => setPlatformTab('android')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  platformTab === 'android'
                    ? 'bg-white text-rose-gold-800 shadow-sm border border-rose-gold-200'
                    : 'text-graphite-600 hover:text-graphite-900'
                }`}
              >
                <span>🤖 Celulares Android</span>
              </button>
            </div>

            {/* Instrucciones Paso a Paso */}
            <div className="p-4 bg-white rounded-2xl border border-rose-gold-100 space-y-2.5">
              {platformTab === 'ios' ? (
                <ol className="space-y-2 text-graphite-700 list-decimal list-inside leading-relaxed text-[11px]">
                  <li>Apunta la <strong>Cámara de tu iPhone</strong> hacia el código QR de arriba.</li>
                  <li>Toca la notificación emergente para abrir el enlace en <strong>Safari</strong>.</li>
                  <li>En la barra inferior de Safari, toca el botón de <strong>Compartir</strong> (icono de cuadrado con flecha ⎋).</li>
                  <li>Desplázate hacia abajo y selecciona <strong>"Agregar a Inicio" (➕)</strong>.</li>
                  <li>¡Listo! La app se instalará en tu pantalla con su icono oficial de Hikari Suite.</li>
                </ol>
              ) : (
                <ol className="space-y-2 text-graphite-700 list-decimal list-inside leading-relaxed text-[11px]">
                  <li>Abre la <strong>Cámara</strong> o Google Lens y escanea el código QR de arriba.</li>
                  <li>Abre el enlace en tu navegador <strong>Google Chrome</strong>.</li>
                  <li>Pulsa sobre el aviso emergente <strong>"Instalar Hikari Suite"</strong> que aparecerá abajo.</li>
                  <li>Si no aparece automáticamente, toca los <strong>3 puntos (⋮)</strong> arriba a la derecha y selecciona <strong>"Instalar aplicación"</strong> o <strong>"Agregar a pantalla principal"</strong>.</li>
                  <li>¡Listo! La app quedará guardada como una aplicación nativa.</li>
                </ol>
              )}
            </div>
          </div>

          {/* Características de Modo Offline & Sincronización */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-start gap-2.5">
              <CloudOff className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-emerald-900 text-[11px]">Modo Offline Autónomo</h4>
                <p className="text-[10px] text-emerald-700 mt-0.5 leading-snug">
                  Si la computadora del centro se apaga o la conexión se interrumpe, la app sigue funcionando al 100% en tu teléfono guardando turnos y clientes.
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 flex items-start gap-2.5">
              <RefreshCw className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-amber-900 text-[11px]">Sincronización Inteligente</h4>
                <p className="text-[10px] text-amber-700 mt-0.5 leading-snug">
                  Al reconectarse el servidor, los datos se sincronizan automáticamente. Si hay modificaciones simultáneas, te consultará cuál versión conservar.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-silk-100 border-t border-rose-gold-200/70 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] text-graphite-500">
            <Wifi className="w-3.5 h-3.5 text-emerald-600" />
            <span>El celular debe estar conectado a la misma red Wi-Fi del local.</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-graphite-800 hover:bg-graphite-900 text-white font-semibold text-xs transition-colors"
          >
            Entendido / Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
