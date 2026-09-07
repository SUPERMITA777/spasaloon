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
} from 'lucide-react';

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

  // Comisiones
  const [commissions, setCommissions] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'cash' | 'commissions'>('cash');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCommissions();
  }, []);

  const loadCommissions = async () => {
    try {
      const comms = await api.getCommissions();
      setCommissions(comms);
    } catch (e) {
      console.error(e);
    }
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

        <div className="flex items-center gap-3">
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
          {/* Summary Cards */}
          {activeShift && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-3xl border border-rose-gold-100 shadow-soft">
                <span className="text-[10px] font-bold text-graphite-400 uppercase tracking-wider">
                  Fondo Inicial
                </span>
                <p className="font-serif font-bold text-xl text-graphite-900 mt-1">
                  ${activeShift.initial_cash.toLocaleString('es-AR')}
                </p>
                <p className="text-[10px] text-graphite-500 mt-0.5">
                  Abierto por {activeShift.opened_by}
                </p>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-emerald-100 shadow-soft">
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
                  Total Ingresos (Cobros)
                </span>
                <p className="font-serif font-bold text-xl text-emerald-700 mt-1">
                  +${activeShift.total_incomes.toLocaleString('es-AR')}
                </p>
                <p className="text-[10px] text-graphite-500 mt-0.5">
                  Turnos & Productos
                </p>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-rose-100 shadow-soft">
                <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider">
                  Total Egresos (Gastos)
                </span>
                <p className="font-serif font-bold text-xl text-rose-600 mt-1">
                  -${activeShift.total_expenses.toLocaleString('es-AR')}
                </p>
                <p className="text-[10px] text-graphite-500 mt-0.5">
                  Insumos & Compras
                </p>
              </div>

              <div className="bg-gradient-to-br from-rose-gold-500 to-rose-gold-600 text-white p-5 rounded-3xl shadow-soft">
                <span className="text-[10px] font-bold uppercase tracking-wider opacity-90">
                  Saldo Esperado en Caja
                </span>
                <p className="font-serif font-bold text-2xl mt-1">
                  ${activeShift.expected_cash.toLocaleString('es-AR')}
                </p>
                <p className="text-[10px] opacity-80 mt-0.5">
                  Estado: {activeShift.status === 'open' ? '🟢 Abierta' : '🔴 Cerrada'}
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
                          <td className="p-3.5 capitalize text-graphite-600">{tx.payment_method}</td>
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
    </div>
  );
};
