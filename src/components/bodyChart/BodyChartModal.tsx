import React, { useState } from 'react';
import { BodyPoint, BodyMeasurements, BodyChart } from '../../types';
import { api } from '../../services/api';
import { useApp } from '../../context/AppContext';
import { X, Sparkles, Activity, Plus, Trash2, Save, FileText, CheckCircle2 } from 'lucide-react';

interface Props {
  clientId: string;
  clientName: string;
  onClose: () => void;
}

export const BodyChartModal: React.FC<Props> = ({ clientId, clientName, onClose }) => {
  const { addToast } = useApp();
  const [activeView, setActiveView] = useState<'front' | 'back'>('front');
  const [selectedCondition, setSelectedCondition] = useState<BodyPoint['condition']>('adiposidad');
  const [points, setPoints] = useState<BodyPoint[]>([]);
  const [pointZoneName, setPointZoneName] = useState<string>('Abdomen bajo');
  
  // Medidas antropométricas
  const [measurements, setMeasurements] = useState<BodyMeasurements>({
    weight_kg: 60,
    waist_cm: 70,
    abdomen_high_cm: 78,
    abdomen_low_cm: 85,
    hips_cm: 98,
    thigh_right_cm: 55,
    thigh_left_cm: 55,
    arm_right_cm: 27,
    arm_left_cm: 27,
    fluid_retention: 'leve',
    notes: '',
  });

  const [contraindications, setContraindications] = useState<string>('Sin cirugías recientes, No marcapasos');
  const [clinicalNotes, setClinicalNotes] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);

  // Manejador de click sobre el SVG para colocar un punto anatómico
  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);

    const newPoint: BodyPoint = {
      id: Math.random().toString(36).substring(2, 9),
      x,
      y,
      view: activeView,
      zone_name: pointZoneName,
      condition: selectedCondition,
    };

    setPoints([...points, newPoint]);
    addToast({ type: 'info', title: `Punto agregado en ${pointZoneName}` });
  };

  const removePoint = (pointId: string) => {
    setPoints(points.filter((p) => p.id !== pointId));
  };

  const handleSaveChart = async () => {
    try {
      setSaving(true);
      await api.createBodyChart({
        client_id: clientId,
        points,
        measurements,
        clinical_contraindications: contraindications.split(',').map((s) => s.trim()).filter(Boolean),
        notes: clinicalNotes,
      });
      addToast({ type: 'success', title: '¡Ficha corporal guardada exitosamente!' });
      onClose();
    } catch (error: any) {
      addToast({ type: 'error', title: 'Error al guardar ficha corporal', message: error.message });
    } finally {
      setSaving(false);
    }
  };

  const conditionColors = {
    adiposidad: '#D97D64',
    flacidez: '#C59B7E',
    celulitis: '#B5838D',
    estrias: '#8FBC8F',
    contractura: '#6B705C',
    tratamiento: '#3D5A80',
  };

  return (
    <div className="fixed inset-0 z-50 bg-graphite-900/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full shadow-soft-lg border border-rose-gold-200 overflow-hidden animate-scale-up flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-sage-600 to-rose-gold-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Activity className="w-5 h-5" />
            <div>
              <h2 className="font-serif font-bold text-lg leading-tight">
                Ficha Corporal & Mapeo Anatómico
              </h2>
              <p className="text-xs opacity-90">Paciente: {clientName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-silk-50/50">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Interactive SVG Body Map */}
            <div className="lg:col-span-6 bg-white p-5 rounded-3xl border border-rose-gold-200 shadow-soft flex flex-col items-center">
              <div className="flex items-center justify-between w-full mb-3">
                <span className="text-xs font-bold text-graphite-800">
                  Mapa Silueta Humana:
                </span>
                <div className="flex bg-silk-100 p-1 rounded-xl border border-rose-gold-200">
                  <button
                    onClick={() => setActiveView('front')}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                      activeView === 'front'
                        ? 'bg-rose-gold-500 text-white shadow-sm'
                        : 'text-graphite-600 hover:text-graphite-900'
                    }`}
                  >
                    Vista Frente
                  </button>
                  <button
                    onClick={() => setActiveView('back')}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                      activeView === 'back'
                        ? 'bg-rose-gold-500 text-white shadow-sm'
                        : 'text-graphite-600 hover:text-graphite-900'
                    }`}
                  >
                    Vista Dorso
                  </button>
                </div>
              </div>

              {/* Selector de condición a marcar */}
              <div className="w-full grid grid-cols-3 gap-1.5 mb-3">
                {(['adiposidad', 'flacidez', 'celulitis', 'estrias', 'contractura', 'tratamiento'] as const).map((cond) => (
                  <button
                    key={cond}
                    type="button"
                    onClick={() => setSelectedCondition(cond)}
                    className={`px-2 py-1.5 rounded-xl text-[11px] font-semibold capitalize border transition-all ${
                      selectedCondition === cond
                        ? 'border-graphite-800 shadow-sm text-white font-bold'
                        : 'border-rose-gold-100 bg-silk-50 text-graphite-700'
                    }`}
                    style={{
                      backgroundColor: selectedCondition === cond ? conditionColors[cond] : undefined,
                    }}
                  >
                    {cond}
                  </button>
                ))}
              </div>

              {/* Nombre de zona */}
              <div className="w-full flex gap-2 mb-3">
                <input
                  type="text"
                  value={pointZoneName}
                  onChange={(e) => setPointZoneName(e.target.value)}
                  placeholder="Nombre de la zona (ej. Flanco izq, Abdomen...)"
                  className="flex-1 text-xs p-2 rounded-xl bg-silk-50 border border-rose-gold-200 text-graphite-800 focus:outline-none"
                />
                <span className="text-[11px] text-graphite-400 self-center">
                  💡 Haz clic en la silueta para marcar
                </span>
              </div>

              {/* SVG Silhouette Canvas */}
              <div className="relative w-64 h-96 bg-silk-100/60 rounded-2xl border border-rose-gold-200/80 flex items-center justify-center overflow-hidden cursor-crosshair">
                <svg
                  viewBox="0 0 100 150"
                  onClick={handleSvgClick}
                  className="w-full h-full p-2 select-none"
                >
                  {/* Anatomical Body Silhouette Vector */}
                  <g fill="#EAD9CE" stroke="#C59B7E" strokeWidth="1.2">
                    {/* Head */}
                    <circle cx="50" cy="14" r="9" />
                    {/* Neck */}
                    <rect x="47" y="22" width="6" height="5" />
                    {/* Torso */}
                    <path d="M35 27 C32 40, 36 60, 34 75 C37 82, 45 88, 50 88 C55 88, 63 82, 66 75 C64 60, 68 40, 65 27 Z" />
                    {/* Arms */}
                    <path d="M35 27 C28 40, 24 60, 22 75 C20 78, 23 80, 26 78 C29 65, 33 45, 37 32 Z" />
                    <path d="M65 27 C72 40, 76 60, 78 75 C80 78, 77 80, 74 78 C71 65, 67 45, 63 32 Z" />
                    {/* Legs */}
                    <path d="M35 85 C34 100, 32 120, 34 142 C36 145, 41 145, 43 142 C45 125, 47 105, 49 88 Z" />
                    <path d="M65 85 C66 100, 68 120, 66 142 C64 145, 59 145, 57 142 C55 125, 53 105, 51 88 Z" />
                  </g>

                  {/* Render Marked Points */}
                  {points
                    .filter((p) => p.view === activeView)
                    .map((p) => (
                      <g key={p.id} className="cursor-pointer">
                        <circle
                          cx={p.x}
                          cy={p.y}
                          r="3"
                          fill={conditionColors[p.condition] || '#D97D64'}
                          stroke="#FFFFFF"
                          strokeWidth="0.8"
                          className="animate-pulse"
                        />
                      </g>
                    ))}
                </svg>
              </div>

              {/* Lista de Puntos Marcados */}
              <div className="w-full mt-3 max-h-24 overflow-y-auto space-y-1">
                {points.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between text-[10px] p-1.5 bg-silk-50 rounded-lg border border-rose-gold-100"
                  >
                    <span className="font-semibold text-graphite-800">
                      {p.view.toUpperCase()} • {p.zone_name} ({p.condition})
                    </span>
                    <button
                      onClick={() => removePoint(p.id)}
                      className="text-rose-400 hover:text-rose-600 p-0.5"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Anthropometric Measurements & Clinic Data */}
            <div className="lg:col-span-6 space-y-4">
              <div className="bg-white p-5 rounded-3xl border border-rose-gold-200 shadow-soft space-y-4">
                <h3 className="font-serif font-bold text-sm text-graphite-900 border-b border-rose-gold-100 pb-2">
                  Medidas Antropométricas & Contornos (cm)
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] font-semibold text-graphite-600">Peso (kg):</label>
                    <input
                      type="number"
                      step="0.1"
                      value={measurements.weight_kg || ''}
                      onChange={(e) => setMeasurements({ ...measurements, weight_kg: Number(e.target.value) })}
                      className="w-full text-xs p-2 rounded-xl bg-silk-50 border border-rose-gold-200 font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-graphite-600">Cintura (cm):</label>
                    <input
                      type="number"
                      step="0.5"
                      value={measurements.waist_cm || ''}
                      onChange={(e) => setMeasurements({ ...measurements, waist_cm: Number(e.target.value) })}
                      className="w-full text-xs p-2 rounded-xl bg-silk-50 border border-rose-gold-200 font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-graphite-600">Cadera (cm):</label>
                    <input
                      type="number"
                      step="0.5"
                      value={measurements.hips_cm || ''}
                      onChange={(e) => setMeasurements({ ...measurements, hips_cm: Number(e.target.value) })}
                      className="w-full text-xs p-2 rounded-xl bg-silk-50 border border-rose-gold-200 font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-graphite-600">Abdomen Alto (cm):</label>
                    <input
                      type="number"
                      step="0.5"
                      value={measurements.abdomen_high_cm || ''}
                      onChange={(e) => setMeasurements({ ...measurements, abdomen_high_cm: Number(e.target.value) })}
                      className="w-full text-xs p-2 rounded-xl bg-silk-50 border border-rose-gold-200 font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-graphite-600">Abdomen Bajo (cm):</label>
                    <input
                      type="number"
                      step="0.5"
                      value={measurements.abdomen_low_cm || ''}
                      onChange={(e) => setMeasurements({ ...measurements, abdomen_low_cm: Number(e.target.value) })}
                      className="w-full text-xs p-2 rounded-xl bg-silk-50 border border-rose-gold-200 font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-graphite-600">Muslo Der (cm):</label>
                    <input
                      type="number"
                      step="0.5"
                      value={measurements.thigh_right_cm || ''}
                      onChange={(e) => setMeasurements({ ...measurements, thigh_right_cm: Number(e.target.value) })}
                      className="w-full text-xs p-2 rounded-xl bg-silk-50 border border-rose-gold-200 font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-graphite-600">Muslo Izq (cm):</label>
                    <input
                      type="number"
                      step="0.5"
                      value={measurements.thigh_left_cm || ''}
                      onChange={(e) => setMeasurements({ ...measurements, thigh_left_cm: Number(e.target.value) })}
                      className="w-full text-xs p-2 rounded-xl bg-silk-50 border border-rose-gold-200 font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-graphite-600">Brazo Der (cm):</label>
                    <input
                      type="number"
                      step="0.5"
                      value={measurements.arm_right_cm || ''}
                      onChange={(e) => setMeasurements({ ...measurements, arm_right_cm: Number(e.target.value) })}
                      className="w-full text-xs p-2 rounded-xl bg-silk-50 border border-rose-gold-200 font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-graphite-600">Retención Líquidos:</label>
                    <select
                      value={measurements.fluid_retention}
                      onChange={(e) => setMeasurements({ ...measurements, fluid_retention: e.target.value as any })}
                      className="w-full text-xs p-2 rounded-xl bg-silk-50 border border-rose-gold-200 font-bold"
                    >
                      <option value="ninguna">Ninguna</option>
                      <option value="leve">Leve</option>
                      <option value="moderada">Moderada</option>
                      <option value="severa">Severa</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-semibold text-graphite-600">
                    Antecedentes / Contraindicaciones Clínicas:
                  </label>
                  <input
                    type="text"
                    value={contraindications}
                    onChange={(e) => setContraindications(e.target.value)}
                    placeholder="Separadas por comas (ej. No marcapasos, No tiroides descompensada...)"
                    className="w-full text-xs p-2.5 rounded-xl bg-silk-50 border border-rose-gold-200 text-graphite-800"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-semibold text-graphite-600">
                    Observaciones y Evolución de la Sesión:
                  </label>
                  <textarea
                    rows={3}
                    value={clinicalNotes}
                    onChange={(e) => setClinicalNotes(e.target.value)}
                    placeholder="Detalles sobre aparatología utilizada, parámetros y respuesta de la piel..."
                    className="w-full text-xs p-2.5 rounded-xl bg-silk-50 border border-rose-gold-200 text-graphite-800"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-white border-t border-rose-gold-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-rose-gold-300 text-xs font-semibold text-graphite-700 hover:bg-silk-100 transition-colors"
          >
            Cerrar
          </button>

          <button
            type="button"
            onClick={handleSaveChart}
            disabled={saving}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-sage-600 to-rose-gold-600 text-white text-xs font-semibold shadow-soft hover:shadow-soft-md transition-all"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Guardando...' : 'Guardar Ficha Corporal'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
