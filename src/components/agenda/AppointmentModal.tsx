import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Appointment, Product, SubTreatment, PaymentSurchargesConfig, PaymentCardRule } from '../../types';
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
  CreditCard,
  Percent,
  ChevronRight,
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

  // Reglas de cobro y recargos
  const [paymentRules, setPaymentRules] = useState<PaymentSurchargesConfig | null>(null);
  const [showCheckoutModal, setShowCheckoutModal] = useState<boolean>(false);
  const [checkoutPaymentMethod, setCheckoutPaymentMethod] = useState<'cash' | 'card_debit' | 'card_credit' | 'transfer'>('cash');
  const [selectedCardRuleId, setSelectedCardRuleId] = useState<string>('');
  const [customCardName, setCustomCardName] = useState<string>('');
  const [customCardPercent, setCustomCardPercent] = useState<number>(5);

  useEffect(() => {
    api.getPaymentRules()
      .then((rules) => {
        setPaymentRules(rules);
        if (rules.card_rules && rules.card_rules.length > 0) {
          setSelectedCardRuleId(rules.card_rules[0].id);
        }
      })
      .catch((err) => console.error('Error fetching payment rules:', err));
  }, []);

  // Calcular totales
  const cartItems = appointment.cart_items || [];
  const cartTotal = cartItems.reduce((acc, item) => acc + item.subtotal, 0);
  const totalAmount = appointment.service_price + cartTotal;
  const balanceDue = Math.max(0, totalAmount - appointment.deposit_amount);

  // Cálculo dinámico de recargo/descuento según método seleccionado
  let adjustmentPercent = 0;
  let adjustmentLabel = '';
  let cardBrandName = '';

  if (checkoutPaymentMethod === 'cash') {
    const discount = paymentRules?.cash_discount_percent || 0;
    if (discount > 0) {
      adjustmentPercent = -discount;
      adjustmentLabel = `Descuento Efectivo (-${discount}%)`;
    }
  } else if (checkoutPaymentMethod === 'card_debit') {
    const surcharge = paymentRules?.debit_surcharge_percent || 0;
    if (surcharge !== 0) {
      adjustmentPercent = surcharge;
      adjustmentLabel = surcharge > 0 ? `Recargo Débito (+${surcharge}%)` : `Descuento Débito (${surcharge}%)`;
    }
  } else if (checkoutPaymentMethod === 'transfer') {
    const discount = paymentRules?.transfer_discount_percent || 0;
    if (discount !== 0) {
      adjustmentPercent = -discount;
      adjustmentLabel = discount > 0 ? `Descuento Transf. (-${discount}%)` : `Recargo Transf. (+${Math.abs(discount)}%)`;
    }
  } else if (checkoutPaymentMethod === 'card_credit') {
    if (selectedCardRuleId === 'custom') {
      adjustmentPercent = customCardPercent || 0;
      cardBrandName = customCardName.trim() || 'Tarjeta';
      adjustmentLabel = adjustmentPercent >= 0 ? `Recargo (+${adjustmentPercent}%)` : `Descuento (${adjustmentPercent}%)`;
    } else {
      const rule = paymentRules?.card_rules.find((r) => r.id === selectedCardRuleId);
      if (rule) {
        adjustmentPercent = rule.percentage;
        cardBrandName = rule.name;
        adjustmentLabel = `${rule.name} (${rule.percentage >= 0 ? '+' : ''}${rule.percentage}%)`;
      } else {
        const def = paymentRules?.credit_default_surcharge_percent || 0;
        adjustmentPercent = def;
        cardBrandName = 'Tarjeta de Crédito';
        adjustmentLabel = def > 0 ? `Recargo Tarjeta (+${def}%)` : 'Tarjeta';
      }
    }
  }

  const adjustmentAmount = Math.round((balanceDue * adjustmentPercent) / 100);
  const finalCalculatedAmount = Math.max(0, balanceDue + adjustmentAmount);

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
      await api.updateAppointment(appointment.id, {
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

  // Abrir checkout con un método seleccionado
  const handleOpenCheckout = (method: 'cash' | 'card_debit' | 'card_credit' | 'transfer') => {
    setCheckoutPaymentMethod(method);
    setShowCheckoutModal(true);
  };

  // Completar turno cuando no hay saldo pendiente
  const handleCompleteWithoutBalance = async () => {
    try {
      setLoadingAction(true);
      await api.updateAppointment(appointment.id, {
        status: 'completed',
        notes,
      });
      setStatus('completed');
      await refreshAppointments();
      addToast({ type: 'success', title: '¡Turno completado exitosamente!' });
      onClose();
    } catch (error: any) {
      addToast({ type: 'error', title: 'Error al completar turno', message: error.message });
    } finally {
      setLoadingAction(false);
    }
  };

  // Cobrar saldo y registrar en caja
  const handleExecuteCheckout = async () => {
    if (balanceDue <= 0) {
      await handleCompleteWithoutBalance();
      return;
    }

    try {
      setLoadingAction(true);
      // Registrar transacción en caja
      await api.createCashTransaction({
        shift_id: activeShift?.id,
        appointment_id: appointment.id,
        client_id: appointment.client_id,
        type: 'income',
        category: `Atención: ${appointment.sub_treatment?.name || 'Turno'}`,
        amount: finalCalculatedAmount,
        payment_method: checkoutPaymentMethod,
        card_brand: (checkoutPaymentMethod === 'card_credit' || checkoutPaymentMethod === 'card_debit') ? cardBrandName : undefined,
        surcharge_percentage: adjustmentPercent !== 0 ? adjustmentPercent : undefined,
        notes: `Cobro final turno #${appointment.id.substring(0, 8)}${cardBrandName ? ` (${cardBrandName})` : ''}`,
      });

      // Marcar turno como completado
      await api.updateAppointment(appointment.id, {
        status: 'completed',
        notes,
      });

      setStatus('completed');
      await refreshAppointments();
      addToast({
        type: 'success',
        title: '¡Cobro registrado y turno completado!',
        message: `Monto liquidado: $${finalCalculatedAmount.toLocaleString('es-AR')}`,
      });
      setShowCheckoutModal(false);
      onClose(); // Se cierra automáticamente al cobrar y finalizar
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

          {status === 'completed' ? (
            <div className="flex items-center gap-2">
              <span className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Turno Finalizado y Cobrado
              </span>
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-graphite-800 hover:bg-graphite-900 text-white text-xs font-semibold transition-colors"
              >
                Cerrar
              </button>
            </div>
          ) : balanceDue <= 0 ? (
            <div className="flex items-center gap-2">
              <button
                onClick={handleCompleteWithoutBalance}
                disabled={loadingAction}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-soft transition-all flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                Finalizar Turno (Saldo $0)
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-graphite-600 hidden sm:inline">
                Cobrar Saldo:
              </span>
              <button
                onClick={() => handleOpenCheckout('cash')}
                disabled={loadingAction}
                className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-all"
                title="Pagar con efectivo"
              >
                💵 Efectivo {paymentRules?.cash_discount_percent ? `(-${paymentRules.cash_discount_percent}%)` : ''}
              </button>
              <button
                onClick={() => handleOpenCheckout('card_credit')}
                disabled={loadingAction}
                className="px-3 py-2 rounded-xl bg-rose-gold-600 hover:bg-rose-gold-700 text-white text-xs font-semibold shadow-sm transition-all"
                title="Pagar con tarjeta de crédito o débito"
              >
                💳 Tarjeta
              </button>
              <button
                onClick={() => handleOpenCheckout('transfer')}
                disabled={loadingAction}
                className="px-3 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-sm transition-all"
                title="Pagar con transferencia bancaria o Mercado Pago"
              >
                📱 Transferencia
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Liquidación / Cobro con Recargos y Selección de Tarjeta */}
      {showCheckoutModal && (
        <div className="fixed inset-0 z-60 bg-graphite-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-rose-gold-200 overflow-hidden animate-scale-up flex flex-col">
            {/* Header del Cobro */}
            <div className="p-4 bg-gradient-to-r from-rose-gold-500 to-rose-gold-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-white/20">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-sm">Cobro y Cierre de Turno</h3>
                  <p className="text-[11px] text-white/80">
                    Cliente: {appointment.client?.first_name} {appointment.client?.last_name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCheckoutModal(false)}
                className="p-1 rounded-lg hover:bg-white/20 text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Contenido del Cobro */}
            <div className="p-5 space-y-4 text-xs">
              {/* Selector de Medio de Pago */}
              <div>
                <label className="text-xs font-bold text-graphite-700 block mb-2">
                  Seleccione el Medio de Pago:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setCheckoutPaymentMethod('cash')}
                    className={`p-2.5 rounded-xl border text-center font-medium transition-all ${
                      checkoutPaymentMethod === 'cash'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-800 font-bold shadow-xs ring-2 ring-emerald-500/20'
                        : 'border-rose-gold-200 hover:bg-silk-100 text-graphite-700'
                    }`}
                  >
                    <div className="text-base mb-0.5">💵</div>
                    <div>Efectivo</div>
                    {paymentRules?.cash_discount_percent ? (
                      <div className="text-[10px] text-emerald-600 font-bold">-{paymentRules.cash_discount_percent}% desc.</div>
                    ) : null}
                  </button>

                  <button
                    type="button"
                    onClick={() => setCheckoutPaymentMethod('card_credit')}
                    className={`p-2.5 rounded-xl border text-center font-medium transition-all ${
                      checkoutPaymentMethod === 'card_credit'
                        ? 'border-rose-gold-500 bg-rose-gold-50 text-rose-gold-800 font-bold shadow-xs ring-2 ring-rose-gold-500/20'
                        : 'border-rose-gold-200 hover:bg-silk-100 text-graphite-700'
                    }`}
                  >
                    <div className="text-base mb-0.5">💳</div>
                    <div>T. Crédito</div>
                    <div className="text-[10px] text-rose-gold-600">Por banco/red</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCheckoutPaymentMethod('card_debit')}
                    className={`p-2.5 rounded-xl border text-center font-medium transition-all ${
                      checkoutPaymentMethod === 'card_debit'
                        ? 'border-rose-gold-500 bg-rose-gold-50 text-rose-gold-800 font-bold shadow-xs ring-2 ring-rose-gold-500/20'
                        : 'border-rose-gold-200 hover:bg-silk-100 text-graphite-700'
                    }`}
                  >
                    <div className="text-base mb-0.5">💳</div>
                    <div>T. Débito</div>
                    {paymentRules?.debit_surcharge_percent ? (
                      <div className="text-[10px] text-amber-600">+{paymentRules.debit_surcharge_percent}% rec.</div>
                    ) : null}
                  </button>

                  <button
                    type="button"
                    onClick={() => setCheckoutPaymentMethod('transfer')}
                    className={`p-2.5 rounded-xl border text-center font-medium transition-all ${
                      checkoutPaymentMethod === 'transfer'
                        ? 'border-sky-500 bg-sky-50 text-sky-800 font-bold shadow-xs ring-2 ring-sky-500/20'
                        : 'border-rose-gold-200 hover:bg-silk-100 text-graphite-700'
                    }`}
                  >
                    <div className="text-base mb-0.5">📱</div>
                    <div>Transf. / MP</div>
                    {paymentRules?.transfer_discount_percent ? (
                      <div className="text-[10px] text-sky-600">-{paymentRules.transfer_discount_percent}% desc.</div>
                    ) : null}
                  </button>
                </div>
              </div>

              {/* Si es Tarjeta de Crédito: Consulta específica de tarjeta */}
              {checkoutPaymentMethod === 'card_credit' && (
                <div className="p-3.5 bg-rose-gold-50/70 border border-rose-gold-200 rounded-2xl space-y-2.5">
                  <label className="text-xs font-bold text-graphite-800 flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-rose-gold-600" />
                    ¿Qué tarjeta / entidad bancaria presenta el cliente?
                  </label>
                  <select
                    value={selectedCardRuleId}
                    onChange={(e) => setSelectedCardRuleId(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl bg-white border border-rose-gold-300 text-graphite-800 font-medium focus:ring-1 focus:ring-rose-gold-400"
                  >
                    {paymentRules?.card_rules && paymentRules.card_rules.length > 0 ? (
                      paymentRules.card_rules
                        .filter((r) => r.is_active)
                        .map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.name} ({r.percentage >= 0 ? `+${r.percentage}% recargo` : `${r.percentage}% descuento`})
                          </option>
                        ))
                    ) : (
                      <option value="default">Tarjeta Estándar (+{paymentRules?.credit_default_surcharge_percent || 5}%)</option>
                    )}
                    <option value="custom">Otra tarjeta personalizada...</option>
                  </select>

                  {selectedCardRuleId === 'custom' && (
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div>
                        <label className="text-[11px] font-semibold text-graphite-600 block mb-1">
                          Nombre Tarjeta:
                        </label>
                        <input
                          type="text"
                          placeholder="Ej. Cabal / Naranja"
                          value={customCardName}
                          onChange={(e) => setCustomCardName(e.target.value)}
                          className="w-full text-xs p-2 rounded-xl bg-white border border-rose-gold-300"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-graphite-600 block mb-1">
                          % Recargo / Descuento:
                        </label>
                        <input
                          type="number"
                          value={customCardPercent}
                          onChange={(e) => setCustomCardPercent(Number(e.target.value))}
                          className="w-full text-xs p-2 rounded-xl bg-white border border-rose-gold-300"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Resumen de Liquidación */}
              <div className="p-4 bg-silk-50 rounded-2xl border border-rose-gold-200/90 space-y-2">
                <div className="flex justify-between text-graphite-600">
                  <span>Saldo base a cancelar:</span>
                  <span className="font-semibold text-graphite-900">
                    ${balanceDue.toLocaleString('es-AR')}
                  </span>
                </div>

                {adjustmentPercent !== 0 && (
                  <div className="flex justify-between items-center text-xs">
                    <span className={adjustmentPercent > 0 ? 'text-amber-700' : 'text-emerald-700'}>
                      {adjustmentLabel}:
                    </span>
                    <span className={`font-bold ${adjustmentPercent > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                      {adjustmentAmount > 0 ? `+$${adjustmentAmount.toLocaleString('es-AR')}` : `-$${Math.abs(adjustmentAmount).toLocaleString('es-AR')}`}
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-center text-sm font-extrabold text-graphite-900 pt-2 border-t border-rose-gold-200">
                  <span>Total Final a Cobrar:</span>
                  <span className="text-base text-rose-gold-800">
                    ${finalCalculatedAmount.toLocaleString('es-AR')}
                  </span>
                </div>
              </div>
            </div>

            {/* Acciones del Checkout */}
            <div className="p-4 bg-silk-50 border-t border-rose-gold-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowCheckoutModal(false)}
                disabled={loadingAction}
                className="px-4 py-2 rounded-xl border border-rose-gold-300 text-xs font-semibold text-graphite-700 hover:bg-white transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleExecuteCheckout}
                disabled={loadingAction}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white text-xs font-bold shadow-soft transition-all flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirmar Cobro (${finalCalculatedAmount.toLocaleString('es-AR')}) y Finalizar</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
