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
  DollarSign,
  Tag,
  Edit3,
  Trash2,
  CheckSquare,
  Flame,
  MessageCircle,
} from 'lucide-react';
import { HikariLogo } from '../common/HikariLogo';
import { offlineStorage } from '../../services/offlineStorage';
import { syncService, SyncConflict } from '../../services/syncService';
import { ConflictResolutionModal } from './ConflictResolutionModal';

export const MobileAppView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'agenda' | 'clients' | 'new_appointment' | 'prices' | 'sync'>('agenda');
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

  // Modal de Edición de Turno / Cita
  const [editingAppointment, setEditingAppointment] = useState<any | null>(null);
  const [editStartTime, setEditStartTime] = useState<string>('');
  const [editStaffId, setEditStaffId] = useState<string>('');
  const [editBoxId, setEditBoxId] = useState<string>('');
  const [editStatus, setEditStatus] = useState<string>('scheduled');
  const [editNotes, setEditNotes] = useState<string>('');
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editDeposit, setEditDeposit] = useState<number>(0);

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

  // Búsqueda y Modales de Clientes
  const [clientSearch, setClientSearch] = useState<string>('');
  const [showNewClientModal, setShowNewClientModal] = useState<boolean>(false);
  const [editingClient, setEditingClient] = useState<any | null>(null);
  const [clientFirst, setClientFirst] = useState<string>('');
  const [clientLast, setClientLast] = useState<string>('');
  const [clientPhone, setClientPhone] = useState<string>('');
  const [clientEmail, setClientEmail] = useState<string>('');
  const [clientNotes, setClientNotes] = useState<string>('');

  // Gestión de Precios y Servicios
  const [editingPriceItem, setEditingPriceItem] = useState<any | null>(null);
  const [newPriceValue, setNewPriceValue] = useState<number>(0);
  const [priceSearch, setPriceSearch] = useState<string>('');
  const [showNewServiceModal, setShowNewServiceModal] = useState<boolean>(false);
  const [newServiceName, setNewServiceName] = useState<string>('');
  const [newServicePrice, setNewServicePrice] = useState<number>(0);
  const [newServiceDuration, setNewServiceDuration] = useState<number>(60);
  const [newServiceTreatmentId, setNewServiceTreatmentId] = useState<string>('');

  // PWA banner
  const [showPwaBanner, setShowPwaBanner] = useState<boolean>(true);

  // Iniciar sincronización y listeners
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

  const loadLocalData = async () => {
    const snapshot = await offlineStorage.getSnapshot();
    if (snapshot) {
      setAppointments(snapshot.appointments || []);
      setClients(snapshot.clients || []);
      setTreatments(snapshot.treatments || []);
      setBoxes(snapshot.boxes || []);
      setStaff(snapshot.staff || []);
      setLastSyncedAt(snapshot.lastSyncedAt);

      if (!newStaffId && snapshot.staff?.length > 0) {
        setNewStaffId(snapshot.staff[0].id);
      }
      if (!newBoxId && snapshot.boxes?.length > 0) {
        setNewBoxId(snapshot.boxes[0].id);
      }
      if (!newSubTreatmentId && snapshot.treatments?.[0]?.sub_treatments?.[0]) {
        setNewSubTreatmentId(snapshot.treatments[0].sub_treatments[0].id);
      }
      if (!newServiceTreatmentId && snapshot.treatments?.length > 0) {
        setNewServiceTreatmentId(snapshot.treatments[0].id);
      }
    }
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    await syncService.syncNow();
    await loadLocalData();
    setIsSyncing(false);
  };

  // Cambio de fecha en agenda
  const changeDateOffset = (offset: number) => {
    const current = new Date(selectedDate + 'T00:00:00');
    current.setDate(current.getDate() + offset);
    setSelectedDate(current.toISOString().split('T')[0]);
  };

  // Citas del día seleccionado
  const dayAppointments = appointments.filter((a) => {
    if (!a.start_time) return false;
    return a.start_time.startsWith(selectedDate);
  });

  // ==========================================
  // GESTIÓN DE CITAS / TURNOS
  // ==========================================
  const handleOpenEditAppointment = (appt: any) => {
    setEditingAppointment(appt);
    setEditStartTime(appt.start_time?.substring(11, 16) || '10:00');
    setEditStaffId(appt.staff_id || '');
    setEditBoxId(appt.box_id || '');
    setEditStatus(appt.status || 'scheduled');
    setEditNotes(appt.notes || '');
    setEditPrice(appt.service_price || 0);
    setEditDeposit(appt.deposit_amount || 0);
  };

  const handleSaveEditAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAppointment) return;

    const fullStartTime = `${editingAppointment.start_time.split('T')[0]}T${editStartTime}:00`;
    // Calcular fin estimado sumando 60 mins por defecto o duración previa
    const startDateObj = new Date(fullStartTime);
    const endDateObj = new Date(startDateObj.getTime() + 60 * 60 * 1000);
    const fullEndTime = endDateObj.toISOString().substring(0, 19);

    const updated = {
      ...editingAppointment,
      start_time: fullStartTime,
      end_time: fullEndTime,
      staff_id: editStaffId,
      box_id: editBoxId,
      status: editStatus,
      notes: editNotes,
      service_price: Number(editPrice),
      deposit_amount: Number(editDeposit),
      staff: staff.find((s) => s.id === editStaffId) || editingAppointment.staff,
      box: boxes.find((b) => b.id === editBoxId) || editingAppointment.box,
    };

    // Actualizar estado local
    const newAppts = appointments.map((a) => (a.id === updated.id ? updated : a));
    setAppointments(newAppts);
    await offlineStorage.saveSnapshot({ appointments: newAppts });

    // Registrar mutación para sincronizar
    await syncService.recordOfflineAction('appointment', 'update', updated.id, {
      start_time: fullStartTime,
      end_time: fullEndTime,
      staff_id: editStaffId,
      box_id: editBoxId,
      status: editStatus,
      notes: editNotes,
      service_price: Number(editPrice),
      deposit_amount: Number(editDeposit),
    });

    setEditingAppointment(null);
  };

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientId || !newSubTreatmentId) {
      alert('Por favor selecciona un cliente y un tratamiento.');
      return;
    }

    const startDateTime = `${newDate}T${newTime}:00`;
    const startDateObj = new Date(startDateTime);
    const endDateObj = new Date(startDateObj.getTime() + 60 * 60 * 1000);
    const endDateTime = endDateObj.toISOString().substring(0, 19);

    const newId = `appt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const clientObj = clients.find((c) => c.id === newClientId);
    const staffObj = staff.find((s) => s.id === newStaffId);
    const boxObj = boxes.find((b) => b.id === newBoxId);

    let foundSub: any = null;
    let foundTreat: any = null;
    for (const t of treatments) {
      const sub = t.sub_treatments?.find((st: any) => st.id === newSubTreatmentId);
      if (sub) {
        foundSub = sub;
        foundTreat = t;
        break;
      }
    }

    const newAppt = {
      id: newId,
      client_id: newClientId,
      staff_id: newStaffId || null,
      box_id: newBoxId || null,
      sub_treatment_id: newSubTreatmentId,
      start_time: startDateTime,
      end_time: endDateTime,
      service_price: foundSub?.price || 0,
      deposit_amount: Number(newDeposit) || 0,
      status: 'scheduled',
      notes: newNotes,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      client: clientObj,
      staff: staffObj,
      box: boxObj,
      sub_treatment: foundSub,
      treatment: foundTreat,
    };

    const newAppts = [newAppt, ...appointments];
    setAppointments(newAppts);
    await offlineStorage.saveSnapshot({ appointments: newAppts });

    await syncService.recordOfflineAction('appointment', 'create', newId, {
      client_id: newClientId,
      staff_id: newStaffId,
      box_id: newBoxId,
      sub_treatment_id: newSubTreatmentId,
      start_time: startDateTime,
      end_time: endDateTime,
      service_price: foundSub?.price || 0,
      deposit_amount: Number(newDeposit) || 0,
      status: 'scheduled',
      notes: newNotes,
    });

    setFormSuccess('¡Turno agendado con éxito!');
    setTimeout(() => {
      setFormSuccess('');
      setSelectedDate(newDate);
      setActiveTab('agenda');
    }, 1200);
  };

  // ==========================================
  // GESTIÓN DE CLIENTES
  // ==========================================
  const handleSaveClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientFirst.trim()) return;

    if (editingClient) {
      // Modificar cliente existente
      const updated = {
        ...editingClient,
        first_name: clientFirst.trim(),
        last_name: clientLast.trim(),
        phone: clientPhone.trim(),
        email: clientEmail.trim(),
        notes: clientNotes.trim(),
        updated_at: new Date().toISOString(),
      };

      const newClients = clients.map((c) => (c.id === updated.id ? updated : c));
      setClients(newClients);
      await offlineStorage.saveSnapshot({ clients: newClients });

      await syncService.recordOfflineAction('client', 'update', updated.id, {
        first_name: updated.first_name,
        last_name: updated.last_name,
        phone: updated.phone,
        email: updated.email,
        notes: updated.notes,
      });

      setEditingClient(null);
    } else {
      // Crear nuevo cliente
      const newId = `cli_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const newCli = {
        id: newId,
        first_name: clientFirst.trim(),
        last_name: clientLast.trim(),
        phone: clientPhone.trim(),
        email: clientEmail.trim(),
        notes: clientNotes.trim(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const newClients = [newCli, ...clients];
      setClients(newClients);
      await offlineStorage.saveSnapshot({ clients: newClients });

      await syncService.recordOfflineAction('client', 'create', newId, {
        first_name: newCli.first_name,
        last_name: newCli.last_name,
        phone: newCli.phone,
        email: newCli.email,
        notes: newCli.notes,
      });

      setNewClientId(newId);
      setShowNewClientModal(false);
    }

    setClientFirst('');
    setClientLast('');
    setClientPhone('');
    setClientEmail('');
    setClientNotes('');
  };

  const openEditClientModal = (cli: any) => {
    setEditingClient(cli);
    setClientFirst(cli.first_name || '');
    setClientLast(cli.last_name || '');
    setClientPhone(cli.phone || '');
    setClientEmail(cli.email || '');
    setClientNotes(cli.notes || '');
  };

  // ==========================================
  // GESTIÓN DE PRECIOS Y SERVICIOS
  // ==========================================
  const handleSavePriceUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPriceItem) return;

    const newPrice = Number(newPriceValue);
    // Actualizar en memoria local
    const updatedTreatments = treatments.map((t) => ({
      ...t,
      sub_treatments: t.sub_treatments?.map((st: any) =>
        st.id === editingPriceItem.id ? { ...st, price: newPrice } : st
      ),
    }));

    setTreatments(updatedTreatments);
    await offlineStorage.saveSnapshot({ treatments: updatedTreatments });

    // Enviar mutación para actualizar precio
    await syncService.recordOfflineAction('sub_treatment', 'update_price', editingPriceItem.id, {
      price: newPrice,
    });

    setEditingPriceItem(null);
  };

  const handleCreateNewService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServiceName.trim() || !newServiceTreatmentId) return;

    const newId = `sub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newService = {
      id: newId,
      treatment_id: newServiceTreatmentId,
      name: newServiceName.trim(),
      price: Number(newServicePrice) || 0,
      duration_minutes: Number(newServiceDuration) || 60,
      is_active: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const updatedTreatments = treatments.map((t) => {
      if (t.id === newServiceTreatmentId) {
        return {
          ...t,
          sub_treatments: [...(t.sub_treatments || []), newService],
        };
      }
      return t;
    });

    setTreatments(updatedTreatments);
    await offlineStorage.saveSnapshot({ treatments: updatedTreatments });

    await syncService.recordOfflineAction('sub_treatment', 'create', newId, {
      treatment_id: newServiceTreatmentId,
      name: newService.name,
      price: newService.price,
      duration_minutes: newService.duration_minutes,
    });

    setShowNewServiceModal(false);
    setNewServiceName('');
    setNewServicePrice(0);
    setNewServiceDuration(60);
  };

  // Filtrado de clientes
  const filteredClients = clients.filter((c) => {
    if (!clientSearch) return true;
    const q = clientSearch.toLowerCase();
    const full = `${c.first_name || ''} ${c.last_name || ''} ${c.phone || ''}`.toLowerCase();
    return full.includes(q);
  });

  return (
    <div className="flex flex-col h-screen w-screen bg-silk-50 font-sans text-graphite-900 select-none overflow-hidden">
      {/* Top Mobile Header */}
      <header className="px-4 py-3 bg-white border-b border-rose-gold-200/60 shadow-xs flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <HikariLogo size={28} />
          <div>
            <h1 className="font-serif font-bold text-sm text-graphite-900 leading-tight">
              Hikari Suite Mobile
            </h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  isOnline ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'
                }`}
              />
              <span className="text-[10px] text-graphite-500 font-medium">
                {isOnline ? 'Conectado al Servidor' : 'Modo Offline Autónomo'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {pendingCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              {pendingCount} pend.
            </span>
          )}

          <button
            onClick={handleManualSync}
            disabled={isSyncing}
            className="p-2 rounded-xl bg-silk-100 hover:bg-silk-200 text-rose-gold-800 border border-rose-gold-200 transition-colors"
            title="Sincronizar ahora"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>

      {/* PWA Prompt / Offline Alert Banner */}
      {!isOnline && (
        <div className="bg-amber-500 text-white px-4 py-1.5 text-[11px] font-semibold flex items-center justify-between shadow-xs shrink-0">
          <div className="flex items-center gap-2">
            <WifiOff className="w-3.5 h-3.5" />
            <span>Sin internet. Trabajando con datos locales en tu teléfono.</span>
          </div>
          <span className="text-[10px] bg-white/20 px-1.5 py-0.2 rounded font-mono">OFFLINE</span>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-4 pb-24 space-y-4">
        {/* ========================================================= */}
        {/* TAB 1: AGENDA / CITAS                                     */}
        {/* ========================================================= */}
        {activeTab === 'agenda' && (
          <div className="space-y-4 max-w-lg mx-auto">
            {/* Barra de Navegación de Fecha */}
            <div className="bg-white p-3 rounded-2xl border border-rose-gold-200 shadow-soft flex items-center justify-between">
              <button
                onClick={() => changeDateOffset(-1)}
                className="p-2 rounded-xl bg-silk-100 hover:bg-silk-200 text-graphite-700"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="text-center">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="font-bold text-xs text-graphite-800 bg-transparent text-center border-b border-rose-gold-300 pb-0.5 outline-none cursor-pointer"
                />
                <div className="text-[10px] text-graphite-500 capitalize mt-0.5">
                  {new Date(selectedDate + 'T00:00:00').toLocaleDateString('es-AR', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'short',
                  })}
                </div>
              </div>

              <button
                onClick={() => changeDateOffset(1)}
                className="p-2 rounded-xl bg-silk-100 hover:bg-silk-200 text-graphite-700"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Listado de Turnos del Día */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between px-1">
                <h2 className="font-bold text-xs text-graphite-700 uppercase tracking-wider">
                  Turnos ({dayAppointments.length})
                </h2>
                <button
                  onClick={() => setActiveTab('new_appointment')}
                  className="text-xs font-bold text-rose-gold-700 flex items-center gap-1 hover:underline"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Nuevo Turno</span>
                </button>
              </div>

              {dayAppointments.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-rose-gold-200 text-graphite-400 space-y-2">
                  <Calendar className="w-8 h-8 mx-auto text-rose-gold-300 opacity-70" />
                  <p className="text-xs font-medium">No hay turnos agendados para este día.</p>
                  <button
                    onClick={() => setActiveTab('new_appointment')}
                    className="px-4 py-2 bg-rose-gold-600 hover:bg-rose-gold-700 text-white rounded-xl font-bold text-xs shadow-soft transition-all"
                  >
                    + Agendar Primer Turno
                  </button>
                </div>
              ) : (
                dayAppointments.map((appt) => {
                  const statusColors: Record<string, { bg: string; text: string; label: string }> = {
                    scheduled: { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-800', label: 'Agendado' },
                    in_progress: { bg: 'bg-sky-50 border-sky-200', text: 'text-sky-800', label: 'En Curso' },
                    completed: { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-800', label: 'Cobrado' },
                    cancelled: { bg: 'bg-rose-50 border-rose-200', text: 'text-rose-800', label: 'Cancelado' },
                  };
                  const currentStatus = statusColors[appt.status] || statusColors.scheduled;

                  return (
                    <div
                      key={appt.id}
                      onClick={() => handleOpenEditAppointment(appt)}
                      className="p-3.5 bg-white rounded-2xl border border-rose-gold-200/80 shadow-soft hover:shadow-md transition-all active:scale-[0.99] cursor-pointer space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs px-2 py-0.5 bg-silk-100 rounded-lg text-graphite-800 border border-rose-gold-200/50">
                            {appt.start_time?.substring(11, 16)}
                          </span>
                          <span className="font-bold text-xs text-graphite-900">
                            {appt.client?.first_name} {appt.client?.last_name}
                          </span>
                        </div>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${currentStatus.bg} ${currentStatus.text}`}
                        >
                          {currentStatus.label}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-graphite-600">
                        <div className="flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-rose-gold-600" />
                          <span className="font-medium">
                            {appt.sub_treatment?.name || appt.treatment?.name || 'Tratamiento'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 font-mono text-[11px]">
                          {appt.deposit_amount > 0 && (
                            <span className="text-emerald-700 font-bold">
                              Seña: ${Number(appt.deposit_amount).toLocaleString('es-AR')}
                            </span>
                          )}
                          <span className="font-bold text-graphite-800">
                            ${Number(appt.service_price || 0).toLocaleString('es-AR')}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-silk-200 text-[10px] text-graphite-500">
                        <span>Prof: {appt.staff?.first_name || 'Sin asignar'}</span>
                        <div className="flex items-center gap-2">
                          <span>Box: {appt.box?.name || 'General'}</span>
                          <span className="text-rose-gold-700 font-bold">Editar ✎</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: CLIENTES                                           */}
        {/* ========================================================= */}
        {activeTab === 'clients' && (
          <div className="space-y-4 max-w-lg mx-auto">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-sm text-graphite-800">Fichas de Clientes</h2>
              <button
                onClick={() => {
                  setEditingClient(null);
                  setClientFirst('');
                  setClientLast('');
                  setClientPhone('');
                  setClientEmail('');
                  setClientNotes('');
                  setShowNewClientModal(true);
                }}
                className="px-3 py-1.5 bg-rose-gold-600 hover:bg-rose-gold-700 text-white rounded-xl text-xs font-bold shadow-soft flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nuevo Cliente</span>
              </button>
            </div>

            {/* Buscador */}
            <div className="relative">
              <Search className="w-4 h-4 text-graphite-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Buscar por nombre o teléfono..."
                value={clientSearch}
                onChange={(e) => setClientSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white rounded-xl border border-rose-gold-200 text-xs focus:ring-1 focus:ring-rose-gold-500 outline-none"
              />
            </div>

            {/* Listado */}
            <div className="space-y-2">
              {filteredClients.map((c) => (
                <div
                  key={c.id}
                  className="p-3 bg-white rounded-2xl border border-rose-gold-200 shadow-soft flex items-center justify-between"
                >
                  <div className="space-y-0.5">
                    <h3 className="font-bold text-xs text-graphite-900">
                      {c.first_name} {c.last_name}
                    </h3>
                    {c.phone && (
                      <p className="text-[11px] text-graphite-500 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-rose-gold-600" />
                        <span>{c.phone}</span>
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {c.phone && (
                      <a
                        href={`https://wa.me/${c.phone.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                        title="WhatsApp"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                      </a>
                    )}
                    <button
                      onClick={() => {
                        openEditClientModal(c);
                        setShowNewClientModal(true);
                      }}
                      className="p-2 rounded-xl bg-silk-100 text-graphite-700 hover:bg-silk-200"
                      title="Editar Ficha"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: NUEVO TURNO                                        */}
        {/* ========================================================= */}
        {activeTab === 'new_appointment' && (
          <div className="max-w-lg mx-auto bg-white p-5 rounded-3xl border border-rose-gold-200 shadow-soft space-y-4">
            <h2 className="font-bold text-sm text-graphite-900 flex items-center gap-2">
              <PlusCircle className="w-4 h-4 text-rose-gold-600" />
              <span>Agendar Nuevo Turno a Distancia</span>
            </h2>

            {formSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-bold text-center animate-fade-in">
                {formSuccess}
              </div>
            )}

            <form onSubmit={handleCreateAppointment} className="space-y-3.5 text-xs">
              {/* Cliente */}
              <div>
                <label className="block text-[11px] font-bold text-graphite-700 mb-1">
                  Cliente *
                </label>
                <div className="flex gap-1.5">
                  <select
                    value={newClientId}
                    onChange={(e) => setNewClientId(e.target.value)}
                    required
                    className="flex-1 p-2 bg-silk-50 rounded-xl border border-rose-gold-200 outline-none text-xs"
                  >
                    <option value="">-- Seleccionar Cliente --</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.first_name} {c.last_name} {c.phone ? `(${c.phone})` : ''}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingClient(null);
                      setShowNewClientModal(true);
                    }}
                    className="px-2.5 py-1.5 bg-rose-gold-100 hover:bg-rose-gold-200 text-rose-gold-900 rounded-xl font-bold text-xs"
                    title="Crear Nuevo Cliente"
                  >
                    + Nuevo
                  </button>
                </div>
              </div>

              {/* Tratamiento / Servicio */}
              <div>
                <label className="block text-[11px] font-bold text-graphite-700 mb-1">
                  Servicio / Tratamiento *
                </label>
                <select
                  value={newSubTreatmentId}
                  onChange={(e) => setNewSubTreatmentId(e.target.value)}
                  required
                  className="w-full p-2 bg-silk-50 rounded-xl border border-rose-gold-200 outline-none text-xs"
                >
                  <option value="">-- Seleccionar Servicio --</option>
                  {treatments.map((t) => (
                    <optgroup key={t.id} label={t.name}>
                      {t.sub_treatments?.map((st: any) => (
                        <option key={st.id} value={st.id}>
                          {st.name} — ${Number(st.price || 0).toLocaleString('es-AR')} ({st.duration_minutes}m)
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              {/* Fecha y Hora */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-graphite-700 mb-1">
                    Fecha *
                  </label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    required
                    className="w-full p-2 bg-silk-50 rounded-xl border border-rose-gold-200 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-graphite-700 mb-1">
                    Hora Inicio *
                  </label>
                  <input
                    type="time"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    required
                    className="w-full p-2 bg-silk-50 rounded-xl border border-rose-gold-200 text-xs"
                  />
                </div>
              </div>

              {/* Profesional y Box */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-graphite-700 mb-1">
                    Profesional
                  </label>
                  <select
                    value={newStaffId}
                    onChange={(e) => setNewStaffId(e.target.value)}
                    className="w-full p-2 bg-silk-50 rounded-xl border border-rose-gold-200 text-xs"
                  >
                    <option value="">-- Automático --</option>
                    {staff.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.first_name} {s.last_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-graphite-700 mb-1">
                    Box / Cabina
                  </label>
                  <select
                    value={newBoxId}
                    onChange={(e) => setNewBoxId(e.target.value)}
                    className="w-full p-2 bg-silk-50 rounded-xl border border-rose-gold-200 text-xs"
                  >
                    <option value="">-- Automático --</option>
                    {boxes.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Seña Cobrada */}
              <div>
                <label className="block text-[11px] font-bold text-graphite-700 mb-1">
                  Seña Recibida ($)
                </label>
                <input
                  type="number"
                  min="0"
                  step="500"
                  value={newDeposit}
                  onChange={(e) => setNewDeposit(Number(e.target.value))}
                  placeholder="0"
                  className="w-full p-2 bg-silk-50 rounded-xl border border-rose-gold-200 text-xs"
                />
              </div>

              {/* Observaciones */}
              <div>
                <label className="block text-[11px] font-bold text-graphite-700 mb-1">
                  Notas / Observaciones
                </label>
                <textarea
                  rows={2}
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Detalles sobre el turno o preferencias..."
                  className="w-full p-2 bg-silk-50 rounded-xl border border-rose-gold-200 text-xs resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-gradient-to-r from-rose-gold-600 to-rose-gold-700 text-white rounded-xl font-bold text-xs shadow-soft hover:shadow-md transition-all active:scale-[0.98]"
              >
                Confirmar y Guardar Turno
              </button>
            </form>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 4: PRECIOS Y SERVICIOS                                */}
        {/* ========================================================= */}
        {activeTab === 'prices' && (
          <div className="space-y-4 max-w-lg mx-auto">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-bold text-sm text-graphite-800">Precios y Tratamientos</h2>
                <p className="text-[11px] text-graphite-500">
                  Modifica precios al instante desde tu teléfono
                </p>
              </div>
              <button
                onClick={() => setShowNewServiceModal(true)}
                className="px-3 py-1.5 bg-rose-gold-600 hover:bg-rose-gold-700 text-white rounded-xl text-xs font-bold shadow-soft flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nuevo Servicio</span>
              </button>
            </div>

            {/* Listado de Servicios agrupados */}
            <div className="space-y-3">
              {treatments.map((t) => (
                <div key={t.id} className="bg-white p-3.5 rounded-2xl border border-rose-gold-200 shadow-soft space-y-2">
                  <div className="flex items-center gap-2 border-b border-silk-200 pb-1.5">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: t.color_code || '#C59B7E' }}
                    />
                    <h3 className="font-bold text-xs text-graphite-900">{t.name}</h3>
                  </div>

                  <div className="space-y-2">
                    {t.sub_treatments?.map((st: any) => (
                      <div
                        key={st.id}
                        className="p-2.5 bg-silk-50/60 rounded-xl border border-rose-gold-100 flex items-center justify-between"
                      >
                        <div>
                          <h4 className="font-bold text-xs text-graphite-800">{st.name}</h4>
                          <span className="text-[10px] text-graphite-500">
                            {st.duration_minutes} minutos
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-graphite-900">
                            ${Number(st.price || 0).toLocaleString('es-AR')}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingPriceItem(st);
                              setNewPriceValue(st.price || 0);
                            }}
                            className="p-1.5 rounded-lg bg-white border border-rose-gold-200 text-rose-gold-700 hover:bg-rose-gold-50 shadow-xs flex items-center gap-1 text-[11px] font-bold"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>Editar</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 5: ESTADO DE SINCRONIZACIÓN                           */}
        {/* ========================================================= */}
        {activeTab === 'sync' && (
          <div className="space-y-4 max-w-lg mx-auto">
            <div className="bg-white p-5 rounded-3xl border border-rose-gold-200 shadow-soft space-y-3 text-center">
              <div
                className={`w-12 h-12 mx-auto rounded-2xl flex items-center justify-center ${
                  isOnline ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                }`}
              >
                {isOnline ? <Wifi className="w-6 h-6" /> : <WifiOff className="w-6 h-6" />}
              </div>

              <div>
                <h2 className="font-bold text-sm text-graphite-900">
                  {isOnline ? 'Servidor Conectado y En Línea' : 'Trabajando Fuera de Línea'}
                </h2>
                <p className="text-[11px] text-graphite-500 mt-0.5">
                  {isOnline
                    ? 'Tus cambios se sincronizan en tiempo real con la computadora.'
                    : 'La app continuará funcionando con los datos guardados en este teléfono.'}
                </p>
              </div>

              <div className="p-3 bg-silk-50 rounded-2xl border border-rose-gold-200/60 text-[11px] text-graphite-600 space-y-1">
                <div className="flex justify-between">
                  <span>Cambios locales pendientes:</span>
                  <span className="font-mono font-bold text-graphite-900">{pendingCount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Última sincronización:</span>
                  <span className="font-mono font-bold text-graphite-900">
                    {lastSyncedAt ? new Date(lastSyncedAt).toLocaleTimeString('es-AR') : 'Recién iniciado'}
                  </span>
                </div>
              </div>

              <button
                onClick={handleManualSync}
                disabled={isSyncing}
                className="w-full py-2.5 bg-rose-gold-600 hover:bg-rose-gold-700 text-white rounded-xl font-bold text-xs shadow-soft flex items-center justify-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Sincronizando...' : 'Forzar Sincronización Ahora'}</span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* ========================================================= */}
      {/* MODAL HOJA: EDITAR TURNO / CITA                          */}
      {/* ========================================================= */}
      {editingAppointment && (
        <div className="fixed inset-0 z-50 bg-graphite-950/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-md w-full p-5 border border-rose-gold-200 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-silk-200 pb-2">
              <h3 className="font-serif font-bold text-sm text-graphite-900">
                Editar Cita: {editingAppointment.client?.first_name} {editingAppointment.client?.last_name}
              </h3>
              <button
                onClick={() => setEditingAppointment(null)}
                className="p-1 rounded-full text-graphite-400 hover:text-graphite-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditAppointment} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-graphite-700 mb-1">
                    Hora Inicio
                  </label>
                  <input
                    type="time"
                    value={editStartTime}
                    onChange={(e) => setEditStartTime(e.target.value)}
                    required
                    className="w-full p-2 bg-silk-50 rounded-xl border border-rose-gold-200 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-graphite-700 mb-1">
                    Estado
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full p-2 bg-silk-50 rounded-xl border border-rose-gold-200 text-xs"
                  >
                    <option value="scheduled">Agendado</option>
                    <option value="in_progress">En Curso</option>
                    <option value="completed">Cobrado / Listo</option>
                    <option value="cancelled">Cancelado</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-graphite-700 mb-1">
                    Profesional
                  </label>
                  <select
                    value={editStaffId}
                    onChange={(e) => setEditStaffId(e.target.value)}
                    className="w-full p-2 bg-silk-50 rounded-xl border border-rose-gold-200 text-xs"
                  >
                    <option value="">-- Sin asignar --</option>
                    {staff.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.first_name} {s.last_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-graphite-700 mb-1">
                    Box
                  </label>
                  <select
                    value={editBoxId}
                    onChange={(e) => setEditBoxId(e.target.value)}
                    className="w-full p-2 bg-silk-50 rounded-xl border border-rose-gold-200 text-xs"
                  >
                    <option value="">-- General --</option>
                    {boxes.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-graphite-700 mb-1">
                    Precio Total ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editPrice}
                    onChange={(e) => setEditPrice(Number(e.target.value))}
                    className="w-full p-2 bg-silk-50 rounded-xl border border-rose-gold-200 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-graphite-700 mb-1">
                    Seña Recibida ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editDeposit}
                    onChange={(e) => setEditDeposit(Number(e.target.value))}
                    className="w-full p-2 bg-silk-50 rounded-xl border border-rose-gold-200 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-graphite-700 mb-1">
                  Notas
                </label>
                <textarea
                  rows={2}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full p-2 bg-silk-50 rounded-xl border border-rose-gold-200 text-xs resize-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingAppointment(null)}
                  className="flex-1 py-2.5 bg-silk-100 text-graphite-700 rounded-xl font-bold text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-rose-gold-600 hover:bg-rose-gold-700 text-white rounded-xl font-bold text-xs shadow-soft"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL HOJA: EDITAR / CREAR CLIENTE                       */}
      {/* ========================================================= */}
      {showNewClientModal && (
        <div className="fixed inset-0 z-50 bg-graphite-950/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-md w-full p-5 border border-rose-gold-200 shadow-2xl space-y-3">
            <div className="flex items-center justify-between border-b border-silk-200 pb-2">
              <h3 className="font-serif font-bold text-sm text-graphite-900">
                {editingClient ? 'Editar Ficha de Cliente' : 'Nuevo Cliente'}
              </h3>
              <button
                onClick={() => setShowNewClientModal(false)}
                className="p-1 rounded-full text-graphite-400 hover:text-graphite-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveClient} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-graphite-700 mb-1">Nombre *</label>
                  <input
                    type="text"
                    required
                    value={clientFirst}
                    onChange={(e) => setClientFirst(e.target.value)}
                    className="w-full p-2 bg-silk-50 rounded-xl border border-rose-gold-200 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-graphite-700 mb-1">Apellido</label>
                  <input
                    type="text"
                    value={clientLast}
                    onChange={(e) => setClientLast(e.target.value)}
                    className="w-full p-2 bg-silk-50 rounded-xl border border-rose-gold-200 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-graphite-700 mb-1">Teléfono / WhatsApp</label>
                <input
                  type="tel"
                  placeholder="Ej: 11 5555 5555"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  className="w-full p-2 bg-silk-50 rounded-xl border border-rose-gold-200 text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-graphite-700 mb-1">Email</label>
                <input
                  type="email"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  className="w-full p-2 bg-silk-50 rounded-xl border border-rose-gold-200 text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-graphite-700 mb-1">Observaciones</label>
                <textarea
                  rows={2}
                  value={clientNotes}
                  onChange={(e) => setClientNotes(e.target.value)}
                  className="w-full p-2 bg-silk-50 rounded-xl border border-rose-gold-200 text-xs resize-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewClientModal(false)}
                  className="flex-1 py-2.5 bg-silk-100 text-graphite-700 rounded-xl font-bold text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-rose-gold-600 hover:bg-rose-gold-700 text-white rounded-xl font-bold text-xs shadow-soft"
                >
                  Guardar Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL HOJA: EDITAR PRECIO EN VIVO                         */}
      {/* ========================================================= */}
      {editingPriceItem && (
        <div className="fixed inset-0 z-50 bg-graphite-950/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-sm w-full p-5 border border-rose-gold-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-silk-200 pb-2">
              <h3 className="font-serif font-bold text-sm text-graphite-900">
                Modificar Precio
              </h3>
              <button
                onClick={() => setEditingPriceItem(null)}
                className="p-1 rounded-full text-graphite-400 hover:text-graphite-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] text-graphite-500">Servicio seleccionado:</span>
              <p className="font-bold text-sm text-graphite-800">{editingPriceItem.name}</p>
            </div>

            <form onSubmit={handleSavePriceUpdate} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-graphite-700 mb-1">
                  Nuevo Precio ($)
                </label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  required
                  value={newPriceValue}
                  onChange={(e) => setNewPriceValue(Number(e.target.value))}
                  className="w-full p-2.5 bg-silk-50 rounded-xl border border-rose-gold-300 font-mono font-bold text-sm outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingPriceItem(null)}
                  className="flex-1 py-2.5 bg-silk-100 text-graphite-700 rounded-xl font-bold text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-rose-gold-600 hover:bg-rose-gold-700 text-white rounded-xl font-bold text-xs shadow-soft"
                >
                  Actualizar Precio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL HOJA: NUEVO SERVICIO / TRATAMIENTO                 */}
      {/* ========================================================= */}
      {showNewServiceModal && (
        <div className="fixed inset-0 z-50 bg-graphite-950/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-md w-full p-5 border border-rose-gold-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-silk-200 pb-2">
              <h3 className="font-serif font-bold text-sm text-graphite-900">
                Nuevo Servicio / Tratamiento
              </h3>
              <button
                onClick={() => setShowNewServiceModal(false)}
                className="p-1 rounded-full text-graphite-400 hover:text-graphite-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNewService} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-graphite-700 mb-1">
                  Categoría / Tratamiento *
                </label>
                <select
                  value={newServiceTreatmentId}
                  onChange={(e) => setNewServiceTreatmentId(e.target.value)}
                  required
                  className="w-full p-2 bg-silk-50 rounded-xl border border-rose-gold-200 text-xs"
                >
                  {treatments.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-graphite-700 mb-1">
                  Nombre del Servicio *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Limpieza Profunda con Punta de Diamante"
                  value={newServiceName}
                  onChange={(e) => setNewServiceName(e.target.value)}
                  className="w-full p-2 bg-silk-50 rounded-xl border border-rose-gold-200 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-graphite-700 mb-1">
                    Precio ($) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    required
                    value={newServicePrice}
                    onChange={(e) => setNewServicePrice(Number(e.target.value))}
                    className="w-full p-2 bg-silk-50 rounded-xl border border-rose-gold-200 text-xs font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-graphite-700 mb-1">
                    Duración (min) *
                  </label>
                  <input
                    type="number"
                    min="10"
                    step="5"
                    required
                    value={newServiceDuration}
                    onChange={(e) => setNewServiceDuration(Number(e.target.value))}
                    className="w-full p-2 bg-silk-50 rounded-xl border border-rose-gold-200 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewServiceModal(false)}
                  className="flex-1 py-2.5 bg-silk-100 text-graphite-700 rounded-xl font-bold text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-rose-gold-600 hover:bg-rose-gold-700 text-white rounded-xl font-bold text-xs shadow-soft"
                >
                  Guardar Servicio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* NAVEGACIÓN INFERIOR (BOTTOM BAR)                          */}
      {/* ========================================================= */}
      <nav className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-rose-gold-200/80 px-2 py-2 flex items-center justify-around shadow-lg z-40">
        <button
          onClick={() => setActiveTab('agenda')}
          className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all ${
            activeTab === 'agenda'
              ? 'text-rose-gold-700 font-bold'
              : 'text-graphite-400 hover:text-graphite-700'
          }`}
        >
          <Calendar className="w-5 h-5" />
          <span className="text-[10px]">Agenda</span>
        </button>

        <button
          onClick={() => setActiveTab('clients')}
          className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all ${
            activeTab === 'clients'
              ? 'text-rose-gold-700 font-bold'
              : 'text-graphite-400 hover:text-graphite-700'
          }`}
        >
          <Users className="w-5 h-5" />
          <span className="text-[10px]">Clientes</span>
        </button>

        <button
          onClick={() => setActiveTab('new_appointment')}
          className="flex flex-col items-center -mt-5"
        >
          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-rose-gold-600 to-rose-gold-700 text-white flex items-center justify-center shadow-lg border-2 border-white hover:scale-105 active:scale-95 transition-all">
            <Plus className="w-6 h-6" />
          </div>
          <span className="text-[10px] font-bold text-rose-gold-700 mt-1">Nuevo</span>
        </button>

        <button
          onClick={() => setActiveTab('prices')}
          className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all ${
            activeTab === 'prices'
              ? 'text-rose-gold-700 font-bold'
              : 'text-graphite-400 hover:text-graphite-700'
          }`}
        >
          <DollarSign className="w-5 h-5" />
          <span className="text-[10px]">Precios</span>
        </button>

        <button
          onClick={() => setActiveTab('sync')}
          className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all ${
            activeTab === 'sync'
              ? 'text-rose-gold-700 font-bold'
              : 'text-graphite-400 hover:text-graphite-700'
          }`}
        >
          <RefreshCw className="w-5 h-5" />
          <span className="text-[10px]">Sync</span>
        </button>
      </nav>
    </div>
  );
};
