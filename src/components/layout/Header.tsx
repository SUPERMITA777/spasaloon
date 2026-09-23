import React from 'react';
import { useApp } from '../../context/AppContext';
import { HikariLogo } from '../common/HikariLogo';
import { APP_NAME } from '../../version';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  DollarSign,
  Search,
  Sparkles,
  Wifi,
  Smartphone,
  QrCode,
  AlertTriangle,
} from 'lucide-react';

export const Header: React.FC = () => {
  const {
    selectedDate,
    setSelectedDate,
    setIsNewAppointmentOpen,
    activeShift,
    networkInfo,
    setIsStaffQrModalOpen,
    setIsMobileQrModalOpen,
    conflicts,
    setIsConflictModalOpen,
    isRealtimeConnected,
  } = useApp();

  // Cambiar fecha
  const changeDay = (offset: number) => {
    const d = new Date(selectedDate + 'T00:00:00');
    d.setDate(d.getDate() + offset);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const setToday = () => {
    setSelectedDate(new Date().toISOString().split('T')[0]);
  };

  const formattedDate = new Date(selectedDate + 'T00:00:00').toLocaleDateString('es-AR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

  const formattedDateFull = new Date(selectedDate + 'T00:00:00').toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <header className="h-12 sm:h-14 lg:h-16 bg-white/90 backdrop-blur-md border-b border-rose-gold-200/50 px-2 sm:px-4 lg:px-6 flex items-center justify-between shadow-soft shrink-0 z-30">
      {/* Left: Mobile Brand & Date Navigation */}
      <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
        {/* Monograma en Móvil (reemplaza al sidebar en pantallas pequeñas) */}
        <div className="flex items-center gap-1.5 lg:hidden shrink-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-silk-100 to-rose-gold-100 border border-rose-gold-200/80 flex items-center justify-center shadow-2xs">
            <HikariLogo size={22} variant="icon" />
          </div>
          <div className="hidden xs:flex flex-col">
            <span className="font-serif font-bold text-[11px] text-graphite-900 leading-tight">
              {APP_NAME}
            </span>
            <span className="flex items-center gap-1 text-[9px] font-semibold text-graphite-500">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isRealtimeConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                }`}
              />
              {isRealtimeConnected ? 'En Vivo' : 'Offline'}
            </span>
          </div>
        </div>

        {/* Date Navigation for Agenda */}
        <div className="flex items-center bg-silk-100 p-0.5 sm:p-1 rounded-xl sm:rounded-2xl border border-rose-gold-200/60 shadow-inner">
          <button
            onClick={() => changeDay(-1)}
            title="Día anterior"
            className="p-1 sm:p-1.5 rounded-lg sm:rounded-xl hover:bg-white text-graphite-600 hover:text-graphite-900 transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
          
          <button
            onClick={setToday}
            className="px-2 sm:px-3 py-0.5 sm:py-1 text-[11px] sm:text-xs font-semibold text-rose-gold-800 hover:bg-white rounded-lg sm:rounded-xl transition-colors"
          >
            Hoy
          </button>

          <button
            onClick={() => changeDay(1)}
            title="Día siguiente"
            className="p-1 sm:p-1.5 rounded-lg sm:rounded-xl hover:bg-white text-graphite-600 hover:text-graphite-900 transition-colors"
          >
            <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>

        {/* Date Display */}
        <div className="relative flex items-center gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 bg-rose-blush-50 rounded-xl sm:rounded-2xl border border-rose-blush-200 text-graphite-800 text-[11px] sm:text-xs font-medium cursor-pointer">
          <CalendarIcon className="w-3.5 h-3.5 text-rose-gold-500 shrink-0" />
          <span className="capitalize font-semibold hidden md:inline">{formattedDateFull}</span>
          <span className="capitalize font-semibold md:hidden">{formattedDate}</span>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="opacity-0 inset-0 absolute cursor-pointer w-full h-full"
          />
        </div>
      </div>

      {/* Right Action Bar */}
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        {/* Cash Shift Status (Compacto en móvil) */}
        <div
          className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl sm:rounded-2xl text-[11px] sm:text-xs font-medium border ${
            activeShift && activeShift.status === 'open'
              ? 'bg-sage-50 text-sage-700 border-sage-200'
              : 'bg-amber-50 text-amber-700 border-amber-200'
          }`}
          title={activeShift && activeShift.status === 'open' ? 'Caja Abierta' : 'Caja Cerrada'}
        >
          <DollarSign className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          <span className="hidden sm:inline">
            {activeShift && activeShift.status === 'open'
              ? `Caja ($${activeShift.expected_cash?.toLocaleString('es-AR')})`
              : 'Caja Cerrada'}
          </span>
          <span className="sm:hidden font-bold">
            {activeShift && activeShift.status === 'open' ? 'Abierta' : 'Cerrada'}
          </span>
        </div>

        {/* Network / Mobile QR Badge */}
        {networkInfo && (
          <button
            onClick={() => setIsStaffQrModalOpen(true)}
            className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs bg-rose-gold-50 text-rose-gold-700 border border-rose-gold-200 hover:bg-rose-gold-100 transition-colors"
            title="Ver portal de turnos para el personal"
          >
            <Smartphone className="w-3.5 h-3.5 text-rose-gold-600" />
            <span className="font-semibold">Portal Personal</span>
          </button>
        )}

        {/* Discrepancies Resolution Badge / Button */}
        {conflicts.length > 0 && (
          <button
            onClick={() => setIsConflictModalOpen(true)}
            className="flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl sm:rounded-2xl text-[10px] sm:text-xs bg-amber-500 hover:bg-amber-600 text-white border border-amber-600 transition-all font-bold shadow-xs animate-pulse"
            title={`${conflicts.length} discrepancias pendientes`}
          >
            <AlertTriangle className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span>{conflicts.length}</span>
          </button>
        )}

        {/* Mobile App Sync & QR Button (Visible en tablet y desktop) */}
        <button
          onClick={() => setIsMobileQrModalOpen(true)}
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs bg-rose-blush-50 hover:bg-rose-blush-100 text-rose-gold-800 border border-rose-gold-200 transition-all font-medium shadow-2xs"
          title="Descargar/Vincular App Móvil iPhone y Android"
        >
          <QrCode className="w-3.5 h-3.5 text-rose-gold-600" />
          <span className="font-semibold hidden lg:inline">📲 App Móvil</span>
          <span className="text-[10px] bg-rose-gold-500 text-white px-1.5 py-0.2 rounded-full font-bold">QR</span>
        </button>

        {/* New Appointment Primary Button (Alta prioridad en iPhone) */}
        <button
          onClick={() => setIsNewAppointmentOpen(true)}
          className="flex items-center gap-1 sm:gap-2 px-2.5 sm:px-4 py-1 sm:py-2 rounded-xl sm:rounded-2xl bg-gradient-to-r from-rose-gold-500 to-rose-gold-600 hover:from-rose-gold-600 hover:to-rose-gold-700 text-white text-[11px] sm:text-xs font-bold shadow-soft hover:shadow-soft-md transition-all active:scale-95"
        >
          <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span className="hidden sm:inline">Nuevo Turno</span>
          <span className="sm:hidden">Turno</span>
        </button>
      </div>
    </header>
  );
};
