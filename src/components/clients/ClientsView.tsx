import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Client } from '../../types';
import { api } from '../../services/api';
import {
  Users,
  Search,
  Plus,
  Phone,
  Mail,
  Calendar,
  Activity,
  Sparkles,
  Edit2,
  Trash2,
  LayoutGrid,
  Table,
  Download,
  Upload,
} from 'lucide-react';
import { ClientProfileModal } from './ClientProfileModal';
import { downloadTemplateCSV } from '../../utils/spreadsheetTemplates';
import { ImportSpreadsheetModal } from '../common/ImportSpreadsheetModal';

export const ClientsView: React.FC = () => {
  const { clients, refreshAllData, addToast } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'spreadsheet'>(() => {
    return (localStorage.getItem('hikari_view_mode_clients') as 'grid' | 'spreadsheet') || 'grid';
  });

  const handleSetViewMode = (mode: 'grid' | 'spreadsheet') => {
    setViewMode(mode);
    localStorage.setItem('hikari_view_mode_clients', mode);
  };
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  
  // Modales
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  // Formulario cliente
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [dni, setDni] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const filteredClients = clients.filter((c) => {
    const term = searchTerm.toLowerCase();
    return (
      c.first_name.toLowerCase().includes(term) ||
      c.last_name.toLowerCase().includes(term) ||
      c.phone.includes(term) ||
      (c.dni && c.dni.includes(term))
    );
  });

  const handleOpenCreate = () => {
    setEditingClient(null);
    setFirstName('');
    setLastName('');
    setPhone('');
    setEmail('');
    setDni('');
    setBirthDate('');
    setNotes('');
    setIsClientModalOpen(true);
  };

  const handleOpenEdit = (client: Client, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingClient(client);
    setFirstName(client.first_name);
    setLastName(client.last_name);
    setPhone(client.phone);
    setEmail(client.email || '');
    setDni(client.dni || '');
    setBirthDate(client.birth_date ? client.birth_date.split('T')[0] : '');
    setNotes(client.notes || '');
    setIsClientModalOpen(true);
  };

  const handleSubmitClient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const payload = {
        first_name: firstName,
        last_name: lastName,
        phone,
        email: email || null,
        dni: dni || null,
        birth_date: birthDate || null,
        notes: notes || null,
      };

      if (editingClient) {
        await api.updateClient(editingClient.id, payload);
        addToast({ type: 'success', title: 'Cliente actualizado exitosamente' });
      } else {
        await api.createClient(payload);
        addToast({ type: 'success', title: 'Cliente registrado exitosamente' });
      }

      await refreshAllData();
      setIsClientModalOpen(false);
    } catch (error: any) {
      addToast({ type: 'error', title: 'Error al guardar cliente', message: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClient = async (clientId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('¿Estás seguro de que deseas eliminar este cliente?')) return;
    try {
      await api.deleteClient(clientId);
      await refreshAllData();
      addToast({ type: 'success', title: 'Cliente eliminado' });
    } catch (error: any) {
      addToast({ type: 'error', title: 'Error al eliminar cliente', message: error.message });
    }
  };

  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto bg-silk-100/60">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif font-bold text-2xl text-graphite-900 leading-tight">
            Clientes & Consultantes
          </h1>
          <p className="text-xs text-graphite-500 mt-0.5">
            Gestión integral de pacientes, historial clínico, fichas técnicas y consentimientos
          </p>
        </div>

        {/* Action Buttons: Mode, Template, Import, New */}
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
            onClick={() => downloadTemplateCSV('clientes')}
            title="Descargar archivo modelo en formato CSV/Excel con datos de ejemplo"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-white border border-rose-gold-200 text-graphite-700 hover:bg-rose-gold-50 text-xs font-semibold shadow-soft transition-all"
          >
            <Download className="w-3.5 h-3.5 text-rose-gold-600" />
            <span className="hidden md:inline">Planilla Ejemplo</span>
          </button>

          <button
            onClick={() => setIsImportModalOpen(true)}
            title="Importar clientes masivamente desde otro sistema"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-white border border-rose-gold-200 text-rose-gold-800 hover:bg-rose-gold-50 text-xs font-semibold shadow-soft transition-all"
          >
            <Upload className="w-3.5 h-3.5 text-rose-gold-600" />
            <span>Importar</span>
          </button>

          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-rose-gold-500 to-rose-gold-600 hover:from-rose-gold-600 hover:to-rose-gold-700 text-white text-xs font-semibold shadow-soft hover:shadow-soft-md transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Cliente</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="p-4 bg-white rounded-3xl border border-rose-gold-200/80 shadow-soft flex items-center gap-3">
        <Search className="w-4 h-4 text-rose-gold-500" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar cliente por nombre, apellido, teléfono, DNI..."
          className="flex-1 text-xs text-graphite-800 placeholder:text-graphite-400 focus:outline-none"
        />
        <span className="text-xs font-semibold text-graphite-400">
          {filteredClients.length} clientes encontrados
        </span>
      </div>

      {/* CONTENIDO: MODO PLANILLA vs TARJETAS */}
      {viewMode === 'spreadsheet' ? (
        <div className="bg-white rounded-3xl border border-rose-gold-200/80 shadow-soft overflow-hidden">
          <div className="p-4 border-b border-rose-gold-100 bg-silk-50/70 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Table className="w-4 h-4 text-rose-gold-600" />
              <span className="text-xs font-bold text-graphite-900">
                Planilla de Clientes ({filteredClients.length})
              </span>
            </div>
            <span className="text-[11px] text-graphite-500 italic">
              💡 Haz clic en cualquier fila para ver el expediente, editar o eliminar
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-rose-gold-100 bg-silk-100/60 text-graphite-600 font-bold text-[11px]">
                  <th className="py-3 px-4">Cliente</th>
                  <th className="py-3 px-3">Teléfono / WhatsApp</th>
                  <th className="py-3 px-3">DNI</th>
                  <th className="py-3 px-3">Email</th>
                  <th className="py-3 px-3">Cumpleaños</th>
                  <th className="py-3 px-3 text-center">Sesiones</th>
                  <th className="py-3 px-3">Notas</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rose-gold-100">
                {filteredClients.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-xs text-graphite-400">
                      No se encontraron clientes coincidentes.
                    </td>
                  </tr>
                ) : (
                  filteredClients.map((client) => (
                    <tr
                      key={client.id}
                      onClick={() => setSelectedClient(client)}
                      className="hover:bg-rose-gold-50/50 cursor-pointer transition-colors"
                      title="Haz clic para abrir el expediente completo"
                    >
                      <td className="py-3 px-4 font-semibold text-graphite-900 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-rose-gold-100 to-rose-blush-100 border border-rose-gold-200 flex items-center justify-center text-rose-gold-700 font-serif font-bold text-xs shadow-xs">
                            {client.first_name[0]}
                          </div>
                          <span>{client.first_name} {client.last_name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 font-medium text-graphite-700 whitespace-nowrap">
                        {client.phone}
                      </td>
                      <td className="py-3 px-3 text-graphite-600 whitespace-nowrap">
                        {client.dni || '—'}
                      </td>
                      <td className="py-3 px-3 text-graphite-600 whitespace-nowrap">
                        {client.email || '—'}
                      </td>
                      <td className="py-3 px-3 text-graphite-600 whitespace-nowrap">
                        {client.birth_date ? new Date(client.birth_date).toLocaleDateString('es-AR') : '—'}
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-lg bg-silk-100 text-rose-gold-800 font-bold text-[11px] border border-rose-gold-200/60">
                          {client.total_sessions_count || 0}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-graphite-500 truncate max-w-[180px]">
                        {client.notes || '—'}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={(e) => handleOpenEdit(client, e)}
                            title="Editar Datos"
                            className="p-1 rounded-lg hover:bg-rose-gold-100 text-graphite-600 hover:text-rose-gold-700 transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => handleDeleteClient(client.id, e)}
                            title="Eliminar Cliente"
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
        /* Clients Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClients.map((client) => (
            <div
              key={client.id}
              onClick={() => setSelectedClient(client)}
              className="bg-white rounded-3xl p-5 border border-rose-gold-100 hover:border-rose-gold-300 shadow-soft hover:shadow-soft-md transition-all duration-200 cursor-pointer space-y-4 group flex flex-col justify-between"
            >
              <div className="space-y-3">
                {/* Top row */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-gold-100 to-rose-blush-100 border border-rose-gold-200 flex items-center justify-center text-rose-gold-700 font-serif font-bold text-lg shadow-sm">
                      {client.first_name[0]}
                    </div>
                    <div>
                      <h3 className="font-serif font-bold text-base text-graphite-900 group-hover:text-rose-gold-700 transition-colors">
                        {client.first_name} {client.last_name}
                      </h3>
                      <p className="text-xs text-graphite-500">
                        DNI: {client.dni || 'No registrado'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => handleOpenEdit(client, e)}
                      className="p-2 rounded-xl bg-silk-100 hover:bg-rose-gold-100 text-rose-gold-800 transition-colors"
                      title="Editar datos del cliente"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => handleDeleteClient(client.id, e)}
                      className="p-2 rounded-xl text-graphite-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Eliminar cliente"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Contact details */}
                <div className="space-y-1.5 text-xs text-graphite-600 bg-silk-50 p-3 rounded-2xl border border-rose-gold-100/60">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-rose-gold-500" />
                    <span className="font-medium">{client.phone}</span>
                  </div>
                  {client.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-rose-gold-500" />
                      <span className="truncate">{client.email}</span>
                    </div>
                  )}
                  {client.birth_date && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-rose-gold-500" />
                      <span>{new Date(client.birth_date).toLocaleDateString('es-AR')}</span>
                    </div>
                  )}
                </div>

                {/* Clinical Notes Summary */}
                {client.notes && (
                  <div className="p-2.5 bg-rose-blush-50/50 rounded-xl border border-rose-blush-100 text-[11px] text-graphite-600 line-clamp-2">
                    <span className="font-semibold text-rose-gold-800">Notas: </span>
                    {client.notes}
                  </div>
                )}
              </div>

              {/* Bottom stats */}
              <div className="pt-3 border-t border-rose-gold-100 flex items-center justify-between text-[11px] text-graphite-500">
                <span className="font-semibold text-rose-gold-800">
                  {client.total_sessions_count || 0} sesiones realizadas
                </span>
                <span className="text-graphite-400 font-medium">Ver Expediente →</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Perfil del Cliente */}
      {selectedClient && (
        <ClientProfileModal
          clientId={selectedClient.id}
          onClose={() => setSelectedClient(null)}
        />
      )}

      {/* Modal Crear / Editar Cliente */}
      {isClientModalOpen && (
        <div className="fixed inset-0 z-50 bg-graphite-900/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-soft-lg border border-rose-gold-200 overflow-hidden animate-scale-up">
            <div className="p-5 bg-gradient-to-r from-rose-gold-600 to-rose-gold-500 text-white flex items-center justify-between">
              <h2 className="font-serif font-bold text-lg">
                {editingClient ? 'Editar Datos del Cliente' : 'Registrar Nuevo Cliente'}
              </h2>
              <button
                onClick={() => setIsClientModalOpen(false)}
                className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitClient} className="p-6 space-y-4 bg-silk-50/50 text-xs">
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

              <div>
                <label className="block font-semibold text-graphite-700 mb-1">
                  Teléfono / WhatsApp *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="+54 9 11 ..."
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-white border border-rose-gold-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-graphite-700 mb-1">DNI / Identificación</label>
                  <input
                    type="text"
                    value={dni}
                    onChange={(e) => setDni(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-white border border-rose-gold-200"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-graphite-700 mb-1">Fecha de Nacimiento</label>
                  <input
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-white border border-rose-gold-200"
                  />
                </div>
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

              <div>
                <label className="block font-semibold text-graphite-700 mb-1">Notas Internas / Preferencias</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Preferencias, antecedentes..."
                  className="w-full p-2.5 rounded-xl bg-white border border-rose-gold-200"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2.5 border-t border-rose-gold-100">
                <button
                  type="button"
                  onClick={() => setIsClientModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-rose-gold-300 font-semibold text-graphite-700 hover:bg-silk-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-rose-gold-500 to-rose-gold-600 hover:from-rose-gold-600 hover:to-rose-gold-700 text-white font-semibold shadow-soft"
                >
                  {loading ? 'Guardando...' : editingClient ? 'Actualizar Cliente' : 'Registrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Importar Planilla Masiva */}
      <ImportSpreadsheetModal
        type="clientes"
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={refreshAllData}
        addToast={addToast}
      />
    </div>
  );
};
