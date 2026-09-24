import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Smartphone,
  Download,
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Cloud,
  ChevronRight,
  Layers,
  ArrowRight,
  Info,
} from 'lucide-react';
import { HikariLogo } from '../common/HikariLogo';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  customProfileUrl?: string | null;
  customQrDataUrl?: string | null;
  salonName?: string;
}

export const IosInstallGuideModal: React.FC<Props> = ({
  isOpen,
  onClose,
  customProfileUrl,
  customQrDataUrl,
  salonName,
}) => {
  const [profileUrl, setProfileUrl] = useState<string>(customProfileUrl || '/api/sync/ios-profile');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(customQrDataUrl || null);
  const [targetSalon, setTargetSalon] = useState<string>(salonName || 'Mi Salón Hikari');
  const [activeStep, setActiveStep] = useState<number>(1);
  const [copied, setCopied] = useState<boolean>(false);
  const [isIosDevice, setIsIosDevice] = useState<boolean>(false);

  useEffect(() => {
    // Detectar si el usuario está abriendo esto directamente desde un iPhone/iPad
    if (typeof window !== 'undefined') {
      const ua = window.navigator.userAgent || '';
      const isIos = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
      setIsIosDevice(isIos);
    }
  }, []);

  useEffect(() => {
    if (isOpen && (!customQrDataUrl || !customProfileUrl)) {
      fetch('/api/sync/mobile-app-info')
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            if (data.iosProfile?.profileUrl) {
              setProfileUrl(data.iosProfile.profileUrl);
            }
            if (data.iosProfile?.qrCodeDataUrl) {
              setQrCodeDataUrl(data.iosProfile.qrCodeDataUrl);
            }
            if (data.turso?.salonName) {
              setTargetSalon(data.turso.salonName);
            }
          }
        })
        .catch((err) => console.error('Error cargando info de perfil iOS:', err));
    }
  }, [isOpen, customProfileUrl, customQrDataUrl]);

  const handleCopyLink = () => {
    if (profileUrl) {
      navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100000] bg-graphite-950/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-white rounded-t-3xl sm:rounded-3xl max-w-xl w-full shadow-2xl border-t sm:border border-rose-gold-300 overflow-hidden animate-scale-up flex flex-col my-0 sm:my-4 text-xs relative z-10 max-h-[96vh] sm:max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera de Lujo Hikari Suite */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-rose-gold-800 via-rose-gold-700 to-graphite-900 text-white shrink-0 relative overflow-hidden">
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
          <div className="w-12 h-1 bg-white/30 rounded-full mx-auto mb-2 sm:hidden" />
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 sm:p-2.5 rounded-2xl bg-white/20 backdrop-blur-md shadow-inner border border-white/20">
                <HikariLogo size={26} variant="icon" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-serif font-bold text-sm sm:text-base tracking-wide text-white">
                    Instalación Nativa en iPhone
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-gradient-to-r from-amber-300 to-rose-gold-200 text-graphite-900 font-bold uppercase tracking-wider shadow-xs">
                    Camino 3
                  </span>
                </div>
                <p className="text-[11px] text-white/85 mt-0.5">
                  WebClip Autónomo Apple • Pantalla Completa • Memoria Eterna
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-white/20 text-white/80 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Contenido Desplazable */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto bg-silk-50/50">
          {/* Banner de Auto-vinculación a Turso Cloud */}
          <div className="p-3 bg-gradient-to-r from-rose-blush-50 to-silk-100 rounded-2xl border border-rose-gold-200 flex items-start gap-2.5 shadow-2xs">
            <div className="p-1.5 rounded-xl bg-rose-gold-500/10 text-rose-gold-700 shrink-0 mt-0.5">
              <Cloud className="w-4 h-4" />
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-graphite-900 text-[11px]">
                  Vinculación Automática a Base de Datos: <strong className="text-rose-gold-900">{targetSalon}</strong>
                </span>
                <span className="text-[9px] bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.2 rounded-full font-bold">
                  NUNCA MÁS PEDIRÁ QR
                </span>
              </div>
              <p className="text-[10px] text-graphite-600 leading-relaxed">
                Este perfil de configuración WebClip inyecta de forma permanente el enlace de tu salón. La app se abrirá directamente a pantalla completa sin barras de navegador Safari.
              </p>
            </div>
          </div>

          {/* Tarjeta de Código QR o Botón de Descarga si está en iPhone */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-rose-gold-200/90 shadow-soft flex flex-col items-center text-center space-y-3">
            <div className="flex items-center gap-1.5 text-rose-gold-800 font-bold uppercase tracking-wider text-[11px]">
              <Smartphone className="w-4 h-4 text-rose-gold-600" />
              <span>
                {isIosDevice
                  ? 'Toca para Descargar el Perfil en este iPhone'
                  : 'Escanea con la Cámara de tu iPhone'}
              </span>
            </div>

            {/* QR Code */}
            {qrCodeDataUrl ? (
              <div className="p-2.5 bg-white rounded-2xl border-2 border-rose-gold-300 shadow-md transition-transform hover:scale-[1.02]">
                <img
                  src={qrCodeDataUrl}
                  alt="QR Instalación iOS Hikari Suite"
                  className="w-44 h-44 sm:w-48 sm:h-48 object-contain rounded-lg"
                />
              </div>
            ) : (
              <div className="w-44 h-44 flex items-center justify-center bg-silk-100 rounded-2xl border border-rose-gold-200">
                <span className="text-graphite-500 text-xs">Cargando código QR...</span>
              </div>
            )}

            <p className="text-[11px] text-graphite-600 max-w-sm leading-snug">
              Abre la <strong>Cámara de tu iPhone</strong>, enfoca el código QR y pulsa en la notificación amarilla para abrir en <strong>Safari</strong>.
            </p>

            {/* Botón de Descarga Directa e Interacción */}
            <div className="flex flex-wrap items-center justify-center gap-2 w-full pt-1">
              <a
                href={profileUrl}
                className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-rose-gold-600 to-rose-gold-700 hover:from-rose-gold-700 hover:to-rose-gold-800 text-white font-bold text-xs shadow-soft flex items-center gap-2 transition-all active:scale-[0.98]"
              >
                <Download className="w-4 h-4" />
                <span>Descargar Perfil (.mobileconfig)</span>
              </a>

              <button
                type="button"
                onClick={handleCopyLink}
                className="py-2.5 px-3 rounded-xl bg-silk-100 hover:bg-silk-200 text-graphite-700 border border-rose-gold-200 font-bold text-xs flex items-center gap-1.5 transition-colors"
                title="Copiar enlace de descarga directa"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copiado' : 'Copiar Enlace'}</span>
              </button>

              <button
                type="button"
                onClick={() => window.open(profileUrl, '_blank')}
                className="p-2.5 rounded-xl bg-silk-100 hover:bg-silk-200 text-rose-gold-700 border border-rose-gold-200 transition-colors"
                title="Abrir en nueva pestaña"
              >
                <ExternalLink className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Guía Visual Interactiva de 3 Pasos */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between px-1">
              <h3 className="font-bold text-xs text-graphite-800 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-rose-gold-600" />
                <span>Guía Oficial Apple en 3 Pasos</span>
              </h3>
              <span className="text-[10px] text-graphite-500 font-medium">
                Toma solo 10 segundos
              </span>
            </div>

            {/* Pestañas de pasos */}
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-silk-200 rounded-xl border border-rose-gold-200">
              <button
                type="button"
                onClick={() => setActiveStep(1)}
                className={`py-1.5 rounded-lg font-bold text-[11px] transition-all flex items-center justify-center gap-1 ${
                  activeStep === 1
                    ? 'bg-white text-rose-gold-800 shadow-xs'
                    : 'text-graphite-600 hover:text-graphite-900'
                }`}
              >
                <span>1. Permitir</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveStep(2)}
                className={`py-1.5 rounded-lg font-bold text-[11px] transition-all flex items-center justify-center gap-1 ${
                  activeStep === 2
                    ? 'bg-white text-rose-gold-800 shadow-xs'
                    : 'text-graphite-600 hover:text-graphite-900'
                }`}
              >
                <span>2. Ajustes</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveStep(3)}
                className={`py-1.5 rounded-lg font-bold text-[11px] transition-all flex items-center justify-center gap-1 ${
                  activeStep === 3
                    ? 'bg-white text-rose-gold-800 shadow-xs'
                    : 'text-graphite-600 hover:text-graphite-900'
                }`}
              >
                <span>3. Instalar</span>
              </button>
            </div>

            {/* Tarjeta del Paso Seleccionado */}
            <div className="p-4 bg-white rounded-2xl border border-rose-gold-200 shadow-soft space-y-3">
              {activeStep === 1 && (
                <div className="space-y-3">
                  <div className="flex items-start gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-rose-gold-100 text-rose-gold-800 font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
                      1
                    </span>
                    <div>
                      <h4 className="font-bold text-graphite-900 text-xs">
                        Paso 1: Toca "Permitir" en el aviso de Safari
                      </h4>
                      <p className="text-[11px] text-graphite-600 mt-0.5 leading-relaxed">
                        Al descargar o escanear el QR, iOS Safari mostrará la ventana oficial de Apple para perfiles de configuración:
                      </p>
                    </div>
                  </div>

                  {/* Simulación visual de alerta de iOS */}
                  <div className="p-3.5 bg-graphite-900/5 rounded-xl border border-graphite-200/80 max-w-sm mx-auto text-center space-y-2">
                    <div className="text-[11px] font-bold text-graphite-900">
                      "Este sitio web está intentando descargar un perfil de configuración. ¿Deseas permitirlo?"
                    </div>
                    <div className="flex items-center justify-center gap-3 pt-1 border-t border-graphite-200">
                      <span className="text-[11px] text-graphite-400">Ignorar</span>
                      <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-lg border border-blue-200 shadow-xs">
                        Permitir ➔
                      </span>
                    </div>
                  </div>

                  <p className="text-[10px] text-graphite-500 italic text-center">
                    Toca <strong>Permitir</strong> y luego <strong>Cerrar</strong> cuando veas el mensaje "Perfil descargado".
                  </p>
                </div>
              )}

              {activeStep === 2 && (
                <div className="space-y-3">
                  <div className="flex items-start gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-rose-gold-100 text-rose-gold-800 font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
                      2
                    </span>
                    <div>
                      <h4 className="font-bold text-graphite-900 text-xs">
                        Paso 2: Abre la app "Ajustes" de tu iPhone
                      </h4>
                      <p className="text-[11px] text-graphite-600 mt-0.5 leading-relaxed">
                        Sal de Safari y abre la app <strong>Ajustes (⚙️)</strong> de tu iPhone. Verás arriba del todo una nueva opción destacada:
                      </p>
                    </div>
                  </div>

                  {/* Simulación visual de Ajustes de iOS */}
                  <div className="p-3 bg-silk-50 rounded-xl border border-rose-gold-200 max-w-sm mx-auto space-y-2 font-sans">
                    <div className="flex items-center gap-2 p-2 bg-white rounded-lg border border-silk-300">
                      <div className="w-8 h-8 rounded-full bg-graphite-200 flex items-center justify-center font-bold text-graphite-600 text-xs">
                        ID
                      </div>
                      <div className="text-[11px] font-semibold text-graphite-800 truncate">
                        Tu Nombre (Apple ID)
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-2.5 bg-gradient-to-r from-rose-gold-100 to-rose-blush-100 rounded-lg border-2 border-rose-gold-400 shadow-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-rose-gold-600 animate-pulse" />
                        <span className="font-bold text-graphite-900 text-xs">
                          Perfil descargado (Hikari Suite)
                        </span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-rose-gold-700" />
                    </div>
                  </div>

                  <p className="text-[10px] text-graphite-500 italic text-center">
                    Toca sobre <strong>"Perfil descargado"</strong> para abrir el asistente de instalación.
                  </p>
                </div>
              )}

              {activeStep === 3 && (
                <div className="space-y-3">
                  <div className="flex items-start gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-rose-gold-100 text-rose-gold-800 font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
                      3
                    </span>
                    <div>
                      <h4 className="font-bold text-graphite-900 text-xs">
                        Paso 3: Toca "Instalar" arriba a la derecha
                      </h4>
                      <p className="text-[11px] text-graphite-600 mt-0.5 leading-relaxed">
                        Pulsa en <strong>"Instalar"</strong>, ingresa tu código PIN de desbloqueo si te lo pide y confirma:
                      </p>
                    </div>
                  </div>

                  {/* Simulación visual de Instalación */}
                  <div className="p-3 bg-silk-50 rounded-xl border border-rose-gold-200 max-w-sm mx-auto space-y-2">
                    <div className="flex items-center justify-between pb-2 border-b border-silk-200">
                      <span className="text-[11px] text-graphite-500">Cancelar</span>
                      <span className="font-bold text-xs text-graphite-900">Instalar perfil</span>
                      <span className="font-bold text-xs text-rose-gold-700 bg-rose-gold-100 px-2 py-0.5 rounded-md">
                        Instalar
                      </span>
                    </div>

                    <div className="flex items-center gap-3 p-2 bg-white rounded-lg border border-silk-200">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-silk-100 to-rose-gold-100 border border-rose-gold-200 flex items-center justify-center shrink-0">
                        <HikariLogo size={22} variant="icon" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-xs text-graphite-900">Hikari Suite</div>
                        <div className="text-[10px] text-graphite-500">Acceso autónomo a pantalla completa</div>
                      </div>
                    </div>
                  </div>

                  <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 text-center text-[10px] text-emerald-800 font-semibold">
                    ✨ ¡LISTO! El ícono oficial aparecerá en tu pantalla de inicio y correrá como app nativa 24/7.
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Comparativa de Beneficios: Safari vs Camino 3 */}
          <div className="p-3.5 bg-silk-100/90 rounded-2xl border border-rose-gold-200/80 space-y-2">
            <h4 className="font-bold text-graphite-900 text-xs flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Por qué Camino 3 es la Solución Definitiva en iPhone</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] text-graphite-700">
              <div className="p-2 bg-white rounded-xl border border-rose-gold-100 space-y-0.5">
                <span className="font-bold text-rose-gold-900 block">✦ Pantalla Completa Real:</span>
                <p className="text-graphite-600">Oculta permanentemente las barras de navegación, pestañas y recargas accidentales de Safari.</p>
              </div>
              <div className="p-2 bg-white rounded-xl border border-rose-gold-100 space-y-0.5">
                <span className="font-bold text-rose-gold-900 block">✦ Persistencia de Nube:</span>
                <p className="text-graphite-600">Almacena el hash de tu salón de forma indeleble. Nunca se desvincula ni pide volver a configurar.</p>
              </div>
              <div className="p-2 bg-white rounded-xl border border-rose-gold-100 space-y-0.5">
                <span className="font-bold text-rose-gold-900 block">✦ Cero Bloqueos:</span>
                <p className="text-graphite-600">Elimina el rebote elástico indeseado de iOS (overscroll) y respeta la Dynamic Island y Notch.</p>
              </div>
              <div className="p-2 bg-white rounded-xl border border-rose-gold-100 space-y-0.5">
                <span className="font-bold text-rose-gold-900 block">✦ 100% Desinstalable:</span>
                <p className="text-graphite-600">Si alguna vez deseas quitarlo, puedes eliminar el ícono o el perfil en Ajustes &gt; General &gt; VPN.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-silk-100 border-t border-rose-gold-200/70 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-graphite-500">
            Hikari Suite • Arquitectura iOS Standalone
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-graphite-800 hover:bg-graphite-900 text-white font-semibold text-xs transition-colors"
          >
            Entendido / Cerrar
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
