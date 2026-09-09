import React from 'react';
import { useApp } from '../../context/AppContext';
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
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <header className="h-16 bg-white/80 backdrop-blur-md border-b border-rose-gold-200/50 px-6 flex items-center justify-between shadow-soft shrink-0">
      {/* Date Navigation for Agenda */}
      <div className="flex items-center gap-3">
        <div className="flex items-center bg-silk-100 p-1 rounded-2xl border border-rose-gold-200/60 shadow-inner">
          <button
            onClick={() => changeDay(-1)}
            title="Día anterior"
            className="p-1.5 rounded-xl hover:bg-white text-graphite-600 hover:text-graphite-900 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          <button
            onClick={setToday}
            className="px-3 py-1 text-xs font-semibold text-rose-gold-800 hover:bg-white rounded-xl transition-colors"
          >
            Hoy
          </button>

          <button
            onClick={() => changeDay(1)}
            title="Día siguiente"
            className="p-1.5 rounded-xl hover:bg-white text-graphite-600 hover:text-graphite-900 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Date Display */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-rose-blush-50 rounded-2xl border border-rose-blush-200 text-graphite-800 text-xs font-medium">
          <CalendarIcon className="w-4 h-4 text-rose-gold-500" />
          <span className="capitalize font-semibold">{formattedDate}</span>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="opacity-0 w-4 h-4 absolute cursor-pointer"
          />
        </div>
      </div>

      {/* Right Action Bar */}
      <div className="flex items-center gap-3">
        {/* Cash Shift Status */}
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-2xl text-xs font-medium border ${
            activeShift && activeShift.status === 'open'
              ? 'bg-sage-50 text-sage-700 border-sage-200'
              : 'bg-amber-50 text-amber-700 border-amber-200'
          }`}
        >
          <DollarSign className="w-3.5 h-3.5" />
          <span>
            {activeShift && activeShift.status === 'open'
              ? `Caja Abierta ($${activeShift.expected_cash?.toLocaleString('es-AR')})`
              : 'Caja Cerrada'}
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

        {/* Mobile App Sync & QR Button */}
        <button
          onClick={() => setIsMobileQrModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs bg-rose-blush-50 hover:bg-rose-blush-100 text-rose-gold-800 border border-rose-gold-200 transition-all duration-150 font-medium shadow-sm hover:scale-[1.02]"
          title="Descargar/Vincular App Móvil iPhone y Android con sincronización offline"
        >
          <QrCode className="w-3.5 h-3.5 text-rose-gold-600" />
          <span className="font-semibold hidden sm:inline">📲 App Móvil</span>
          <span className="text-[10px] bg-rose-gold-500 text-white px-1.5 py-0.2 rounded-full font-bold">Offline</span>
        </button>

        {/* New Appointment Primary Button */}
        <button
          onClick={() => setIsNewAppointmentOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-gradient-to-r from-rose-gold-500 to-rose-gold-600 hover:from-rose-gold-600 hover:to-rose-gold-700 text-white text-xs font-semibold shadow-soft hover:shadow-soft-md transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Turno</span>
        </button>
      </div>
    </header>
  );
};
