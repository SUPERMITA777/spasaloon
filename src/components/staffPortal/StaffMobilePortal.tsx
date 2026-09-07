import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Appointment, Product, SubTreatment } from '../../types';
import {
  Sparkles,
  Lock,
  Clock,
  LayoutGrid,
  User,
  ShoppingCart,
  Plus,
  Trash2,
  CheckCircle2,
  Calendar,
  RefreshCw,
  LogOut,
} from 'lucide-react';

export const StaffMobilePortal: React.FC = () => {
  const [token, setToken] = useState<string>('');
  const [staffInfo, setStaffInfo] = useState<any>(null);
  const [pin, setPin] = useState<string>('');
  const [authenticated, setAuthenticated] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  // Datos del portal
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [treatments, setTreatments] = useState<any[]>([]);
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);

  // Form para sumar ítems
  const [selectedProdId, setSelectedProdId] = useState<string>('');
  const [selectedSubId, setSelectedSubId] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  useEffect(() => {
    // Obtener token de la URL (?token=...)
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get('token') || '';
    setToken(tokenParam);

    if (tokenParam) {
      loadStaffInfo(tokenParam);
    } else {
      setLoading(false);
    }
  }, []);

  const loadStaffInfo = async (t: string) => {
    try {
      setLoading(true);
      setError('');
      const data = await api.getStaffByToken(t);
      setStaffInfo(data);
    } catch (err: any) {
      setError('Enlace QR no válido o expirado.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    try {
      setLoading(true);
      setError('');
      const res = await api.verifyStaffPin(token, pin);
      setStaffInfo(res.staff);
      setAuthenticated(true);
      await loadPortalData(res.staff.id);
    } catch (err: any) {
      setError('PIN incorrecto. Por favor intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const loadPortalData = async (staffId: string) => {
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const [appts, prods, treats] = await Promise.all([
        api.getAppointments({ date: todayStr, staff_id: staffId }),
        api.getProducts({ is_for_sale: true }),
        api.getTreatments(),
      ]);
      setAppointments(appts);
      setProducts(prods);
      setTreatments(treats);
    } catch (err: any) {
      console.error('Error al cargar datos del portal móvil:', err);
    }
  };

  const refreshPortal = async () => {
    if (staffInfo) {
      await loadPortalData(staffInfo.id);
    }
  };

  // Agregar producto al carrito desde el celular
  const handleAddProduct = async () => {
    if (!selectedAppt || !selectedProdId) return;
    const prod = products.find((p) => p.id === selectedProdId);
    if (!prod) return;

    try {
      setActionLoading(true);
      await api.addCartItem(selectedAppt.id, {
        item_type: 'product',
        item_id: prod.id,
        name: prod.name,
        quantity: 1,
        unit_price: prod.sale_price,
        staff_id: staffInfo.id,
      });
      setSelectedProdId('');
      await refreshPortal();
      // Actualizar turno seleccionado
      const updated = await api.getAppointmentById(selectedAppt.id);
      setSelectedAppt(updated);
    } catch (err: any) {
      alert('Error al agregar producto: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Agregar sub-tratamiento extra al carrito desde el celular
  const handleAddSubTreatment = async () => {
    if (!selectedAppt || !selectedSubId) return;
    const allSubs: SubTreatment[] = treatments.flatMap((t) => t.sub_treatments || []);
    const sub = allSubs.find((s) => s.id === selectedSubId);
    if (!sub) return;

    try {
      setActionLoading(true);
      await api.addCartItem(selectedAppt.id, {
        item_type: 'sub_treatment',
        item_id: sub.id,
        name: sub.name,
        quantity: 1,
        unit_price: sub.base_price,
        staff_id: staffInfo.id,
      });
      setSelectedSubId('');
      await refreshPortal();
      const updated = await api.getAppointmentById(selectedAppt.id);
      setSelectedAppt(updated);
    } catch (err: any) {
      alert('Error al sumar servicio: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Quitar ítem del carrito
  const handleRemoveCartItem = async (cartItemId: string) => {
    if (!selectedAppt) return;
    try {
      setActionLoading(true);
      await api.removeCartItem(selectedAppt.id, cartItemId);
      await refreshPortal();
      const updated = await api.getAppointmentById(selectedAppt.id);
      setSelectedAppt(updated);
    } catch (err: any) {
      alert('Error al quitar ítem: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Vista de Bloqueo / Entrada de PIN
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-silk-100 flex flex-col items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-soft-lg border border-rose-gold-200 text-center space-y-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-rose-gold-500 to-rose-gold-300 flex items-center justify-center mx-auto text-white shadow-soft">
            <Lock className="w-6 h-6" />
          </div>

          <div>
            <h1 className="font-serif font-bold text-xl text-graphite-900">
              Portal del Profesional
            </h1>
            {staffInfo ? (
              <p className="text-xs text-rose-gold-700 font-semibold mt-1">
                Hola, {staffInfo.first_name} ({staffInfo.role})
              </p>
            ) : (
              <p className="text-xs text-graphite-500 mt-1">
                Acceso seguro en red local del consultorio
              </p>
            )}
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
              {error}
            </div>
          )}

          <form onSubmit={handleVerifyPin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-graphite-600 mb-1.5">
                Ingresa tu PIN de 4 dígitos:
              </label>
              <input
                type="password"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                autoFocus
                pattern="[0-9]*"
                inputMode="numeric"
                placeholder="••••"
                className="w-full text-center text-2xl tracking-widest font-mono p-3 rounded-2xl bg-silk-50 border border-rose-gold-300 text-graphite-900 focus:outline-none focus:ring-2 focus:ring-rose-gold-400"
              />
            </div>

            <button
              type="submit"
              disabled={loading || pin.length < 4}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-rose-gold-500 to-rose-gold-600 text-white text-xs font-bold shadow-soft hover:shadow-soft-md transition-all disabled:opacity-50"
            >
              {loading ? 'Verificando...' : 'Acceder a mi Agenda'}
            </button>
          </form>

          <p className="text-[10px] text-graphite-400">
            Conectado a la red local del centro (100% Offline)
          </p>
        </div>
      </div>
    );
  }

  // Vista Principal del Profesional en Celular
  const todayFormatted = new Date().toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <div className="min-h-screen bg-silk-100 flex flex-col pb-10">
      {/* Mobile Top Header */}
      <header className="bg-white border-b border-rose-gold-200/80 p-4 sticky top-0 z-20 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-sm"
            style={{ backgroundColor: staffInfo.color_code || '#C59B7E' }}
          >
            {staffInfo.first_name[0]}
          </div>
          <div>
            <h2 className="font-serif font-bold text-sm text-graphite-900 leading-tight">
              {staffInfo.first_name} {staffInfo.last_name}
            </h2>
            <span className="text-[10px] text-rose-gold-600 font-semibold capitalize">
              {staffInfo.role} • {todayFormatted}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={refreshPortal}
            className="p-2 rounded-xl bg-silk-100 hover:bg-silk-200 text-graphite-700 transition-colors"
            title="Actualizar agenda"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={() => setAuthenticated(false)}
            className="p-2 rounded-xl bg-silk-100 hover:bg-rose-50 text-graphite-500 hover:text-rose-600 transition-colors"
            title="Cerrar sesión"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content: Assigned Appointments */}
      <main className="p-4 max-w-md w-full mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-serif font-bold text-sm text-graphite-900">
            Mis Turnos de Hoy ({appointments.length})
          </h3>
          <span className="text-[10px] bg-sage-100 text-sage-800 px-2 py-0.5 rounded-full font-semibold">
            Red Local Activa
          </span>
        </div>

        {appointments.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-rose-gold-100 space-y-2">
            <Sparkles className="w-8 h-8 text-rose-gold-400 mx-auto" />
            <h4 className="font-serif font-bold text-sm text-graphite-800">
              No tienes turnos para hoy
            </h4>
            <p className="text-xs text-graphite-500">
              Disfruta tu jornada o consulta en recepción si se agenda uno nuevo.
            </p>
          </div>
        ) : (
          appointments.map((appt) => {
            const isSelected = selectedAppt?.id === appt.id;
            const startTime = new Date(appt.start_time).toLocaleTimeString('es-AR', {
              hour: '2-digit',
              minute: '2-digit',
            });
            const endTime = new Date(appt.end_time).toLocaleTimeString('es-AR', {
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={appt.id}
                className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden shadow-soft ${
                  isSelected
                    ? 'border-rose-gold-400 ring-2 ring-rose-gold-200'
                    : 'border-rose-gold-100 hover:border-rose-gold-300'
                }`}
              >
                {/* Appointment Card Header */}
                <div
                  onClick={() => setSelectedAppt(isSelected ? null : appt)}
                  className="p-4 cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-rose-gold-700">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{startTime} - {endTime} hs</span>
                      </div>
                      <h4 className="font-serif font-bold text-base text-graphite-900 mt-1">
                        {appt.client?.first_name} {appt.client?.last_name}
                      </h4>
                      <p className="text-xs font-semibold text-graphite-600">
                        {appt.sub_treatment?.name}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-silk-100 border border-rose-gold-200 text-xs font-bold text-graphite-800">
                        <LayoutGrid className="w-3 h-3 text-rose-gold-600" />
                        {appt.box?.name}
                      </span>
                    </div>
                  </div>

                  {/* Cart badge summary */}
                  {appt.cart_items && appt.cart_items.length > 0 && (
                    <div className="mt-2.5 flex items-center gap-1.5 text-[11px] font-semibold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                      <ShoppingCart className="w-3 h-3 text-amber-600" />
                      <span>{appt.cart_items.length} consumos/productos sumados</span>
                    </div>
                  )}
                </div>

                {/* Expanded Details & Cart Actions */}
                {isSelected && (
                  <div className="p-4 bg-silk-50/80 border-t border-rose-gold-100 space-y-4">
                    {/* Notes if any */}
                    {appt.notes && (
                      <div className="p-2.5 rounded-xl bg-white border border-rose-gold-100 text-xs text-graphite-700">
                        <span className="font-semibold text-graphite-900">Nota: </span>
                        {appt.notes}
                      </div>
                    )}

                    {/* Live Cart Items */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-serif font-bold text-xs text-graphite-900 flex items-center gap-1.5">
                          <ShoppingCart className="w-3.5 h-3.5 text-rose-gold-600" />
                          Consumos en Cabina (Carrito)
                        </h5>
                      </div>

                      {appt.cart_items && appt.cart_items.length > 0 ? (
                        <div className="space-y-1.5">
                          {appt.cart_items.map((item) => (
                            <div
                              key={item.id}
                              className="flex items-center justify-between p-2 rounded-xl bg-white border border-rose-gold-100 text-xs"
                            >
                              <div>
                                <span className="font-medium text-graphite-900">{item.name}</span>
                                <span className="ml-2 text-[10px] text-graphite-500">
                                  ${item.subtotal.toLocaleString('es-AR')}
                                </span>
                              </div>
                              <button
                                onClick={() => handleRemoveCartItem(item.id)}
                                className="text-rose-400 hover:text-rose-600 p-1 rounded-lg"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[11px] text-graphite-400 italic">
                          No hay consumos extras agregados a esta cita.
                        </p>
                      )}
                    </div>

                    {/* Add Product from Phone */}
                    <div className="p-3 bg-white rounded-xl border border-rose-gold-100 space-y-2">
                      <label className="block text-[11px] font-semibold text-graphite-700">
                        + Sumar Producto para el Cliente:
                      </label>
                      <div className="flex gap-1.5">
                        <select
                          value={selectedProdId}
                          onChange={(e) => setSelectedProdId(e.target.value)}
                          className="flex-1 text-xs bg-silk-50 border border-rose-gold-200 rounded-xl px-2 py-1.5 text-graphite-800 focus:outline-none"
                        >
                          <option value="">Seleccionar producto...</option>
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} (${p.sale_price.toLocaleString('es-AR')})
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={handleAddProduct}
                          disabled={!selectedProdId || actionLoading}
                          className="px-3 py-1.5 rounded-xl bg-rose-gold-500 text-white text-xs font-bold disabled:opacity-50"
                        >
                          Sumar
                        </button>
                      </div>
                    </div>

                    {/* Add Extra Service from Phone */}
                    <div className="p-3 bg-white rounded-xl border border-rose-gold-100 space-y-2">
                      <label className="block text-[11px] font-semibold text-graphite-700">
                        + Sumar Tratamiento / Servicio Extra:
                      </label>
                      <div className="flex gap-1.5">
                        <select
                          value={selectedSubId}
                          onChange={(e) => setSelectedSubId(e.target.value)}
                          className="flex-1 text-xs bg-silk-50 border border-rose-gold-200 rounded-xl px-2 py-1.5 text-graphite-800 focus:outline-none"
                        >
                          <option value="">Seleccionar servicio extra...</option>
                          {treatments.flatMap((t) =>
                            (t.sub_treatments || []).map((sub: SubTreatment) => (
                              <option key={sub.id} value={sub.id}>
                                {sub.name} (${sub.base_price.toLocaleString('es-AR')})
                              </option>
                            ))
                          )}
                        </select>
                        <button
                          onClick={handleAddSubTreatment}
                          disabled={!selectedSubId || actionLoading}
                          className="px-3 py-1.5 rounded-xl bg-rose-gold-500 text-white text-xs font-bold disabled:opacity-50"
                        >
                          Sumar
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </main>
    </div>
  );
};
