import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import {
  DollarSign,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Lock,
  Unlock,
  CreditCard,
  Smartphone,
  Wallet,
  Calendar,
  FileText,
  UserCheck,
  Settings,
  Percent,
  Trash2,
  CheckCircle2,
  X,
} from 'lucide-react';
import { PaymentSurchargesConfig, PaymentCardRule } from '../../types';

export const CashView: React.FC = () => {
  const { activeShift, refreshAllData, addToast, staff } = useApp();
  const [isOpenShiftModal, setIsOpenShiftModal] = useState(false);
  const [isCloseShiftModal, setIsCloseShiftModal] = useState(false);
  const [isExpenseModal, setIsExpenseModal] = useState(false);

  // Form Open Shift
  const [initialCash, setInitialCash] = useState(15000);
  const [openedBy, setOpenedBy] = useState('Recepción');

  // Form Close Shift
  const [actualCash, setActualCash] = useState(0);
  const [closedNotes, setClosedNotes] = useState('');

  // Form Expense
  const [expenseAmount, setExpenseAmount] = useState(2500);
  const [expenseCategory, setExpenseCategory] = useState('Insumos de Limpieza');
  const [expenseMethod, setExpenseMethod] = useState('cash');
  const [expenseNotes, setExpenseNotes] = useState('');

  // Configuración de Medios de Pago, Descuentos y Recargos
  const [paymentRules, setPaymentRules] = useState<PaymentSurchargesConfig | null>(null);
  const [isPaymentRulesModalOpen, setIsPaymentRulesModalOpen] = useState(false);
  const [editingPaymentRules, setEditingPaymentRules] = useState<PaymentSurchargesConfig | null>(null);
  const [newCardName, setNewCardName] = useState('');
  const [newCardPercent, setNewCardPercent] = useState(5);

  // Comisiones
  const [commissions, setCommissions] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'cash' | 'commissions'>('cash');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCommissions();
    loadPaymentRules();
  }, []);

  const loadCommissions = async () => {
    try {
      const comms = await api.getCommissions();
      setCommissions(comms);
    } catch (e) {
      console.error(e);
    }
  };

  const loadPaymentRules = async () => {
    try {
      const rules = await api.getPaymentRules();
      setPaymentRules(rules);
      setEditingPaymentRules(rules);
    } catch (e) {
      console.error('Error cargando reglas de cobro:', e);
    }
  };

  const handleSavePaymentRules = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPaymentRules) return;
    try {
      setLoading(true);
      const res = await api.updatePaymentRules(editingPaymentRules);
      setPaymentRules(res.config);
      setEditingPaymentRules(res.config);
      setIsPaymentRulesModalOpen(false);
      addToast({ type: 'success', title: 'Reglas de recargos y descuentos guardadas' });
    } catch (err: any) {
      addToast({ type: 'error', title: 'Error al guardar reglas', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleAddCardRule = () => {
    if (!newCardName.trim() || !editingPaymentRules) return;
    const newRule: PaymentCardRule = {
      id: `card_${Date.now()}`,
      name: newCardName.trim(),
      percentage: Number(newCardPercent),
      is_active: true,
    };
    setEditingPaymentRules({
      ...editingPaymentRules,
      card_rules: [...editingPaymentRules.card_rules, newRule],
    });
    setNewCardName('');
    setNewCardPercent(5);
  };

  const handleRemoveCardRule = (id: string) => {
    if (!editingPaymentRules) return;
    setEditingPaymentRules({
      ...editingPaymentRules,
      card_rules: editingPaymentRules.card_rules.filter((r) => r.id !== id),
    });
  };

  const handleToggleCardRule = (id: string) => {
    if (!editingPaymentRules) return;
    setEditingPaymentRules({
      ...editingPaymentRules,
      card_rules: editingPaymentRules.card_rules.map((r) =>
        r.id === id ? { ...r, is_active: !r.is_active } : r
      ),
    });
  };

  const handleOpenShift = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await api.openShift({
        initial_cash: Number(initialCash),
        opened_by: openedBy,
      });
      await refreshAllData();
      addToast({ type: 'success', title: 'Caja abierta correctamente' });
      setIsOpenShiftModal(false);
    } catch (error: any) {
      addToast({ type: 'error', title: 'Error al abrir caja', message: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeShift) return;
    try {
      setLoading(true);
      await api.closeShift(activeShift.id, {
        actual_cash: Number(actualCash),
        closed_by: 'Recepción',
        notes: closedNotes,
      });
      await refreshAllData();
      addToast({ type: 'success', title: 'Caja cerrada y arqueo registrado' });
      setIsCloseShiftModal(false);
    } catch (error: any) {
      addToast({ type: 'error', title: 'Error al cerrar caja', message: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await api.createCashTransaction({
        shift_id: activeShift?.id,
        type: 'expense',
        category: expenseCategory,
        amount: Number(expenseAmount),
        payment_method: expenseMethod,
        notes: expenseNotes || null,
      });
      await refreshAllData();
      addToast({ type: 'success', title: 'Gasto / Egreso registrado' });
      setIsExpenseModal(false);
      setExpenseNotes('');
    } catch (error: any) {
      addToast({ type: 'error', title: 'Error al registrar egreso', message: error.message });
    } finally {
      setLoading(false);
    }
  };

  const transactions = activeShift?.transactions || [];

  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto bg-silk-100/60">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif font-bold text-2xl text-graphite-900 leading-tight">
            Control de Caja & Facturación
          </h1>
          <p className="text-xs text-graphite-500 mt-0.5">
            Arqueo de turnos, medios de pago, registro de gastos y liquidación de comisiones
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => {
              setEditingPaymentRules(
                paymentRules
                  ? { ...paymentRules, card_rules: [...paymentRules.card_rules] }
                  : null
              );
              setIsPaymentRulesModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white hover:bg-silk-50 text-graphite-700 text-xs font-semibold border border-rose-gold-200 shadow-soft transition-all"
            title="Configurar descuentos en efectivo, recargos en tarjetas y reglas por banco"
          >
            <Settings className="w-4 h-4 text-rose-gold-600" />
            <span>Reglas de Medios de Pago</span>
          </button>

          {activeShift && activeShift.status === 'open' ? (
            <>
              <button
                onClick={() => setIsExpenseModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-semibold border border-amber-300 transition-colors shadow-soft"
              >
                <ArrowDownLeft className="w-4 h-4" />
                <span>Registrar Egreso / Gasto</span>
              </button>

              <button
                onClick={() => {
                  setActualCash(activeShift.expected_cash || 0);
                  setIsCloseShiftModal(true);
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-rose-gold-600 hover:bg-rose-gold-700 text-white text-xs font-semibold shadow-soft hover:shadow-soft-md transition-all"
              >
                <Lock className="w-4 h-4" />
                <span>Cerrar Turno de Caja</span>
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsOpenShiftModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-soft transition-all"
            >
              <Unlock className="w-4 h-4" />
              <span>Abrir Nuevo Turno de Caja</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-silk-200 p-1 rounded-2xl border border-rose-gold-200/60 w-fit">
        <button
          onClick={() => setActiveTab('cash')}
          className={`px-4 py-1.5 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'cash'
              ? 'bg-white text-rose-gold-800 shadow-sm font-bold'
              : 'text-graphite-600 hover:text-graphite-900'
          }`}
        >
          💵 Movimientos de Caja
        </button>

        <button
          onClick={() => setActiveTab('commissions')}
          className={`px-4 py-1.5 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'commissions'
              ? 'bg-white text-rose-gold-800 shadow-sm font-bold'
              : 'text-graphite-600 hover:text-graphite-900'
          }`}
        >
          👩‍⚕️ Comisiones del Personal ({commissions.length})
        </button>
      </div>

      {/* TAB 1: MOVIMIENTOS DE CAJA */}
      {activeTab === 'cash' && (
        <div className="space-y-6">
          {/* Summary Cards: Breakdown of Cash, Cards, Transfers, Incomes and Expenses */}
          {activeShift && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {/* Card 1: Efectivo Físico en Caja */}
              <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 text-white p-5 rounded-3xl shadow-soft">
                <span className="text-[10px] font-bold uppercase tracking-wider opacity-90 block">
                  💵 Efectivo Físico en Caja
                </span>
                <p className="font-serif font-bold text-2xl mt-1">
                  ${(activeShift.expected_cash || 0).toLocaleString('es-AR')}
                </p>
                <p className="text-[10px] opacity-80 mt-1">
                  Fondo Inicial: ${(activeShift.initial_cash || 0).toLocaleString('es-AR')}
                </p>
              </div>

              {/* Card 2: Total Cobros por Tarjeta */}
              <div className="bg-white p-5 rounded-3xl border border-rose-gold-200 shadow-soft">
                <span className="text-[10px] font-bold text-rose-gold-700 uppercase tracking-wider block">
                  💳 Cobros con Tarjeta
                </span>
                <p className="font-serif font-bold text-xl text-graphite-900 mt-1">
                  ${(activeShift.total_cards || 0).toLocaleString('es-AR')}
                </p>
                <p className="text-[10px] text-graphite-500 mt-1">
                  Débito & Crédito en lote
                </p>
              </div>

              {/* Card 3: Total Cobros por Transferencia */}
              <div className="bg-white p-5 rounded-3xl border border-sky-200 shadow-soft">
                <span className="text-[10px] font-bold text-sky-700 uppercase tracking-wider block">
                  📱 Cobros por Transferencia
                </span>
                <p className="font-serif font-bold text-xl text-graphite-900 mt-1">
                  ${(activeShift.total_transfers || 0).toLocaleString('es-AR')}
                </p>
                <p className="text-[10px] text-graphite-500 mt-1">
                  Mercado Pago & Bancos
                </p>
              </div>

              {/* Card 4: Total General Ingresos */}
              <div className="bg-white p-5 rounded-3xl border border-emerald-100 shadow-soft">
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">
                  📈 Total General Facturado
                </span>
                <p className="font-serif font-bold text-xl text-emerald-700 mt-1">
                  +${(activeShift.total_incomes || 0).toLocaleString('es-AR')}
                </p>
                <p className="text-[10px] text-graphite-500 mt-1">
                  Turnos, señas y ventas
                </p>
              </div>

              {/* Card 5: Total Egresos */}
              <div className="bg-white p-5 rounded-3xl border border-rose-100 shadow-soft">
                <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider block">
                  📉 Total Egresos (Gastos)
                </span>
                <p className="font-serif font-bold text-xl text-rose-600 mt-1">
                  -${(activeShift.total_expenses || 0).toLocaleString('es-AR')}
                </p>
                <p className="text-[10px] text-graphite-500 mt-1">
                  Insumos & compras
                </p>
              </div>
            </div>
          )}

          {/* Transactions Log Table */}
          <div className="bg-white rounded-3xl border border-rose-gold-100 shadow-soft overflow-hidden">
            <div className="p-5 border-b border-rose-gold-100 flex items-center justify-between">
              <h3 className="font-serif font-bold text-base text-graphite-900">
                Detalle de Movimientos del Turno
              </h3>
              <span className="text-xs font-semibold text-graphite-400">
                {transactions.length} registros
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-silk-50 border-b border-rose-gold-100 text-graphite-500 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="p-3.5">Hora</th>
                    <th className="p-3.5">Tipo</th>
                    <th className="p-3.5">Concepto / Categoría</th>
                    <th className="p-3.5">Cliente</th>
                    <th className="p-3.5">Medio de Pago</th>
                    <th className="p-3.5 text-right">Monto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-rose-gold-100/60">
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-graphite-400 italic">
                        No hay movimientos registrados en este turno de caja aún.
                      </td>
                    </tr>
                  ) : (
                    transactions.map((tx: any) => {
                      const time = new Date(tx.created_at).toLocaleTimeString('es-AR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      });
                      const isIncome = tx.type === 'income';

                      return (
                        <tr key={tx.id} className="hover:bg-silk-50/50 transition-colors">
                          <td className="p-3.5 font-mono text-graphite-500">{time}</td>
                          <td className="p-3.5">
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                isIncome
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-rose-50 text-rose-700 border border-rose-200'
                              }`}
                            >
                              {isIncome ? 'Ingreso' : 'Egreso'}
                            </span>
                          </td>
                          <td className="p-3.5 font-medium text-graphite-900">{tx.category}</td>
                          <td className="p-3.5 text-graphite-600">
                            {tx.client_first_name
                              ? `${tx.client_first_name} ${tx.client_last_name}`
                              : '—'}
                          </td>
                          <td className="p-3.5 text-graphite-600">
                            <div className="flex flex-col">
                              <span className="font-medium text-graphite-800">
                                {tx.payment_method === 'cash'
                                  ? '💵 Efectivo'
                                  : tx.payment_method === 'transfer'
                                  ? '📱 Transferencia'
                                  : tx.payment_method === 'card_debit'
                                  ? '💳 Débito'
                                  : '💳 Crédito'}
                              </span>
                              {tx.card_brand && (
                                <span className="text-[10px] text-rose-gold-700 font-semibold">
                                  {tx.card_brand}{' '}
                                  {tx.surcharge_percentage !== undefined && tx.surcharge_percentage !== null && tx.surcharge_percentage !== 0
                                    ? `(${tx.surcharge_percentage >= 0 ? '+' : ''}${tx.surcharge_percentage}%)`
                                    : ''}
                                </span>
                              )}
                              {!tx.card_brand &&
                                tx.surcharge_percentage !== undefined &&
                                tx.surcharge_percentage !== null &&
                                tx.surcharge_percentage !== 0 && (
                                  <span className="text-[10px] text-graphite-500 font-semibold">
                                    {tx.surcharge_percentage >= 0
                                      ? `+${tx.surcharge_percentage}% rec.`
                                      : `${tx.surcharge_percentage}% desc.`}
                                  </span>
                                )}
                            </div>
                          </td>
                          <td className={`p-3.5 text-right font-bold ${isIncome ? 'text-emerald-700' : 'text-rose-600'}`}>
                            {isIncome ? '+' : '-'}${tx.amount.toLocaleString('es-AR')}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: COMISIONES */}
      {activeTab === 'commissions' && (
        <div className="bg-white rounded-3xl border border-rose-gold-100 shadow-soft p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-rose-gold-100 pb-3">
            <h3 className="font-serif font-bold text-base text-graphite-900">
              Liquidación de Comisiones por Profesional
            </h3>
            <span className="text-xs text-graphite-500">
              Calculadas automáticamente sobre las sesiones atendidas
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {staff.map((s) => {
              const staffComms = commissions.filter((c) => c.staff_id === s.id);
              const totalAmount = staffComms.reduce((acc, c) => acc + c.amount_calculated, 0);

              return (
                <div key={s.id} className="p-4 rounded-2xl bg-silk-50 border border-rose-gold-100 space-y-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold"
                      style={{ backgroundColor: s.color_code }}
                    >
                      {s.first_name[0]}
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-graphite-900">
                        {s.first_name} {s.last_name}
                      </h4>
                      <p className="text-[10px] text-graphite-500">{s.role} • {s.default_commission_rate}%</p>
                    </div>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-rose-gold-100 flex justify-between items-center text-xs">
                    <span className="text-graphite-500">Comisión Devengada:</span>
                    <span className="font-bold text-rose-gold-700 text-sm">
                      ${totalAmount.toLocaleString('es-AR')}
                    </span>
                  </div>

                  <button className="w-full py-2 rounded-xl bg-graphite-800 hover:bg-graphite-900 text-white text-xs font-semibold shadow-sm transition-all">
                    Generar Recibo de Liquidación
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal Abrir Caja */}
      {isOpenShiftModal && (
        <div className="fixed inset-0 z-50 bg-graphite-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full shadow-soft-lg border border-rose-gold-200 p-6 space-y-4 animate-scale-up text-xs">
            <h3 className="font-serif font-bold text-base text-graphite-900">
              Apertura de Turno de Caja
            </h3>
            <form onSubmit={handleOpenShift} className="space-y-3">
              <div>
                <label className="block font-semibold mb-1">Monto Inicial en Efectivo ($) *</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={initialCash}
                  onChange={(e) => setInitialCash(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-rose-gold-200 font-bold"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Responsable *</label>
                <input
                  type="text"
                  required
                  value={openedBy}
                  onChange={(e) => setOpenedBy(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-rose-gold-200"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsOpenShiftModal(false)} className="px-4 py-2 rounded-xl border">Cancelar</button>
                <button type="submit" disabled={loading} className="px-5 py-2 bg-emerald-600 text-white rounded-xl font-bold">Abrir Caja</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Cerrar Caja */}
      {isCloseShiftModal && activeShift && (
        <div className="fixed inset-0 z-50 bg-graphite-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full shadow-soft-lg border border-rose-gold-200 p-6 space-y-4 animate-scale-up text-xs">
            <h3 className="font-serif font-bold text-base text-graphite-900">
              Cierre & Arqueo de Caja
            </h3>
            <p className="text-graphite-600">
              Saldo esperado según sistema: <b className="text-graphite-900">${activeShift.expected_cash.toLocaleString('es-AR')}</b>
            </p>
            <form onSubmit={handleCloseShift} className="space-y-3">
              <div>
                <label className="block font-semibold mb-1">Efectivo Real en Mano ($) *</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={actualCash}
                  onChange={(e) => setActualCash(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-rose-gold-200 font-bold"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Observaciones de Cierre</label>
                <textarea
                  rows={2}
                  value={closedNotes}
                  onChange={(e) => setClosedNotes(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-rose-gold-200"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsCloseShiftModal(false)} className="px-4 py-2 rounded-xl border">Cancelar</button>
                <button type="submit" disabled={loading} className="px-5 py-2 bg-rose-gold-600 text-white rounded-xl font-bold">Confirmar Cierre</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Egreso */}
      {isExpenseModal && (
        <div className="fixed inset-0 z-50 bg-graphite-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full shadow-soft-lg border border-rose-gold-200 p-6 space-y-4 animate-scale-up text-xs">
            <h3 className="font-serif font-bold text-base text-graphite-900">
              Registrar Gasto / Egreso
            </h3>
            <form onSubmit={handleRegisterExpense} className="space-y-3">
              <div>
                <label className="block font-semibold mb-1">Monto ($) *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-rose-gold-200 font-bold"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Concepto / Categoría *</label>
                <input
                  type="text"
                  required
                  value={expenseCategory}
                  onChange={(e) => setExpenseCategory(e.target.value)}
                  placeholder="ej. Viáticos, Insumos descartables, Limpieza..."
                  className="w-full p-2.5 rounded-xl border border-rose-gold-200"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Medio de Pago *</label>
                <select
                  value={expenseMethod}
                  onChange={(e) => setExpenseMethod(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-rose-gold-200"
                >
                  <option value="cash">Efectivo de Caja</option>
                  <option value="transfer">Transferencia Bancaria</option>
                  <option value="card_debit">Tarjeta Débito</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold mb-1">Notas</label>
                <input
                  type="text"
                  value={expenseNotes}
                  onChange={(e) => setExpenseNotes(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-rose-gold-200"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsExpenseModal(false)} className="px-4 py-2 rounded-xl border">Cancelar</button>
                <button type="submit" disabled={loading} className="px-5 py-2 bg-rose-600 text-white rounded-xl font-bold">Registrar Egreso</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Configuración de Reglas de Cobro, Descuentos y Recargos */}
      {isPaymentRulesModalOpen && editingPaymentRules && (
        <div className="fixed inset-0 z-50 bg-graphite-900/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-soft-lg border border-rose-gold-200 overflow-hidden animate-scale-up text-xs my-8 flex flex-col max-h-[90vh]">
            <div className="p-4 bg-gradient-to-r from-rose-gold-500 to-rose-gold-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                <h3 className="font-serif font-bold text-sm">
                  Configuración de Medios de Pago & Recargos
                </h3>
              </div>
              <button
                onClick={() => setIsPaymentRulesModalOpen(false)}
                className="p-1 rounded-lg hover:bg-white/20 text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePaymentRules} className="p-5 space-y-4 overflow-y-auto flex-1">
              <p className="text-graphite-600 text-[11px]">
                Configura los porcentajes automáticos de descuento o recargo según el medio de pago utilizado por el cliente.
              </p>

              {/* Reglas Generales */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-silk-50 rounded-2xl border border-rose-gold-200/80">
                <div>
                  <label className="font-bold text-graphite-700 block mb-1">
                    💵 Descuento en Efectivo (%):
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.5"
                      value={editingPaymentRules.cash_discount_percent}
                      onChange={(e) =>
                        setEditingPaymentRules({
                          ...editingPaymentRules,
                          cash_discount_percent: Number(e.target.value),
                        })
                      }
                      className="w-full p-2 pr-6 rounded-xl border border-rose-gold-300 font-bold"
                    />
                    <span className="absolute right-2 top-2 text-graphite-400 font-bold">%</span>
                  </div>
                  <span className="text-[10px] text-graphite-400">Ej: 10 para aplicar 10% desc.</span>
                </div>

                <div>
                  <label className="font-bold text-graphite-700 block mb-1">
                    💳 Recargo T. Débito (%):
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.5"
                      value={editingPaymentRules.debit_surcharge_percent}
                      onChange={(e) =>
                        setEditingPaymentRules({
                          ...editingPaymentRules,
                          debit_surcharge_percent: Number(e.target.value),
                        })
                      }
                      className="w-full p-2 pr-6 rounded-xl border border-rose-gold-300 font-bold"
                    />
                    <span className="absolute right-2 top-2 text-graphite-400 font-bold">%</span>
                  </div>
                  <span className="text-[10px] text-graphite-400">0 si no aplica recargo</span>
                </div>

                <div>
                  <label className="font-bold text-graphite-700 block mb-1">
                    📱 Descuento Transferencia (%):
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.5"
                      value={editingPaymentRules.transfer_discount_percent}
                      onChange={(e) =>
                        setEditingPaymentRules({
                          ...editingPaymentRules,
                          transfer_discount_percent: Number(e.target.value),
                        })
                      }
                      className="w-full p-2 pr-6 rounded-xl border border-rose-gold-300 font-bold"
                    />
                    <span className="absolute right-2 top-2 text-graphite-400 font-bold">%</span>
                  </div>
                  <span className="text-[10px] text-graphite-400">Descuento o 0 si neutro</span>
                </div>

                <div>
                  <label className="font-bold text-graphite-700 block mb-1">
                    💳 Recargo Estándar Crédito (%):
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.5"
                      value={editingPaymentRules.credit_default_surcharge_percent}
                      onChange={(e) =>
                        setEditingPaymentRules({
                          ...editingPaymentRules,
                          credit_default_surcharge_percent: Number(e.target.value),
                        })
                      }
                      className="w-full p-2 pr-6 rounded-xl border border-rose-gold-300 font-bold"
                    />
                    <span className="absolute right-2 top-2 text-graphite-400 font-bold">%</span>
                  </div>
                  <span className="text-[10px] text-graphite-400">Para tarjetas no listadas</span>
                </div>
              </div>

              {/* Reglas Específicas por Tarjeta o Banco */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-graphite-800 text-xs">
                    Reglas Específicas por Tarjeta / Banco:
                  </label>
                  <span className="text-[10px] text-graphite-500">
                    {editingPaymentRules.card_rules.length} tarjetas configuradas
                  </span>
                </div>

                {/* Lista de tarjetas */}
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {editingPaymentRules.card_rules.length === 0 ? (
                    <p className="text-graphite-400 italic p-3 text-center bg-silk-50 rounded-xl">
                      No hay reglas específicas configuradas. Se aplicará el recargo estándar.
                    </p>
                  ) : (
                    editingPaymentRules.card_rules.map((rule) => (
                      <div
                        key={rule.id}
                        className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                          rule.is_active
                            ? 'bg-white border-rose-gold-200 text-graphite-800'
                            : 'bg-silk-100/60 border-gray-200 text-graphite-400 opacity-60'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-rose-gold-600" />
                          <span className="font-semibold">{rule.name}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                              rule.percentage >= 0
                                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            }`}
                          >
                            {rule.percentage >= 0 ? `+${rule.percentage}%` : `${rule.percentage}%`}
                          </span>

                          <button
                            type="button"
                            onClick={() => handleToggleCardRule(rule.id)}
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold border transition-colors ${
                              rule.is_active
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                : 'bg-gray-100 text-gray-600 border-gray-300'
                            }`}
                          >
                            {rule.is_active ? 'Activa' : 'Pausada'}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleRemoveCardRule(rule.id)}
                            className="p-1 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors"
                            title="Eliminar regla"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Formulario para agregar nueva tarjeta */}
                <div className="p-3 bg-silk-100 rounded-2xl border border-rose-gold-200 space-y-2">
                  <span className="text-[11px] font-bold text-graphite-700 block">
                    + Añadir Tarjeta o Promoción Bancaria:
                  </span>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Ej. Mastercard, Visa Banco Nación, Cabal..."
                      value={newCardName}
                      onChange={(e) => setNewCardName(e.target.value)}
                      className="flex-1 p-2 rounded-xl border border-rose-gold-300 bg-white"
                    />
                    <div className="relative w-24">
                      <input
                        type="number"
                        step="0.5"
                        placeholder="%"
                        value={newCardPercent}
                        onChange={(e) => setNewCardPercent(Number(e.target.value))}
                        className="w-full p-2 pr-6 rounded-xl border border-rose-gold-300 bg-white font-bold text-center"
                      />
                      <span className="absolute right-2 top-2 text-graphite-400 font-bold">%</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddCardRule}
                      disabled={!newCardName.trim()}
                      className="px-3 py-2 bg-rose-gold-600 hover:bg-rose-gold-700 disabled:opacity-50 text-white rounded-xl font-bold shadow-soft transition-all"
                    >
                      Añadir
                    </button>
                  </div>
                </div>
              </div>

              {/* Botones de Acción */}
              <div className="flex justify-end gap-2 pt-3 border-t border-rose-gold-100">
                <button
                  type="button"
                  onClick={() => setIsPaymentRulesModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-rose-gold-300 hover:bg-silk-50 transition-colors font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-gradient-to-r from-rose-gold-600 to-rose-gold-700 hover:from-rose-gold-700 hover:to-rose-gold-800 text-white rounded-xl font-bold shadow-soft transition-all"
                >
                  Guardar Configuración
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
