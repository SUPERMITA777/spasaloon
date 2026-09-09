import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Users,
  PlusCircle,
  RefreshCw,
  Wifi,
  WifiOff,
  Clock,
  User,
  Sparkles,
  Phone,
  CheckCircle2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  Check,
  X,
  Smartphone,
} from 'lucide-react';
import { HikariLogo } from '../common/HikariLogo';
import { offlineStorage } from '../../services/offlineStorage';
import { syncService, SyncConflict } from '../../services/syncService';
import { ConflictResolutionModal } from './ConflictResolutionModal';

export const MobileAppView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'agenda' | 'clients' | 'new_appointment' | 'sync'>('agenda');
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [conflicts, setConflicts] = useState<SyncConflict[]>([]);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  // Datos locales
  const [appointments, setAppointments] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [treatments, setTreatments] = useState<any[]>([]);
  const [boxes, setBoxes] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);

  // Filtro de fecha para la agenda
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  // Búsqueda de clientes
  const [clientSearch, setClientSearch] = useState<string>('');

  // Formulario de Nuevo Turno
  const [newClientId, setNewClientId] = useState<string>('');
  const [newStaffId, setNewStaffId] = useState<string>('');
  const [newBoxId, setNewBoxId] = useState<string>('');
  const [newSubTreatmentId, setNewSubTreatmentId] = useState<string>('');
  const [newDate, setNewDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [newTime, setNewTime] = useState<string>('10:00');
  const [newDeposit, setNewDeposit] = useState<number>(0);
  const [newNotes, setNewNotes] = useState<string>('');
  const [formSuccess, setFormSuccess] = useState<string>('');

  // Formulario de Nuevo Cliente
  const [showNewClientModal, setShowNewClientModal] = useState<boolean>(false);
  const [newClientFirst, setNewClientFirst] = useState<string>('');
  const [newClientLast, setNewClientLast] = useState<string>('');
  const [newClientPhone, setNewClientPhone] = useState<string>('');

  // PWA banner dismissal
  const [showPwaBanner, setShowPwaBanner] = useState<boolean>(true);

  // Iniciar sincronización y cargar datos locales
  useEffect(() => {
    syncService.start();

    const unsubscribe = syncService.subscribe((status) => {
      setIsOnline(status.isOnline);
      setIsSyncing(status.isSyncing);
      setPendingCount(status.pendingCount);
      setConflicts(status.conflicts);
      setLastSyncedAt(status.lastSyncedAt);
    });

    loadLocalData();

    return () => {
      unsubscribe();
    };
  }, []);

  // Recargar datos locales periódicamente o tras sincronizar
  const loadLocalData = async () => {
    const snapshot = await offlineStorage.getSnapshot();
    if (snapshot) {
      setAppointments(snapshot.appointments || []);
      setClients(snapshot.clients || []);
      setTreatments(snapshot.treatments || []);
      setBoxes(snapshot.boxes || []);
      setStaff(snapshot.staff || []);
      setLastSyncedAt(snapshot.lastSyncedAt);
    }
  };

  useEffect(() => {
    loadLocalData();
  }, [pendingCount, isSyncing]);

  // Lista plana de todos los sub-tratamientos
  const allSubTreatments = treatments.flatMap((t) => t.sub_treatments || []);

  // Turnos filtrados para la fecha seleccionada
  const filteredAppointments = appointments.filter((a) => {
    const aDate = a.start_time ? a.start_time.split('T')[0] : '';
    return aDate === selectedDate;
  });

  // Clientes filtrados por búsqueda
  const filteredClients = clients.filter((c) => {
    const q = clientSearch.toLowerCase();
    const fullName = `${c.first_name || ''} ${c.last_name || ''}`.toLowerCase();
    const phone = (c.phone || '').toLowerCase();
    return fullName.includes(q) || phone.includes(q);
  });

  // Crear turno offline/online
  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientId || !newSubTreatmentId || !newBoxId || !newStaffId) return;

    const sub = allSubTreatments.find((s) => s.id === newSubTreatmentId);
    const duration = sub?.duration_minutes || 60;
    const price = sub?.base_price || 0;

    const startDateTime = `${newDate}T${newTime}:00`;
    const startDateObj = new Date(startDateTime);
    const endDateObj = new Date(startDateObj.getTime() + duration * 60000);
    const endDateTime = endDateObj.toISOString().substring(0, 19);

    const clientObj = clients.find((c) => c.id === newClientId);
    const staffObj = staff.find((s) => s.id === newStaffId);
    const boxObj = boxes.find((b) => b.id === newBoxId);

    const newApptId = `appt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const apptData = {
      id: newApptId,
      client_id: newClientId,
      staff_id: newStaffId,
      box_id: newBoxId,
      sub_treatment_id: newSubTreatmentId,
      start_time: startDateTime,
      end_time: endDateTime,
      service_price: price,
      deposit_amount: Number(newDeposit) || 0,
      status: 'scheduled',
      notes: newNotes,
      client: clientObj,
      staff: staffObj,
      box: boxObj,
      sub_treatment: sub,
    };

    await syncService.recordOfflineAction('appointment', 'create', newApptId, apptData);
    await loadLocalData();

    setFormSuccess('¡Turno guardado correctamente!');
    setTimeout(() => {
      setFormSuccess('');
      setActiveTab('agenda');
      setSelectedDate(newDate);
    }, 1200);
  };

  // Crear cliente offline/online
  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientFirst.trim()) return;

    const newClientId = `cli_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const clientData = {
      id: newClientId,
      first_name: newClientFirst.trim(),
      last_name: newClientLast.trim(),
      phone: newClientPhone.trim(),
    };

    await syncService.recordOfflineAction('client', 'create', newClientId, clientData);
    await loadLocalData();

    setNewClientFirst('');
    setNewClientLast('');
    setNewClientPhone('');
    setShowNewClientModal(false);
  };

  // Cambiar estado de un turno offline/online
  const handleUpdateStatus = async (apptId: string, newStatus: string) => {
    const current = appointments.find((a) => a.id === apptId);
    if (!current) return;

    const updatedData = { ...current, status: newStatus };
    await syncService.recordOfflineAction('appointment', 'update', apptId, updatedData);
    await loadLocalData();
  };

  const changeDateBy = (days: number) => {
    const curr = new Date(selectedDate);
    curr.setDate(curr.getDate() + days);
    setSelectedDate(curr.toISOString().split('T')[0]);
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-silk-100 text-graphite-800 font-sans select-none">
      {/* Barra de Estado Superior */}
      <header className="bg-white border-b border-rose-gold-200 px-4 py-2.5 flex items-center justify-between shadow-xs shrink-0 pt-safe">
        <div className="flex items-center gap-2">
          <HikariLogo size={32} />
          <div>
            <h1 className="font-serif font-bold text-xs text-graphite-900 leading-tight">
              Hikari Suite
            </h1>
            <span className="text-[10px] text-rose-gold-600 font-semibold">App Móvil</span>
          </div>
        </div>

        {/* Indicador de Conexión & Sincronización */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => syncService.syncNow()}
            disabled={isSyncing}
            className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all flex items-center gap-1.5 shadow-xs ${
              isOnline
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : 'bg-rose-50 text-rose-800 border-rose-300'
            }`}
          >
            {isSyncing ? (
              <RefreshCw className="w-3 h-3 animate-spin text-rose-gold-600" />
            ) : isOnline ? (
              <Wifi className="w-3 h-3 text-emerald-600" />
            ) : (
              <WifiOff className="w-3 h-3 text-rose-600" />
            )}

            <span>{isSyncing ? 'Sincronizando...' : isOnline ? 'En línea' : 'Modo Offline'}</span>

            {pendingCount > 0 && (
              <span className="bg-amber-500 text-white rounded-full px-1.5 py-0.2 text-[9px]">
                {pendingCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Banner de instalación PWA en iPhone / Android */}
      {showPwaBanner && (
        <div className="bg-gradient-to-r from-rose-gold-600 to-rose-gold-700 text-white px-3 py-1.5 flex items-center justify-between text-[11px] shrink-0">
          <div className="flex items-center gap-1.5 truncate">
            <Smartphone className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Instala esta app en tu pantalla de inicio para acceso offline</span>
          </div>
          <button
            onClick={() => setShowPwaBanner(false)}
            className="p-1 rounded-full hover:bg-white/20 text-white"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Contenido Principal de Pestañas */}
      <main className="flex-1 overflow-y-auto p-4 pb-20 space-y-4">
        {/* ======================= TAB 1: AGENDA ======================= */}
        {activeTab === 'agenda' && (
          <div className="space-y-3">
            {/* Navegador de Fecha */}
            <div className="bg-white p-2.5 rounded-2xl border border-rose-gold-200 shadow-soft flex items-center justify-between">
              <button
                type="button"
                onClick={() => changeDateBy(-1)}
                className="p-1.5 rounded-xl hover:bg-silk-100 text-graphite-700"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <div className="text-center">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="font-bold text-xs text-graphite-900 bg-transparent text-center outline-none cursor-pointer"
                />
                <p className="text-[10px] text-graphite-500">
                  {selectedDate === new Date().toISOString().split('T')[0]
                    ? 'Hoy'
                    : new Date(selectedDate + 'T00:00:00').toLocaleDateString('es-AR', { weekday: 'long' })}
                </p>
              </div>

              <button
                type="button"
                onClick={() => changeDateBy(1)}
                className="p-1.5 rounded-xl hover:bg-silk-100 text-graphite-700"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Listado de Turnos */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between px-1">
                <span className="text-[11px] font-bold text-graphite-600 uppercase tracking-wider">
                  Turnos del Día ({filteredAppointments.length})
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setNewDate(selectedDate);
                    setActiveTab('new_appointment');
                  }}
                  className="text-xs text-rose-gold-700 font-bold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Nuevo Turno</span>
                </button>
              </div>

              {filteredAppointments.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-3xl border border-rose-gold-100 shadow-soft space-y-2">
                  <Clock className="w-8 h-8 text-rose-gold-300 mx-auto" />
                  <p className="text-xs font-semibold text-graphite-700">No hay turnos para esta fecha</p>
                  <p className="text-[10px] text-graphite-400">
                    Puedes agendar uno nuevo incluso si la computadora del salón está apagada.
                  </p>
                </div>
              ) : (
                filteredAppointments.map((appt: any) => {
                  const startTime = appt.start_time
                    ? new Date(appt.start_time).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
                    : '—';
                  const endTime = appt.end_time
                    ? new Date(appt.end_time).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
                    : '—';

                  const clientName = appt.client
                    ? `${appt.client.first_name || ''} ${appt.client.last_name || ''}`
                    : 'Cliente';

                  const isCompleted = appt.status === 'completed';
                  const isCancelled = appt.status === 'cancelled';

                  return (
                    <div
                      key={appt.id}
                      className="bg-white rounded-2xl border border-rose-gold-200 shadow-soft p-3.5 space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-rose-gold-800">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{startTime} - {endTime}</span>
                          </div>
                          <h4 className="font-serif font-bold text-sm text-graphite-900 mt-0.5">
                            {clientName}
                          </h4>
                          <p className="text-[11px] text-graphite-600">
                            {appt.sub_treatment?.name || 'Servicio'}
                          </p>
                        </div>

                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                            isCompleted
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : isCancelled
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {appt.status || 'Agendado'}
                        </span>
                      </div>

                      {/* Detalles: Profesional y Box */}
                      <div className="flex items-center justify-between text-[10px] text-graphite-500 pt-1 border-t border-rose-gold-100">
                        <span>👩‍⚕️ {appt.staff?.first_name || 'Sin asignar'}</span>
                        <span>🚪 {appt.box?.name || 'Box'}</span>
                        <span className="font-bold text-graphite-900">
                          ${(appt.service_price || 0).toLocaleString('es-AR')}
                        </span>
                      </div>

                      {/* Botones de Acción Rápida */}
                      {!isCompleted && !isCancelled && (
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(appt.id, 'completed')}
                            className="flex-1 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center justify-center gap-1 shadow-xs"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Completar</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(appt.id, 'cancelled')}
                            className="py-1.5 px-3 rounded-xl border border-rose-200 hover:bg-rose-50 text-rose-700 font-semibold text-[11px]"
                          >
                            Cancelar
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ======================= TAB 2: CLIENTES ======================= */}
        {activeTab === 'clients' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-bold text-graphite-600 uppercase tracking-wider">
                Fichero de Clientes ({clients.length})
              </span>
              <button
                type="button"
                onClick={() => setShowNewClientModal(true)}
                className="text-xs text-rose-gold-700 font-bold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nuevo Cliente</span>
              </button>
            </div>

            {/* Buscador */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-graphite-400" />
              <input
                type="text"
                placeholder="Buscar por nombre o teléfono..."
                value={clientSearch}
                onChange={(e) => setClientSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-2xl bg-white border border-rose-gold-200 text-xs text-graphite-800 outline-none focus:ring-1 focus:ring-rose-gold-400 shadow-soft"
              />
            </div>

            {/* Listado de Clientes */}
            <div className="space-y-2">
              {filteredClients.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-3xl border border-rose-gold-100 shadow-soft">
                  <p className="text-xs text-graphite-500">No se encontraron clientes.</p>
                </div>
              ) : (
                filteredClients.map((client) => (
                  <div
                    key={client.id}
                    className="p-3.5 bg-white rounded-2xl border border-rose-gold-200 shadow-soft flex items-center justify-between"
                  >
                    <div>
                      <h4 className="font-bold text-xs text-graphite-900">
                        {client.first_name} {client.last_name}
                      </h4>
                      <p className="text-[11px] text-graphite-500 mt-0.5 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-rose-gold-600" />
                        <span>{client.phone || '(Sin teléfono)'}</span>
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setNewClientId(client.id);
                        setActiveTab('new_appointment');
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-silk-100 hover:bg-rose-gold-50 border border-rose-gold-200 text-rose-gold-800 text-[10px] font-bold shadow-xs"
                    >
                      + Turno
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ======================= TAB 3: NUEVO TURNO ======================= */}
        {activeTab === 'new_appointment' && (
          <form onSubmit={handleCreateAppointment} className="space-y-3">
            <h3 className="font-serif font-bold text-sm text-graphite-900 px-1">
              Agendar Nuevo Turno
            </h3>

            {formSuccess && (
              <div className="p-3 rounded-2xl bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-scale-up">
                <Check className="w-4 h-4 text-emerald-700" />
                <span>{formSuccess}</span>
              </div>
            )}

            <div className="bg-white p-4 rounded-3xl border border-rose-gold-200 shadow-soft space-y-3 text-xs">
              {/* Cliente */}
              <div>
                <label className="block font-bold text-graphite-700 mb-1">Cliente *</label>
                <select
                  required
                  value={newClientId}
                  onChange={(e) => setNewClientId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-rose-gold-300 bg-silk-50/50"
                >
                  <option value="">Seleccione un cliente...</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.first_name} {c.last_name} ({c.phone || 'Sin tel'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Tratamiento / Servicio */}
              <div>
                <label className="block font-bold text-graphite-700 mb-1">Servicio *</label>
                <select
                  required
                  value={newSubTreatmentId}
                  onChange={(e) => setNewSubTreatmentId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-rose-gold-300 bg-silk-50/50"
                >
                  <option value="">Seleccione un servicio...</option>
                  {allSubTreatments.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} (${s.base_price.toLocaleString('es-AR')} - {s.duration_minutes}m)
                    </option>
                  ))}
                </select>
              </div>

              {/* Profesional y Box */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-graphite-700 mb-1">Profesional *</label>
                  <select
                    required
                    value={newStaffId}
                    onChange={(e) => setNewStaffId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-rose-gold-300 bg-silk-50/50"
                  >
                    <option value="">Elegir...</option>
                    {staff.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.first_name} {s.last_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-graphite-700 mb-1">Box / Cabina *</label>
                  <select
                    required
                    value={newBoxId}
                    onChange={(e) => setNewBoxId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-rose-gold-300 bg-silk-50/50"
                  >
                    <option value="">Elegir...</option>
                    {boxes.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Fecha y Hora */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-graphite-700 mb-1">Fecha *</label>
                  <input
                    type="date"
                    required
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-rose-gold-300 bg-silk-50/50"
                  />
                </div>

                <div>
                  <label className="block font-bold text-graphite-700 mb-1">Hora Inicio *</label>
                  <input
                    type="time"
                    required
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-rose-gold-300 bg-silk-50/50"
                  />
                </div>
              </div>

              {/* Seña y Observaciones */}
              <div>
                <label className="block font-bold text-graphite-700 mb-1">Seña Pagada ($)</label>
                <input
                  type="number"
                  min="0"
                  value={newDeposit}
                  onChange={(e) => setNewDeposit(Number(e.target.value))}
                  placeholder="0"
                  className="w-full p-2.5 rounded-xl border border-rose-gold-300 bg-silk-50/50"
                />
              </div>

              <div>
                <label className="block font-bold text-graphite-700 mb-1">Observaciones</label>
                <textarea
                  rows={2}
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Notas adicionales sobre el turno..."
                  className="w-full p-2.5 rounded-xl border border-rose-gold-300 bg-silk-50/50"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-rose-gold-600 to-rose-gold-700 hover:from-rose-gold-700 hover:to-rose-gold-800 text-white font-bold text-xs shadow-soft transition-all"
              >
                Confirmar y Guardar Turno
              </button>
            </div>
          </form>
        )}

        {/* ======================= TAB 4: SINCRONIZACIÓN ======================= */}
        {activeTab === 'sync' && (
          <div className="space-y-4">
            <h3 className="font-serif font-bold text-sm text-graphite-900 px-1">
              Estado de Sincronización
            </h3>

            <div className="bg-white p-5 rounded-3xl border border-rose-gold-200 shadow-soft space-y-4 text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-rose-gold-100">
                <span className="text-graphite-600 font-medium">Estado del Servidor:</span>
                <span
                  className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${
                    isOnline ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {isOnline ? '🟢 Conectado' : '🔴 Fuera de línea (PC apagada)'}
                </span>
              </div>

              <div className="flex items-center justify-between pb-3 border-b border-rose-gold-100">
                <span className="text-graphite-600 font-medium">Cambios Locales Pendientes:</span>
                <span className="font-bold text-graphite-900">{pendingCount} registros</span>
              </div>

              <div className="flex items-center justify-between pb-3 border-b border-rose-gold-100">
                <span className="text-graphite-600 font-medium">Última Sincronización:</span>
                <span className="font-mono text-graphite-500 text-[11px]">
                  {lastSyncedAt ? new Date(lastSyncedAt).toLocaleTimeString('es-AR') : 'Nunca'}
                </span>
              </div>

              <button
                type="button"
                onClick={() => syncService.syncNow()}
                disabled={isSyncing}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-rose-gold-600 to-rose-gold-700 hover:from-rose-gold-700 hover:to-rose-gold-800 text-white font-bold text-xs shadow-soft transition-all flex items-center justify-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Sincronizando ahora...' : 'Sincronizar Manualmente'}</span>
              </button>
            </div>

            <div className="p-4 bg-silk-50 rounded-2xl border border-rose-gold-200 text-graphite-600 text-[11px] leading-relaxed space-y-1.5">
              <p className="font-bold text-graphite-800">💡 ¿Cómo funciona la sincronización?</p>
              <p>
                Puedes continuar usando la app en tu teléfono aunque la computadora principal se apague o desconectes el Wi-Fi. Todos tus turnos y clientes quedan guardados en el almacenamiento del celular.
              </p>
              <p>
                Al encender la computadora y reconectarse al Wi-Fi del salón, la app detectará automáticamente el servidor y subirá todos los cambios sin perder información.
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Modal para Crear Cliente Rápido */}
      {showNewClientModal && (
        <div className="fixed inset-0 z-60 bg-graphite-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-rose-gold-200 space-y-3 text-xs animate-scale-up">
            <h4 className="font-serif font-bold text-sm text-graphite-900">
              Crear Nuevo Cliente
            </h4>
            <form onSubmit={handleCreateClient} className="space-y-2.5">
              <div>
                <label className="block font-semibold mb-1">Nombre *</label>
                <input
                  type="text"
                  required
                  value={newClientFirst}
                  onChange={(e) => setNewClientFirst(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-rose-gold-200"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Apellido</label>
                <input
                  type="text"
                  value={newClientLast}
                  onChange={(e) => setNewClientLast(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-rose-gold-200"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Teléfono</label>
                <input
                  type="tel"
                  value={newClientPhone}
                  onChange={(e) => setNewClientPhone(e.target.value)}
                  placeholder="ej. 11 4455-6677"
                  className="w-full p-2.5 rounded-xl border border-rose-gold-200"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewClientModal(false)}
                  className="px-3 py-2 rounded-xl border border-rose-gold-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-rose-gold-600 text-white font-bold"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Resolución de Discrepancias / Conflictos */}
      {conflicts.length > 0 && (
        <ConflictResolutionModal
          conflicts={conflicts}
          onClose={() => setConflicts([])}
        />
      )}

      {/* Barra de Navegación Inferior (Bottom Bar) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-rose-gold-200 flex items-center justify-around py-2 px-1 z-50 shadow-soft pb-safe">
        <button
          type="button"
          onClick={() => setActiveTab('agenda')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
            activeTab === 'agenda' ? 'text-rose-gold-700 font-bold' : 'text-graphite-400'
          }`}
        >
          <Calendar className="w-5 h-5" />
          <span className="text-[10px]">Agenda</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('clients')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
            activeTab === 'clients' ? 'text-rose-gold-700 font-bold' : 'text-graphite-400'
          }`}
        >
          <Users className="w-5 h-5" />
          <span className="text-[10px]">Clientes</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('new_appointment')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
            activeTab === 'new_appointment' ? 'text-rose-gold-700 font-bold' : 'text-graphite-400'
          }`}
        >
          <PlusCircle className="w-5 h-5 text-rose-gold-600" />
          <span className="text-[10px] text-rose-gold-600">Nuevo Turno</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('sync')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all relative ${
            activeTab === 'sync' ? 'text-rose-gold-700 font-bold' : 'text-graphite-400'
          }`}
        >
          <RefreshCw className={`w-5 h-5 ${isSyncing ? 'animate-spin' : ''}`} />
          <span className="text-[10px]">Sync</span>
          {pendingCount > 0 && (
            <span className="absolute top-1 right-3 w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          )}
        </button>
      </nav>
    </div>
  );
};
