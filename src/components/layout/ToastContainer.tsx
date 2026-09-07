import React from 'react';
import { useApp } from '../../context/AppContext';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        const icons = {
          success: <CheckCircle2 className="w-4 h-4 text-sage-600 shrink-0" />,
          error: <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />,
          warning: <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />,
          info: <Info className="w-4 h-4 text-rose-gold-600 shrink-0" />,
        };

        const bgStyles = {
          success: 'bg-white border-sage-200 text-graphite-800 shadow-soft-md',
          error: 'bg-white border-rose-200 text-graphite-800 shadow-soft-md',
          warning: 'bg-white border-amber-200 text-graphite-800 shadow-soft-md',
          info: 'bg-white border-rose-gold-200 text-graphite-800 shadow-soft-md',
        };

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto p-4 rounded-2xl border flex items-start gap-3 transition-all duration-300 animate-slide-up ${
              bgStyles[toast.type]
            }`}
          >
            {icons[toast.type]}
            <div className="flex-1 text-xs">
              <h4 className="font-semibold text-graphite-900 leading-tight">{toast.title}</h4>
              {toast.message && <p className="mt-0.5 text-graphite-600 leading-snug">{toast.message}</p>}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-graphite-400 hover:text-graphite-700 p-0.5 rounded-lg transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
