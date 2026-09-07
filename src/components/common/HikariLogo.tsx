import React from 'react';

interface HikariLogoProps {
  size?: number;
  variant?: 'icon' | 'full' | 'horizontal';
  className?: string;
  showText?: boolean;
}

export const HikariLogo: React.FC<HikariLogoProps> = ({
  size = 64,
  variant = 'icon',
  className = '',
  showText = false,
}) => {
  // SVG del Monograma 'H' con Flor de Loto central en Oro Rosado / Cobre
  const renderEmblem = (emblemSize: number) => (
    <svg
      width={emblemSize}
      height={emblemSize}
      viewBox="0 0 160 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0 drop-shadow-sm"
    >
      <defs>
        {/* Gradiente metálico oro rosado / cobre brillante */}
        <linearGradient id="hikariCopperLight" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F5DFD0" />
          <stop offset="35%" stopColor="#D9A88F" />
          <stop offset="70%" stopColor="#BA7B5D" />
          <stop offset="100%" stopColor="#8A4E36" />
        </linearGradient>

        <linearGradient id="hikariGoldAccent" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#8A4E36" />
          <stop offset="50%" stopColor="#C99073" />
          <stop offset="100%" stopColor="#F5DFD0" />
        </linearGradient>

        {/* Resplandor suave */}
        <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#BA7B5D" floodOpacity="0.25" />
        </filter>
      </defs>

      <g filter="url(#softGlow)">
        {/* ======================================================== */}
        {/* COLUMNA IZQUIERDA DEL 'H' (Con serifas romanas clásicas) */}
        {/* ======================================================== */}
        {/* Serifa superior izquierda */}
        <path
          d="M 28 26 L 60 26 C 54 30 50 34 50 42 L 50 118 C 50 126 54 130 60 134 L 28 134 C 34 130 38 126 38 118 L 38 42 C 38 34 34 30 28 26 Z"
          fill="url(#hikariCopperLight)"
        />

        {/* ======================================================== */}
        {/* COLUMNA DERECHA DEL 'H' (Con serifas romanas clásicas)  */}
        {/* ======================================================== */}
        <path
          d="M 100 26 L 132 26 C 126 30 122 34 122 42 L 122 118 C 122 126 126 130 132 134 L 100 134 C 106 130 110 126 110 118 L 110 42 C 110 34 106 30 100 26 Z"
          fill="url(#hikariCopperLight)"
        />

        {/* ======================================================== */}
        {/* TRAVESAÑO CENTRAL DEL 'H'                                */}
        {/* ======================================================== */}
        <path
          d="M 50 76 L 110 76 L 110 84 L 50 84 Z"
          fill="url(#hikariGoldAccent)"
        />

        {/* ======================================================== */}
        {/* FLOR DE LOTO / BROTE CENTRAL (3 Pétalos elegantes)      */}
        {/* ======================================================== */}
        {/* Pétalo Central Vertical (Elíptico en punta) */}
        <path
          d="M 80 44 C 85 54 85 68 80 78 C 75 68 75 54 80 44 Z"
          fill="url(#hikariCopperLight)"
        />

        {/* Pétalo Izquierdo Curvo */}
        <path
          d="M 77 77 C 72 73 60 67 65 54 C 71 58 75 67 77 77 Z"
          fill="url(#hikariGoldAccent)"
        />

        {/* Pétalo Derecho Curvo */}
        <path
          d="M 83 77 C 88 73 100 67 95 54 C 89 58 85 67 83 77 Z"
          fill="url(#hikariGoldAccent)"
        />

        {/* Base central del brote */}
        <circle cx="80" cy="79" r="2.5" fill="#F5DFD0" />
      </g>
    </svg>
  );

  if (variant === 'icon') {
    return <div className={`inline-flex items-center justify-center ${className}`}>{renderEmblem(size)}</div>;
  }

  if (variant === 'horizontal') {
    return (
      <div className={`inline-flex items-center gap-3 ${className}`}>
        {renderEmblem(size)}
        <div className="flex flex-col">
          <span
            className="font-serif font-bold text-graphite-900 tracking-[0.22em] text-base leading-tight uppercase"
            style={{ fontFamily: "'Cinzel', 'Playfair Display', serif" }}
          >
            HIKARI
          </span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="h-[1px] w-3 bg-rose-gold-400 opacity-70"></span>
            <span className="text-[9px] font-semibold tracking-[0.3em] text-rose-gold-700 uppercase">
              SUITE
            </span>
            <span className="h-[1px] w-3 bg-rose-gold-400 opacity-70"></span>
          </div>
        </div>
      </div>
    );
  }

  // Variant 'full' (Vertical con logo grande y tipografía espaciada idéntica a la imagen de referencia)
  return (
    <div className={`flex flex-col items-center justify-center text-center ${className}`}>
      {renderEmblem(size)}
      <div className="mt-4 flex flex-col items-center">
        <h1
          className="font-serif font-bold text-graphite-900 tracking-[0.28em] text-2xl sm:text-3xl leading-none uppercase"
          style={{ fontFamily: "'Cinzel', 'Playfair Display', serif" }}
        >
          HIKARI
        </h1>
        <div className="flex items-center gap-3 mt-2">
          <span className="h-[1px] w-8 sm:w-12 bg-gradient-to-r from-transparent via-rose-gold-400 to-rose-gold-500"></span>
          <span className="text-[11px] sm:text-xs font-semibold tracking-[0.35em] text-rose-gold-800 uppercase">
            SUITE
          </span>
          <span className="h-[1px] w-8 sm:w-12 bg-gradient-to-l from-transparent via-rose-gold-400 to-rose-gold-500"></span>
        </div>
      </div>
    </div>
  );
};
