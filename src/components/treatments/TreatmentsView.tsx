import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Treatment, SubTreatment, TreatmentCategory } from '../../types';
import { api } from '../../services/api';
import { downloadTemplateCSV } from '../../utils/spreadsheetTemplates';
import { ImportSpreadsheetModal } from '../common/ImportSpreadsheetModal';
import {
  Sparkles,
  Plus,
  Clock,
  DollarSign,
  Edit2,
  Trash2,
  LayoutGrid,
  Table,
  Download,
  Upload,
  Search,
  AlertTriangle,
  Boxes,
} from 'lucide-react';

export const TreatmentsView: React.FC = () => {
  const { treatments, refreshAllData, addToast } = useApp();

  // Vista y filtros
  const [viewMode, setViewMode] = useState<'grid' | 'spreadsheet'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Modales
  const [isTreatmentModalOpen, setIsTreatmentModalOpen] = useState(false);
  const [editingTreatment, setEditingTreatment] = useState<Treatment | null>(null);

  const [isSubModalOpen, setIsSubModalOpen] = useState(false);
  const [targetTreatmentForSub, setTargetTreatmentForSub] = useState<Treatment | null>(null);
  const [editingSubTreatment, setEditingSubTreatment] = useState<SubTreatment | null>(null);

  // Confirmación de eliminación
  const [confirmDeleteTreatment, setConfirmDeleteTreatment] = useState<Treatment | null>(null);
  const [confirmDeleteSub, setConfirmDeleteSub] = useState<{ treatment: Treatment; sub: SubTreatment } | null>(null);

  // Form Treatment
  const [name, setName] = useState('');
  const [category, setCategory] = useState<TreatmentCategory>('facial');
  const [description, setDescription] = useState('');
  const [colorCode, setColorCode] = useState('#C59B7E');

  // Form Sub-treatment
  const [subName, setSubName] = useState('');
  const [subDuration, setSubDuration] = useState(45);
  const [subPrice, setSubPrice] = useState(25000);
  const [loading, setLoading] = useState(false);

  const handleOpenCreateTreatment = () => {
    setEditingTreatment(null);
    setName('');
    setCategory('facial');
    setDescription('');
    setColorCode('#C59B7E');
    setIsTreatmentModalOpen(true);
  };

  const handleOpenEditTreatment = (t: Treatment, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingTreatment(t);
    setName(t.name);
    setCategory(t.category);
    setDescription(t.description || '');
    setColorCode(t.color_code);
    setIsTreatmentModalOpen(true);
  };

  const handleOpenCreateSub = (t: Treatment, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setTargetTreatmentForSub(t);
    setEditingSubTreatment(null);
    setSubName('');
    setSubDuration(45);
    setSubPrice(25000);
    setIsSubModalOpen(true);
  };

  const handleOpenEditSub = (t: Treatment, sub: SubTreatment, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setTargetTreatmentForSub(t);
    setEditingSubTreatment(sub);
    setSubName(sub.name);
    setSubDuration(sub.duration_minutes);
    setSubPrice(sub.base_price);
    setIsSubModalOpen(true);
  };

  const handleSubmitTreatment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const payload = {
        name,
        category,
        description: description || null,
        color_code: colorCode,
      };

      if (editingTreatment) {
        await api.updateTreatment(editingTreatment.id, payload);
        addToast({ type: 'success', title: 'Categoría de tratamiento actualizada' });
      } else {
        await api.createTreatment(payload);
        addToast({ type: 'success', title: 'Categoría de tratamiento creada' });
      }

      await refreshAllData();
      setIsTreatmentModalOpen(false);
    } catch (error: any) {
      addToast({ type: 'error', title: 'Error al guardar tratamiento', message: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTreatment = async (t: Treatment) => {
    try {
      setLoading(true);
      await api.deleteTreatment(t.id);
      await refreshAllData();
      addToast({ type: 'info', title: 'Categoría eliminada', message: `${t.name} fue eliminada exitosamente.` });
      setConfirmDeleteTreatment(null);
      setIsTreatmentModalOpen(false);
    } catch (error: any) {
      addToast({ type: 'error', title: 'Error al eliminar categoría', message: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitSubTreatment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetTreatmentForSub) return;
    try {
      setLoading(true);
      const payload = {
        name: subName,
        duration_minutes: Number(subDuration),
        base_price: Number(subPrice),
      };

      if (editingSubTreatment) {
        await api.updateSubTreatment(editingSubTreatment.id, payload);
        addToast({ type: 'success', title: 'Servicio / Sub-tratamiento actualizado' });
      } else {
        await api.createSubTreatment(targetTreatmentForSub.id, payload);
        addToast({ type: 'success', title: 'Servicio / Sub-tratamiento agregado exitosamente' });
      }

      await refreshAllData();
      setIsSubModalOpen(false);
    } catch (error: any) {
      addToast({ type: 'error', title: 'Error al guardar sub-tratamiento', message: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSubTreatment = async (sub: SubTreatment) => {
    try {
      setLoading(true);
      await api.deleteSubTreatment(sub.id);
      await refreshAllData();
      addToast({ type: 'info', title: 'Servicio eliminado', message: `${sub.name} fue eliminado del catálogo.` });
      setConfirmDeleteSub(null);
      setIsSubModalOpen(false);
    } catch (error: any) {
      addToast({ type: 'error', title: 'Error al eliminar servicio', message: error.message });
    } finally {
      setLoading(false);
    }
  };

  // Filtrado para cuadrícula
  const filteredTreatments = treatments.filter((t) => {
    const matchesCategory = t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.description && t.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesSub = (t.sub_treatments || []).some((s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    return matchesCategory || matchesSub;
  });

  // Lista aplanada para modo planilla (cada fila es un servicio/sub-tratamiento)
  const flattenedServices = treatments.flatMap((t) => {
    const subs = t.sub_treatments || [];
    if (subs.length === 0) {
      return [{
        key: `empty-${t.id}`,
        treatment: t,
        sub: null as SubTreatment | null,
      }];
    }
    return subs.map((s) => ({
      key: `${t.id}-${s.id}`,
      treatment: t,
      sub: s,
    }));
  }).filter((item) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const catMatch = item.treatment.name.toLowerCase().includes(term);
    const subMatch = item.sub ? item.sub.name.toLowerCase().includes(term) : false;
    return catMatch || subMatch;
  });

  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto bg-silk-100/60">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif font-bold text-2xl text-graphite-900 leading-tight">
            Tratamientos & Servicios
          </h1>
          <p className="text-xs text-graphite-500 mt-0.5">
            Configuración de duración de turnos, precios base, insumos consumidos y material de marketing
          </p>
        </div>

        {/* Action Buttons: Toggle, Import, Template, New */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Selector de Modo: Tarjetas vs Planilla */}
          <div className="flex bg-white p-1 rounded-2xl border border-rose-gold-200 shadow-sm">
            <button
              onClick={() => setViewMode('grid')}
              title="Vista de Tarjetas por Categoría"
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
              onClick={() => setViewMode('spreadsheet')}
              title="Vista en Modo Planilla (Tabla interactiva de servicios)"
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
            onClick={() => downloadTemplateCSV('tratamientos')}
            title="Descargar archivo modelo en formato CSV/Excel con datos de ejemplo"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-white border border-rose-gold-200 text-graphite-700 hover:bg-rose-gold-50 text-xs font-semibold shadow-soft transition-all"
          >
            <Download className="w-3.5 h-3.5 text-rose-gold-600" />
            <span className="hidden md:inline">Planilla Ejemplo</span>
          </button>

          <button
            onClick={() => setIsImportModalOpen(true)}
            title="Importar lista masiva de tratamientos y servicios desde archivo Excel / CSV"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-white border border-rose-gold-200 text-graphite-700 hover:bg-rose-gold-50 text-xs font-semibold shadow-soft transition-all"
          >
            <Upload className="w-3.5 h-3.5 text-rose-gold-600" />
            <span>Importar</span>
          </button>

          <button
            onClick={handleOpenCreateTreatment}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-gradient-to-r from-rose-gold-500 to-rose-gold-600 hover:from-rose-gold-600 hover:to-rose-gold-700 text-white text-xs font-semibold shadow-soft hover:shadow-soft-md transition-all duration-200"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Categoría</span>
          </button>
        </div>
      </div>

      {/* Buscador y Resumen */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-rose-gold-100 shadow-soft">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-graphite-400" />
          <input
            type="text"
            placeholder="Buscar por categoría o servicio..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-silk-50 border border-rose-gold-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-rose-gold-400"
          />
        </div>

        <div className="flex items-center gap-4 text-xs text-graphite-600 font-medium">
          <span>
            Categorías: <strong className="text-graphite-900">{treatments.length}</strong>
          </span>
          <span className="text-rose-gold-300">|</span>
          <span>
            Servicios totales:{' '}
            <strong className="text-graphite-900">
              {treatments.reduce((acc, t) => acc + (t.sub_treatments?.length || 0), 0)}
            </strong>
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VISTA 1: MODO PLANILLA (TABLA INTERACTIVA) */}
      {/* ========================================================================= */}
      {viewMode === 'spreadsheet' ? (
        <div className="bg-white rounded-3xl border border-rose-gold-100 shadow-soft overflow-hidden">
          <div className="p-4 bg-silk-50/50 border-b border-rose-gold-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Table className="w-4 h-4 text-rose-gold-600" />
              <span className="font-serif font-bold text-sm text-graphite-900">
                Planilla General de Servicios y Tratamientos
              </span>
              <span className="text-[11px] text-graphite-500">
                ({flattenedServices.length} {flattenedServices.length === 1 ? 'servicio' : 'servicios'})
              </span>
            </div>
            <p className="text-[11px] text-graphite-400 italic hidden sm:block">
              Hacé clic en cualquier fila para ver, editar o eliminar el servicio
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-rose-gold-100 bg-silk-50/80 text-[11px] font-bold text-graphite-600 uppercase tracking-wider">
                  <th className="py-3 px-4">Categoría</th>
                  <th className="py-3 px-4">Servicio / Sub-Tratamiento</th>
                  <th className="py-3 px-4">Duración</th>
                  <th className="py-3 px-4">Precio Base</th>
                  <th className="py-3 px-4">Insumos de Cabina</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rose-gold-100/60 text-xs text-graphite-700">
                {flattenedServices.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-graphite-400 italic">
                      No se encontraron tratamientos ni servicios según el filtro seleccionado.
                    </td>
                  </tr>
                ) : (
                  flattenedServices.map(({ key, treatment, sub }) => (
                    <tr
                      key={key}
                      onClick={() => {
                        if (sub) {
                          handleOpenEditSub(treatment, sub);
                        } else {
                          handleOpenCreateSub(treatment);
                        }
                      }}
                      className="hover:bg-rose-gold-50/50 transition-colors cursor-pointer group"
                    >
                      {/* Categoría */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-3 h-3 rounded-full flex-shrink-0 shadow-xs"
                            style={{ backgroundColor: treatment.color_code }}
                          />
                          <span className="font-semibold text-graphite-900 group-hover:text-rose-gold-800 transition-colors">
                            {treatment.name}
                          </span>
                        </div>
                      </td>

                      {/* Servicio / Sub-tratamiento */}
                      <td className="py-3.5 px-4">
                        {sub ? (
                          <div>
                            <span className="font-serif font-bold text-graphite-900 group-hover:text-rose-gold-900">
                              {sub.name}
                            </span>
                          </div>
                        ) : (
                          <span className="italic text-graphite-400 text-[11px]">
                            Sin servicios aún. Hacé clic para agregar.
                          </span>
                        )}
                      </td>

                      {/* Duración */}
                      <td className="py-3.5 px-4">
                        {sub ? (
                          <div className="flex items-center gap-1.5 font-medium text-graphite-700">
                            <Clock className="w-3.5 h-3.5 text-rose-gold-500" />
                            <span>{sub.duration_minutes} min</span>
                          </div>
                        ) : (
                          <span className="text-graphite-300">-</span>
                        )}
                      </td>

                      {/* Precio Base */}
                      <td className="py-3.5 px-4">
                        {sub ? (
                          <span className="font-bold text-rose-gold-900 text-sm">
                            ${sub.base_price.toLocaleString('es-AR')}
                          </span>
                        ) : (
                          <span className="text-graphite-300">-</span>
                        )}
                      </td>

                      {/* Insumos */}
                      <td className="py-3.5 px-4">
                        {sub ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-graphite-600 bg-silk-100 px-2 py-0.5 rounded-lg">
                            <Boxes className="w-3 h-3 text-rose-gold-500" />
                            {sub.supplies && sub.supplies.length > 0
                              ? `${sub.supplies.length} insumos`
                              : 'Sin insumos'}
                          </span>
                        ) : (
                          <span className="text-graphite-300">-</span>
                        )}
                      </td>

                      {/* Acciones */}
                      <td className="py-3.5 px-4 text-right">
                        <div
                          className="flex items-center justify-end gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {sub ? (
                            <>
                              <button
                                onClick={(e) => handleOpenEditSub(treatment, sub, e)}
                                title="Editar servicio"
                                className="p-1.5 rounded-lg hover:bg-rose-gold-100 text-rose-gold-700 transition-colors"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setConfirmDeleteSub({ treatment, sub });
                                }}
                                title="Eliminar servicio"
                                className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 hover:text-red-700 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={(e) => handleOpenCreateSub(treatment, e)}
                              className="px-2 py-1 rounded-lg bg-rose-gold-50 text-rose-gold-700 hover:bg-rose-gold-100 text-[11px] font-semibold"
                            >
                              + Agregar
                            </button>
                          )}
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
        /* ========================================================================= */
        /* VISTA 2: MODO TARJETAS / CATEGORÍAS */
        /* ========================================================================= */
        <div className="space-y-6">
          {filteredTreatments.map((treatment) => (
            <div
              key={treatment.id}
              className="bg-white rounded-3xl p-6 border border-rose-gold-100 shadow-soft space-y-4"
            >
              {/* Category Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-rose-gold-100 pb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-sm"
                    style={{ backgroundColor: treatment.color_code }}
                  >
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-serif font-bold text-lg text-graphite-900">
                      {treatment.name}
                    </h2>
                    <p className="text-xs text-graphite-500">{treatment.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => handleOpenEditTreatment(treatment, e)}
                    className="p-2 rounded-xl bg-silk-100 hover:bg-rose-gold-100 text-rose-gold-800 transition-colors"
                    title="Editar categoría"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfirmDeleteTreatment(treatment);
                    }}
                    className="p-2 rounded-xl bg-silk-100 hover:bg-red-50 text-graphite-500 hover:text-red-600 transition-colors"
                    title="Eliminar categoría"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={(e) => handleOpenCreateSub(treatment, e)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-gold-50 hover:bg-rose-gold-100 text-rose-gold-800 text-xs font-semibold border border-rose-gold-200 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Agregar Servicio</span>
                  </button>
                </div>
              </div>

              {/* Sub-treatments Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {(treatment.sub_treatments || []).length === 0 ? (
                  <div className="col-span-full py-6 text-center text-xs text-graphite-400 italic bg-silk-50/50 rounded-2xl border border-dashed border-rose-gold-200">
                    Esta categoría no tiene servicios asociados todavía.{' '}
                    <button
                      onClick={(e) => handleOpenCreateSub(treatment, e)}
                      className="text-rose-gold-600 font-semibold underline hover:text-rose-gold-700"
                    >
                      Agregar uno ahora
                    </button>
                  </div>
                ) : (
                  (treatment.sub_treatments || []).map((sub: SubTreatment) => (
                    <div
                      key={sub.id}
                      onClick={() => handleOpenEditSub(treatment, sub)}
                      className="p-4 rounded-2xl bg-silk-50/70 border border-rose-gold-100 hover:border-rose-gold-300 transition-all space-y-3 shadow-xs flex flex-col justify-between cursor-pointer hover:shadow-sm group"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-serif font-bold text-sm text-graphite-900 leading-tight group-hover:text-rose-gold-900 transition-colors">
                            {sub.name}
                          </h3>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => handleOpenEditSub(treatment, sub, e)}
                              className="p-1 rounded-lg hover:bg-rose-gold-100 text-rose-gold-700 transition-colors"
                              title="Editar servicio"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setConfirmDeleteSub({ treatment, sub });
                              }}
                              className="p-1 rounded-lg hover:bg-red-50 text-graphite-400 hover:text-red-600 transition-colors"
                              title="Eliminar servicio"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 mt-2 text-xs text-graphite-600">
                          <span className="flex items-center gap-1 font-semibold">
                            <Clock className="w-3.5 h-3.5 text-rose-gold-500" />
                            {sub.duration_minutes} min
                          </span>
                          <span className="flex items-center gap-1 font-bold text-rose-gold-800">
                            <DollarSign className="w-3.5 h-3.5 text-rose-gold-500" />
                            ${sub.base_price.toLocaleString('es-AR')}
                          </span>
                        </div>
                      </div>

                      {/* Consumed supplies count */}
                      <div className="pt-2 border-t border-rose-gold-100 flex items-center justify-between text-[10px] text-graphite-500">
                        <span>
                          {sub.supplies && sub.supplies.length > 0
                            ? `${sub.supplies.length} insumos de cabina`
                            : 'Sin insumos configurados'}
                        </span>
                        <span className="text-emerald-700 font-medium">Activo en Agenda</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL CREAR / EDITAR CATEGORÍA */}
      {/* ========================================================================= */}
      {isTreatmentModalOpen && (
        <div className="fixed inset-0 z-50 bg-graphite-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-soft-lg border border-rose-gold-200 overflow-hidden animate-scale-up">
            <div className="p-5 bg-gradient-to-r from-rose-gold-600 to-rose-gold-500 text-white flex justify-between items-center">
              <h3 className="font-serif font-bold text-base">
                {editingTreatment ? 'Editar Categoría de Tratamiento' : 'Nueva Categoría de Tratamiento'}
              </h3>
              <button
                onClick={() => setIsTreatmentModalOpen(false)}
                className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmitTreatment} className="p-6 space-y-4 text-xs bg-silk-50/40">
              <div>
                <label className="block font-semibold mb-1 text-graphite-700">Nombre Categoría *</label>
                <input
                  type="text"
                  required
                  placeholder="ej. Facial & Cosmiatría, Barbería, Podología..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-rose-gold-200 bg-white focus:ring-2 focus:ring-rose-gold-400 outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1 text-graphite-700">Categoría Tipo *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl border border-rose-gold-200 bg-white focus:ring-2 focus:ring-rose-gold-400 outline-none"
                >
                  <option value="facial">Facial / Cosmetología</option>
                  <option value="corporal">Corporal / Reductores</option>
                  <option value="depilacion">Depilación Láser / Cera</option>
                  <option value="spa">Spa & Masajes</option>
                  <option value="masajes">Peluquería / Barbería</option>
                  <option value="otro">Salón de Uñas / Nails</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold mb-1 text-graphite-700">Color Identificador *</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={colorCode}
                    onChange={(e) => setColorCode(e.target.value)}
                    className="w-12 h-10 p-1 rounded-xl border border-rose-gold-200 cursor-pointer bg-white"
                  />
                  <span className="text-xs font-mono text-graphite-600 uppercase">{colorCode}</span>
                </div>
              </div>
              <div>
                <label className="block font-semibold mb-1 text-graphite-700">Descripción</label>
                <textarea
                  rows={2}
                  placeholder="Detalles sobre esta categoría de servicios..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-rose-gold-200 bg-white focus:ring-2 focus:ring-rose-gold-400 outline-none"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-rose-gold-100">
                {editingTreatment ? (
                  <button
                    type="button"
                    onClick={() => {
                      setConfirmDeleteTreatment(editingTreatment);
                    }}
                    className="flex items-center gap-1 px-3 py-2 rounded-xl text-red-600 hover:bg-red-50 text-xs font-semibold transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Eliminar Categoría</span>
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsTreatmentModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-rose-gold-200 bg-white hover:bg-rose-gold-50 font-medium text-graphite-700"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-5 py-2 bg-rose-gold-600 hover:bg-rose-gold-700 text-white rounded-xl font-bold shadow-soft"
                  >
                    {loading ? 'Guardando...' : editingTreatment ? 'Actualizar' : 'Crear'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL CREAR / EDITAR SUB-TRATAMIENTO (SERVICIO) */}
      {/* ========================================================================= */}
      {isSubModalOpen && targetTreatmentForSub && (
        <div className="fixed inset-0 z-50 bg-graphite-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-soft-lg border border-rose-gold-200 overflow-hidden animate-scale-up">
            <div className="p-5 bg-gradient-to-r from-rose-gold-600 to-rose-gold-500 text-white flex justify-between items-center">
              <div>
                <h3 className="font-serif font-bold text-base">
                  {editingSubTreatment ? 'Editar Servicio' : 'Nuevo Servicio'}
                </h3>
                <p className="text-[11px] opacity-90">Dentro de: {targetTreatmentForSub.name}</p>
              </div>
              <button
                onClick={() => setIsSubModalOpen(false)}
                className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmitSubTreatment} className="p-6 space-y-4 text-xs bg-silk-50/40">
              <div>
                <label className="block font-semibold mb-1 text-graphite-700">Nombre del Servicio *</label>
                <input
                  type="text"
                  required
                  placeholder="ej. Peeling Químico, Corte Degradé, Esmaltado Semipermanente..."
                  value={subName}
                  onChange={(e) => setSubName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-rose-gold-200 bg-white focus:ring-2 focus:ring-rose-gold-400 outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-graphite-700">Duración del Turno (minutos) *</label>
                  <input
                    type="number"
                    step="5"
                    min="5"
                    required
                    value={subDuration}
                    onChange={(e) => setSubDuration(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-rose-gold-200 font-bold bg-white focus:ring-2 focus:ring-rose-gold-400 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-graphite-700">Precio Base ($) *</label>
                  <input
                    type="number"
                    step="500"
                    min="0"
                    required
                    value={subPrice}
                    onChange={(e) => setSubPrice(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-rose-gold-200 font-bold bg-white focus:ring-2 focus:ring-rose-gold-400 outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-rose-gold-100">
                {editingSubTreatment ? (
                  <button
                    type="button"
                    onClick={() => {
                      setConfirmDeleteSub({ treatment: targetTreatmentForSub, sub: editingSubTreatment });
                    }}
                    className="flex items-center gap-1 px-3 py-2 rounded-xl text-red-600 hover:bg-red-50 text-xs font-semibold transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Eliminar</span>
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsSubModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-rose-gold-200 bg-white hover:bg-rose-gold-50 font-medium text-graphite-700"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-5 py-2 bg-rose-gold-600 hover:bg-rose-gold-700 text-white rounded-xl font-bold shadow-soft"
                  >
                    {loading ? 'Guardando...' : editingSubTreatment ? 'Actualizar' : 'Agregar'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DIÁLOGO CONFIRMAR ELIMINACIÓN DE SUB-TRATAMIENTO */}
      {/* ========================================================================= */}
      {confirmDeleteSub && (
        <div className="fixed inset-0 z-50 bg-graphite-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full shadow-soft-lg border border-red-100 p-6 space-y-4 animate-scale-up">
            <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center mx-auto text-red-600">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-serif font-bold text-base text-graphite-900">
                ¿Eliminar servicio?
              </h3>
              <p className="text-xs text-graphite-500">
                Estás a punto de eliminar el servicio{' '}
                <strong className="text-graphite-800 font-semibold">{confirmDeleteSub.sub.name}</strong> de la categoría{' '}
                <strong className="text-graphite-800 font-semibold">{confirmDeleteSub.treatment.name}</strong>.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setConfirmDeleteSub(null)}
                className="flex-1 py-2 rounded-xl border border-rose-gold-200 text-xs font-semibold text-graphite-600 hover:bg-rose-gold-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDeleteSubTreatment(confirmDeleteSub.sub)}
                disabled={loading}
                className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-soft transition-colors"
              >
                {loading ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DIÁLOGO CONFIRMAR ELIMINACIÓN DE CATEGORÍA */}
      {/* ========================================================================= */}
      {confirmDeleteTreatment && (
        <div className="fixed inset-0 z-50 bg-graphite-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full shadow-soft-lg border border-red-100 p-6 space-y-4 animate-scale-up">
            <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center mx-auto text-red-600">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-serif font-bold text-base text-graphite-900">
                ¿Eliminar categoría completa?
              </h3>
              <p className="text-xs text-graphite-500">
                Se eliminará la categoría{' '}
                <strong className="text-graphite-800 font-semibold">{confirmDeleteTreatment.name}</strong> y todos sus servicios asociados.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setConfirmDeleteTreatment(null)}
                className="flex-1 py-2 rounded-xl border border-rose-gold-200 text-xs font-semibold text-graphite-600 hover:bg-rose-gold-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDeleteTreatment(confirmDeleteTreatment)}
                disabled={loading}
                className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-soft transition-colors"
              >
                {loading ? 'Eliminando...' : 'Eliminar Categoría'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL DE IMPORTACIÓN MASIVA DESDE PLANILLA CSV / EXCEL */}
      {/* ========================================================================= */}
      <ImportSpreadsheetModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        type="tratamientos"
        addToast={addToast}
        onSuccess={async () => {
          await refreshAllData();
        }}
      />
    </div>
  );
};

