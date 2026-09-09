import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Staff } from '../../types';
import { api } from '../../services/api';
import { downloadTemplateCSV } from '../../utils/spreadsheetTemplates';
import { ImportSpreadsheetModal } from '../common/ImportSpreadsheetModal';
import {
  UserCheck,
  Plus,
  QrCode,
  Smartphone,
  Calendar,
  DollarSign,
  Phone,
  Mail,
  Shield,
  Clock,
  Printer,
  Edit2,
  Trash2,
  LayoutGrid,
  Table,
  Download,
  Upload,
} from 'lucide-react';

export const StaffView: React.FC = () => {
  const { staff, refreshAllData, addToast, setIsStaffQrModalOpen } = useApp();
  const [viewMode, setViewMode] = useState<'grid' | 'spreadsheet'>(() => {
    return (localStorage.getItem('hikari_view_mode_staff') as 'grid' | 'spreadsheet') || 'grid';
  });

  const handleSetViewMode = (mode: 'grid' | 'spreadsheet') => {
    setViewMode(mode);
    localStorage.setItem('hikari_view_mode_staff', mode);
  };
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [confirmDeleteStaff, setConfirmDeleteStaff] = useState<Staff | null>(null);

  // Formulario staff
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('esteticista');
  const [commissionRate, setCommissionRate] = useState(30);
  const [pinCode, setPinCode] = useState('1234');
  const [colorCode, setColorCode] = useState('#C59B7E');
  const [loading, setLoading] = useState(false);

  const handleOpenCreate = () => {
    setEditingStaff(null);
    setFirstName('');
    setLastName('');
    setPhone('');
    setEmail('');
    setRole('esteticista');
    setCommissionRate(30);
    setPinCode('1234');
    setColorCode('#C59B7E');
    setIsStaffModalOpen(true);
  };

  const handleOpenEdit = (s: Staff, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingStaff(s);
    setFirstName(s.first_name);
    setLastName(s.last_name);
    setPhone(s.phone);
    setEmail(s.email || '');
    setRole(s.role);
    setCommissionRate(s.default_commission_rate);
    setPinCode(s.pin_code || '1234');
    setColorCode(s.color_code || '#C59B7E');
    setIsStaffModalOpen(true);
  };

  const handleDeleteStaff = async (s: Staff) => {
    try {
      setLoading(true);
      await api.deleteStaff(s.id);
      await refreshAllData();
      addToast({ type: 'info', title: 'Profesional eliminado', message: `${s.first_name} ${s.last_name} fue dado de baja.` });
      setConfirmDeleteStaff(null);
      setIsStaffModalOpen(false);
    } catch (error: any) {
      addToast({ type: 'error', title: 'Error al eliminar profesional', message: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const payload = {
        first_name: firstName,
        last_name: lastName,
        phone,
        email: email || null,
        role,
        commission_type: 'fixed_percent',
        default_commission_rate: Number(commissionRate),
        pin_code: pinCode,
        color_code: colorCode,
      };

      if (editingStaff) {
        await api.updateStaff(editingStaff.id, payload);
        addToast({ type: 'success', title: 'Profesional actualizado exitosamente' });
      } else {
        await api.createStaff(payload);
        addToast({ type: 'success', title: 'Profesional registrado exitosamente' });
      }

      await refreshAllData();
      setIsStaffModalOpen(false);
    } catch (error: any) {
      addToast({ type: 'error', title: 'Error al guardar profesional', message: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto bg-silk-100/60">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif font-bold text-2xl text-graphite-900 leading-tight">
            Personal & Profesionales
          </h1>
          <p className="text-xs text-graphite-500 mt-0.5">
            Gestión de profesionales, comisiones asignadas, horarios de trabajo y códigos QR móviles
          </p>
        </div>

        {/* Action Buttons: View mode, Template, Import, QR, New */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Selector de Modo: Tarjetas vs Planilla */}
          <div className="flex bg-white p-1 rounded-2xl border border-rose-gold-200 shadow-sm">
            <button
              onClick={() => handleSetViewMode('grid')}
              title="Vista de Tarjetas"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                viewMode === 'grid'
                  ? 'bg-rose-gold-50 text-rose-gold-800 shadow-xs font-bold border border-rose-gold-200'
                  : 'text-graphite-600 hover:text-graphite-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Tarjetas</span>
            </button>
            <button
              onClick={() => handleSetViewMode('spreadsheet')}
              title="Vista en Modo Planilla (Tabla interactiva)"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                viewMode === 'spreadsheet'
                  ? 'bg-rose-gold-50 text-rose-gold-800 shadow-xs font-bold border border-rose-gold-200'
                  : 'text-graphite-600 hover:text-graphite-900'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>Modo Planilla</span>
            </button>
          </div>

          <button
            onClick={() => downloadTemplateCSV('profesionales')}
            title="Descargar archivo modelo en formato CSV/Excel con datos de ejemplo"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-white border border-rose-gold-200 text-graphite-700 hover:bg-rose-gold-50 text-xs font-semibold shadow-soft transition-all"
          >
            <Download className="w-3.5 h-3.5 text-rose-gold-600" />
            <span className="hidden md:inline">Planilla Ejemplo</span>
          </button>

          <button
            onClick={() => setIsImportModalOpen(true)}
            title="Importar profesionales masivamente desde otro sistema"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-white border border-rose-gold-200 text-rose-gold-800 hover:bg-rose-gold-50 text-xs font-semibold shadow-soft transition-all"
          >
            <Upload className="w-3.5 h-3.5 text-rose-gold-600" />
            <span>Importar</span>
          </button>

          <button
            onClick={() => setIsStaffQrModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-rose-gold-100 hover:bg-rose-gold-200 text-rose-gold-800 text-xs font-semibold border border-rose-gold-200 transition-colors shadow-soft"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Tarjetas QR</span>
          </button>

          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-rose-gold-500 to-rose-gold-600 hover:from-rose-gold-600 hover:to-rose-gold-700 text-white text-xs font-semibold shadow-soft hover:shadow-soft-md transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Profesional</span>
          </button>
        </div>
      </div>

      {/* CONTENIDO: MODO PLANILLA vs TARJETAS */}
      {viewMode === 'spreadsheet' ? (
        <div className="bg-white rounded-3xl border border-rose-gold-200/80 shadow-soft overflow-hidden">
          <div className="p-4 border-b border-rose-gold-100 bg-silk-50/70 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Table className="w-4 h-4 text-rose-gold-600" />
              <span className="text-xs font-bold text-graphite-900">
                Planilla de Personal & Profesionales ({staff.length})
              </span>
            </div>
            <span className="text-[11px] text-graphite-500 italic">
              💡 Haz clic en cualquier fila para ver, editar o dar de baja al profesional
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-rose-gold-100 bg-silk-100/60 text-graphite-600 font-bold text-[11px]">
                  <th className="py-3 px-4">Profesional</th>
                  <th className="py-3 px-3">Especialidad / Rol</th>
                  <th className="py-3 px-3">Teléfono / Celular</th>
                  <th className="py-3 px-3">Email</th>
                  <th className="py-3 px-3 text-center">% Comisión</th>
                  <th className="py-3 px-3 text-center">PIN Acceso</th>
                  <th className="py-3 px-3 text-center">Estado</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rose-gold-100">
                {staff.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-xs text-graphite-400">
                      No hay profesionales registrados.
                    </td>
                  </tr>
                ) : (
                  staff.map((s) => (
                    <tr
                      key={s.id}
                      onClick={() => handleOpenEdit(s)}
                      className="hover:bg-rose-gold-50/50 cursor-pointer transition-colors"
                      title="Haz clic para ver y editar los datos de este profesional"
                    >
                      <td className="py-3 px-4 font-semibold text-graphite-900 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-7 h-7 rounded-xl flex items-center justify-center text-white font-serif font-bold text-xs shadow-xs"
                            style={{ backgroundColor: s.color_code }}
                          >
                            {s.first_name[0]}
                          </div>
                          <span>{s.first_name} {s.last_name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-rose-gold-700 bg-rose-gold-50 px-2 py-0.5 rounded-lg border border-rose-gold-200">
                          {s.role}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-medium text-graphite-700 whitespace-nowrap">
                        {s.phone}
                      </td>
                      <td className="py-3 px-3 text-graphite-600 whitespace-nowrap">
                        {s.email || '—'}
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-graphite-900 whitespace-nowrap">
                        {s.default_commission_rate}%
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-[11px] text-graphite-600 whitespace-nowrap">
                        {s.pin_code}
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            s.active ? 'bg-sage-100 text-sage-800' : 'bg-silk-200 text-graphite-500'
                          }`}
                        >
                          {s.active ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={(e) => handleOpenEdit(s, e)}
                            title="Editar Profesional"
                            className="p-1 rounded-lg hover:bg-rose-gold-100 text-graphite-600 hover:text-rose-gold-700 transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmDeleteStaff(s);
                            }}
                            title="Dar de baja profesional"
                            className="p-1 rounded-lg hover:bg-rose-100 text-graphite-400 hover:text-rose-600 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Staff Grid Tradicional */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {staff.map((s) => (
            <div
              key={s.id}
              onClick={() => handleOpenEdit(s)}
              className="bg-white rounded-3xl p-6 border border-rose-gold-100 shadow-soft hover:shadow-soft-md transition-all space-y-5 flex flex-col justify-between cursor-pointer"
            >
              <div className="space-y-4">
                {/* Top info */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-serif font-bold text-xl shadow-sm"
                      style={{ backgroundColor: s.color_code }}
                    >
                      {s.first_name[0]}
                    </div>
                    <div>
                      <h3 className="font-serif font-bold text-base text-graphite-900">
                        {s.first_name} {s.last_name}
                      </h3>
                      <span className="text-xs font-semibold text-rose-gold-600 uppercase tracking-wide">
                        {s.role}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={(e) => handleOpenEdit(s, e)}
                      className="p-2 rounded-xl bg-silk-100 hover:bg-rose-gold-100 text-rose-gold-800 transition-colors"
                      title="Editar profesional"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setConfirmDeleteStaff(s)}
                      className="p-2 rounded-xl text-graphite-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Eliminar profesional"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-2 text-xs text-graphite-600 bg-silk-50 p-4 rounded-2xl border border-rose-gold-100/60">
                  <div className="flex items-center justify-between">
                    <span className="text-graphite-400">Comisión Base:</span>
                    <span className="font-bold text-graphite-900 bg-white px-2 py-0.5 rounded-lg border border-rose-gold-200">
                      {s.default_commission_rate}% por servicio
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-graphite-400">PIN Acceso Rápido:</span>
                    <span className="font-mono font-bold text-rose-gold-700 bg-white px-2 py-0.5 rounded-lg border border-rose-gold-200">
                      ••••
                    </span>
                  </div>
                  <div className="flex items-center gap-2 pt-1 border-t border-rose-gold-100/40">
                    <Phone className="w-3.5 h-3.5 text-rose-gold-500" />
                    <span>{s.phone}</span>
                  </div>
                  {s.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-rose-gold-500" />
                      <span className="truncate">{s.email}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Botón QR individual */}
              <div className="pt-2 border-t border-rose-gold-100 flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
                <span className="text-[11px] font-semibold text-graphite-500">
                  {s.active ? '● Activo en agenda' : '○ Inactivo'}
                </span>
                <button
                  onClick={() => setIsStaffQrModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-rose-gold-200 hover:bg-rose-gold-50 text-rose-gold-800 text-xs font-semibold transition-colors"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Portal QR</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Importar Planilla Masiva */}
      <ImportSpreadsheetModal
        type="profesionales"
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={refreshAllData}
        addToast={addToast}
      />

      {/* Modal Crear / Editar Profesional */}
      {isStaffModalOpen && (
        <div className="fixed inset-0 z-50 bg-graphite-900/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-soft-lg border border-rose-gold-200 overflow-hidden animate-scale-up">
            <div className="p-5 bg-gradient-to-r from-rose-gold-600 to-rose-gold-500 text-white flex items-center justify-between">
              <h2 className="font-serif font-bold text-lg">
                {editingStaff ? 'Editar Profesional' : 'Nuevo Profesional'}
              </h2>
              <button
                onClick={() => setIsStaffModalOpen(false)}
                className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitStaff} className="p-6 space-y-4 bg-silk-50/50 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-graphite-700 mb-1">Nombre *</label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-white border border-rose-gold-200"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-graphite-700 mb-1">Apellido *</label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-white border border-rose-gold-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-graphite-700 mb-1">Rol / Especialidad *</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-white border border-rose-gold-200"
                  >
                    <option value="esteticista">Esteticista</option>
                    <option value="cosmetologa">Cosmetóloga</option>
                    <option value="masajista">Masajista</option>
                    <option value="dermatocosmiatra">Dermatocosmiatra</option>
                    <option value="recepcion">Recepción</option>
                    <option value="administrador">Administrador</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-graphite-700 mb-1">% Comisión Base *</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    required
                    value={commissionRate}
                    onChange={(e) => setCommissionRate(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl bg-white border border-rose-gold-200 font-bold text-rose-gold-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-graphite-700 mb-1">PIN Acceso (4 dígitos) *</label>
                  <input
                    type="text"
                    maxLength={4}
                    required
                    value={pinCode}
                    onChange={(e) => setPinCode(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-white border border-rose-gold-200 text-center font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-graphite-700 mb-1">Color Distintivo *</label>
                  <input
                    type="color"
                    value={colorCode}
                    onChange={(e) => setColorCode(e.target.value)}
                    className="w-full h-10 p-1 rounded-xl bg-white border border-rose-gold-200 cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-graphite-700 mb-1">Teléfono</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+54 9 11 ..."
                  className="w-full p-2.5 rounded-xl bg-white border border-rose-gold-200"
                />
              </div>

              <div>
                <label className="block font-semibold text-graphite-700 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-white border border-rose-gold-200"
                />
              </div>

              <div className="pt-3 flex items-center justify-between border-t border-rose-gold-100">
                {editingStaff ? (
                  <button
                    type="button"
                    onClick={() => {
                      setIsStaffModalOpen(false);
                      setConfirmDeleteStaff(editingStaff);
                    }}
                    className="flex items-center gap-1.5 text-rose-600 hover:text-rose-700 font-semibold text-xs"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Eliminar</span>
                  </button>
                ) : (
                  <div></div>
                )}

                <div className="flex gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsStaffModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-rose-gold-300 font-semibold text-graphite-700 hover:bg-silk-100"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-rose-gold-500 to-rose-gold-600 hover:from-rose-gold-600 hover:to-rose-gold-700 text-white font-semibold shadow-soft"
                  >
                    {loading ? 'Guardando...' : editingStaff ? 'Actualizar' : 'Registrar'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirmar Eliminación de Profesional */}
      {confirmDeleteStaff && (
        <div className="fixed inset-0 z-50 bg-graphite-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-soft-lg border border-rose-gold-200 space-y-4">
            <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center">
              <Trash2 className="w-5 h-5" />
            </div>

            <div>
              <h3 className="font-serif font-bold text-base text-graphite-900">
                ¿Dar de baja a {confirmDeleteStaff.first_name} {confirmDeleteStaff.last_name}?
              </h3>
              <p className="text-xs text-graphite-500 mt-1">
                El profesional ya no figurará en la agenda activa ni en la lista del personal.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteStaff(null)}
                className="px-3.5 py-1.5 rounded-xl border border-rose-gold-200 text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleDeleteStaff(confirmDeleteStaff)}
                className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-sm"
              >
                Sí, Dar de Baja
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
