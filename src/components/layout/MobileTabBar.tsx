import React, { useState } from 'react';
import { useApp, NavigationTab } from '../../context/AppContext';
import {
  Calendar,
  Users,
  DollarSign,
  Activity,
  LayoutGrid,
  Sparkles,
  Package,
  UserCheck,
  Share2,
  Database,
  BookOpen,
  QrCode,
  X,
  ChevronRight,
  ShieldCheck,
  Wifi,
  Power,
} from 'lucide-react';
import { HikariLogo } from '../common/HikariLogo';
import { APP_VERSION, APP_NAME } from '../../version';

export const MobileTabBar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    appointments,
    products,
    setIsMobileQrModalOpen,
    isRealtimeConnected,
  } = useApp();

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const lowStockCount = products.filter((p) => p.stock_quantity <= p.min_stock_alert).length;
  const todayApptCount = appointments.length;

  const handleSelectTab = (tab: NavigationTab) => {
    setActiveTab(tab);
    setIsDrawerOpen(false);
  };

  const drawerModules: Array<{
    tab: NavigationTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string | number;
    color: string;
  }> = [
    {
      tab: 'treatments',
      label: 'Tratamientos & Servicios',
      icon: Sparkles,
      color: 'text-amber-600 bg-amber-50 border-amber-200',
    },
    {
      tab: 'products',
      label: 'Stock & Insumos',
      icon: Package,
      badge: lowStockCount > 0 ? `! ${lowStockCount}` : undefined,
      color: 'text-rose-gold-700 bg-rose-gold-50 border-rose-gold-200',
    },
    {
      tab: 'boxes',
      label: 'Boxes & Cabinas',
      icon: LayoutGrid,
      color: 'text-sage-700 bg-sage-50 border-sage-200',
    },
    {
      tab: 'staff',
      label: 'Personal & Comisiones',
      icon: UserCheck,
      color: 'text-mauve-700 bg-mauve-50 border-mauve-200',
    },
    {
      tab: 'marketing',
      label: 'Marketing & Redes',
      icon: Share2,
      color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    },
    {
      tab: 'settings',
      label: 'Copias de Seguridad',
      icon: Database,
      color: 'text-blue-700 bg-blue-50 border-blue-200',
    },
    {
      tab: 'guide',
      label: 'Guía de Uso',
      icon: BookOpen,
      color: 'text-graphite-700 bg-graphite-100 border-graphite-200',
    },
  ];

  return (
    <>
      {/* Drawer de Módulos Secundarios (Slide-up iOS Sheet) */}
      {isDrawerOpen && (
        <div
          className="fixed inset-0 z-50 bg-graphite-950/60 backdrop-blur-sm flex flex-col justify-end animate-fade-in lg:hidden"
          onClick={() => setIsDrawerOpen(false)}
        >
          <div
            className="bg-white rounded-t-3xl max-h-[82vh] overflow-y-auto flex flex-col shadow-2xl border-t border-rose-gold-200 animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Grab Handle iOS */}
            <div className="w-12 h-1.5 bg-graphite-300 rounded-full mx-auto mt-3 mb-1" />

            {/* Header Drawer */}
            <div className="px-5 py-3 border-b border-rose-gold-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <HikariLogo size={24} variant="icon" />
                <div>
                  <h3 className="font-serif font-bold text-graphite-900 text-sm">
                    {APP_NAME} — Todos los Módulos
                  </h3>
                  <div className="flex items-center gap-1.5 text-[10px] text-graphite-500">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isRealtimeConnected ? 'bg-emerald-500' : 'bg-amber-500'
                      }`}
                    />
                    <span>
                      {isRealtimeConnected
                        ? 'Servidor PC Conectado (Tiempo Real)'
                        : 'Conectando con Servidor...'}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="p-1.5 rounded-full hover:bg-silk-100 text-graphite-400 hover:text-graphite-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Grid de Módulos */}
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-2 pb-8">
              {drawerModules.map((m) => {
                const IconComponent = m.icon;
                const isSelected = activeTab === m.tab;
                return (
                  <button
                    key={m.tab}
                    type="button"
                    onClick={() => handleSelectTab(m.tab)}
                    className={`flex items-center justify-between p-3 rounded-2xl border transition-all text-left ${
                      isSelected
                        ? 'bg-rose-gold-50 border-rose-gold-400 shadow-sm'
                        : 'bg-white hover:bg-silk-50 border-rose-gold-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl border ${m.color}`}>
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <span className="font-semibold text-xs text-graphite-800">
                        {m.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {m.badge && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">
                          {m.badge}
                        </span>
                      )}
                      <ChevronRight className="w-4 h-4 text-graphite-400" />
                    </div>
                  </button>
                );
              })}

              {/* Botón QR Instalación / Descarga */}
              <button
                type="button"
                onClick={() => {
                  setIsDrawerOpen(false);
                  setIsMobileQrModalOpen(true);
                }}
                className="flex items-center justify-between p-3 rounded-2xl border border-rose-gold-200 bg-gradient-to-r from-rose-gold-50 to-silk-100 text-left transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-white border border-rose-gold-200 text-rose-gold-700">
                    <QrCode className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-xs text-graphite-900 block">
                      Código QR & Descarga
                    </span>
                    <span className="text-[10px] text-graphite-500">
                      Instalar en otros dispositivos
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-graphite-400" />
              </button>

              {/* Pie con Versión en Móvil */}
              <div className="pt-2 text-center border-t border-rose-gold-100 flex items-center justify-center gap-2">
                <span className="text-[10px] font-mono font-bold text-rose-gold-800 bg-rose-gold-50 border border-rose-gold-200 px-2 py-0.5 rounded-full">
                  v{APP_VERSION}
                </span>
                <span className="text-[10px] text-graphite-400">
                  {APP_NAME} Móvil
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Barra de Pestañas Inferior iOS (Fija en la parte inferior) */}
      <nav aria-label="Navegación principal móvil" className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-rose-gold-200 shadow-soft pb-[env(safe-area-inset-bottom)] lg:hidden">
        <div className="flex items-center justify-around h-14 max-w-lg mx-auto px-2">
          {/* 1. Agenda */}
          <button
            type="button"
            onClick={() => handleSelectTab('agenda')}
            className={`flex-1 flex flex-col items-center justify-center py-1 transition-all relative ${
              activeTab === 'agenda'
                ? 'text-rose-gold-700 font-bold'
                : 'text-graphite-500 hover:text-graphite-800'
            }`}
          >
            <div className="relative">
              <Calendar className="w-5 h-5" />
              {todayApptCount > 0 && (
                <span className="absolute -top-1 -right-2.5 px-1 py-0.1 min-w-[15px] h-[15px] bg-rose-gold-600 text-white rounded-full text-[9px] font-bold flex items-center justify-center">
                  {todayApptCount}
                </span>
              )}
            </div>
            <span className="text-[10px] tracking-tight mt-0.5">Agenda</span>
            {activeTab === 'agenda' && (
              <span className="w-1 h-1 rounded-full bg-rose-gold-600 mt-0.5" />
            )}
          </button>

          {/* 2. Clientes */}
          <button
            type="button"
            onClick={() => handleSelectTab('clients')}
            className={`flex-1 flex flex-col items-center justify-center py-1 transition-all ${
              activeTab === 'clients'
                ? 'text-rose-gold-700 font-bold'
                : 'text-graphite-500 hover:text-graphite-800'
            }`}
          >
            <Users className="w-5 h-5" />
            <span className="text-[10px] tracking-tight mt-0.5">Clientes</span>
            {activeTab === 'clients' && (
              <span className="w-1 h-1 rounded-full bg-rose-gold-600 mt-0.5" />
            )}
          </button>

          {/* 3. Caja */}
          <button
            type="button"
            onClick={() => handleSelectTab('cash')}
            className={`flex-1 flex flex-col items-center justify-center py-1 transition-all ${
              activeTab === 'cash'
                ? 'text-rose-gold-700 font-bold'
                : 'text-graphite-500 hover:text-graphite-800'
            }`}
          >
            <DollarSign className="w-5 h-5" />
            <span className="text-[10px] tracking-tight mt-0.5">Caja</span>
            {activeTab === 'cash' && (
              <span className="w-1 h-1 rounded-full bg-rose-gold-600 mt-0.5" />
            )}
          </button>

          {/* 4. Fichas */}
          <button
            type="button"
            onClick={() => handleSelectTab('body_charts')}
            className={`flex-1 flex flex-col items-center justify-center py-1 transition-all ${
              activeTab === 'body_charts'
                ? 'text-rose-gold-700 font-bold'
                : 'text-graphite-500 hover:text-graphite-800'
            }`}
          >
            <Activity className="w-5 h-5" />
            <span className="text-[10px] tracking-tight mt-0.5">Fichas</span>
            {activeTab === 'body_charts' && (
              <span className="w-1 h-1 rounded-full bg-rose-gold-600 mt-0.5" />
            )}
          </button>

          {/* 5. Módulos (Más) */}
          <button
            type="button"
            onClick={() => setIsDrawerOpen(true)}
            className={`flex-1 flex flex-col items-center justify-center py-1 transition-all ${
              isDrawerOpen ||
              ![
                'agenda',
                'clients',
                'cash',
                'body_charts',
              ].includes(activeTab)
                ? 'text-rose-gold-700 font-bold'
                : 'text-graphite-500 hover:text-graphite-800'
            }`}
          >
            <div className="relative">
              <LayoutGrid className="w-5 h-5" />
              {lowStockCount > 0 && (
                <span className="absolute -top-1 -right-2 w-2 h-2 rounded-full bg-amber-500" />
              )}
            </div>
            <span className="text-[10px] tracking-tight mt-0.5">Módulos</span>
            {![
              'agenda',
              'clients',
              'cash',
              'body_charts',
            ].includes(activeTab) && (
              <span className="w-1 h-1 rounded-full bg-rose-gold-600 mt-0.5" />
            )}
          </button>
        </div>
      </nav>
    </>
  );
};
