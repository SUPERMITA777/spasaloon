import React, { useState } from 'react';
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
} from 'lucide-react';

const TIME_SLOTS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
  '17:00', '17:30', '18:00', '18:30', '19:00', '19:30',
  '20:00', '20:30'
];

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

  const [viewMode, setViewMode] = useState<'boxes' | 'staff'>('boxes');
  const [draggedApptId, setDraggedApptId] = useState<string | null>(null);

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

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] bg-silk-100 overflow-hidden">
      {/* Top Filter & View Mode Bar */}
      <div className="px-6 py-3 bg-white/60 backdrop-blur-sm border-b border-rose-gold-200/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-xs font-semibold text-graphite-600">Visualizar por:</div>
          <div className="flex bg-silk-200 p-1 rounded-2xl border border-rose-gold-200/60 shadow-inner">
            <button
              onClick={() => setViewMode('boxes')}
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
              onClick={() => setViewMode('staff')}
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
        </div>

        {/* Legend / Info */}
        <div className="hidden lg:flex items-center gap-4 text-[11px] text-graphite-500">
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
            💡 Arrastra con el mouse para mover horarios o boxes
          </span>
        </div>
      </div>

      {/* Grid Container */}
      <div className="flex-1 overflow-x-auto overflow-y-auto flex flex-col bg-silk-50/70 select-none">
        {/* Column Headers (Sticky Top) */}
        <div className="flex border-b border-rose-gold-200 bg-white sticky top-0 z-20 shadow-sm shrink-0 min-w-max">
          {/* Time Column Header */}
          <div className="w-20 shrink-0 p-3 border-r border-rose-gold-200 bg-silk-100/80 flex items-center justify-center text-xs font-bold text-graphite-600">
            <Clock className="w-4 h-4 text-rose-gold-500 mr-1" />
            Hora
          </div>

          {/* Dynamic Columns (Boxes or Staff) */}
          {activeColumns.map((col: any) => {
            const isBox = viewMode === 'boxes';
            return (
              <div
                key={col.id}
                className="w-64 sm:w-72 shrink-0 p-3 border-r border-rose-gold-200 flex items-center justify-between bg-white"
              >
                <div className="flex items-center gap-2 truncate">
                  <span
                    className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                    style={{ backgroundColor: col.color_code || '#C59B7E' }}
                  />
                  <div className="truncate">
                    <h3 className="font-serif font-bold text-xs text-graphite-900 truncate">
                      {col.name || `${col.first_name} ${col.last_name}`}
                    </h3>
                    <p className="text-[10px] text-graphite-500 truncate">
                      {isBox ? (col.description || `Box #${col.number}`) : col.role}
                    </p>
                  </div>
                </div>

                <span className="text-[10px] px-2 py-0.5 rounded-full bg-silk-100 text-graphite-600 font-medium shrink-0 border border-silk-300">
                  {isBox ? `Sala ${col.number}` : col.first_name}
                </span>
              </div>
            );
          })}
        </div>

        {/* Schedule Body with Time Rows */}
        <div className="flex relative flex-1 min-w-max">
          {/* Time Gutter (Left) */}
          <div className="w-20 shrink-0 border-r border-rose-gold-200 bg-silk-100/50 z-10">
            {TIME_SLOTS.map((time) => (
              <div
                key={time}
                className="h-[40px] border-b border-rose-gold-100/80 px-2 flex items-start justify-end text-[10px] font-semibold text-graphite-500 pt-1"
              >
                {time}
              </div>
            ))}
          </div>

          {/* Columns Grid Cells and Floating Cards */}
          {activeColumns.map((col: any) => {
            // Filtrar turnos de esta columna
            const columnAppts = appointments.filter((a) => {
              if (viewMode === 'boxes') return a.box_id === col.id;
              return a.staff_id === col.id;
            });

            return (
              <div
                key={col.id}
                className="w-64 sm:w-72 shrink-0 border-r border-rose-gold-200/80 relative bg-white/40"
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
                    className="h-[40px] border-b border-rose-gold-100/60 hover:bg-rose-gold-50/50 transition-colors cursor-pointer group flex items-center justify-end px-2"
                    title={`Click para agendar en ${col.name || col.first_name} a las ${time}`}
                  >
                    <span className="opacity-0 group-hover:opacity-100 text-[10px] text-rose-gold-500 font-medium">
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
                    scheduled: 'border-l-rose-gold-500 bg-gradient-to-br from-white to-rose-gold-50/70',
                    confirmed: 'border-l-emerald-500 bg-gradient-to-br from-white to-emerald-50/70',
                    in_progress: 'border-l-amber-500 bg-gradient-to-br from-white to-amber-50/70',
                    completed: 'border-l-sky-500 bg-gradient-to-br from-white to-sky-50/70 opacity-80',
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
                      className={`absolute left-1 right-1 rounded-xl p-2.5 border-l-4 border shadow-soft hover:shadow-soft-md transition-all duration-150 cursor-pointer overflow-hidden z-10 flex flex-col justify-between group hover:scale-[1.01] ${
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
