import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useApp } from '../../context/AppContext';
import {
  X,
  Phone,
  Mail,
  Calendar,
  Activity,
  Sparkles,
  FileSignature,
  Send,
  Plus,
  Clock,
  LayoutGrid,
  FileText,
} from 'lucide-react';
import { BodyChartModal } from '../bodyChart/BodyChartModal';
import { FacialChartModal } from '../facialChart/FacialChartModal';
import { ConsentModal } from '../consents/ConsentModal';

interface Props {
  clientId: string;
  onClose: () => void;
}

export const ClientProfileModal: React.FC<Props> = ({ clientId, onClose }) => {
  const { addToast } = useApp();
  const [clientData, setClientData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'sessions' | 'body' | 'facial' | 'consents'>('sessions');

  // Modales secundarios
  const [isBodyModalOpen, setIsBodyModalOpen] = useState(false);
  const [isFacialModalOpen, setIsFacialModalOpen] = useState(false);
  const [isConsentModalOpen, setIsConsentModalOpen] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await api.getClientById(clientId);
      setClientData(data);
    } catch (error: any) {
      addToast({ type: 'error', title: 'Error al cargar perfil del cliente', message: error.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [clientId]);

  if (loading || !clientData) {
    return (
      <div className="fixed inset-0 z-50 bg-graphite-900/40 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-soft-lg text-center text-xs font-semibold text-graphite-600">
          Cargando expediente del cliente...
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-graphite-900/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full shadow-soft-lg border border-rose-gold-200 overflow-hidden animate-scale-up flex flex-col max-h-[92vh]">
        {/* Profile Header */}
        <div className="p-6 bg-gradient-to-r from-rose-gold-600 via-rose-gold-500 to-rose-blush-500 text-white flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-3xl bg-white/20 backdrop-blur-md flex items-center justify-center font-serif font-bold text-2xl shadow-inner">
              {clientData.first_name[0]}
            </div>
            <div>
              <h2 className="font-serif font-bold text-xl leading-tight">
                {clientData.first_name} {clientData.last_name}
              </h2>
              <div className="flex flex-wrap gap-4 mt-1 text-xs opacity-90">
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5" />
                  {clientData.phone}
                </span>
                {clientData.dni && <span>DNI: {clientData.dni}</span>}
                {clientData.birth_date && <span>Nac: {clientData.birth_date}</span>}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dossier Tabs */}
        <div className="bg-silk-50 border-b border-rose-gold-200 px-6 flex items-center justify-between">
          <div className="flex gap-2 pt-2">
            <button
              onClick={() => setActiveTab('sessions')}
              className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
                activeTab === 'sessions'
                  ? 'border-rose-gold-600 text-rose-gold-800 bg-white rounded-t-2xl shadow-sm'
                  : 'border-transparent text-graphite-500 hover:text-graphite-900'
              }`}
            >
              🗓 Historial de Turnos ({clientData.appointments?.length || 0})
            </button>

            <button
              onClick={() => setActiveTab('body')}
              className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
                activeTab === 'body'
                  ? 'border-rose-gold-600 text-rose-gold-800 bg-white rounded-t-2xl shadow-sm'
                  : 'border-transparent text-graphite-500 hover:text-graphite-900'
              }`}
            >
              🧘‍♀️ Ficha Corporal ({clientData.bodyCharts?.length || 0})
            </button>

            <button
              onClick={() => setActiveTab('facial')}
              className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
                activeTab === 'facial'
                  ? 'border-rose-gold-600 text-rose-gold-800 bg-white rounded-t-2xl shadow-sm'
                  : 'border-transparent text-graphite-500 hover:text-graphite-900'
              }`}
            >
              ✨ Ficha Cosmetológica ({clientData.facialCharts?.length || 0})
            </button>

            <button
              onClick={() => setActiveTab('consents')}
              className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
                activeTab === 'consents'
                  ? 'border-rose-gold-600 text-rose-gold-800 bg-white rounded-t-2xl shadow-sm'
                  : 'border-transparent text-graphite-500 hover:text-graphite-900'
              }`}
            >
              📝 Consentimientos ({clientData.informedConsents?.length || 0})
            </button>
          </div>

          {/* New form action buttons based on active tab */}
          <div className="pb-1">
            {activeTab === 'body' && (
              <button
                onClick={() => setIsBodyModalOpen(true)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-sage-600 text-white text-xs font-semibold shadow-sm hover:bg-sage-700 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nueva Medición / Ficha</span>
              </button>
            )}

            {activeTab === 'facial' && (
              <button
                onClick={() => setIsFacialModalOpen(true)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-gold-600 text-white text-xs font-semibold shadow-sm hover:bg-rose-gold-700 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nuevo Diagnóstico Facial</span>
              </button>
            )}

            {activeTab === 'consents' && (
              <button
                onClick={() => setIsConsentModalOpen(true)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-graphite-800 text-white text-xs font-semibold shadow-sm hover:bg-graphite-900 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Firmar Consentimiento</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 bg-silk-50/40">
          {/* TAB: SESSIONS TIMELINE */}
          {activeTab === 'sessions' && (
            <div className="space-y-3">
              {clientData.appointments?.length === 0 ? (
                <p className="text-xs text-graphite-400 italic text-center py-6">
                  No hay turnos registrados para este cliente.
                </p>
              ) : (
                clientData.appointments.map((appt: any) => {
                  const date = new Date(appt.start_time).toLocaleDateString('es-AR', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <div
                      key={appt.id}
                      className="p-4 bg-white rounded-2xl border border-rose-gold-100 flex items-center justify-between text-xs shadow-sm hover:border-rose-gold-300 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-graphite-900">{appt.sub_treatment_name}</span>
                          <span
                            className="px-2 py-0.5 rounded-md text-[10px] font-semibold text-white"
                            style={{ backgroundColor: appt.treatment_color || '#C59B7E' }}
                          >
                            {appt.treatment_name}
                          </span>
                        </div>
                        <div className="text-[11px] text-graphite-500">
                          {date} • Profesional: {appt.staff_first_name} {appt.staff_last_name} • {appt.box_name}
                        </div>
                        {appt.notes && (
                          <div className="text-[11px] text-graphite-600 bg-silk-50 p-1.5 rounded-lg">
                            {appt.notes}
                          </div>
                        )}
                      </div>

                      <div className="text-right">
                        <span className="font-bold text-sm text-graphite-900 block">
                          ${appt.service_price.toLocaleString('es-AR')}
                        </span>
                        <span className="text-[10px] uppercase font-semibold text-rose-gold-600">
                          {appt.status}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB: BODY CHARTS */}
          {activeTab === 'body' && (
            <div className="space-y-4">
              {clientData.bodyCharts?.length === 0 ? (
                <div className="bg-white p-8 rounded-3xl text-center border border-rose-gold-100">
                  <Activity className="w-8 h-8 text-sage-500 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-graphite-700">
                    Aún no se ha cargado una ficha corporal para este cliente.
                  </p>
                  <button
                    onClick={() => setIsBodyModalOpen(true)}
                    className="mt-3 px-4 py-2 rounded-xl bg-sage-600 text-white text-xs font-semibold shadow-soft"
                  >
                    Crear Primera Ficha Corporal
                  </button>
                </div>
              ) : (
                clientData.bodyCharts.map((bc: any) => (
                  <div key={bc.id} className="p-5 bg-white rounded-3xl border border-rose-gold-200 shadow-soft space-y-3">
                    <div className="flex items-center justify-between border-b border-rose-gold-100 pb-2">
                      <h4 className="font-serif font-bold text-sm text-graphite-900">
                        Evolución Corporal • Fecha: {bc.date}
                      </h4>
                      <span className="text-xs font-semibold text-sage-700 bg-sage-50 px-2.5 py-1 rounded-xl">
                        {bc.points?.length || 0} zonas tratadas
                      </span>
                    </div>

                    {/* Measurements summary */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-silk-50 p-3 rounded-2xl border border-rose-gold-100">
                      <div><span className="text-graphite-500">Peso: </span><span className="font-bold">{bc.measurements?.weight_kg || '-'} kg</span></div>
                      <div><span className="text-graphite-500">Cintura: </span><span className="font-bold">{bc.measurements?.waist_cm || '-'} cm</span></div>
                      <div><span className="text-graphite-500">Cadera: </span><span className="font-bold">{bc.measurements?.hips_cm || '-'} cm</span></div>
                      <div><span className="text-graphite-500">Abdomen Bajo: </span><span className="font-bold">{bc.measurements?.abdomen_low_cm || '-'} cm</span></div>
                    </div>

                    {bc.notes && (
                      <p className="text-xs text-graphite-600 italic">
                        "{bc.notes}"
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB: FACIAL CHARTS */}
          {activeTab === 'facial' && (
            <div className="space-y-4">
              {clientData.facialCharts?.length === 0 ? (
                <div className="bg-white p-8 rounded-3xl text-center border border-rose-gold-100">
                  <Sparkles className="w-8 h-8 text-rose-gold-500 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-graphite-700">
                    Aún no se ha registrado una ficha cosmetológica facial.
                  </p>
                  <button
                    onClick={() => setIsFacialModalOpen(true)}
                    className="mt-3 px-4 py-2 rounded-xl bg-rose-gold-600 text-white text-xs font-semibold shadow-soft"
                  >
                    Crear Diagnóstico Facial
                  </button>
                </div>
              ) : (
                clientData.facialCharts.map((fc: any) => (
                  <div key={fc.id} className="p-5 bg-white rounded-3xl border border-rose-gold-200 shadow-soft space-y-3">
                    <div className="flex items-center justify-between border-b border-rose-gold-100 pb-2">
                      <h4 className="font-serif font-bold text-sm text-graphite-900">
                        Diagnóstico Cutáneo • Fecha: {fc.date}
                      </h4>
                      <span className="text-xs font-semibold text-rose-gold-800 bg-rose-gold-50 px-2.5 py-1 rounded-xl uppercase">
                        Tipo: {fc.skin_type} (Fototipo {fc.phototype})
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                      <div><span className="text-graphite-500">Hidratación: </span><span className="font-bold capitalize">{fc.hydration_level}</span></div>
                      <div><span className="text-graphite-500">Sensibilidad: </span><span className="font-bold capitalize">{fc.sensitivity_level}</span></div>
                      <div><span className="text-graphite-500">Alergias: </span><span className="font-bold">{fc.allergies || 'Ninguna'}</span></div>
                    </div>

                    {fc.recommended_homecare && (
                      <div className="p-2.5 rounded-xl bg-rose-blush-50 border border-rose-blush-200 text-xs">
                        <span className="font-bold text-rose-gold-900">Homecare Indicado: </span>
                        <span className="text-graphite-700">{fc.recommended_homecare}</span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB: CONSENTS */}
          {activeTab === 'consents' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-rose-gold-100">
                <div>
                  <h3 className="font-serif font-bold text-sm text-graphite-900">
                    Consentimientos Informados & Formularios de Consulta
                  </h3>
                  <p className="text-[11px] text-graphite-500">
                    Genera el código QR para que el cliente complete el formulario médico y firme con el dedo desde su celular
                  </p>
                </div>
                <button
                  onClick={() => setIsConsentModalOpen(true)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-rose-gold-500 to-rose-gold-600 hover:from-rose-gold-600 hover:to-rose-gold-700 text-white text-xs font-semibold shadow-soft"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Nuevo Consentimiento / QR Móvil</span>
                </button>
              </div>

              {clientData.informedConsents?.length === 0 ? (
                <div className="bg-white p-8 rounded-3xl text-center border border-rose-gold-100">
                  <FileSignature className="w-8 h-8 text-rose-gold-400 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-graphite-700">
                    No hay consentimientos firmados por el cliente aún.
                  </p>
                  <button
                    onClick={() => setIsConsentModalOpen(true)}
                    className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-silk-100 hover:bg-rose-gold-100 text-rose-gold-800 text-xs font-semibold border border-rose-gold-200"
                  >
                    Generar primer QR de Consentimiento
                  </button>
                </div>
              ) : (
                clientData.informedConsents.map((ic: any) => (
                  <div key={ic.id} className="p-4 bg-white rounded-2xl border border-rose-gold-100 space-y-3 shadow-xs">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-bold text-sm text-graphite-900">{ic.title}</h4>
                        <p className="text-[11px] text-graphite-500">
                          Firmado el {new Date(ic.signed_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })} • DNI: {ic.client_dni}
                        </p>
                      </div>
                      {ic.signature_image_base64 && (
                        <div className="text-right">
                          <span className="text-[10px] text-graphite-400 font-semibold block mb-0.5">Firma Digital:</span>
                          <img
                            src={ic.signature_image_base64}
                            alt="Firma"
                            className="h-10 border border-rose-gold-200 rounded-lg p-1 bg-white inline-block"
                          />
                        </div>
                      )}
                    </div>

                    {/* Resumen de respuestas si existen */}
                    {ic.form_data && (
                      <div className="p-3 bg-silk-50/70 rounded-xl border border-rose-gold-100/60 text-xs text-graphite-700 space-y-1">
                        <span className="font-bold text-rose-gold-800 block text-[11px] uppercase tracking-wide">
                          Resumen del Cuestionario Médico:
                        </span>
                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                          <div>
                            <b>Condición crónica:</b> {ic.form_data.medical_history?.chronic_condition?.answer ? 'SÍ (' + ic.form_data.medical_history.chronic_condition.details + ')' : 'NO'}
                          </div>
                          <div>
                            <b>Medicamentos:</b> {ic.form_data.medical_history?.medications?.answer ? 'SÍ (' + ic.form_data.medical_history.medications.details + ')' : 'NO'}
                          </div>
                          <div>
                            <b>Alergias cutáneas:</b> {ic.form_data.medical_history?.skin_allergy?.answer ? 'SÍ (' + ic.form_data.medical_history.skin_allergy.details + ')' : 'NO'}
                          </div>
                          <div>
                            <b>Alergias medicamentos:</b> {ic.form_data.medical_history?.allergic_reaction?.answer ? 'SÍ (' + ic.form_data.medical_history.allergic_reaction.details + ')' : 'NO'}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-white border-t border-rose-gold-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-graphite-800 hover:bg-graphite-900 text-white text-xs font-semibold shadow-soft"
          >
            Cerrar Expediente
          </button>
        </div>
      </div>

      {/* Modales Secundarios */}
      {isBodyModalOpen && (
        <BodyChartModal
          clientId={clientData.id}
          clientName={`${clientData.first_name} ${clientData.last_name}`}
          onClose={() => {
            setIsBodyModalOpen(false);
            loadData();
          }}
        />
      )}

      {isFacialModalOpen && (
        <FacialChartModal
          clientId={clientData.id}
          clientName={`${clientData.first_name} ${clientData.last_name}`}
          onClose={() => {
            setIsFacialModalOpen(false);
            loadData();
          }}
        />
      )}

      {isConsentModalOpen && (
        <ConsentModal
          clientId={clientData.id}
          clientName={`${clientData.first_name} ${clientData.last_name}`}
          clientDni={clientData.dni || ''}
          treatmentId={clientData.appointments[0]?.treatment_id || ''}
          treatmentName={clientData.appointments[0]?.sub_treatment_name || 'Tratamiento General'}
          onClose={() => {
            setIsConsentModalOpen(false);
            loadData();
          }}
        />
      )}
    </div>
  );
};
