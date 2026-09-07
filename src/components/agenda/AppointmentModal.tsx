import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Appointment, Product, SubTreatment } from '../../types';
import { api } from '../../services/api';
import {
  X,
  Clock,
  User,
  UserCheck,
  LayoutGrid,
  Sparkles,
  DollarSign,
  ShoppingCart,
  Plus,
  Trash2,
  Send,
  CheckCircle2,
  Receipt,
  FileText,
  AlertCircle,
} from 'lucide-react';

interface Props {
  appointment: Appointment;
  onClose: () => void;
}

export const AppointmentModal: React.FC<Props> = ({ appointment, onClose }) => {
  const { products, treatments, staff, boxes, refreshAppointments, addToast, activeShift } = useApp();
  
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [selectedSubTreatmentId, setSelectedSubTreatmentId] = useState<string>('');
  const [loadingAction, setLoadingAction] = useState<boolean>(false);
  const [status, setStatus] = useState(appointment.status);
  const [notes, setNotes] = useState(appointment.notes || '');

  // Calcular totales
  const cartItems = appointment.cart_items || [];
  const cartTotal = cartItems.reduce((acc, item) => acc + item.subtotal, 0);
  const totalAmount = appointment.service_price + cartTotal;
  const balanceDue = Math.max(0, totalAmount - appointment.deposit_amount);

  // Formatear fechas
  const startDate = new Date(appointment.start_time);
  const endDate = new Date(appointment.end_time);
  const timeFormatted = `${startDate.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} - ${endDate.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}`;

  // Todos los sub-tratamientos disponibles para agregar como extra
  const allSubTreatments: SubTreatment[] = treatments.flatMap((t) => t.sub_treatments || []);

  // Agregar Producto al Carrito
  const handleAddProduct = async () => {
    if (!selectedProductId) return;
    const prod = products.find((p) => p.id === selectedProductId);
    if (!prod) return;

    try {
      setLoadingAction(true);
      await api.addCartItem(appointment.id, {
        item_type: 'product',
        item_id: prod.id,
        name: prod.name,
        quantity: 1,
        unit_price: prod.sale_price,
        staff_id: appointment.staff_id,
      });
      setSelectedProductId('');
      await refreshAppointments();
      addToast({ type: 'success', title: 'Producto añadido al carrito' });
    } catch (error: any) {
      addToast({ type: 'error', title: 'Error al añadir producto', message: error.message });
    } finally {
      setLoadingAction(false);
    }
  };

  // Agregar Sub-tratamiento Extra al Carrito
  const handleAddSubTreatment = async () => {
    if (!selectedSubTreatmentId) return;
    const sub = allSubTreatments.find((s) => s.id === selectedSubTreatmentId);
    if (!sub) return;

    try {
      setLoadingAction(true);
      await api.addCartItem(appointment.id, {
        item_type: 'sub_treatment',
        item_id: sub.id,
        name: sub.name,
        quantity: 1,
        unit_price: sub.base_price,
        staff_id: appointment.staff_id,
      });
      setSelectedSubTreatmentId('');
      await refreshAppointments();
      addToast({ type: 'success', title: 'Servicio adicional sumado al carrito' });
    } catch (error: any) {
      addToast({ type: 'error', title: 'Error al sumar servicio', message: error.message });
    } finally {
      setLoadingAction(false);
    }
  };

  // Eliminar ítem del carrito
  const handleRemoveCartItem = async (cartItemId: string) => {
    try {
      setLoadingAction(true);
      await api.removeCartItem(appointment.id, cartItemId);
      await refreshAppointments();
      addToast({ type: 'info', title: 'Ítem eliminado del carrito' });
    } catch (error: any) {
      addToast({ type: 'error', title: 'Error al quitar ítem', message: error.message });
    } finally {
      setLoadingAction(false);
    }
  };

  // Guardar cambios de Estado y Notas
  const handleUpdateDetails = async (newStatus?: string) => {
    try {
      setLoadingAction(true);
      const updated = await api.updateAppointment(appointment.id, {
        status: newStatus || status,
        notes,
      });
      if (newStatus) setStatus(newStatus as any);
      await refreshAppointments();
      addToast({ type: 'success', title: 'Turno actualizado' });
    } catch (error: any) {
      addToast({ type: 'error', title: 'Error al actualizar', message: error.message });
    } finally {
      setLoadingAction(false);
    }
  };

  // Enviar / Abrir recordatorio por WhatsApp
  const handleWhatsAppReminder = async () => {
    try {
      setLoadingAction(true);
      const res = await api.sendWhatsAppReminder(appointment.id);
      window.open(res.whatsappUrl, '_blank');
      await refreshAppointments();
      addToast({ type: 'success', title: 'WhatsApp abierto con mensaje listo para enviar' });
    } catch (error: any) {
      addToast({ type: 'error', title: 'Error al generar WhatsApp', message: error.message });
    } finally {
      setLoadingAction(false);
    }
  };

  // Cobrar saldo y registrar en caja
  const handleCheckout = async (paymentMethod: string) => {
    if (balanceDue <= 0 && appointment.status === 'completed') {
      addToast({ type: 'info', title: 'Este turno ya fue completado y liquidado' });
      return;
    }

    try {
      setLoadingAction(true);
      // Registrar transacción en caja
      if (balanceDue > 0) {
        await api.createCashTransaction({
          appointment_id: appointment.id,
          client_id: appointment.client_id,
          type: 'income',
          category: `Atención: ${appointment.sub_treatment?.name}`,
          amount: balanceDue,
          payment_method: paymentMethod,
          notes: `Cobro final de turno #${appointment.id.substring(0, 8)}`,
        });
      }

      // Marcar turno como completado
      await api.updateAppointment(appointment.id, {
        status: 'completed',
        notes,
      });

      setStatus('completed');
      await refreshAppointments();
      addToast({ type: 'success', title: '¡Cobro registrado y turno completado!' });
    } catch (error: any) {
      addToast({ type: 'error', title: 'Error al registrar cobro', message: error.message });
    } finally {
      setLoadingAction(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-graphite-900/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-soft-lg border border-rose-gold-200 overflow-hidden animate-scale-up flex flex-col max-h-[90vh]">
        {/* Header con Color del Tratamiento */}
        <div
          className="p-5 text-white flex items-center justify-between"
          style={{
            backgroundColor: appointment.treatment?.color_code || '#C59B7E',
          }}
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-white/20 backdrop-blur-md">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-semibold tracking-wider uppercase opacity-90">
                {appointment.treatment?.name}
              </span>
              <h2 className="text-lg font-serif font-bold leading-tight">
                {appointment.sub_treatment?.name}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-silk-50/50">
          {/* Main Info Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-white rounded-2xl border border-rose-gold-100 shadow-sm">
              <div className="flex items-center gap-1.5 text-[10px] font-semibold text-graphite-400 uppercase">
                <Clock className="w-3.5 h-3.5 text-rose-gold-500" />
                <span>Horario</span>
              </div>
              <p className="mt-1 text-xs font-bold text-graphite-900">{timeFormatted}</p>
              <p className="text-[10px] text-graphite-500">{appointment.sub_treatment?.duration_minutes} min</p>
            </div>

            <div className="p-3 bg-white rounded-2xl border border-rose-gold-100 shadow-sm">
              <div className="flex items-center gap-1.5 text-[10px] font-semibold text-graphite-400 uppercase">
                <LayoutGrid className="w-3.5 h-3.5 text-sage-500" />
                <span>Ubicación</span>
              </div>
              <p className="mt-1 text-xs font-bold text-graphite-900">{appointment.box?.name}</p>
              <p className="text-[10px] text-graphite-500">Box #{appointment.box?.number}</p>
            </div>

            <div className="p-3 bg-white rounded-2xl border border-rose-gold-100 shadow-sm">
              <div className="flex items-center gap-1.5 text-[10px] font-semibold text-graphite-400 uppercase">
                <User className="w-3.5 h-3.5 text-rose-gold-500" />
                <span>Cliente</span>
              </div>
              <p className="mt-1 text-xs font-bold text-graphite-900 truncate">
                {appointment.client?.first_name} {appointment.client?.last_name}
              </p>
              <p className="text-[10px] text-graphite-500">{appointment.client?.phone}</p>
            </div>

            <div className="p-3 bg-white rounded-2xl border border-rose-gold-100 shadow-sm">
              <div className="flex items-center gap-1.5 text-[10px] font-semibold text-graphite-400 uppercase">
                <UserCheck className="w-3.5 h-3.5 text-mauve-500" />
                <span>Profesional</span>
              </div>
              <p className="mt-1 text-xs font-bold text-graphite-900 truncate">
                {appointment.staff?.first_name} {appointment.staff?.last_name}
              </p>
              <p className="text-[10px] text-graphite-500">Comisión asignada</p>
            </div>
          </div>

          {/* WhatsApp Reminder & Status Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white rounded-2xl border border-rose-gold-100">
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-graphite-700">Estado del Turno:</label>
              <select
                value={status}
                onChange={(e) => handleUpdateDetails(e.target.value)}
                className="text-xs bg-silk-100 border border-rose-gold-200 rounded-xl px-2.5 py-1.5 font-medium text-graphite-800 focus:outline-none focus:ring-1 focus:ring-rose-gold-400"
              >
                <option value="scheduled">🗓 Agendado</option>
                <option value="confirmed">✅ Confirmado</option>
                <option value="in_progress">💆‍♀️ En Atención (Box)</option>
                <option value="completed">🎉 Completado & Liquidado</option>
                <option value="cancelled">❌ Cancelado</option>
                <option value="no_show">⚠️ Ausente / No Vino</option>
              </select>
            </div>

            <button
              onClick={handleWhatsAppReminder}
              disabled={loadingAction}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-semibold transition-colors"
            >
              <Send className="w-3.5 h-3.5 text-emerald-600" />
              <span>
                {appointment.whatsapp_reminder_status === 'sent'
                  ? 'Reenviar WhatsApp'
                  : 'Enviar Recordatorio WhatsApp'}
              </span>
            </button>
          </div>

          {/* ======================================================== */}
          {/* CARRITO DE COMPRAS DE LA CITA (Tratamientos & Productos) */}
          {/* ======================================================== */}
          <div className="p-4 bg-white rounded-2xl border border-rose-gold-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-rose-gold-100 pb-2.5">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-rose-gold-600" />
                <h3 className="font-serif font-bold text-graphite-900 text-sm">
                  Carrito de la Cita & Consumos
                </h3>
              </div>
              <span className="text-[11px] text-graphite-500">
                Suma tratamientos y productos realizados en cabina
              </span>
            </div>

            {/* Base Service Row */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-silk-50 border border-silk-200 text-xs">
              <div>
                <span className="font-semibold text-graphite-900">
                  {appointment.sub_treatment?.name}
                </span>
                <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full bg-rose-gold-100 text-rose-gold-800 font-medium">
                  Servicio Principal
                </span>
              </div>
              <span className="font-bold text-graphite-900">
                ${appointment.service_price.toLocaleString('es-AR')}
              </span>
            </div>

            {/* Extra Cart Items */}
            {cartItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-rose-gold-100 hover:border-rose-gold-300 text-xs transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-md font-semibold ${
                      item.item_type === 'product'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-mauve-100 text-mauve-800'
                    }`}
                  >
                    {item.item_type === 'product' ? 'Producto' : 'Extra'}
                  </span>
                  <span className="font-medium text-graphite-900">{item.name}</span>
                  {item.added_by_staff_name && (
                    <span className="text-[10px] text-graphite-400">
                      (sumado por {item.added_by_staff_name})
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-semibold text-graphite-900">
                    ${item.subtotal.toLocaleString('es-AR')}
                  </span>
                  <button
                    onClick={() => handleRemoveCartItem(item.id)}
                    className="text-rose-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 transition-colors"
                    title="Quitar ítem"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}

            {/* Add Extra Items Selectors */}
            <div className="space-y-3 pt-3 border-t border-dashed border-rose-gold-200">
              {/* Add Product Selector */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-graphite-600 block">
                  + Sumar Producto (Reventa / Cabina):
                </label>
                <div className="flex gap-2 min-w-0">
                  <select
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    className="flex-1 min-w-0 text-xs bg-silk-100 border border-rose-gold-200 rounded-xl px-3 py-2 text-graphite-800 focus:outline-none focus:ring-1 focus:ring-rose-gold-400 truncate"
                  >
                    <option value="">Seleccionar producto para sumar...</option>
                    {products.filter((p) => p.is_for_sale).map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} (${p.sale_price.toLocaleString('es-AR')})
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleAddProduct}
                    disabled={!selectedProductId || loadingAction}
                    className="px-3 py-2 rounded-xl bg-gradient-to-r from-rose-gold-500 to-rose-gold-600 hover:from-rose-gold-600 hover:to-rose-gold-700 text-white text-xs font-semibold shadow-soft disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-1.5 shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Sumar Producto</span>
                  </button>
                </div>
              </div>

              {/* Add Sub-Treatment Selector */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-graphite-600 block">
                  + Sumar Tratamiento o Servicio Extra:
                </label>
                <div className="flex gap-2 min-w-0">
                  <select
                    value={selectedSubTreatmentId}
                    onChange={(e) => setSelectedSubTreatmentId(e.target.value)}
                    className="flex-1 min-w-0 text-xs bg-silk-100 border border-rose-gold-200 rounded-xl px-3 py-2 text-graphite-800 focus:outline-none focus:ring-1 focus:ring-rose-gold-400 truncate"
                  >
                    <option value="">Seleccionar servicio extra para sumar...</option>
                    {allSubTreatments.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.name} (${sub.base_price.toLocaleString('es-AR')} - {sub.duration_minutes} min)
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleAddSubTreatment}
                    disabled={!selectedSubTreatmentId || loadingAction}
                    className="px-3 py-2 rounded-xl bg-gradient-to-r from-rose-gold-500 to-rose-gold-600 hover:from-rose-gold-600 hover:to-rose-gold-700 text-white text-xs font-semibold shadow-soft disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-1.5 shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Sumar Servicio</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Financial Totals Summary */}
            <div className="p-3.5 bg-silk-100 rounded-2xl space-y-1.5 border border-rose-gold-200/80 text-xs">
              <div className="flex justify-between text-graphite-600">
                <span>Total Servicios & Productos:</span>
                <span className="font-semibold text-graphite-900">
                  ${totalAmount.toLocaleString('es-AR')}
                </span>
              </div>
              <div className="flex justify-between text-emerald-700">
                <span>Seña pagada previamente:</span>
                <span className="font-semibold">
                  - ${appointment.deposit_amount.toLocaleString('es-AR')}
                </span>
              </div>
              <div className="flex justify-between text-sm font-bold text-graphite-900 pt-1.5 border-t border-rose-gold-200">
                <span>Saldo Pendiente a Cobrar:</span>
                <span className={balanceDue > 0 ? 'text-rose-gold-700 font-extrabold' : 'text-emerald-700'}>
                  ${balanceDue.toLocaleString('es-AR')}
                </span>
              </div>
            </div>
          </div>

          {/* Notes Section */}
          <div className="p-4 bg-white rounded-2xl border border-rose-gold-100 space-y-2">
            <label className="text-xs font-semibold text-graphite-700">
              Observaciones del Turno / Reacciones / Ficha:
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Escribe notas sobre la sesión, productos aplicados o preferencias del cliente..."
              className="w-full text-xs p-3 rounded-xl bg-silk-50 border border-rose-gold-200 focus:outline-none focus:ring-1 focus:ring-rose-gold-400 text-graphite-800"
            />
          </div>
        </div>

        {/* Footer with Checkout Actions */}
        <div className="p-4 bg-white border-t border-rose-gold-100 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={() => handleUpdateDetails()}
            disabled={loadingAction}
            className="px-4 py-2 rounded-xl border border-rose-gold-300 text-xs font-semibold text-graphite-700 hover:bg-silk-100 transition-colors"
          >
            Guardar Notas
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-graphite-600 hidden sm:inline">
              Cobrar Saldo:
            </span>
            <button
              onClick={() => handleCheckout('cash')}
              disabled={loadingAction}
              className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-all"
            >
              💵 Efectivo
            </button>
            <button
              onClick={() => handleCheckout('transfer')}
              disabled={loadingAction}
              className="px-3 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-sm transition-all"
            >
              📱 Transferencia / MP
            </button>
            <button
              onClick={() => handleCheckout('card_credit')}
              disabled={loadingAction}
              className="px-3 py-2 rounded-xl bg-rose-gold-600 hover:bg-rose-gold-700 text-white text-xs font-semibold shadow-sm transition-all"
            >
              💳 Tarjeta
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
