import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import {
  Cloud,
  RefreshCw,
  Zap,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Smartphone,
  Eye,
  EyeOff,
  ExternalLink,
  Lock,
  Globe,
  Database,
  ArrowRight,
} from 'lucide-react';

export const CloudSyncTab: React.FC = () => {
  const { addToast } = useApp();

  const [salonName, setSalonName] = useState('Mi Salón Hikari');
  const [dbUrl, setDbUrl] = useState('');
  const [authToken, setAuthToken] = useState('');
  const [syncEnabled, setSyncEnabled] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);
  const [status, setStatus] = useState<'disconnected' | 'connected' | 'syncing' | 'error'>('disconnected');

  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      setLoading(true);
      const res = await api.getCloudSyncStatus();
      if (res.success && res.config) {
        setSalonName(res.config.salonName || 'Mi Salón Hikari');
        setDbUrl(res.config.dbUrl || '');
        setAuthToken(res.config.authToken || '');
        setSyncEnabled(res.config.syncEnabled || false);
        setLastSyncAt(res.config.lastSyncAt || null);
        setStatus(res.config.status || 'disconnected');
      }
    } catch (err: any) {
      console.error('Error cargando estado de Turso Cloud:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    if (!dbUrl.trim() || !authToken.trim()) {
      addToast({
        type: 'warning',
        title: 'Campos requeridos',
        message: 'Ingresa la URL y el Token de Turso antes de probar la conexión.',
      });
      return;
    }

    try {
      setTesting(true);
      setTestResult(null);
      const res = await api.testCloudSync(dbUrl, authToken);
      setTestResult(res);
      if (res.success) {
        addToast({ type: 'success', title: 'Conexión Exitosa', message: res.message });
      } else {
        addToast({ type: 'error', title: 'Fallo de Conexión', message: res.message });
      }
    } catch (err: any) {
      setTestResult({ success: false, message: err.message || 'Error de red' });
    } finally {
      setTesting(false);
    }
  };

  const handleSaveConfig = async () => {
    try {
      setSaving(true);
      const res = await api.saveCloudSyncConfig({
        salonName,
        dbUrl,
        authToken,
        syncEnabled,
      });

      if (res.success) {
        addToast({ type: 'success', title: 'Configuración Guardada', message: 'Los parámetros de la nube fueron guardados.' });
        await loadStatus();
      }
    } catch (err: any) {
      addToast({ type: 'error', title: 'Error al Guardar', message: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleTriggerSync = async () => {
    try {
      setSyncing(true);
      addToast({ type: 'info', title: 'Sincronizando con la Nube...', message: 'Subiendo y bajando cambios...' });
      const res = await api.triggerCloudSync();
      if (res.success) {
        addToast({ type: 'success', title: 'Sincronización Completa', message: res.message });
        setLastSyncAt(res.timestamp);
        setStatus('connected');
      } else {
        addToast({ type: 'error', title: 'Error de Sincronización', message: res.message });
      }
    } catch (err: any) {
      addToast({ type: 'error', title: 'Error en Sincronización', message: err.message });
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 flex flex-col items-center justify-center gap-3">
        <RefreshCw className="w-6 h-6 text-rose-gold-500 animate-spin" />
        <span className="text-xs text-graphite-600 font-medium">Cargando estado de la nube Turso...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Banner de Estado Cloud */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-rose-gold-600 via-rose-gold-500 to-rose-gold-700 text-white shadow-soft flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner">
            <Cloud className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold tracking-widest uppercase bg-white/25 px-2 py-0.5 rounded-full">
                Turso LibSQL Cloud
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  syncEnabled && status === 'connected'
                    ? 'bg-emerald-400/90 text-emerald-950'
                    : 'bg-white/20 text-white'
                }`}
              >
                {syncEnabled && status === 'connected' ? '● En Línea' : '○ Inactivo'}
              </span>
            </div>
            <h2 className="text-lg font-serif font-bold text-white mt-0.5">
              Puente Cloud para Acceso Exterior (4G/5G) y iPhone
            </h2>
            <p className="text-xs text-white/90">
              Permite a los dispositivos móviles operar 24/7 sin depender de que la PC esté encendida ni usar túneles temporales.
            </p>
          </div>
        </div>

        {syncEnabled && dbUrl && (
          <button
            type="button"
            onClick={handleTriggerSync}
            disabled={syncing}
            className="px-4 py-2 rounded-xl bg-white text-rose-gold-800 hover:bg-rose-gold-50 text-xs font-bold transition-all shadow-md flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
            <span>{syncing ? 'Sincronizando...' : 'Sincronizar Ahora'}</span>
          </button>
        )}
      </div>

      {/* Formulario de Configuración de la Nube */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 p-6 rounded-3xl bg-white border border-rose-gold-200/80 shadow-soft space-y-4">
          <div className="flex items-center justify-between border-b border-rose-gold-100 pb-3">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-rose-gold-600" />
              <h3 className="text-sm font-bold text-graphite-900">Credenciales de la Base de Datos del Salón</h3>
            </div>
            {lastSyncAt && (
              <span className="text-[10px] text-graphite-500 font-mono">
                Última sinc.: {new Date(lastSyncAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>

          {/* Nombre del Salón */}
          <div>
            <label className="block text-xs font-bold text-graphite-700 mb-1">
              Nombre de tu Salón / Centro:
            </label>
            <input
              type="text"
              value={salonName}
              onChange={(e) => setSalonName(e.target.value)}
              placeholder="Ej: Hikari Estética & Spa"
              className="w-full text-xs p-3 rounded-xl bg-silk-50 border border-rose-gold-200 text-graphite-800 focus:outline-none focus:ring-1 focus:ring-rose-gold-400 font-medium"
            />
            <p className="text-[10px] text-graphite-400 mt-1">
              Identificador utilizado para aislar la base de datos de tu negocio en la nube.
            </p>
          </div>

          {/* URL de Base de Datos Turso */}
          <div>
            <label className="block text-xs font-bold text-graphite-700 mb-1">
              URL de Base de Datos Turso (LibSQL):
            </label>
            <div className="relative">
              <Globe className="w-4 h-4 text-graphite-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={dbUrl}
                onChange={(e) => setDbUrl(e.target.value)}
                placeholder="libsql://hikari-salon-centro-usuario.turso.io"
                className="w-full text-xs pl-9 pr-3 py-3 rounded-xl bg-silk-50 border border-rose-gold-200 text-graphite-800 font-mono focus:outline-none focus:ring-1 focus:ring-rose-gold-400"
              />
            </div>
            <p className="text-[10px] text-graphite-400 mt-1">
              Obtén tu URL gratuita ejecutando <code>turso db show [nombre]</code> o desde el panel web de Turso.
            </p>
          </div>

          {/* Auth Token de Turso */}
          <div>
            <label className="block text-xs font-bold text-graphite-700 mb-1">
              Token de Autenticación de Turso:
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-graphite-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type={showToken ? 'text' : 'password'}
                value={authToken}
                onChange={(e) => setAuthToken(e.target.value)}
                placeholder="eyJh..."
                className="w-full text-xs pl-9 pr-10 py-3 rounded-xl bg-silk-50 border border-rose-gold-200 text-graphite-800 font-mono focus:outline-none focus:ring-1 focus:ring-rose-gold-400"
              />
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-graphite-400 hover:text-graphite-700"
              >
                {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[10px] text-graphite-400 mt-1">
              Token seguro de lectura/escritura generado con <code>turso db tokens create [nombre]</code>.
            </p>
          </div>

          {/* Switch de Activación */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-silk-50 border border-rose-gold-200/80">
            <div>
              <span className="text-xs font-bold text-graphite-900 block">
                Activar Sincronización Automática en la Nube
              </span>
              <span className="text-[11px] text-graphite-500">
                Sincroniza citas, clientes, stock y caja en segundo plano.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setSyncEnabled(!syncEnabled)}
              className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ${
                syncEnabled ? 'bg-emerald-600' : 'bg-graphite-300'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                  syncEnabled ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Resultado de la prueba */}
          {testResult && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                testResult.success
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border-rose-200'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{testResult.message}</span>
            </div>
          )}

          {/* Botones de Acción */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testing || !dbUrl.trim() || !authToken.trim()}
              className="px-4 py-2.5 rounded-xl border border-rose-gold-300 text-xs font-bold text-rose-gold-800 hover:bg-silk-100 transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              <Zap className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
              <span>{testing ? 'Comprobando...' : 'Probar Conexión'}</span>
            </button>

            <button
              type="button"
              onClick={handleSaveConfig}
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-gold-600 to-rose-gold-700 hover:from-rose-gold-700 hover:to-rose-gold-800 text-white text-xs font-bold shadow-soft transition-all disabled:opacity-50"
            >
              {saving ? 'Guardando...' : 'Guardar Parámetros'}
            </button>
          </div>
        </div>

        {/* Guía en 3 Pasos */}
        <div className="space-y-4">
          <div className="p-5 rounded-3xl bg-white border border-rose-gold-200/80 shadow-soft space-y-3.5 text-xs">
            <div className="flex items-center gap-2 text-rose-gold-800 font-bold">
              <ShieldCheck className="w-4 h-4" />
              <span>¿Cómo crear tu base Turso Gratis?</span>
            </div>
            <p className="text-[11px] text-graphite-600 leading-relaxed">
              Turso ofrece <strong>500 bases de datos SQLite gratuitas</strong> con 9 GB de espacio y 1.000 millones de lecturas mensuales.
            </p>

            <ol className="space-y-2.5 text-[11px] text-graphite-700 list-decimal list-inside leading-relaxed">
              <li>
                Entra a{' '}
                <a
                  href="https://turso.tech"
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold text-rose-gold-700 underline inline-flex items-center gap-0.5"
                >
                  turso.tech <ExternalLink className="w-2.5 h-2.5" />
                </a>{' '}
                y crea tu cuenta gratuita.
              </li>
              <li>
                Crea una base de datos con el nombre de tu salón (ej: <code>hikari-salon</code>).
              </li>
              <li>
                Genera un <strong>Token</strong> y copia la <strong>URL</strong> en los campos de la izquierda.
              </li>
            </ol>

            <div className="p-3 bg-silk-100 rounded-xl border border-rose-gold-200/80 text-[10px] text-graphite-600">
              💡 <strong>Ventaja clave:</strong> Al tener tu base en Turso, tu iPhone se conecta en cualquier lugar con 4G sin que la computadora del salón deba quedar encendida por la noche.
            </div>
          </div>

          {/* Ventajas para iPhone */}
          <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-emerald-950 text-xs space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold">
              <Smartphone className="w-4 h-4 text-emerald-700" />
              <span>Conexión Móvil Autónoma</span>
            </div>
            <p className="text-[11px] text-emerald-800 leading-relaxed">
              Cuando salgas del salón o no tengas Wi-Fi local, la aplicación móvil conmuta automáticamente a la réplica en la nube para mantenerte operativo siempre.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
