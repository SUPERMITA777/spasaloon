import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { SubTreatment, Client } from '../../types';
import { api } from '../../services/api';
import { X, Sparkles, Clock, Calendar, LayoutGrid, User, UserCheck, DollarSign, UserPlus, Search, Phone } from 'lucide-react';

interface Props {
  initialBoxId?: string;
  initialTime?: string;
  onClose: () => void;
}

export const NewAppointmentModal: React.FC<Props> = ({ initialBoxId, initialTime, onClose }) => {
  const { clients, staff, boxes, treatments, selectedDate, refreshAppointments, refreshAllData, addToast } = useApp();

  // Cliente - búsqueda y selección
  const [clientId, setClientId] = useState<string>('');
  const [clientSearch, setClientSearch] = useState('');
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const clientInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Quick-create modal
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [quickFirstName, setQuickFirstName] = useState('');
  const [quickLastName, setQuickLastName] = useState('');
  const [quickPhone, setQuickPhone] = useState('');
  const [creatingClient, setCreatingClient] = useState(false);

  const [staffId, setStaffId] = useState<string>(staff[0]?.id || '');
  const [boxId, setBoxId] = useState<string>(initialBoxId || boxes[0]?.id || '');
  
  // Filtrar boxes que estén disponibles en la fecha seleccionada
  const availableBoxes = boxes.filter((b) => {
    if (!b.is_active) return false;
    if (!b.is_temporary) return true;
    const selDate = new Date(selectedDate);
    if (b.available_from && new Date(b.available_from) > selDate) return false;
    if (b.available_to && new Date(b.available_to) < selDate) return false;
    return true;
  });

  const selectedBox = boxes.find((b) => b.id === boxId);
  const allSubTreatments = treatments.flatMap((t) =>
    (t.sub_treatments || []).map((st: SubTreatment) => ({
      ...st,
      categoryName: t.name,
      categoryColor: t.color_code,
    }))
  );

  const [subTreatmentId, setSubTreatmentId] = useState<string>(allSubTreatments[0]?.id || '');
  const [startTime, setStartTime] = useState<string>(initialTime || '10:00');
  const [depositAmount, setDepositAmount] = useState<number>(0);
  const [depositPaymentMethod, setDepositPaymentMethod] = useState<string>('cash');
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const selectedSub = allSubTreatments.find((st) => st.id === subTreatmentId);
  const selectedClient = clients.find((c) => c.id === clientId);

  // Filtrar clientes por búsqueda
  const filteredClients = clientSearch.trim()
    ? clients.filter((c) => {
        const fullName = `${c.first_name} ${c.last_name}`.toLowerCase();
        const phone = c.phone || '';
        const search = clientSearch.toLowerCase();
        return fullName.includes(search) || phone.includes(search);
      })
    : clients;

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        clientInputRef.current &&
        !clientInputRef.current.contains(e.target as Node)
      ) {
        setShowClientDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectClient = (client: Client) => {
    setClientId(client.id);
    setClientSearch(`${client.first_name} ${client.last_name}`);
    setShowClientDropdown(false);
    setHighlightedIndex(-1);
  };

  const handleClientInputChange = (value: string) => {
    setClientSearch(value);
    setClientId(''); // Reset selection when typing
    setShowClientDropdown(true);
    setHighlightedIndex(-1);
  };

  const handleClientKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => Math.min(prev + 1, filteredClients.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && filteredClients[highlightedIndex]) {
        handleSelectClient(filteredClients[highlightedIndex]);
      } else if (filteredClients.length === 1) {
        // Solo un resultado, seleccionar automáticamente
        handleSelectClient(filteredClients[0]);
      } else if (filteredClients.length === 0 && clientSearch.trim()) {
        // No se encontró: abrir modal de creación rápida
        openQuickCreate();
      }
    } else if (e.key === 'Escape') {
      setShowClientDropdown(false);
    }
  };

  const openQuickCreate = () => {
    // Intentar separar nombre y apellido del texto buscado
    const parts = clientSearch.trim().split(/\s+/);
    if (parts.length >= 2) {
      setQuickFirstName(parts[0]);
      setQuickLastName(parts.slice(1).join(' '));
    } else {
      setQuickFirstName(clientSearch.trim());
      setQuickLastName('');
    }
    setQuickPhone('');
    setShowQuickCreate(true);
    setShowClientDropdown(false);
  };

  const handleQuickCreateClient = async () => {
    if (!quickFirstName.trim()) {
      addToast({ type: 'warning', title: 'Ingrese al menos el nombre del cliente' });
      return;
    }
    if (!quickPhone.trim()) {
      addToast({ type: 'warning', title: 'Ingrese el número de WhatsApp del cliente' });
      return;
    }

    try {
      setCreatingClient(true);
      const newClient = await api.createClient({
        first_name: quickFirstName.trim(),
        last_name: quickLastName.trim(),
        phone: quickPhone.trim(),
        email: null,
        birth_date: null,
        dni: null,
        notes: null,
        profile_photo_url: null,
      });

      // Refrescar lista de clientes y seleccionar el nuevo
      await refreshAllData();
      setClientId(newClient.id);
      setClientSearch(`${newClient.first_name} ${newClient.last_name}`);
      setShowQuickCreate(false);
      addToast({ type: 'success', title: `¡Cliente ${newClient.first_name} ${newClient.last_name} creado!` });
    } catch (error: any) {
      addToast({ type: 'error', title: 'Error al crear cliente', message: error.message });
    } finally {
      setCreatingClient(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId || !staffId || !boxId || !subTreatmentId) {
      addToast({ type: 'warning', title: 'Por favor complete todos los campos requeridos' });
      return;
    }

    // Validar rango horario del box
    const currentBox = boxes.find((b) => b.id === boxId);
    if (currentBox && currentBox.start_time && currentBox.end_time) {
      const duration = selectedSub?.duration_minutes || 45;
      const startDateTime = new Date(`${selectedDate}T${startTime}:00`);
      const endDateTime = new Date(startDateTime.getTime() + duration * 60000);
      const apptStartHM = `${String(startDateTime.getHours()).padStart(2, '0')}:${String(startDateTime.getMinutes()).padStart(2, '0')}`;
      const apptEndHM = `${String(endDateTime.getHours()).padStart(2, '0')}:${String(endDateTime.getMinutes()).padStart(2, '0')}`;

      if (apptStartHM < currentBox.start_time || apptEndHM > currentBox.end_time) {
        addToast({
          type: 'error',
          title: 'Horario fuera del rango del Box',
          message: `El ${currentBox.name} opera de ${currentBox.start_time} a ${currentBox.end_time}.`,
        });
        return;
      }
    }

    try {
      setLoading(true);
      const duration = selectedSub?.duration_minutes || 45;
      
      // Calcular start_time y end_time ISO
      const startDateTime = new Date(`${selectedDate}T${startTime}:00`);
      const endDateTime = new Date(startDateTime.getTime() + duration * 60000);

      await api.createAppointment({
        client_id: clientId,
        staff_id: staffId,
        sub_treatment_id: subTreatmentId,
        box_id: boxId,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        deposit_amount: Number(depositAmount),
        deposit_payment_method: depositAmount > 0 ? depositPaymentMethod : null,
        notes: notes.trim() || null,
      });

      await refreshAppointments();
      addToast({ type: 'success', title: '¡Turno agendado exitosamente!' });
      onClose();
    } catch (error: any) {
      addToast({ type: 'error', title: 'No se pudo agendar el turno', message: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-graphite-900/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-soft-lg border border-rose-gold-200 overflow-hidden animate-scale-up">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-rose-gold-600 to-rose-gold-500 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-5 h-5" />
            <h2 className="font-serif font-bold text-lg">Agendar Nuevo Turno</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 bg-silk-50/50">
          {/* Sub-treatment Selection */}
          <div>
            <label className="block text-xs font-semibold text-graphite-700 mb-1">
              Tratamiento / Servicio a Realizar *
            </label>
            <select
              value={subTreatmentId}
              onChange={(e) => setSubTreatmentId(e.target.value)}
              required
              className="w-full text-xs p-2.5 rounded-xl bg-white border border-rose-gold-200 text-graphite-800 focus:outline-none focus:ring-1 focus:ring-rose-gold-400"
            >
              {allSubTreatments.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.categoryName} — {st.name} ({st.duration_minutes} min | ${st.base_price.toLocaleString('es-AR')})
                </option>
              ))}
            </select>
          </div>

          {/* Client Search + Autocomplete */}
          <div className="relative">
            <label className="block text-xs font-semibold text-graphite-700 mb-1">
              Cliente / Consultante *
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-graphite-400" />
              <input
                ref={clientInputRef}
                type="text"
                value={clientSearch}
                onChange={(e) => handleClientInputChange(e.target.value)}
                onFocus={() => setShowClientDropdown(true)}
                onKeyDown={handleClientKeyDown}
                placeholder="Escribí el nombre del cliente..."
                className={`w-full text-xs p-2.5 pl-9 pr-10 rounded-xl border focus:outline-none focus:ring-1 ${
                  clientId
                    ? 'bg-green-50 border-green-300 text-green-900 focus:ring-green-400'
                    : 'bg-white border-rose-gold-200 text-graphite-800 focus:ring-rose-gold-400'
                }`}
              />
              {clientId && (
                <UserCheck className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-600" />
              )}
            </div>

            {/* Dropdown de resultados */}
            {showClientDropdown && (
              <div
                ref={dropdownRef}
                className="absolute z-20 mt-1 w-full bg-white rounded-2xl border border-rose-gold-200 shadow-soft-lg max-h-48 overflow-y-auto"
              >
                {filteredClients.length > 0 ? (
                  filteredClients.slice(0, 8).map((c, idx) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => handleSelectClient(c)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-xs transition-colors ${
                        idx === highlightedIndex
                          ? 'bg-rose-gold-50 text-rose-gold-900'
                          : 'hover:bg-silk-50 text-graphite-800'
                      }`}
                    >
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-rose-gold-200 to-rose-gold-300 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                        {c.first_name[0]}{c.last_name?.[0] || ''}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="font-semibold block truncate">{c.first_name} {c.last_name}</span>
                        <span className="text-graphite-500 text-[10px]">{c.phone}</span>
                      </div>
                    </button>
                  ))
                ) : clientSearch.trim() ? (
                  <div className="p-4 text-center space-y-2">
                    <p className="text-xs text-graphite-500">
                      No se encontró "<b>{clientSearch}</b>"
                    </p>
                    <button
                      type="button"
                      onClick={openQuickCreate}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-rose-gold-500 to-rose-gold-600 text-white text-xs font-bold shadow-soft hover:shadow-md transition-all"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      Crear cliente nuevo
                    </button>
                    <p className="text-[10px] text-graphite-400">o presioná Enter ↵</p>
                  </div>
                ) : null}
              </div>
            )}
          </div>

          {/* Staff and Box in Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-graphite-700 mb-1">
                Profesional Asignada *
              </label>
              <select
                value={staffId}
                onChange={(e) => setStaffId(e.target.value)}
                required
                className="w-full text-xs p-2.5 rounded-xl bg-white border border-rose-gold-200 text-graphite-800 focus:outline-none focus:ring-1 focus:ring-rose-gold-400"
              >
                {staff.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.first_name} {s.last_name} ({s.role})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-graphite-700 mb-1">
                Box / Sala de Atención *
              </label>
              <select
                value={boxId}
                onChange={(e) => setBoxId(e.target.value)}
                required
                className="w-full text-xs p-2.5 rounded-xl bg-white border border-rose-gold-200 text-graphite-800 focus:outline-none focus:ring-1 focus:ring-rose-gold-400"
              >
                {availableBoxes.length === 0 ? (
                  <option value="">No hay boxes activos en esta fecha</option>
                ) : (
                  availableBoxes.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.start_time || '08:00'} - {b.end_time || '21:00'})
                    </option>
                  ))
                )}
              </select>
              {selectedBox && (
                <p className="text-[10px] text-graphite-500 mt-1">
                  🕒 Horario del box: {selectedBox.start_time || '08:00'} a {selectedBox.end_time || '21:00'}
                </p>
              )}
            </div>
          </div>

          {/* Time & Duration */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-graphite-700 mb-1">
                Hora de Inicio *
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                className="w-full text-xs p-2.5 rounded-xl bg-white border border-rose-gold-200 text-graphite-800 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-graphite-700 mb-1">
                Duración Estimada
              </label>
              <div className="w-full text-xs p-2.5 rounded-xl bg-silk-100 border border-rose-gold-200 text-graphite-600 font-semibold">
                {selectedSub?.duration_minutes || 45} minutos
              </div>
            </div>
          </div>

          {/* Deposit (Seña) */}
          <div className="grid grid-cols-2 gap-3 p-3 bg-white rounded-2xl border border-rose-gold-100">
            <div>
              <label className="block text-xs font-semibold text-graphite-700 mb-1">
                Seña Pagada ($):
              </label>
              <input
                type="number"
                min="0"
                step="500"
                value={depositAmount}
                onChange={(e) => setDepositAmount(Number(e.target.value))}
                placeholder="0"
                className="w-full text-xs p-2 rounded-xl bg-silk-50 border border-rose-gold-200 font-bold text-graphite-800 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-graphite-700 mb-1">
                Medio de Pago Seña:
              </label>
              <select
                value={depositPaymentMethod}
                onChange={(e) => setDepositPaymentMethod(e.target.value)}
                disabled={depositAmount <= 0}
                className="w-full text-xs p-2 rounded-xl bg-silk-50 border border-rose-gold-200 text-graphite-800 focus:outline-none disabled:opacity-50"
              >
                <option value="cash">Efectivo</option>
                <option value="transfer">Transferencia</option>
                <option value="qr_mercadopago">MercadoPago QR</option>
                <option value="card_credit">Tarjeta</option>
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-graphite-700 mb-1">
              Notas internas / Observaciones:
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Primera vez, piel sensible, traer toalla personal..."
              className="w-full text-xs p-2.5 rounded-xl bg-white border border-rose-gold-200 text-graphite-800 focus:outline-none"
            />
          </div>

          {/* Submit Buttons */}
          <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-rose-gold-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-rose-gold-300 text-xs font-semibold text-graphite-700 hover:bg-silk-100 transition-colors"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={loading || !clientId}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-rose-gold-500 to-rose-gold-600 hover:from-rose-gold-600 hover:to-rose-gold-700 text-white text-xs font-semibold shadow-soft transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Agendando...' : 'Confirmar Turno'}
            </button>
          </div>
        </form>
      </div>

      {/* ===== MODAL RÁPIDO: Crear Cliente Nuevo ===== */}
      {showQuickCreate && (
        <div className="fixed inset-0 z-[60] bg-graphite-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-soft-lg border border-rose-gold-200 overflow-hidden animate-scale-up">
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-rose-gold-500 to-rose-gold-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5" />
                <h3 className="font-serif font-bold text-base">Nuevo Cliente Rápido</h3>
              </div>
              <button
                onClick={() => setShowQuickCreate(false)}
                className="p-1 rounded-full bg-white/20 hover:bg-white/30 text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 bg-silk-50/50">
              <p className="text-[11px] text-graphite-500 leading-relaxed">
                Cliente no encontrado. Completá los datos mínimos para crearlo al instante y agendar el turno.
              </p>

              {/* Nombre */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-graphite-700 mb-1">Nombre *</label>
                  <input
                    type="text"
                    value={quickFirstName}
                    onChange={(e) => setQuickFirstName(e.target.value)}
                    placeholder="María"
                    autoFocus
                    className="w-full text-xs p-2.5 rounded-xl bg-white border border-rose-gold-200 text-graphite-800 focus:outline-none focus:ring-1 focus:ring-rose-gold-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-graphite-700 mb-1">Apellido</label>
                  <input
                    type="text"
                    value={quickLastName}
                    onChange={(e) => setQuickLastName(e.target.value)}
                    placeholder="González"
                    className="w-full text-xs p-2.5 rounded-xl bg-white border border-rose-gold-200 text-graphite-800 focus:outline-none focus:ring-1 focus:ring-rose-gold-400"
                  />
                </div>
              </div>

              {/* WhatsApp */}
              <div>
                <label className="block text-xs font-semibold text-graphite-700 mb-1">
                  <Phone className="w-3.5 h-3.5 inline mr-1" />
                  Número de WhatsApp *
                </label>
                <input
                  type="tel"
                  value={quickPhone}
                  onChange={(e) => setQuickPhone(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleQuickCreateClient();
                    }
                  }}
                  placeholder="+54 9 11 1234-5678"
                  className="w-full text-sm p-3 rounded-xl bg-white border-2 border-green-300 text-graphite-800 focus:outline-none focus:ring-2 focus:ring-green-400 font-semibold tracking-wide"
                />
                <p className="text-[10px] text-graphite-400 mt-1">
                  Podés completar el resto de los datos después desde la ficha del cliente.
                </p>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-rose-gold-100">
                <button
                  type="button"
                  onClick={() => setShowQuickCreate(false)}
                  className="px-4 py-2 rounded-xl border border-rose-gold-300 text-xs font-semibold text-graphite-700 hover:bg-silk-100 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleQuickCreateClient}
                  disabled={creatingClient || !quickFirstName.trim() || !quickPhone.trim()}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white text-xs font-bold shadow-soft transition-all disabled:opacity-50"
                >
                  {creatingClient ? 'Creando...' : '✓ Crear y Seleccionar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
