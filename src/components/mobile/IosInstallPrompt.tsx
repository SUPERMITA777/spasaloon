import React, { useState, useEffect } from 'react';
import {
  Download,
  Share2,
  X,
  CheckCircle2,
} from 'lucide-react';
import { HikariLogo } from '../common/HikariLogo';

export const IosInstallPrompt: React.FC = () => {
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [showSafariGuide, setShowSafariGuide] = useState<boolean>(false);

  useEffect(() => {
    // Verificar si es iOS
    const ua = window.navigator.userAgent || '';
    const isIos = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
    
    // Verificar si ya está en modo autónomo (app instalada)
    const isStandalone =
      (window.navigator as any).standalone === true ||
      window.matchMedia('(display-mode: standalone)').matches;

    // Verificar si el usuario ya lo cerró en esta sesión
    const isDismissed = sessionStorage.getItem('hikari_ios_install_dismissed');

    if (isIos && !isStandalone && !isDismissed) {
      // Mostrar con una suave animación tras 1.2 segundos de carga
      const timer = setTimeout(() => setIsVisible(true), 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem('hikari_ios_install_dismissed', 'true');
  };

  if (!isVisible) return null;

  return (
    <aside aria-label="Instalación en iPhone" className="fixed top-2 left-2 right-2 z-[9999] max-w-lg mx-auto animate-slide-down">
      <div className="bg-white/95 backdrop-blur-md rounded-2xl p-3 shadow-xl border border-rose-gold-300 text-xs text-graphite-900 relative">
        <button
          onClick={handleDismiss}
          className="absolute top-2.5 right-2.5 p-1 rounded-full text-graphite-400 hover:text-graphite-700 hover:bg-silk-100 transition-colors"
          title="Continuar en Safari"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-2.5 pr-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-silk-100 to-rose-gold-100 border border-rose-gold-200 flex items-center justify-center shrink-0 shadow-2xs">
            <HikariLogo size={24} variant="icon" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h4 className="font-serif font-bold text-graphite-900 text-xs truncate">
                Instalar Hikari Suite en iPhone
              </h4>
              <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-rose-gold-100 text-rose-gold-800 font-bold uppercase tracking-wider">
                App
              </span>
            </div>
            <p className="text-[11px] text-graphite-600 mt-0.5 leading-snug">
              Úsala en pantalla completa sin barras de Safari con acceso directo en tu inicio.
            </p>

            <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
              {/* Opción 1: Descargar perfil .mobileconfig (sin atributo download para disparo nativo en Safari) */}
              <a
                href="/api/sync/ios-profile"
                className="py-1.5 px-3 rounded-xl bg-gradient-to-r from-rose-gold-600 to-rose-gold-700 hover:from-rose-gold-700 hover:to-rose-gold-800 text-white font-bold text-[11px] shadow-2xs flex items-center gap-1.5 transition-transform active:scale-95"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Instalar Perfil (.mobileconfig)</span>
              </a>

              {/* Opción 2: Ver guía visual 3 pasos */}
              <button
                type="button"
                onClick={() => setShowSafariGuide(!showSafariGuide)}
                className="py-1.5 px-2.5 rounded-xl bg-silk-100 hover:bg-silk-200 text-graphite-700 font-bold text-[11px] border border-rose-gold-200 flex items-center gap-1 transition-colors"
              >
                <Share2 className="w-3 h-3 text-rose-gold-600" />
                <span>Guía de Instalación</span>
              </button>

              <button
                type="button"
                onClick={handleDismiss}
                className="py-1.5 px-2 text-[10px] text-graphite-500 hover:text-graphite-800 underline"
              >
                Continuar en Safari
              </button>
            </div>

            {/* Guía desplegable de Safari */}
            {showSafariGuide && (
              <div className="mt-2.5 p-2.5 bg-silk-50 rounded-xl border border-rose-gold-200/80 text-[10px] text-graphite-700 space-y-1 animate-fade-in">
                <div className="font-bold text-rose-gold-800 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>Cómo instalar desde Safari en 3 toques:</span>
                </div>
                <ol className="list-decimal list-inside space-y-1 pl-0.5 leading-relaxed">
                  <li>Toca el botón <strong>Compartir (⎋)</strong> en la barra inferior de Safari.</li>
                  <li>Baja en el menú y selecciona <strong>"Agregar a Inicio" (➕)</strong>.</li>
                  <li>Toca <strong>"Agregar"</strong> arriba a la derecha.</li>
                </ol>
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
};
