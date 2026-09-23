import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { Appointment, Box, Staff } from '../../types';
import { api } from '../../services/api';
import {
  Calendar as CalendarIcon,
  LayoutGrid,
  UserCheck,
  Clock,
  Sparkles,
  Plus,
  ShoppingCart,
  CheckCircle2,
  AlertCircle,
  GripVertical,
  RotateCcw,
  Phone,
  ChevronRight,
  List,
} from 'lucide-react';

const TIME_SLOTS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
  '17:00', '17:30', '18:00', '18:30', '19:00', '19:30',
  '20:00', '20:30'
];

const DEFAULT_COL_WIDTH = 270;
const MIN_COL_WIDTH = 180;
const MAX_COL_WIDTH = 550;

export const AgendaView: React.FC = () => {
  const {
    boxes,
    staff,
    appointments,
    selectedDate,
    setSelectedAppointment,
    setIsNewAppointmentOpen,
    refreshAppointments,
    addToast,
  } = useApp();

  // Modo ergonómico para iPhone / móvil
  const [mobileMode, setMobileMode] = useState<'timeline' | 'box_tab' | 'grid'>('timeline');
  const [selectedMobileBoxId, setSelectedMobileBoxId] = useState<string>('');

  useEffect(() => {
    if (boxes.length > 0 && !selectedMobileBoxId) {
      setSelectedMobileBoxId(boxes[0].id);
    }
  }, [boxes, selectedMobileBoxId]);

  // Persistencia de la vista boxes vs staff en desktop
  const [viewMode, setViewMode] = useState<'boxes' | 'staff'>(() => {
    return (localStorage.getItem('hikari_agenda_view_mode') as 'boxes' | 'staff') || 'boxes';
  });

  const handleSetViewMode = (mode: 'boxes' | 'staff') => {
    setViewMode(mode);
    localStorage.setItem('hikari_agenda_view_mode', mode);
  };

  const [draggedApptId, setDraggedApptId] = useState<string | null>(null);

  // Anchos de columna estilo Excel persistidos en localStorage
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('hikari_agenda_col_widths');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  // Guardar en localStorage cuando cambien los anchos
  useEffect(() => {
    try {
      localStorage.setItem('hikari_agenda_col_widths', JSON.stringify(columnWidths));
    } catch (e) {}
  }, [columnWidths]);

  // Estado del redimensionamiento interactivo (Excel resize)
  const [resizingColId, setResizingColId] = useState<string | null>(null);
  const startXRef = useRef<number>(0);
  const startWidthRef = useRef<number>(DEFAULT_COL_WIDTH);

  const handleMouseDownResize = (e: React.MouseEvent, colId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setResizingColId(colId);
    startXRef.current = e.clientX;
    startWidthRef.current = columnWidths[colId] || DEFAULT_COL_WIDTH;
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!resizingColId) return;
    const deltaX = e.clientX - startXRef.current;
    const newWidth = Math.max(MIN_COL_WIDTH, Math.min(MAX_COL_WIDTH, startWidthRef.current + deltaX));
    setColumnWidths((prev) => ({
      ...prev,
      [resizingColId]: newWidth,
    }));
  }, [resizingColId]);

  const handleMouseUp = useCallback(() => {
    setResizingColId(null);
  }, []);

  useEffect(() => {
    if (resizingColId) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [resizingColId, handleMouseMove, handleMouseUp]);

  // Restablecer anchos de columna
  const handleResetWidths = () => {
    setColumnWidths({});
    localStorage.removeItem('hikari_agenda_col_widths');
    addToast({ type: 'info', title: 'Anchos de columna restablecidos' });
  };

  // Línea roja indicadora de la hora actual en tiempo real
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  // Comprobar si la fecha seleccionada es hoy
  const isToday = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    return selectedDate === todayStr;
  };

  // Calcular la posición vertical de la hora actual en píxeles (cada 30 min = 40px)
  const getCurrentTimeTopPx = () => {
    const hours = currentTime.getHours();
    const minutes = currentTime.getMinutes();
    const minsFrom8 = (hours - 8) * 60 + minutes;
    if (minsFrom8 < 0 || minsFrom8 > 13 * 60) return null; // Fuera del horario de agenda 08:00 a 21:00
    return (minsFrom8 / 30) * 40;
  };

  const currentTimeTop = isToday() ? getCurrentTimeTopPx() : null;

  // Helper para convertir "HH:mm" a minutos desde las 08:00
  const getMinutesFromDayStart = (timeString: string) => {
    const d = new Date(timeString);
    const hours = d.getHours();
    const minutes = d.getMinutes();
    return (hours - 8) * 60 + minutes;
  };

  // Helper para calcular posición y altura (60px = 60 minutos)
  const getCardStyle = (appt: Appointment) => {
    const startMins = getMinutesFromDayStart(appt.start_time);
    const duration = appt.sub_treatment?.duration_minutes || 45;
    
    // 1 minuto = 1.33 píxeles (cada bloque de 30 min mide 40px)
    const topPx = (startMins / 30) * 40;
    const heightPx = Math.max(38, (duration / 30) * 40 - 4);

    return {
      top: `${topPx}px`,
      height: `${heightPx}px`,
    };
  };

  // Manejo de Drag and Drop
  const handleDragStart = (e: React.DragEvent, apptId: string) => {
    e.dataTransfer.setData('text/plain', apptId);
    setDraggedApptId(apptId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, columnId: string, timeSlot: string) => {
    e.preventDefault();
    const apptId = e.dataTransfer.getData('text/plain') || draggedApptId;
    if (!apptId) return;

    const appt = appointments.find((a) => a.id === apptId);
    if (!appt) return;

    const duration = appt.sub_treatment?.duration_minutes || 45;
    const newStartDateTime = new Date(`${selectedDate}T${timeSlot}:00`);
    const newEndDateTime = new Date(newStartDateTime.getTime() + duration * 60000);

    const updatePayload: any = {
      start_time: newStartDateTime.toISOString(),
      end_time: newEndDateTime.toISOString(),
    };

    if (viewMode === 'boxes') {
      updatePayload.box_id = columnId;
    } else {
      updatePayload.staff_id = columnId;
    }

    try {
      await api.updateAppointment(appt.id, updatePayload);
      await refreshAppointments();
      addToast({ type: 'success', title: 'Turno reubicado correctamente' });
    } catch (error: any) {
      addToast({ type: 'error', title: 'Conflicto de horario al mover turno', message: error.message });
    } finally {
      setDraggedApptId(null);
    }
  };

  // Filtrar boxes según la fecha seleccionada (respetando boxes temporales)
  const activeColumns = viewMode === 'boxes'
    ? boxes.filter((b) => {
        if (!b.is_active) return false;
        if (!b.is_temporary) return true;
        const selDate = new Date(selectedDate);
        if (b.available_from && new Date(b.available_from) > selDate) return false;
        if (b.available_to && new Date(b.available_to) < selDate) return false;
        return true;
      })
    : staff.filter((s) => s.active);

  const sortedDayAppointments = [...appointments].sort((a, b) =>
    (a.start_time || '').localeCompare(b.start_time || '')
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return { bg: 'bg-emerald-50 text-emerald-800 border-emerald-300', dot: 'bg-emerald-500', label: 'Cobrado' };
      case 'in_progress':
        return { bg: 'bg-amber-50 text-amber-800 border-amber-300', dot: 'bg-amber-500', label: 'En Box' };
      case 'confirmed':
        return { bg: 'bg-blue-50 text-blue-800 border-blue-300', dot: 'bg-blue-500', label: 'Confirmado' };
      case 'cancelled':
        return { bg: 'bg-rose-50 text-rose-800 border-rose-300', dot: 'bg-rose-500', label: 'Cancelado' };
      default:
        return { bg: 'bg-rose-gold-50 text-rose-gold-800 border-rose-gold-300', dot: 'bg-rose-gold-500', label: 'Agendado' };
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-silk-100 overflow-hidden">
      {/* 1. Mobile-Specific Controls Bar (< lg) */}
      <div className="lg:hidden px-2.5 py-1.5 bg-white/95 backdrop-blur-md border-b border-rose-gold-200/60 flex items-center justify-between gap-1.5 shadow-2xs shrink-0">
        <div className="flex bg-silk-200 p-0.5 rounded-xl border border-rose-gold-200 shadow-inner text-[11px] font-semibold">
          <button
            type="button"
            onClick={() => setMobileMode('timeline')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all ${
              mobileMode === 'timeline'
                ? 'bg-white text-rose-gold-900 shadow-2xs font-bold'
                : 'text-graphite-600 hover:text-graphite-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-rose-gold-600" />
            <span>Día ({sortedDayAppointments.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setMobileMode('box_tab')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all ${
              mobileMode === 'box_tab'
                ? 'bg-white text-rose-gold-900 shadow-2xs font-bold'
                : 'text-graphite-600 hover:text-graphite-900'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5 text-rose-gold-600" />
            <span>Por Box</span>
          </button>

          <button
            type="button"
            onClick={() => setMobileMode('grid')}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg transition-all ${
              mobileMode === 'grid'
                ? 'bg-white text-rose-gold-900 shadow-2xs font-bold'
                : 'text-graphite-600 hover:text-graphite-900'
            }`}
          >
            <List className="w-3.5 h-3.5 text-rose-gold-600" />
            <span>Grilla</span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => setIsNewAppointmentOpen(true)}
          className="px-2.5 py-1 bg-gradient-to-r from-rose-gold-600 to-rose-gold-700 hover:from-rose-gold-700 hover:to-rose-gold-800 text-white rounded-xl text-xs font-bold shadow-2xs flex items-center gap-1 active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Agendar</span>
        </button>
      </div>

      {/* 2. Desktop Controls Bar (>= lg) */}
      <div className="hidden lg:flex px-6 py-3 bg-white/70 backdrop-blur-md border-b border-rose-gold-200/50 items-center justify-between shadow-2xs shrink-0">
        <div className="flex items-center gap-3">
          <div className="text-xs font-semibold text-graphite-600">Visualizar por:</div>
          <div className="flex bg-silk-200 p-1 rounded-2xl border border-rose-gold-200/60 shadow-inner">
            <button
              onClick={() => handleSetViewMode('boxes')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-xl transition-all ${
                viewMode === 'boxes'
                  ? 'bg-white text-rose-gold-800 shadow-soft font-bold'
                  : 'text-graphite-600 hover:text-graphite-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5 text-rose-gold-600" />
              <span>Boxes / Cabinas ({boxes.length})</span>
            </button>

            <button
              onClick={() => handleSetViewMode('staff')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-xl transition-all ${
                viewMode === 'staff'
                  ? 'bg-white text-rose-gold-800 shadow-soft font-bold'
                  : 'text-graphite-600 hover:text-graphite-900'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5 text-rose-gold-600" />
              <span>Profesionales ({staff.length})</span>
            </button>
          </div>

          <button
            onClick={handleResetWidths}
            title="Restablecer ancho de columnas a valor predeterminado"
            className="p-1.5 text-graphite-400 hover:text-rose-gold-700 hover:bg-silk-200 rounded-xl transition-colors text-[11px] flex items-center gap-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Restablecer anchos</span>
          </button>
        </div>

        {/* Legend / Info */}
        <div className="hidden lg:flex items-center gap-4 text-[11px] text-graphite-500">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 bg-rose-500 rounded-full"></span>
            <span className="text-rose-600 font-semibold">Hora actual</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Confirmado / Señado
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            En Box
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-gold-500"></span>
            Agendado
          </span>
          <span className="text-rose-gold-600 font-medium">
            💡 Arrastra los bordes de columna para cambiar su tamaño (tipo Excel)
          </span>
        </div>
      </div>

      {/* ========================================================= */}
      {/* VISTA MÓVIL 1: CRONOGRAMA DIARIO ULTRA-COMPACTO           */}
      {/* ========================================================= */}
      {mobileMode === 'timeline' && (
        <div className="flex-1 overflow-y-auto p-2 sm:p-3 space-y-2 lg:hidden max-w-lg mx-auto w-full">
          {sortedDayAppointments.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-3xl border border-dashed border-rose-gold-300 text-graphite-500 space-y-3 mt-4">
              <CalendarIcon className="w-10 h-10 mx-auto text-rose-gold-400 opacity-80" />
              <div>
                <h4 className="font-serif font-bold text-graphite-900 text-sm">
                  Sin turnos programados para esta fecha
                </h4>
                <p className="text-xs text-graphite-500 mt-0.5">
                  Aprovecha los espacios disponibles y agenda un turno.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsNewAppointmentOpen(true)}
                className="px-4 py-2 bg-gradient-to-r from-rose-gold-600 to-rose-gold-700 text-white rounded-2xl font-bold text-xs shadow-md active:scale-95"
              >
                + Agendar Primer Turno
              </button>
            </div>
          ) : (
            sortedDayAppointments.map((appt) => {
              const statusBadge = getStatusBadge(appt.status);
              const startTimeFormatted = appt.start_time ? appt.start_time.split('T')[1].substring(0, 5) : '--:--';
              const endTimeFormatted = appt.end_time ? appt.end_time.split('T')[1].substring(0, 5) : '--:--';
              const balanceDue = Math.max(0, (appt.total_amount || appt.service_price || 0) - (appt.deposit_amount || 0));

              return (
                <div
                  key={appt.id}
                  onClick={() => setSelectedAppointment(appt)}
                  className="bg-white rounded-2xl p-2.5 border border-rose-gold-200/90 shadow-2xs hover:shadow-soft transition-all active:scale-[0.99] cursor-pointer flex items-center justify-between gap-2.5 relative overflow-hidden"
                >
                  {/* Barra de acento con color del Box */}
                  <div
                    className="absolute left-0 top-0 bottom-0 w-1.5"
                    style={{ backgroundColor: appt.box?.color_code || '#C59B7E' }}
                  />

                  <div className="flex items-center gap-2.5 pl-1.5 min-w-0 flex-1">
                    {/* Bloque Horario Monospace */}
                    <div className="shrink-0 text-center bg-silk-100 px-2 py-1 rounded-xl border border-rose-gold-200/70">
                      <div className="font-mono font-bold text-xs text-graphite-900 leading-tight">
                        {startTimeFormatted}
                      </div>
                      <div className="font-mono text-[9px] text-graphite-500 leading-none mt-0.5">
                        {endTimeFormatted}
                      </div>
                    </div>

                    {/* Datos Cliente & Servicio */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-bold text-xs text-graphite-900 truncate">
                          {appt.client?.first_name} {appt.client?.last_name}
                        </h4>
                      </div>
                      <p className="text-[11px] text-rose-gold-800 font-medium truncate">
                        {appt.sub_treatment?.name || 'Tratamiento'}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-graphite-500">
                        <span
                          className="px-1.5 py-0.2 rounded font-semibold text-[9px] border"
                          style={{
                            backgroundColor: `${appt.box?.color_code || '#C59B7E'}15`,
                            color: appt.box?.color_code || '#C59B7E',
                            borderColor: `${appt.box?.color_code || '#C59B7E'}40`,
                          }}
                        >
                          {appt.box?.name || 'Box'}
                        </span>
                        <span>•</span>
                        <span className="truncate">{appt.staff?.first_name || 'Staff'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Estado y Monto */}
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 ${
                        statusBadge.bg
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${statusBadge.dot}`} />
                      {statusBadge.label}
                    </span>
                    <div className="text-right">
                      <div className="font-bold text-xs text-graphite-900">
                        ${(appt.total_amount || appt.service_price || 0).toLocaleString('es-AR')}
                      </div>
                      {balanceDue > 0 && appt.status !== 'completed' ? (
                        <div className="text-[9px] text-amber-700 font-semibold">
                          Resta: ${balanceDue.toLocaleString('es-AR')}
                        </div>
                      ) : appt.status === 'completed' ? (
                        <div className="text-[9px] text-emerald-700 font-semibold">
                          Pagado
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* VISTA MÓVIL 2: POR BOX INDIVIDUAL (100% ANCHO)             */}
      {/* ========================================================= */}
      {mobileMode === 'box_tab' && (
        <div className="flex-1 flex flex-col overflow-hidden lg:hidden">
          {/* Selector horizontal de boxes */}
          <div className="flex gap-1.5 overflow-x-auto p-2 bg-silk-50 border-b border-rose-gold-200/60 shrink-0">
            {boxes.map((b) => {
              const isSelected = (selectedMobileBoxId || boxes[0]?.id) === b.id;
              const boxColor = b.color_code || '#C59B7E';
              const boxAppts = sortedDayAppointments.filter((a) => a.box_id === b.id);
              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setSelectedMobileBoxId(b.id)}
                  style={{
                    borderColor: isSelected ? boxColor : undefined,
                  }}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all shrink-0 ${
                    isSelected
                      ? 'bg-white shadow-xs text-graphite-900 border-2'
                      : 'bg-white/70 text-graphite-600 border-rose-gold-200'
                  }`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: boxColor }}
                  />
                  <span>{b.name}</span>
                  {boxAppts.length > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-silk-200 text-graphite-700 font-bold">
                      {boxAppts.length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Horarios de ese box en ancho completo */}
          <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5 max-w-lg mx-auto w-full">
            {TIME_SLOTS.map((slot) => {
              const currentBoxId = selectedMobileBoxId || boxes[0]?.id;
              const appt = appointments.find((a) => {
                if (a.box_id !== currentBoxId) return false;
                const slotHour = slot.split(':')[0];
                const slotMin = slot.split(':')[1];
                const apptTime = a.start_time?.split('T')[1];
                if (!apptTime) return false;
                const apptHour = apptTime.split(':')[0];
                const apptMin = parseInt(apptTime.split(':')[1], 10);
                const slotMinNum = parseInt(slotMin, 10);
                return apptHour === slotHour && apptMin >= slotMinNum && apptMin < slotMinNum + 30;
              });

              if (appt) {
                const statusBadge = getStatusBadge(appt.status);
                return (
                  <div
                    key={slot}
                    onClick={() => setSelectedAppointment(appt)}
                    className="p-2.5 bg-white rounded-xl border border-rose-gold-200 shadow-2xs flex items-center justify-between gap-2 cursor-pointer hover:shadow-soft"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-rose-gold-800 bg-silk-100 px-1.5 py-1 rounded-lg">
                        {slot}
                      </span>
                      <div className="min-w-0">
                        <h5 className="font-bold text-xs text-graphite-900 truncate">
                          {appt.client?.first_name} {appt.client?.last_name}
                        </h5>
                        <p className="text-[10px] text-graphite-600 truncate">
                          {appt.sub_treatment?.name} • {appt.staff?.first_name}
                        </p>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusBadge.bg}`}>
                      {statusBadge.label}
                    </span>
                  </div>
                );
              }

              return (
                <div
                  key={slot}
                  onClick={() => setIsNewAppointmentOpen(true)}
                  className="p-2 bg-white/60 hover:bg-white rounded-xl border border-dashed border-rose-gold-200/80 flex items-center justify-between cursor-pointer transition-colors text-xs text-graphite-400 group"
                >
                  <span className="font-mono text-[11px] text-graphite-500 font-semibold">{slot}</span>
                  <span className="text-[10px] text-rose-gold-600 font-medium group-hover:underline flex items-center gap-1">
                    <Plus className="w-3 h-3" />
                    <span>Disponible</span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* VISTA 3: GRILLA COMPLETA EXCEL (Desktop o Móvil 'grid')   */}
      {/* ========================================================= */}
      <div className={`flex-1 overflow-x-auto overflow-y-auto flex-col bg-silk-50/70 select-none relative ${
        mobileMode !== 'grid' ? 'hidden lg:flex' : 'flex'
      }`}>
        {/* Column Headers (Sticky Top) */}
        <div className="flex border-b border-rose-gold-200 bg-white sticky top-0 z-30 shadow-xs shrink-0 min-w-max">
          {/* Time Column Header - Sticky Left */}
          <div className="w-20 shrink-0 p-3 border-r border-rose-gold-200 bg-silk-100 sticky left-0 z-40 flex items-center justify-center text-xs font-bold text-graphite-700 shadow-[2px_0_5px_rgba(0,0,0,0.03)]">
            <Clock className="w-4 h-4 text-rose-gold-500 mr-1" />
            Hora
          </div>

          {/* Dynamic Columns (Boxes or Staff) with Excel Resize Handle */}
          {activeColumns.map((col: any) => {
            const isBox = viewMode === 'boxes';
            const colWidth = columnWidths[col.id] || DEFAULT_COL_WIDTH;
            const customColor = col.color_code || '#C59B7E';

            return (
              <div
                key={col.id}
                style={{
                  width: `${colWidth}px`,
                  backgroundColor: `${customColor}0D`, // Tinte sutil en header
                  borderTop: `3px solid ${customColor}`,
                }}
                className="shrink-0 p-3 border-r border-rose-gold-200 flex items-center justify-between relative group"
              >
                <div className="flex items-center gap-2 truncate min-w-0 pr-2">
                  <span
                    className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm border border-white"
                    style={{ backgroundColor: customColor }}
                  />
                  <div className="truncate min-w-0">
                    <h3 className="font-serif font-bold text-xs text-graphite-900 truncate flex items-center gap-1">
                      <span>{col.name || `${col.first_name} ${col.last_name}`}</span>
                    </h3>
                    <p className="text-[10px] text-graphite-500 truncate">
                      {isBox
                        ? `${col.start_time || '08:00'} a ${col.end_time || '21:00'}`
                        : col.role}
                    </p>
                  </div>
                </div>

                <span
                  className="text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0 border"
                  style={{
                    backgroundColor: `${customColor}20`,
                    color: customColor,
                    borderColor: `${customColor}40`,
                  }}
                >
                  {isBox ? `Box #${col.number}` : col.first_name}
                </span>

                {/* Handle de redimensionamiento estilo Excel */}
                <div
                  onMouseDown={(e) => handleMouseDownResize(e, col.id)}
                  onDoubleClick={() => {
                    setColumnWidths((prev) => {
                      const next = { ...prev };
                      delete next[col.id];
                      return next;
                    });
                  }}
                  title="Arrastrar para redimensionar / Doble clic para auto-ajuste"
                  className="absolute right-0 top-0 bottom-0 w-2.5 cursor-col-resize hover:bg-rose-gold-400/50 active:bg-rose-gold-600 transition-colors z-20 flex items-center justify-center group-hover:opacity-100 opacity-30"
                >
                  <div className="w-[1.5px] h-4 bg-rose-gold-400 rounded-full" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Schedule Body with Time Rows */}
        <div className="flex relative flex-1 min-w-max">
          {/* Time Gutter (Left) - Sticky Left Always Visible */}
          <div className="w-20 shrink-0 border-r border-rose-gold-200 bg-silk-100/95 sticky left-0 z-20 shadow-[2px_0_5px_rgba(0,0,0,0.03)] backdrop-blur-xs">
            {TIME_SLOTS.map((time) => (
              <div
                key={time}
                className="h-[40px] border-b border-rose-gold-100/80 px-2 flex items-start justify-end text-[10px] font-semibold text-graphite-500 pt-1"
              >
                {time}
              </div>
            ))}
          </div>

          {/* Línea Roja del Horario Actual */}
          {currentTimeTop !== null && (
            <div
              style={{ top: `${currentTimeTop}px` }}
              className="absolute left-0 right-0 z-20 pointer-events-none flex items-center"
            >
              {/* Punto indicador rojo en columna de horas */}
              <div className="w-20 shrink-0 sticky left-0 flex items-center justify-end pr-1 z-30">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-white shadow-xs" />
              </div>
              {/* Línea roja continua en todo el ancho de la agenda */}
              <div className="flex-1 h-[2px] bg-rose-500 shadow-xs" />
            </div>
          )}

          {/* Columns Grid Cells and Floating Cards */}
          {activeColumns.map((col: any) => {
            const isBox = viewMode === 'boxes';
            const colWidth = columnWidths[col.id] || DEFAULT_COL_WIDTH;
            const customColor = col.color_code || '#C59B7E';

            // Filtrar turnos de esta columna
            const columnAppts = appointments.filter((a) => {
              if (viewMode === 'boxes') return a.box_id === col.id;
              return a.staff_id === col.id;
            });

            return (
              <div
                key={col.id}
                style={{
                  width: `${colWidth}px`,
                  backgroundColor: `${customColor}05`, // Fondo sutil coloreado
                }}
                className="shrink-0 border-r border-rose-gold-200/80 relative"
              >
                {/* 30-min Drop Target Rows */}
                {TIME_SLOTS.map((time) => (
                  <div
                    key={time}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, col.id, time)}
                    onClick={() => {
                      setIsNewAppointmentOpen(true);
                    }}
                    className="h-[40px] border-b border-rose-gold-100/60 hover:bg-rose-gold-50/70 transition-colors cursor-pointer group flex items-center justify-end px-2"
                    title={`Click para agendar en ${col.name || col.first_name} a las ${time}`}
                  >
                    <span className="opacity-0 group-hover:opacity-100 text-[10px] text-rose-gold-600 font-bold">
                      + Agendar
                    </span>
                  </div>
                ))}

                {/* Render Appointment Cards */}
                {columnAppts.map((appt) => {
                  const cardStyle = getCardStyle(appt);
                  const isCartEmpty = !appt.cart_items || appt.cart_items.length === 0;

                  // Status Badges
                  const statusColors: Record<string, string> = {
                    scheduled: 'border-l-rose-gold-500 bg-gradient-to-br from-white to-rose-gold-50/80',
                    confirmed: 'border-l-emerald-500 bg-gradient-to-br from-white to-emerald-50/80',
                    in_progress: 'border-l-amber-500 bg-gradient-to-br from-white to-amber-50/80',
                    completed: 'border-l-sky-500 bg-gradient-to-br from-white to-sky-50/80 opacity-80',
                    cancelled: 'border-l-rose-400 bg-gradient-to-br from-white to-rose-50/50 opacity-60 line-through',
                    no_show: 'border-l-purple-400 bg-gradient-to-br from-white to-purple-50/50 opacity-60',
                  };

                  const startTimeFormatted = new Date(appt.start_time).toLocaleTimeString('es-AR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  });
                  const endTimeFormatted = new Date(appt.end_time).toLocaleTimeString('es-AR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <div
                      key={appt.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, appt.id)}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedAppointment(appt);
                      }}
                      style={cardStyle}
                      className={`absolute left-1.5 right-1.5 rounded-xl p-2.5 border-l-4 border shadow-soft hover:shadow-soft-md transition-all duration-150 cursor-pointer overflow-hidden z-10 flex flex-col justify-between group hover:scale-[1.01] ${
                        statusColors[appt.status] || 'border-l-rose-gold-500 bg-white'
                      }`}
                    >
                      {/* Top Row: Client & Time */}
                      <div className="flex items-start justify-between gap-1">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1 text-[10px] font-bold text-graphite-500 leading-tight">
                            <Clock className="w-3 h-3 text-rose-gold-600 shrink-0" />
                            <span>{startTimeFormatted} - {endTimeFormatted}</span>
                          </div>
                          <h4 className="font-serif font-bold text-xs text-graphite-900 truncate mt-0.5">
                            {appt.client?.first_name} {appt.client?.last_name}
                          </h4>
                        </div>
                        <GripVertical className="w-3 h-3 text-graphite-300 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                      </div>

                      {/* Middle Row: Sub-Treatment Name */}
                      <div className="text-[11px] font-semibold text-rose-gold-800 truncate leading-tight">
                        {appt.sub_treatment?.name}
                      </div>

                      {/* Bottom Row: Staff/Box and Financials */}
                      <div className="flex items-center justify-between text-[10px] pt-1 border-t border-rose-gold-200/40">
                        <span className="text-graphite-600 truncate font-medium">
                          {viewMode === 'boxes' ? `👩‍⚕️ ${appt.staff?.first_name}` : `🚪 ${appt.box?.name}`}
                        </span>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {!isCartEmpty && (
                            <span className="px-1.5 py-0.2 rounded-md bg-amber-100 text-amber-800 font-bold flex items-center gap-0.5">
                              <ShoppingCart className="w-2.5 h-2.5" />
                              {appt.cart_items?.length}
                            </span>
                          )}
                          <span className="font-bold text-graphite-800">
                            ${appt.total_amount ? appt.total_amount.toLocaleString('es-AR') : appt.service_price.toLocaleString('es-AR')}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

