import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Box } from '../../types';
import { api } from '../../services/api';
import { LayoutGrid, Plus, Edit2, Calendar, Clock, Check, Trash2, AlertCircle } from 'lucide-react';

export const BoxesView: React.FC = () => {
  const { boxes, refreshAllData, addToast } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBox, setEditingBox] = useState<Box | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [number, setNumber] = useState(boxes.length + 1);
  const [description, setDescription] = useState('');
  const [colorCode, setColorCode] = useState('#C59B7E');
  const [equipmentStr, setEquipmentStr] = useState('');
  const [isPermanent, setIsPermanent] = useState(true);
  const [availableFrom, setAvailableFrom] = useState('');
  const [availableTo, setAvailableTo] = useState('');
  const [loading, setLoading] = useState(false);

  const handleOpenCreate = () => {
    setEditingBox(null);
    setName('');
    setNumber(boxes.length + 1);
    setDescription('');
    setColorCode('#C59B7E');
    setEquipmentStr('');
    setIsPermanent(true);
    setAvailableFrom(new Date().toISOString().split('T')[0]);
    setAvailableTo(new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0]);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (box: Box) => {
    setEditingBox(box);
    setName(box.name);
    setNumber(box.number);
    setDescription(box.description || '');
    setColorCode(box.color_code);
    setEquipmentStr((box.equipment || []).join(', '));
    setIsPermanent(!box.is_temporary);
    setAvailableFrom(box.available_from ? box.available_from.split('T')[0] : '');
    setAvailableTo(box.available_to ? box.available_to.split('T')[0] : '');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const payload = {
        name,
        number: Number(number),
        description: description || null,
        color_code: colorCode,
        order_index: editingBox ? editingBox.order_index : boxes.length,
        is_temporary: !isPermanent,
        available_from: !isPermanent && availableFrom ? availableFrom : null,
        available_to: !isPermanent && availableTo ? availableTo : null,
        equipment: equipmentStr.split(',').map((s) => s.trim()).filter(Boolean),
      };

      if (editingBox) {
        await api.updateBox(editingBox.id, payload);
        addToast({ type: 'success', title: 'Box / Sala actualizado correctamente' });
      } else {
        await api.createBox(payload);
        addToast({ type: 'success', title: 'Box / Sala creado correctamente' });
      }

      await refreshAllData();
      setIsModalOpen(false);
    } catch (error: any) {
      addToast({ type: 'error', title: 'Error al guardar box', message: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBox = async (boxId: string) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este Box?')) return;
    try {
      await api.deleteBox(boxId);
      await refreshAllData();
      addToast({ type: 'success', title: 'Box eliminado' });
    } catch (error: any) {
      addToast({ type: 'error', title: 'Error al eliminar box', message: error.message });
    }
  };

  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto bg-silk-100/60">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif font-bold text-2xl text-graphite-900 leading-tight">
            Boxes, Cabinas & Puestos de Atención
          </h1>
          <p className="text-xs text-graphite-500 mt-0.5">
            Configuración de salas permanentes y boxes temporales para jornadas especiales o tratamientos mensuales
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-rose-gold-500 to-rose-gold-600 hover:from-rose-gold-600 hover:to-rose-gold-700 text-white text-xs font-semibold shadow-soft hover:shadow-soft-md transition-all duration-200"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Box / Cabina</span>
        </button>
      </div>

      {/* Boxes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {boxes.map((box) => (
          <div
            key={box.id}
            className="bg-white rounded-3xl p-6 border border-rose-gold-100 shadow-soft hover:shadow-soft-md transition-all space-y-4 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-serif font-bold text-lg shadow-sm"
                  style={{ backgroundColor: box.color_code }}
                >
                  #{box.number}
                </div>

                <div className="flex items-center gap-1.5">
                  {box.is_temporary ? (
                    <span className="px-2.5 py-0.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold">
                      Temporal
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-xl bg-sage-50 text-sage-700 border border-sage-200 text-[10px] font-bold">
                      Permanente
                    </span>
                  )}
                </div>
              </div>

              <div>
                <h3 className="font-serif font-bold text-base text-graphite-900">
                  {box.name}
                </h3>
                <p className="text-xs text-graphite-500 mt-0.5">
                  {box.description || 'Puesto de atención'}
                </p>
              </div>

              {/* Temporary Date Badge */}
              {box.is_temporary && (
                <div className="p-2.5 bg-amber-50/70 rounded-xl border border-amber-200/80 text-[11px] text-amber-900 space-y-0.5">
                  <div className="flex items-center gap-1 font-semibold">
                    <Calendar className="w-3 h-3 text-amber-700" />
                    <span>Disponible en Agenda:</span>
                  </div>
                  <div className="font-mono text-[10px] text-amber-800">
                    {box.available_from ? new Date(box.available_from).toLocaleDateString('es-AR') : 'Inicio'} al {box.available_to ? new Date(box.available_to).toLocaleDateString('es-AR') : 'Fin'}
                  </div>
                </div>
              )}

              {/* Equipment list */}
              {box.equipment && box.equipment.length > 0 && (
                <div className="pt-2 border-t border-rose-gold-100 space-y-1.5">
                  <span className="text-[10px] font-bold text-graphite-400 uppercase tracking-wider block">
                    Equipamiento:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {box.equipment.map((eq, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-lg bg-silk-100 text-graphite-700 text-[10px] font-medium border border-silk-200"
                      >
                        {eq}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-rose-gold-100 flex items-center justify-between">
              <button
                onClick={() => handleOpenEdit(box)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-silk-100 hover:bg-rose-gold-100 text-rose-gold-800 text-xs font-semibold border border-rose-gold-200 transition-colors"
              >
                <Edit2 className="w-3 h-3" />
                <span>Editar Box</span>
              </button>

              <button
                onClick={() => handleDeleteBox(box.id)}
                className="p-1.5 rounded-xl text-graphite-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                title="Eliminar Box"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Crear / Editar Box */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-graphite-900/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-soft-lg border border-rose-gold-200 overflow-hidden animate-scale-up">
            <div className="p-5 bg-gradient-to-r from-rose-gold-600 to-rose-gold-500 text-white flex justify-between items-center">
              <h3 className="font-serif font-bold text-base">
                {editingBox ? 'Editar Box / Sala' : 'Nuevo Box / Sala de Atención'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-white p-1 rounded-full hover:bg-white/20">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs bg-silk-50/40">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block font-semibold mb-1 text-graphite-700">Nombre del Box *</label>
                  <input
                    type="text"
                    required
                    placeholder="ej. Box 5 — Criolipólisis Mensual"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-rose-gold-200 bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-graphite-700">Número *</label>
                  <input
                    type="number"
                    required
                    value={number}
                    onChange={(e) => setNumber(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-rose-gold-200 font-bold bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-graphite-700">Color Distintivo *</label>
                <input
                  type="color"
                  value={colorCode}
                  onChange={(e) => setColorCode(e.target.value)}
                  className="w-full h-10 p-1 rounded-xl border border-rose-gold-200 cursor-pointer bg-white"
                />
              </div>

              {/* Box Permanente vs Temporal Selector */}
              <div className="p-3.5 bg-white rounded-2xl border border-rose-gold-200 space-y-3">
                <label className="flex items-center gap-2 font-bold text-graphite-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPermanent}
                    onChange={(e) => setIsPermanent(e.target.checked)}
                    className="w-4 h-4 rounded text-rose-gold-600 focus:ring-rose-gold-400"
                  />
                  <span>¿Es un Box Permanente y disponible siempre?</span>
                </label>

                {!isPermanent && (
                  <div className="pt-2 border-t border-dashed border-rose-gold-200 space-y-2.5 animate-slide-up">
                    <p className="text-[11px] text-amber-800 font-medium">
                      📅 Define el rango de fechas en el que este box estará activo en la agenda:
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-semibold text-graphite-600 mb-1">
                          Disponible Desde:
                        </label>
                        <input
                          type="date"
                          required={!isPermanent}
                          value={availableFrom}
                          onChange={(e) => setAvailableFrom(e.target.value)}
                          className="w-full p-2 rounded-xl border border-rose-gold-200 bg-silk-50 text-xs font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-graphite-600 mb-1">
                          Disponible Hasta:
                        </label>
                        <input
                          type="date"
                          required={!isPermanent}
                          value={availableTo}
                          onChange={(e) => setAvailableTo(e.target.value)}
                          className="w-full p-2 rounded-xl border border-rose-gold-200 bg-silk-50 text-xs font-semibold"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block font-semibold mb-1 text-graphite-700">Equipamiento / Aparatología</label>
                <input
                  type="text"
                  placeholder="Separado por comas (ej. Dermapen, Lámpara LED, Sillón Reclinable...)"
                  value={equipmentStr}
                  onChange={(e) => setEquipmentStr(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-rose-gold-200 bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-graphite-700">Descripción / Notas</label>
                <input
                  type="text"
                  placeholder="ej. Cabina especial para jornadas de láser o eventos"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-rose-gold-200 bg-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-rose-gold-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-rose-gold-300 font-semibold text-graphite-700 hover:bg-silk-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-gradient-to-r from-rose-gold-500 to-rose-gold-600 hover:from-rose-gold-600 hover:to-rose-gold-700 text-white rounded-xl font-bold shadow-soft"
                >
                  {loading ? 'Guardando...' : editingBox ? 'Actualizar Box' : 'Crear Box'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
