import React, { useState, useEffect } from 'react';
import { HikariLogo } from './HikariLogo';
import { APP_VERSION, APP_TAGLINE } from '../../version';
import { Sparkles, ArrowRight } from 'lucide-react';

interface SplashScreenProps {
  onComplete: () => void;
  minDurationMs?: number;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  onComplete,
  minDurationMs = 2400,
}) => {
  const [progress, setProgress] = useState(0);
  const [loadingStage, setLoadingStage] = useState('Iniciando sistema...');
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const currentProgress = Math.min(100, Math.round((elapsed / minDurationMs) * 100));
      setProgress(currentProgress);

      if (currentProgress < 25) {
        setLoadingStage('Iniciando módulos y servicios...');
      } else if (currentProgress < 55) {
        setLoadingStage('Verificando base de datos y agenda clínica...');
      } else if (currentProgress < 85) {
        setLoadingStage('Cargando catálogo, insumos y profesionales...');
      } else if (currentProgress < 100) {
        setLoadingStage('Preparando entorno de trabajo...');
      } else {
        setLoadingStage('¡Bienvenido!');
        clearInterval(interval);
        // Pequeño delay de 350ms en 100% para apreciar el éxito, luego fade out
        setTimeout(() => {
          setIsFadingOut(true);
          setTimeout(() => {
            onComplete();
          }, 450);
        }, 350);
      }
    }, 40);

    return () => clearInterval(interval);
  }, [minDurationMs, onComplete]);

  const handleSkip = () => {
    setIsFadingOut(true);
    setTimeout(onComplete, 250);
  };

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-between p-8 select-none transition-all duration-500 ${
        isFadingOut ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'
      }`}
      style={{
        background: 'radial-gradient(ellipse at 50% 30%, #FFFFFF 0%, #FAF5EE 50%, #F1E5D8 100%)',
      }}
    >
      {/* Destellos de luz sutiles de fondo (Aura / Caustics) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-40 blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(226,184,157,0.4) 0%, transparent 70%)' }}
        />
        <div
          className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full opacity-35 blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(186,123,93,0.3) 0%, transparent 70%)' }}
        />
      </div>

      {/* Espaciador superior */}
      <div className="w-full flex justify-end">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/70 border border-rose-gold-200/80 shadow-xs text-[11px] font-semibold tracking-wider text-rose-gold-800">
          <Sparkles className="w-3 h-3 text-rose-gold-500" />
          v{APP_VERSION}
        </span>
      </div>

      {/* Contenido Central: Logo Hikari + Título + Bienvenida */}
      <div className="relative z-10 flex flex-col items-center max-w-md w-full text-center space-y-6">
        {/* Monograma y Logotipo */}
        <div className="transform transition-transform duration-700 hover:scale-105">
          <HikariLogo size={110} variant="full" />
        </div>

        {/* Mensaje de Bienvenida y Tagline */}
        <div className="space-y-1.5 pt-2">
          <p className="font-serif text-lg sm:text-xl font-bold text-graphite-900 tracking-tight">
            Inicio de Sesión de Sistema
          </p>
          <p className="text-xs sm:text-sm text-graphite-600 font-medium">
            Bienvenido a <span className="text-rose-gold-800 font-semibold">Hikari Suite</span> — {APP_TAGLINE}
          </p>
        </div>

        {/* Barra de Progreso Lujosa inspirada en la imagen de referencia */}
        <div className="w-full max-w-xs space-y-2.5 pt-4">
          <div className="relative h-2.5 w-full bg-stone-200/80 rounded-full p-[2px] shadow-inner border border-rose-gold-200/60 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-100 ease-out relative overflow-hidden"
              style={{
                width: `${progress}%`,
                background: 'linear-gradient(90deg, #BA7B5D 0%, #D9A88F 50%, #8A4E36 100%)',
                boxShadow: '0 0 10px rgba(186, 123, 93, 0.4)',
              }}
            >
              {/* Brillo dinámico en la barra */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-pulse" />
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-graphite-500 px-1">
            <span className="font-medium animate-fade-in">{loadingStage}</span>
            <span className="font-mono font-bold text-rose-gold-800">{progress}%</span>
          </div>
        </div>
      </div>

      {/* Pie: Botón directo y copyright */}
      <div className="relative z-10 flex flex-col items-center space-y-3">
        <button
          onClick={handleSkip}
          className="flex items-center gap-1.5 text-xs text-graphite-500 hover:text-rose-gold-800 font-semibold transition-colors px-3 py-1.5 rounded-xl hover:bg-white/60"
        >
          <span>Ingresar directamente</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>

        <p className="text-[10px] text-graphite-400 font-medium tracking-wide">
          Hikari Suite • Gestión Profesional para Centros de Estética y Bienestar
        </p>
      </div>
    </div>
  );
};
