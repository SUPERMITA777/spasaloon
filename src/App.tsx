import React, { useState, useEffect } from 'react';
import { useApp } from './context/AppContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { ToastContainer } from './components/layout/ToastContainer';
import { SplashScreen } from './components/common/SplashScreen';
import { UpdateModal, UpdateInfo } from './components/common/UpdateModal';
import { api } from './services/api';

// Vistas
import { AgendaView } from './components/agenda/AgendaView';
import { ClientsView } from './components/clients/ClientsView';
import { StaffView } from './components/staff/StaffView';
import { TreatmentsView } from './components/treatments/TreatmentsView';
import { BoxesView } from './components/boxes/BoxesView';
import { ProductsView } from './components/products/ProductsView';
import { CashView } from './components/cash/CashView';
import { MarketingView } from './components/marketing/MarketingView';
import { UserGuideView } from './components/guide/UserGuideView';
import { BackupSettingsView } from './components/settings/BackupSettingsView';

import { AppointmentModal } from './components/agenda/AppointmentModal';
import { NewAppointmentModal } from './components/agenda/NewAppointmentModal';
import { StaffQrModal } from './components/staff/StaffQrModal';
import { StaffMobilePortal } from './components/staffPortal/StaffMobilePortal';
import { ClientMobileConsentPortal } from './components/consents/ClientMobileConsentPortal';
import { MobileAppView } from './components/mobile/MobileAppView';
import { MobileQrModal } from './components/mobile/MobileQrModal';
import { ConflictResolutionModal } from './components/mobile/ConflictResolutionModal';
import { syncService, SyncConflict } from './services/syncService';

export const App: React.FC = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);

  const {
    activeTab,
    selectedAppointment,
    setSelectedAppointment,
    isNewAppointmentOpen,
    setIsNewAppointmentOpen,
    isMobileQrModalOpen,
    setIsMobileQrModalOpen,
    addToast,
  } = useApp();

  const [conflicts, setConflicts] = useState<SyncConflict[]>([]);

  // Escuchar conflictos detectados durante la sincronización
  useEffect(() => {
    const unsub = syncService.onConflict((c) => {
      setConflicts(c);
    });
    return unsub;
  }, []);

  // Comprobación automática de versiones al iniciar
  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        const res = await api.checkUpdates();
        if (res.success && res.updateAvailable) {
          setUpdateInfo(res);
          setIsUpdateModalOpen(true);
        }
      } catch (err) {
        // Silencioso si no hay conexión
      }
    }, 2800);

    return () => clearTimeout(timer);
  }, []);

  const handleManualCheckUpdates = async () => {
    try {
      addToast({ type: 'info', title: 'Buscando actualizaciones...' });
      const res = await api.checkUpdates();
      if (res.success && res.updateAvailable) {
        setUpdateInfo(res);
        setIsUpdateModalOpen(true);
      } else {
        addToast({
          type: 'success',
          title: 'Sistema Actualizado',
          message: `Estás utilizando la versión más reciente (v${res.currentVersion}).`,
        });
      }
    } catch (error: any) {
      addToast({
        type: 'error',
        title: 'Error al verificar actualizaciones',
        message: error.message,
      });
    }
  };

  // Si estamos en la ruta móvil de consentimiento (/consent)
  const isConsentRoute = window.location.pathname.startsWith('/consent');
  if (isConsentRoute) {
    return <ClientMobileConsentPortal />;
  }

  // Si estamos en la ruta móvil de la App sincronizable (/mobile o ?mode=mobile o #mobile)
  const isMobileRoute =
    window.location.pathname.startsWith('/mobile') ||
    new URLSearchParams(window.location.search).get('mode') === 'mobile' ||
    window.location.hash === '#mobile';

  if (isMobileRoute) {
    return <MobileAppView />;
  }

  // Si estamos en la ruta móvil del profesional (/staff o ?token=...)
  const isStaffRoute = window.location.pathname.startsWith('/staff') || new URLSearchParams(window.location.search).has('token');

  if (isStaffRoute) {
    return <StaffMobilePortal />;
  }

  const renderActiveView = () => {
    switch (activeTab) {
      case 'agenda':
        return <AgendaView />;
      case 'clients':
      case 'body_charts':
        return <ClientsView />;
      case 'staff':
        return <StaffView />;
      case 'treatments':
        return <TreatmentsView />;
      case 'boxes':
        return <BoxesView />;
      case 'products':
        return <ProductsView />;
      case 'cash':
        return <CashView />;
      case 'marketing':
        return <MarketingView />;
      case 'guide':
        return <UserGuideView />;
      case 'settings':
        return <BackupSettingsView />;
      default:
        return <AgendaView />;
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-silk-100 font-sans text-graphite-800">
      {/* Sidebar Lateral */}
      <Sidebar onCheckUpdates={handleManualCheckUpdates} />

      {/* Main App Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header />
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {renderActiveView()}
        </main>
      </div>

      {/* Global Modals */}
      {selectedAppointment && (
        <AppointmentModal
          appointment={selectedAppointment}
          onClose={() => setSelectedAppointment(null)}
        />
      )}

      {isNewAppointmentOpen && (
        <NewAppointmentModal
          onClose={() => setIsNewAppointmentOpen(false)}
        />
      )}

      <StaffQrModal />
      <MobileQrModal
        isOpen={isMobileQrModalOpen}
        onClose={() => setIsMobileQrModalOpen(false)}
      />
      <ConflictResolutionModal
        conflicts={conflicts}
        onClose={() => setConflicts([])}
      />
      <ToastContainer />

      {/* Modal de Actualización Disponible */}
      <UpdateModal
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
        updateInfo={updateInfo}
      />

      {/* Pantalla de Inicio (Splash Screen) */}
      {showSplash && (
        <SplashScreen onComplete={() => setShowSplash(false)} />
      )}
    </div>
  );
};
