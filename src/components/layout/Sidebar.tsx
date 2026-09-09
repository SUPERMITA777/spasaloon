import React from 'react';
import { useApp, NavigationTab } from '../../context/AppContext';
import { HikariLogo } from '../common/HikariLogo';
import { APP_VERSION, APP_NAME } from '../../version';
import {
  Calendar,
  Users,
  UserCheck,
  Sparkles,
  LayoutGrid,
  Package,
  Activity,
  DollarSign,
  Share2,
  BookOpen,
  QrCode,
  ChevronRight,
  Database,
  Power,
  AlertTriangle,
  Smartphone,
} from 'lucide-react';

interface NavItem {
  tab: NavigationTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
}

interface SidebarProps {
  onCheckUpdates?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onCheckUpdates }) => {
  const {
    activeTab,
    setActiveTab,
    setIsStaffQrModalOpen,
    setIsMobileQrModalOpen,
    appointments,
    products,
    closeSystem,
    conflicts,
    setIsConflictModalOpen,
  } = useApp();
  const [isShutdownModalOpen, setIsShutdownModalOpen] = React.useState<boolean>(false);

  // Contar alertas
  const lowStockCount = products.filter((p) => p.stock_quantity <= p.min_stock_alert).length;
  const todayApptCount = appointments.length;

  const navItems: NavItem[] = [
    { tab: 'agenda', label: 'Agenda & Boxes', icon: Calendar, badge: todayApptCount > 0 ? todayApptCount : undefined },
    { tab: 'clients', label: 'Clientes & Consultantes', icon: Users },
    { tab: 'body_charts', label: 'Ficha Corporal & Facial', icon: Activity },
    { tab: 'staff', label: 'Personal & Comisiones', icon: UserCheck },
    { tab: 'treatments', label: 'Tratamientos & Servicios', icon: Sparkles },
    { tab: 'boxes', label: 'Boxes & Cabinas', icon: LayoutGrid },
    { tab: 'products', label: 'Stock & Insumos', icon: Package, badge: lowStockCount > 0 ? `! ${lowStockCount}` : undefined },
    { tab: 'cash', label: 'Caja & Facturación', icon: DollarSign },
    { tab: 'marketing', label: 'Marketing & Redes', icon: Share2 },
    { tab: 'settings', label: 'Copias de Seguridad', icon: Database },
    { tab: 'guide', label: 'Guía de Uso', icon: BookOpen },
  ];

  return (
    <aside className="w-64 bg-white/80 backdrop-blur-md border-r border-rose-gold-200/50 flex flex-col h-screen shrink-0 shadow-soft">
      {/* Branding Header */}
      <div className="p-4 border-b border-rose-gold-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-silk-50 to-silk-100 flex items-center justify-center shadow-xs border border-rose-gold-200/80">
            <HikariLogo size={32} variant="icon" />
          </div>
          <div>
            <h1 
              className="font-serif font-bold text-graphite-900 text-base tracking-[0.08em] leading-tight uppercase"
              style={{ fontFamily: "'Cinzel', 'Playfair Display', serif" }}
            >
              {APP_NAME}
            </h1>
            <span className="text-[10px] font-medium text-rose-gold-700 tracking-wider uppercase">
              Gestión Integral
            </span>
          </div>
        </div>
        <button
          onClick={onCheckUpdates}
          title="Hacé clic para buscar actualizaciones en GitHub"
          className="px-1.5 py-0.5 rounded-md bg-rose-gold-50 hover:bg-rose-gold-100 border border-rose-gold-200 text-[10px] font-mono font-bold text-rose-gold-800 shadow-2xs transition-colors cursor-pointer"
        >
          v{APP_VERSION}
        </button>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <div className="px-3 py-1.5 text-[10px] font-bold text-graphite-400 uppercase tracking-wider">
          Módulos Principales
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.tab;

          return (
            <button
              key={item.tab}
              onClick={() => setActiveTab(item.tab)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 group ${
                isActive
                  ? 'bg-rose-gold-50 text-rose-gold-700 shadow-sm border border-rose-gold-200/80 font-semibold'
                  : 'text-graphite-600 hover:bg-silk-100 hover:text-graphite-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    isActive ? 'text-rose-gold-600' : 'text-graphite-400 group-hover:text-rose-gold-500'
                  }`}
                />
                <span>{item.label}</span>
              </div>

              {item.badge !== undefined && (
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                    typeof item.badge === 'string' && item.badge.startsWith('!')
                      ? 'bg-amber-100 text-amber-800'
                      : isActive
                      ? 'bg-rose-gold-200 text-rose-gold-800'
                      : 'bg-silk-200 text-graphite-600'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Botones Móviles y Discrepancias */}
      <div className="p-3 border-t border-rose-gold-100 space-y-2">
        {/* Banner de Discrepancias / Conflictos */}
        {conflicts.length > 0 && (
          <button
            onClick={() => setIsConflictModalOpen(true)}
            className="w-full flex items-center justify-between p-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white text-left transition-all duration-200 shadow-md group animate-pulse"
            title="Resolver discrepancias entre datos del servidor y la app móvil"
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-100 shrink-0" />
              <div>
                <div className="text-xs font-bold leading-tight">
                  {conflicts.length} {conflicts.length === 1 ? 'Discrepancia' : 'Discrepancias'}
                </div>
                <div className="text-[10px] text-amber-100">
                  Decidir: Servidor vs Móvil
                </div>
              </div>
            </div>
            <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded-full">
              Resolver
            </span>
          </button>
        )}

        {/* App Móvil Completa (iPhone / Android) */}
        <button
          onClick={() => setIsMobileQrModalOpen(true)}
          className="w-full flex items-center justify-between p-2.5 rounded-2xl bg-gradient-to-r from-rose-blush-50 to-rose-gold-50 border border-rose-gold-200 text-left hover:shadow-soft transition-all duration-200 group"
        >
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white shadow-sm text-rose-gold-600 group-hover:scale-105 transition-transform">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-graphite-900 leading-tight flex items-center gap-1.5">
                <span>App Celular</span>
                <span className="text-[9px] bg-rose-gold-500 text-white px-1.5 py-0.2 rounded-full font-bold">Offline</span>
              </div>
              <div className="text-[10px] text-rose-gold-600">
                Descargar iPhone / Android
              </div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-rose-gold-400 group-hover:translate-x-0.5 transition-transform" />
        </button>

        {/* Portal Personal Staff */}
        <button
          onClick={() => setIsStaffQrModalOpen(true)}
          className="w-full flex items-center justify-between p-2.5 rounded-2xl bg-silk-100 hover:bg-silk-200/80 border border-rose-gold-200/60 text-left transition-all duration-200 group"
        >
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-xl bg-white shadow-xs text-graphite-600 group-hover:scale-105 transition-transform">
              <QrCode className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="text-xs font-medium text-graphite-800 leading-tight">
                Portal Personal
              </div>
              <div className="text-[10px] text-graphite-500">
                Agenda diaria staff
              </div>
            </div>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-graphite-400 group-hover:translate-x-0.5 transition-transform" />
        </button>

        {/* Offline Badge */}
        <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-sage-600 font-medium bg-sage-50 py-1 rounded-lg border border-sage-200/50">
          <span className="w-1.5 h-1.5 rounded-full bg-sage-500 animate-pulse"></span>
          Sistema Local 100% Offline
        </div>

        {/* Botón Salir / Cerrar Sistema */}
        <button
          onClick={() => setIsShutdownModalOpen(true)}
          className="mt-2 w-full flex items-center justify-center gap-2 py-1.5 px-3 rounded-xl border border-rose-gold-200/80 text-graphite-600 hover:text-rose-700 hover:bg-rose-50 text-[11px] font-semibold transition-colors"
        >
          <Power className="w-3.5 h-3.5 text-graphite-400 group-hover:text-rose-600" />
          <span>Cerrar Sistema</span>
        </button>
      </div>

      {/* Modal Confirmación Cierre y Backup */}
      {isShutdownModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-graphite-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-soft-lg border border-rose-gold-200 space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="w-11 h-11 rounded-2xl bg-rose-gold-100 text-rose-gold-700 flex items-center justify-center">
              <Power className="w-6 h-6" />
            </div>

            <div>
              <h2 className="text-base font-bold text-graphite-900">
                ¿Cerrar Hikari Suite?
              </h2>
              <p className="text-xs text-graphite-600 mt-1.5 leading-relaxed">
                Al salir se guardará automáticamente una <strong>copia de seguridad</strong> con la fecha y hora actual para resguardar todos tus datos.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setIsShutdownModalOpen(false)}
                className="px-3.5 py-2 rounded-xl border border-rose-gold-200 text-xs font-semibold text-graphite-700 hover:bg-silk-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  setIsShutdownModalOpen(false);
                  closeSystem();
                }}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-gold-500 to-rose-gold-600 text-white text-xs font-semibold shadow-soft hover:shadow-soft-md transition-all"
              >
                Cerrar y Guardar Respaldo
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
