import React, { useState } from 'react';
import { FacialZone, FacialChart } from '../../types';
import { api } from '../../services/api';
import { useApp } from '../../context/AppContext';
import { X, Sparkles, Save, CheckCircle2 } from 'lucide-react';

interface Props {
  clientId: string;
  clientName: string;
  onClose: () => void;
}

export const FacialChartModal: React.FC<Props> = ({ clientId, clientName, onClose }) => {
  const { addToast } = useApp();
  const [skinType, setSkinType] = useState<FacialChart['skin_type']>('mixta');
  const [phototype, setPhototype] = useState<FacialChart['phototype']>('III');
  const [hydrationLevel, setHydrationLevel] = useState<FacialChart['hydration_level']>('optima');
  const [sensitivityLevel, setSensitivityLevel] = useState<FacialChart['sensitivity_level']>('normal');
  const [allergies, setAllergies] = useState<string>('');
  const [activeLesions, setActiveLesions] = useState<string>('');
  const [currentSkincare, setCurrentSkincare] = useState<string>('');
  const [recommendedHomecare, setRecommendedHomecare] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);

  // Zonas faciales
  const [zones, setZones] = useState<FacialZone[]>([
    { id: '1', zone: 'frente', condition: 'grasa', severity: 'moderada' },
    { id: '2', zone: 'nariz', condition: 'grasa', severity: 'moderada' },
    { id: '3', zone: 'mejilla_der', condition: 'sensible', severity: 'leve' },
    { id: '4', zone: 'mejilla_izq', condition: 'sensible', severity: 'leve' },
    { id: '5', zone: 'menton', condition: 'poros_dilatados', severity: 'moderada' },
  ]);

  const handleSave = async () => {
    try {
      setSaving(true);
      await api.createFacialChart({
        client_id: clientId,
        skin_type: skinType,
        phototype,
        hydration_level: hydrationLevel,
        sensitivity_level: sensitivityLevel,
        allergies,
        active_lesions: activeLesions,
        current_skincare_routine: currentSkincare,
        zones,
        recommended_homecare: recommendedHomecare,
      });
      addToast({ type: 'success', title: '¡Ficha cosmetológica guardada exitosamente!' });
      onClose();
    } catch (error: any) {
      addToast({ type: 'error', title: 'Error al guardar ficha facial', message: error.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-graphite-900/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full shadow-soft-lg border border-rose-gold-200 overflow-hidden animate-scale-up flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-rose-gold-600 to-rose-blush-500 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-5 h-5" />
            <div>
              <h2 className="font-serif font-bold text-lg leading-tight">
                Ficha Cosmetológica & Diagnóstico de Piel
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
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="text-xs font-semibold text-graphite-700 block mb-1">
                Biotipo Cutáneo:
              </label>
              <select
                value={skinType}
                onChange={(e) => setSkinType(e.target.value as any)}
                className="w-full text-xs p-2.5 rounded-xl bg-white border border-rose-gold-200 font-bold text-graphite-800"
              >
                <option value="eutrofica">Eutrófica (Normal)</option>
                <option value="grasa">Grasa / Seborreica</option>
                <option value="seca">Seca / Alípica</option>
                <option value="mixta">Mixta</option>
                <option value="sensible">Sensible / Reactiva</option>
                <option value="acneica">Acneica</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-graphite-700 block mb-1">
                Fototipo de Fitzpatrick:
              </label>
              <select
                value={phototype}
                onChange={(e) => setPhototype(e.target.value as any)}
                className="w-full text-xs p-2.5 rounded-xl bg-white border border-rose-gold-200 font-bold text-graphite-800"
              >
                <option value="I">Fototipo I (Muy clara)</option>
                <option value="II">Fototipo II (Clara)</option>
                <option value="III">Fototipo III (Media clara)</option>
                <option value="IV">Fototipo IV (Media oscura)</option>
                <option value="V">Fototipo V (Oscura)</option>
                <option value="VI">Fototipo VI (Muy oscura)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-graphite-700 block mb-1">
                Nivel de Hidratación:
              </label>
              <select
                value={hydrationLevel}
                onChange={(e) => setHydrationLevel(e.target.value as any)}
                className="w-full text-xs p-2.5 rounded-xl bg-white border border-rose-gold-200 font-bold text-graphite-800"
              >
                <option value="optima">Óptima / Turgente</option>
                <option value="moderada">Moderada</option>
                <option value="deshidratada">Deshidratada</option>
                <option value="alipica">Alípica / Desnutrida</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-graphite-700 block mb-1">
                Reactividad / Sensibilidad:
              </label>
              <select
                value={sensitivityLevel}
                onChange={(e) => setSensitivityLevel(e.target.value as any)}
                className="w-full text-xs p-2.5 rounded-xl bg-white border border-rose-gold-200 font-bold text-graphite-800"
              >
                <option value="normal">Normal / Resistente</option>
                <option value="reactiva">Reactiva</option>
                <option value="rosacea">Tendencia a Rosácea</option>
                <option value="eritema">Eritema Frecuente</option>
              </select>
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-graphite-700 block mb-1">
                Alergias o Intolerancias Conocidas:
              </label>
              <input
                type="text"
                value={allergies}
                onChange={(e) => setAllergies(e.target.value)}
                placeholder="ej. Parabenos, ácido salicílico, perfumes..."
                className="w-full text-xs p-2.5 rounded-xl bg-white border border-rose-gold-200 text-graphite-800"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-graphite-700 block mb-1">
                Lesiones Activas / Manchas:
              </label>
              <input
                type="text"
                value={activeLesions}
                onChange={(e) => setActiveLesions(e.target.value)}
                placeholder="ej. Melasma en frente, comedones abiertos..."
                className="w-full text-xs p-2.5 rounded-xl bg-white border border-rose-gold-200 text-graphite-800"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-graphite-700 block mb-1">
              Rutina Actual del Cliente en Casa:
            </label>
            <input
              type="text"
              value={currentSkincare}
              onChange={(e) => setCurrentSkincare(e.target.value)}
              placeholder="Productos que utiliza actualmente (limpiador, sérums, protector solar...)"
              className="w-full text-xs p-2.5 rounded-xl bg-white border border-rose-gold-200 text-graphite-800"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-graphite-700 block mb-1">
              Prescripción / Recomendación Homecare para el Hogar:
            </label>
            <textarea
              rows={3}
              value={recommendedHomecare}
              onChange={(e) => setRecommendedHomecare(e.target.value)}
              placeholder="Tratamiento domiciliario indicado post-sesión..."
              className="w-full text-xs p-2.5 rounded-xl bg-white border border-rose-gold-200 text-graphite-800"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-white border-t border-rose-gold-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-rose-gold-300 text-xs font-semibold text-graphite-700 hover:bg-silk-100"
          >
            Cerrar
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-rose-gold-500 to-rose-gold-600 text-white text-xs font-semibold shadow-soft hover:shadow-soft-md"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Guardando...' : 'Guardar Ficha Cosmetológica'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
