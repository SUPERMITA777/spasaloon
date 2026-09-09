import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  Download,
  CheckCircle2,
  Share2,
  PlusSquare,
  Wifi,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  ExternalLink,
  HelpCircle,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { HikariLogo } from '../common/HikariLogo';
import { APP_VERSION, APP_NAME } from '../../version';

interface Props {
  onEnterApp: () => void;
}

export const MobileDownloadPortal: React.FC<Props> = ({ onEnterApp }) => {
  const [platform, setPlatform] = useState<'ios' | 'android' | 'other'>('android');
  const [serverStatus, setServerStatus] = useState<{
    online: boolean;
    localIp: string;
    port: number;
    latencyMs: number;
  } | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalling, setIsInstalling] = useState<boolean>(false);
  const [installSuccess, setInstallSuccess] = useState<boolean>(false);

  useEffect(() => {
    // Detección de plataforma
    const ua = navigator.userAgent || navigator.vendor || (window as any).opera || '';
    if (/iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream) {
      setPlatform('ios');
    } else if (/android/i.test(ua)) {
      setPlatform('android');
    } else {
      setPlatform('other');
    }

    // Comprobar estado de conexión con el servidor
    checkServerConnection();

    // Capturar evento beforeinstallprompt para Android
    const handlePrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handlePrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handlePrompt);
    };
  }, []);

  const checkServerConnection = async () => {
    const t0 = performance.now();
    try {
      const res = await fetch('/api/info', { cache: 'no-store' });
      const elapsed = Math.round(performance.now() - t0);
      if (res.ok) {
        const data = await res.json();
        setServerStatus({
          online: true,
          localIp: data.localIp || window.location.hostname,
          port: data.port || 3100,
          latencyMs: elapsed,
        });
      } else {
        setServerStatus({
          online: false,
          localIp: window.location.hostname,
          port: 3100,
          latencyMs: elapsed,
        });
      }
    } catch {
      setServerStatus({
        online: false,
        localIp: window.location.hostname,
        port: 3100,
        latencyMs: 999,
      });
    }
  };

  const handleInstallPwa = async () => {
    if (deferredPrompt) {
      setIsInstalling(true);
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      setIsInstalling(false);
      if (outcome === 'accepted') {
        setInstallSuccess(true);
      }
      setDeferredPrompt(null);
    } else {
      // Si el navegador no disparó el prompt automático, guiar al usuario
      alert('Para instalar en Android: pulsa los 3 puntos (⋮) de Chrome arriba a la derecha y selecciona "Instalar aplicación" o "Agregar a la pantalla principal".');
    }
  };

  return (
    <div className="min-h-screen w-full bg-silk-50 font-sans text-graphite-900 flex flex-col justify-between p-4 sm:p-6 max-w-lg mx-auto select-none">
      {/* Cabecera / Identidad */}
      <header className="flex flex-col items-center text-center pt-4 space-y-2">
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-silk-100 to-rose-gold-100 border-2 border-rose-gold-200/90 flex items-center justify-center shadow-soft">
          <HikariLogo size={42} variant="icon" />
        </div>
        <div>
          <span className="text-[10px] font-bold text-rose-gold-700 uppercase tracking-widest bg-rose-gold-100/80 px-2 py-0.5 rounded-full">
            PC Servidora Online • v{APP_VERSION}
          </span>
          <h1 className="font-serif font-bold text-xl text-graphite-900 mt-1">
            {APP_NAME} Mobile
          </h1>
          <p className="text-xs text-graphite-600">
            Descarga e instalación directa en tu teléfono celular
          </p>
        </div>
      </header>

      {/* Monitor de Conexión con la PC Servidora */}
      <div className="my-4 p-3 bg-white rounded-2xl border border-rose-gold-200/80 shadow-soft flex items-center justify-between text-xs">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-3 h-3 rounded-full ${
              serverStatus?.online ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
            }`}
          />
          <div>
            <div className="font-bold text-graphite-800 text-[11px]">
              PC Servidora: {serverStatus?.localIp}:{serverStatus?.port}
            </div>
            <div className="text-[10px] text-graphite-500">
              {serverStatus?.online
                ? `Enlace local directo (${serverStatus.latencyMs} ms) • Base de datos SQLite activa`
                : 'Conexión local o remota en caché'}
            </div>
          </div>
        </div>
        <button
          onClick={checkServerConnection}
          className="p-1.5 rounded-xl bg-silk-100 hover:bg-silk-200 text-graphite-600 transition-colors"
          title="Reverificar conexión"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Selector de Pestañas de Plataforma */}
      <div className="flex bg-silk-200 p-1 rounded-2xl border border-rose-gold-200 mb-4 shadow-inner text-xs">
        <button
          type="button"
          onClick={() => setPlatform('ios')}
          className={`flex-1 py-2 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 ${
            platform === 'ios'
              ? 'bg-white text-rose-gold-900 shadow-sm border border-rose-gold-200'
              : 'text-graphite-600 hover:text-graphite-900'
          }`}
        >
          <span>🍏 iPhone (iOS)</span>
        </button>
        <button
          type="button"
          onClick={() => setPlatform('android')}
          className={`flex-1 py-2 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 ${
            platform === 'android'
              ? 'bg-white text-rose-gold-900 shadow-sm border border-rose-gold-200'
              : 'text-graphite-600 hover:text-graphite-900'
          }`}
        >
          <span>🤖 Android</span>
        </button>
      </div>

      {/* Contenido según la Plataforma */}
      <div className="space-y-4 flex-1">
        {/* ========================================================= */}
        {/* SECCIÓN IPHONE (iOS)                                      */}
        {/* ========================================================= */}
        {platform === 'ios' && (
          <div className="space-y-3">
            {/* Opción A: Perfil de Configuración WebClip iOS (.mobileconfig) */}
            <div className="p-4 bg-white rounded-2xl border border-rose-gold-200 shadow-soft space-y-2.5">
              <div className="flex items-center gap-2 text-rose-gold-800 font-bold text-xs">
                <Download className="w-4 h-4 text-rose-gold-600" />
                <span>Opción 1: Descargar Perfil Autónomo iOS</span>
              </div>
              <p className="text-[11px] text-graphite-600 leading-relaxed">
                Descarga el perfil de configuración oficial para instalar la app con pantalla completa sin barras de Safari.
              </p>
              <a
                href="/api/sync/ios-profile"
                download="HikariSuite.mobileconfig"
                className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-rose-gold-600 to-rose-gold-700 hover:from-rose-gold-700 hover:to-rose-gold-800 text-white font-bold text-xs shadow-soft flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
              >
                <Download className="w-4 h-4" />
                <span>Descargar Perfil para iPhone (.mobileconfig)</span>
              </a>
              <p className="text-[10px] text-graphite-500 italic text-center">
                * Tras descargarlo: ve a <strong>Ajustes del iPhone</strong> &gt; <strong>Perfil descargado</strong> &gt; <strong>Instalar</strong>.
              </p>
            </div>

            {/* Opción B: Safari "Agregar a Inicio" */}
            <div className="p-4 bg-white rounded-2xl border border-rose-gold-200 shadow-soft space-y-2">
              <div className="flex items-center gap-2 text-rose-gold-800 font-bold text-xs">
                <Share2 className="w-4 h-4 text-rose-gold-600" />
                <span>Opción 2: Agregar a Inicio desde Safari</span>
              </div>
              <ol className="text-[11px] text-graphite-700 space-y-1.5 list-decimal list-inside leading-relaxed bg-silk-50 p-3 rounded-xl border border-rose-gold-100">
                <li>En la barra inferior de Safari, toca el botón <strong>Compartir (⎋)</strong>.</li>
                <li>Desplázate hacia abajo y pulsa <strong>"Agregar a Inicio" (➕)</strong>.</li>
                <li>Toca <strong>"Agregar"</strong> en la esquina superior derecha.</li>
              </ol>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* SECCIÓN ANDROID                                           */}
        {/* ========================================================= */}
        {platform === 'android' && (
          <div className="space-y-3">
            {/* Botón de Instalación Automática PWA / WebAPK */}
            <div className="p-4 bg-white rounded-2xl border border-rose-gold-200 shadow-soft space-y-2.5">
              <div className="flex items-center gap-2 text-rose-gold-800 font-bold text-xs">
                <Sparkles className="w-4 h-4 text-rose-gold-600" />
                <span>Instalador Directo para Android</span>
              </div>
              <p className="text-[11px] text-graphite-600 leading-relaxed">
                Instala Hikari Suite como aplicación nativa en tu teléfono Android con un solo toque.
              </p>

              {installSuccess ? (
                <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-bold text-center flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>¡Aplicación instalada con éxito en tu pantalla de inicio!</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleInstallPwa}
                  disabled={isInstalling}
                  className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-rose-gold-600 to-rose-gold-700 hover:from-rose-gold-700 hover:to-rose-gold-800 text-white font-bold text-xs shadow-soft flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                >
                  <Download className="w-4 h-4" />
                  <span>{isInstalling ? 'Instalando...' : 'Instalar Aplicación en Android'}</span>
                </button>
              )}

              {/* Descarga alternativa de APK */}
              <div className="pt-2 border-t border-silk-200 flex items-center justify-between text-[11px]">
                <span className="text-graphite-500">¿Prefieres paquete de instalación?</span>
                <a
                  href="/api/sync/android-apk"
                  download="HikariSuite.apk"
                  className="text-rose-gold-700 font-bold hover:underline flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Descargar APK</span>
                </a>
              </div>
            </div>

            {/* Guía para Google Chrome */}
            <div className="p-4 bg-white rounded-2xl border border-rose-gold-200 shadow-soft space-y-2">
              <div className="flex items-center gap-2 text-rose-gold-800 font-bold text-xs">
                <HelpCircle className="w-4 h-4 text-rose-gold-600" />
                <span>Si el botón no abre la instalación en Chrome:</span>
              </div>
              <ol className="text-[11px] text-graphite-700 space-y-1.5 list-decimal list-inside leading-relaxed bg-silk-50 p-3 rounded-xl border border-rose-gold-100">
                <li>Toca los <strong>3 puntos (⋮)</strong> arriba a la derecha en Chrome.</li>
                <li>Selecciona <strong>"Instalar aplicación"</strong> o <strong>"Agregar a pantalla principal"</strong>.</li>
                <li>Confirma pulsando <strong>"Instalar"</strong>.</li>
              </ol>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* CARACTERÍSTICAS INCLUIDAS                                 */}
        {/* ========================================================= */}
        <div className="p-3.5 bg-silk-100/90 rounded-2xl border border-rose-gold-200/80 space-y-1.5 text-[11px]">
          <div className="font-bold text-graphite-800 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-rose-gold-700" />
            <span>Suite Móvil Completa con Respaldo Offline</span>
          </div>
          <p className="text-graphite-600 leading-snug">
            Accede a todas las funciones: Agenda, Clientes, Fichas Corporal & Facial, Stock, Precios, Caja y Marketing con sincronización bidireccional automática.
          </p>
        </div>
      </div>

      {/* Botón Principal: Ingresar a la App Móvil */}
      <footer className="pt-4 mt-auto">
        <button
          type="button"
          onClick={onEnterApp}
          className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-graphite-800 to-graphite-900 hover:from-graphite-900 hover:to-black text-white font-bold text-xs shadow-md hover:shadow-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
        >
          <span>Abrir App Completa Ahora</span>
          <ArrowRight className="w-4 h-4" />
        </button>
        <p className="text-center text-[10px] text-graphite-400 mt-2">
          Hikari Suite • Conectado a la PC Servidora
        </p>
      </footer>
    </div>
  );
};
