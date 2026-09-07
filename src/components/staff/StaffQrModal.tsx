import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, QrCode, Smartphone, Printer, RefreshCw, Check, Copy } from 'lucide-react';
import { api } from '../../services/api';

export const StaffQrModal: React.FC = () => {
  const { staff, isStaffQrModalOpen, setIsStaffQrModalOpen, networkInfo, refreshAllData, addToast } = useApp();
  const [selectedStaffId, setSelectedStaffId] = useState<string>(staff[0]?.id || '');
  const [copied, setCopied] = useState<boolean>(false);

  if (!isStaffQrModalOpen) return null;

  const selectedStaff = staff.find((s) => s.id === selectedStaffId) || staff[0];

  const handleCopyLink = () => {
    if (selectedStaff?.qr_url) {
      navigator.clipboard.writeText(selectedStaff.qr_url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      addToast({ type: 'success', title: 'Enlace copiado al portapapeles' });
    }
  };

  const handleRegenerateQr = async () => {
    if (!selectedStaff) return;
    try {
      await api.regenerateStaffQr(selectedStaff.id);
      await refreshAllData();
      addToast({ type: 'success', title: 'Código QR regenerado exitosamente' });
    } catch (error: any) {
      addToast({ type: 'error', title: 'Error al regenerar QR', message: error.message });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-graphite-900/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-soft-lg border border-rose-gold-200 overflow-hidden animate-scale-up">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-rose-gold-600 to-rose-gold-500 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <QrCode className="w-5 h-5" />
            <h2 className="font-serif font-bold text-lg">Acceso Móvil para Profesionales</h2>
          </div>
          <button
            onClick={() => setIsStaffQrModalOpen(false)}
            className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-5 bg-silk-50/50">
          {/* Staff Selector */}
          <div>
            <label className="block text-xs font-semibold text-graphite-700 mb-1.5">
              Seleccionar Profesional:
            </label>
            <div className="grid grid-cols-3 gap-2">
              {staff.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedStaffId(s.id)}
                  className={`p-2.5 rounded-2xl border text-left transition-all ${
                    selectedStaff?.id === s.id
                      ? 'bg-rose-gold-50 border-rose-gold-400 shadow-sm'
                      : 'bg-white border-rose-gold-100 hover:border-rose-gold-200'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: s.color_code }}
                    />
                    <h4 className="font-serif font-bold text-xs text-graphite-900 truncate">
                      {s.first_name}
                    </h4>
                  </div>
                  <p className="text-[10px] text-graphite-500 truncate mt-0.5">{s.role}</p>
                </button>
              ))}
            </div>
          </div>

          {/* QR Display Card */}
          {selectedStaff && (
            <div className="p-6 bg-white rounded-3xl border border-rose-gold-200 shadow-soft flex flex-col items-center text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-gold-100 flex items-center justify-center text-rose-gold-600 shadow-inner">
                <Smartphone className="w-6 h-6" />
              </div>

              <div>
                <h3 className="font-serif font-bold text-base text-graphite-900">
                  {selectedStaff.first_name} {selectedStaff.last_name}
                </h3>
                <p className="text-xs text-rose-gold-600 font-medium">
                  {selectedStaff.role.toUpperCase()}
                </p>
                <p className="text-[11px] text-graphite-500 mt-1 max-w-xs">
                  Escanea este código con la cámara de tu celular conectado a la red Wi-Fi del centro.
                </p>
              </div>

              {/* QR Image */}
              <div className="p-3 bg-white rounded-2xl border-2 border-rose-gold-200 shadow-sm">
                {selectedStaff.qr_image ? (
                  <img
                    src={selectedStaff.qr_image}
                    alt="QR Personal"
                    className="w-48 h-48 rounded-xl"
                  />
                ) : (
                  <div className="w-48 h-48 flex items-center justify-center text-graphite-400 text-xs">
                    Generando QR...
                  </div>
                )}
              </div>

              {/* PIN Code Notice */}
              <div className="px-3 py-1.5 bg-silk-100 rounded-xl border border-rose-gold-100 text-xs text-graphite-700">
                <span>PIN de acceso en celular: </span>
                <span className="font-mono font-bold text-rose-gold-700 tracking-wider">
                  {selectedStaff.pin_code || '1234'}
                </span>
              </div>

              {/* Link */}
              <div className="w-full flex items-center gap-1.5 p-2 bg-silk-50 rounded-xl border border-rose-gold-100 text-[11px] text-graphite-600">
                <span className="truncate flex-1 text-left font-mono">{selectedStaff.qr_url}</span>
                <button
                  onClick={handleCopyLink}
                  className="p-1.5 rounded-lg bg-white border border-rose-gold-200 hover:bg-rose-gold-50 text-rose-gold-600 transition-colors shrink-0"
                  title="Copiar URL"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={handleRegenerateQr}
              className="flex items-center gap-1.5 text-xs text-graphite-500 hover:text-rose-gold-600 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Regenerar QR</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-graphite-800 hover:bg-graphite-900 text-white text-xs font-semibold shadow-sm transition-all"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir Tarjeta QR</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
