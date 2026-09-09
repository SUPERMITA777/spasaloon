import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  Globe,
  Radio,
  ShieldCheck,
  Zap,
  Download,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileQrModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [tunnelLoading, setTunnelLoading] = useState<boolean>(false);
  const [connectionMode, setConnectionMode] = useState<'local' | 'remote'>('local');
  const [platformTab, setPlatformTab] = useState<'ios' | 'android'>('ios');
  const [copied, setCopied] = useState<boolean>(false);

  const [info, setInfo] = useState<{
    localIp: string;
    port: number;
    mobileUrl: string;
    localMobileUrl: string;
    localQrCodeDataUrl: string;
    isTunnelActive: boolean;
    remoteMobileUrl: string | null;
    remoteQrCodeDataUrl: string | null;
    pendingConflictsCount?: number;
  } | null>(null);

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
        if (data.isTunnelActive) {
          setConnectionMode('remote');
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const toggleRemoteTunnel = async () => {
    try {
      setTunnelLoading(true);
      const res = await fetch('/api/sync/toggle-remote-tunnel', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        await loadInfo();
        if (data.isTunnelActive) {
          setConnectionMode('remote');
        }
      }
    } catch (e) {
      console.error('Error al conmutar túnel a distancia:', e);
    } finally {
      setTunnelLoading(false);
    }
  };

  const activeUrl =
    connectionMode === 'remote'
      ? info?.remoteMobileUrl || ''
      : info?.localMobileUrl || '';

  const activeQr =
    connectionMode === 'remote'
      ? info?.remoteQrCodeDataUrl
      : info?.localQrCodeDataUrl;

  const handleCopy = () => {
    if (activeUrl) {
      navigator.clipboard.writeText(activeUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] bg-graphite-950/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-rose-gold-200 overflow-hidden animate-scale-up flex flex-col my-4 text-xs relative z-10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-rose-gold-700 via-rose-gold-600 to-rose-gold-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-white/20 backdrop-blur-md shadow-inner">
              <Smartphone className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-serif font-bold text-base tracking-wide">
                  App Móvil Hikari Suite
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-white/20 font-mono font-bold tracking-wider uppercase">
                  Control Total
                </span>
              </div>
              <p className="text-[11px] text-white/90">
                Control a distancia (Citas, Clientes, Precios) y modo Offline
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

        <div className="p-5 space-y-4 overflow-y-auto max-h-[82vh] bg-silk-50/40">
          {/* Selector de Modo de Conexión: Mismo Wi-Fi vs Remoto por Internet */}
          <div className="p-1.5 bg-silk-200 rounded-2xl border border-rose-gold-200 flex gap-1 shadow-inner">
            <button
              type="button"
              onClick={() => setConnectionMode('local')}
              className={`flex-1 py-2.5 px-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 text-xs ${
                connectionMode === 'local'
                  ? 'bg-gradient-to-r from-rose-gold-600 to-rose-gold-700 text-white shadow-md'
                  : 'text-graphite-600 hover:text-graphite-900 hover:bg-white/60'
              }`}
            >
              <Wifi className="w-4 h-4 shrink-0" />
              <span>Mismo Wi-Fi Local (Recomendado)</span>
            </button>
            <button
              type="button"
              onClick={() => setConnectionMode('remote')}
              className={`flex-1 py-2.5 px-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 text-xs ${
                connectionMode === 'remote'
                  ? 'bg-gradient-to-r from-rose-gold-600 to-rose-gold-700 text-white shadow-md'
                  : 'text-graphite-600 hover:text-graphite-900 hover:bg-white/60'
              }`}
            >
              <Globe className="w-4 h-4 shrink-0" />
              <span>A Distancia (Internet / 4G / 5G)</span>
            </button>
          </div>

          {/* Banner explicativo del modo Wi-Fi Local */}
          {connectionMode === 'local' && (
            <div className="p-3 bg-silk-100 rounded-2xl border border-rose-gold-200 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <div>
                  <div className="font-bold text-graphite-800 text-[11px]">
                    Conexión Directa en Red Local
                  </div>
                  <p className="text-[10px] text-graphite-500">
                    Asegúrate de que tu celular esté conectado a la misma red Wi-Fi ({info?.localIp || 'Cargando IP...'}). No requiere internet exterior y abre de forma instantánea.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Banner de Estado del Túnel a Distancia Cloudflare */}
          {connectionMode === 'remote' && (
            <div className="p-3 bg-rose-blush-50 rounded-2xl border border-rose-blush-200 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-3 h-3 rounded-full shrink-0 ${
                    info?.isTunnelActive ? 'bg-emerald-500 animate-pulse' : 'bg-graphite-400'
                  }`}
                />
                <div>
                  <div className="font-bold text-graphite-800 text-[11px] flex items-center gap-1.5">
                    <span>Conexión Cloudflare HTTPS Directa</span>
                    {info?.isTunnelActive ? (
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-mono font-bold">
                        EN LÍNEA
                      </span>
                    ) : (
                      <span className="text-[10px] bg-graphite-200 text-graphite-700 px-1.5 py-0.2 rounded font-mono">
                        INACTIVO
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-graphite-500">
                    {info?.isTunnelActive
                      ? 'Túnel activo sin pantallas de bloqueo. Abre directamente en Safari y Chrome.'
                      : 'Activa la conexión remota para generar una dirección segura accesible desde 4G/5G.'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={toggleRemoteTunnel}
                disabled={tunnelLoading}
                className={`px-3 py-1.5 rounded-xl font-bold text-[11px] transition-all flex items-center gap-1.5 shadow-xs shrink-0 ${
                  info?.isTunnelActive
                    ? 'bg-rose-100 hover:bg-rose-200 text-rose-800'
                    : 'bg-rose-gold-600 hover:bg-rose-gold-700 text-white'
                }`}
              >
                {tunnelLoading ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Zap className="w-3.5 h-3.5" />
                )}
                <span>
                  {tunnelLoading
                    ? 'Conectando...'
                    : info?.isTunnelActive
                    ? 'Desactivar'
                    : 'Activar Túnel'}
                </span>
              </button>
            </div>
          )}

          {/* Tarjeta del Código QR Central */}
          <div className="bg-white p-5 rounded-3xl border border-rose-gold-200 shadow-soft flex flex-col items-center text-center space-y-3">
            <div className="flex items-center gap-1.5 text-rose-gold-800 font-bold uppercase tracking-wider text-[11px]">
              <QrCode className="w-4 h-4 text-rose-gold-600" />
              <span>
                {connectionMode === 'remote'
                  ? 'Escanea para Conectar a Distancia (4G / 5G)'
                  : 'Escanea conectado al Wi-Fi del Salón'}
              </span>
            </div>

            {loading || tunnelLoading ? (
              <div className="w-56 h-56 flex flex-col items-center justify-center gap-2 bg-silk-100 rounded-2xl border border-rose-gold-200">
                <RefreshCw className="w-7 h-7 animate-spin text-rose-gold-500" />
                <span className="text-graphite-600 text-xs font-medium">
                  {tunnelLoading ? 'Iniciando enlace Cloudflare...' : 'Generando QR...'}
                </span>
              </div>
            ) : connectionMode === 'remote' && !info?.isTunnelActive ? (
              <div className="w-64 h-64 p-5 flex flex-col items-center justify-center text-center gap-3 bg-silk-100/70 rounded-2xl border-2 border-dashed border-rose-gold-300">
                <Globe className="w-10 h-10 text-rose-gold-500/80" />
                <div>
                  <h4 className="font-bold text-graphite-800 text-xs">Túnel a Distancia Inactivo</h4>
                  <p className="text-[10px] text-graphite-500 mt-1 leading-relaxed">
                    Activa la conexión para generar un enlace HTTPS seguro de Cloudflare sin pantallas de verificación.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={toggleRemoteTunnel}
                  disabled={tunnelLoading}
                  className="mt-1 px-4 py-2 rounded-xl bg-gradient-to-r from-rose-gold-600 to-rose-gold-700 text-white font-bold text-xs shadow-md hover:from-rose-gold-700 hover:to-rose-gold-800 flex items-center gap-1.5 active:scale-95 transition-all"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Activar Conexión Cloudflare</span>
                </button>
              </div>
            ) : activeQr ? (
              <div className="p-3.5 bg-white rounded-2xl border-2 border-rose-gold-400/80 shadow-md">
                <img
                  src={activeQr}
                  alt="QR Hikari Suite Móvil"
                  className="w-52 h-52 object-contain rounded-lg"
                />
              </div>
            ) : (
              <div className="p-8 text-rose-600 font-semibold text-xs">
                No se pudo generar el código QR.
              </div>
            )}

            {/* Enlace y botón copiar */}
            {activeUrl && (
              <div className="w-full max-w-sm pt-1">
                <div className="flex items-center gap-1.5 p-1.5 bg-silk-100 rounded-xl border border-rose-gold-200">
                  <input
                    type="text"
                    readOnly
                    value={activeUrl}
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
                    onClick={() => window.open(activeUrl, '_blank')}
                    className="p-1.5 rounded-lg bg-rose-gold-600 hover:bg-rose-gold-700 text-white transition-colors"
                    title="Abrir en navegador"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Descargas directas desde la PC Servidora */}
                <div className="flex flex-wrap items-center justify-center gap-1.5 pt-2 border-t border-rose-gold-100">
                  <button
                    type="button"
                    onClick={() => window.open('/api/sync/android-apk', '_blank')}
                    className="px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] flex items-center gap-1 shadow-xs transition-colors"
                    title="Descargar paquete de instalación Android APK directamente desde esta PC"
                  >
                    <Download className="w-3 h-3" />
                    <span>Descargar APK Android</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => window.open('/api/sync/ios-profile', '_blank')}
                    className="px-2.5 py-1 rounded-xl bg-graphite-800 hover:bg-graphite-900 text-white font-bold text-[10px] flex items-center gap-1 shadow-xs transition-colors"
                    title="Descargar perfil de instalación de pantalla completa para iPhone (.mobileconfig)"
                  >
                    <Download className="w-3 h-3" />
                    <span>Perfil iOS (.mobileconfig)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => window.open('/mobile?install=1', '_blank')}
                    className="px-2.5 py-1 rounded-xl bg-rose-gold-100 hover:bg-rose-gold-200 text-rose-gold-800 border border-rose-gold-300 font-bold text-[10px] flex items-center gap-1 transition-colors"
                    title="Ver portal de descarga interactivo con instrucciones paso a paso"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>Portal de Descarga</span>
                  </button>
                </div>
              </div>
            )}
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
                <span>🍏 iPhone / iPad (Safari)</span>
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
                <span>🤖 Celulares Android (Chrome)</span>
              </button>
            </div>

            {/* Instrucciones Paso a Paso */}
            <div className="p-4 bg-white rounded-2xl border border-rose-gold-100 space-y-2 text-[11px]">
              {platformTab === 'ios' ? (
                <ol className="space-y-1.5 text-graphite-700 list-decimal list-inside leading-relaxed">
                  <li>Apunta la <strong>Cámara de tu iPhone</strong> hacia el código QR de arriba.</li>
                  <li>Toca el aviso emergente para abrir el enlace en <strong>Safari</strong> (abre directo, sin pantallas de bloqueo).</li>
                  <li>En la barra inferior de Safari, toca el botón de <strong>Compartir</strong> (icono de cuadrado con flecha ⎋).</li>
                  <li>Selecciona <strong>"Agregar a Inicio" (➕)</strong>.</li>
                  <li>¡Listo! La aplicación se instalará en tu pantalla con su icono oficial de Hikari Suite.</li>
                </ol>
              ) : (
                <ol className="space-y-1.5 text-graphite-700 list-decimal list-inside leading-relaxed">
                  <li>Abre la <strong>Cámara</strong> o Google Lens y escanea el código QR de arriba.</li>
                  <li>Abre el enlace en tu navegador <strong>Google Chrome</strong> (abre directo, sin verificaciones de IP).</li>
                  <li>Pulsa sobre el botón <strong>"Instalar Hikari Suite"</strong> que aparecerá en pantalla.</li>
                  <li>Si no aparece automáticamente, toca los <strong>3 puntos (⋮)</strong> arriba a la derecha y selecciona <strong>"Instalar aplicación"</strong> o <strong>"Agregar a pantalla principal"</strong>.</li>
                  <li>¡Listo! Podrás acceder a la app desde tu pantalla de inicio como una app nativa.</li>
                </ol>
              )}
            </div>
          </div>

          {/* Características de Control a Distancia */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="p-3 bg-emerald-50/80 rounded-2xl border border-emerald-200 flex items-start gap-2.5">
              <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-emerald-950 text-[11px]">Control Total & Precios</h4>
                <p className="text-[10px] text-emerald-800 mt-0.5 leading-snug">
                  Crea y modifica citas, clientes, tratamientos y actualiza los precios en vivo desde tu teléfono celular.
                </p>
              </div>
            </div>

            <div className="p-3 bg-rose-blush-50 rounded-2xl border border-rose-blush-200 flex items-start gap-2.5">
              <CloudOff className="w-5 h-5 text-rose-gold-700 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-rose-gold-950 text-[11px]">Modo Offline</h4>
                <p className="text-[10px] text-rose-gold-800 mt-0.5 leading-snug">
                  Si no hay internet, la app sigue funcionando con los últimos datos y se sincroniza automáticamente al reconectar.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-silk-100 border-t border-rose-gold-200/70 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] text-graphite-600">
            <Globe className="w-3.5 h-3.5 text-rose-gold-600" />
            <span>
              {connectionMode === 'remote'
                ? 'Modo a distancia: enlace seguro Cloudflare HTTPS para usar desde 4G/5G.'
                : 'Modo Wi-Fi Local: conexión directa al servidor en el salón sin usar internet.'}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-graphite-800 hover:bg-graphite-900 text-white font-semibold text-xs transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
