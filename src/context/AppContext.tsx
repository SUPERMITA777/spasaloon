import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Client, Staff, Box, Treatment, Appointment, Product, CashRegisterShift } from '../types';
import { api } from '../services/api';
import { getSocket } from '../services/socket';
import { SyncConflict } from '../services/syncService';

export type NavigationTab = 
  | 'agenda'
  | 'clients'
  | 'staff'
  | 'treatments'
  | 'boxes'
  | 'products'
  | 'body_charts'
  | 'cash'
  | 'marketing'
  | 'guide'
  | 'settings';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
}

interface AppContextType {
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  selectedDate: string; // YYYY-MM-DD
  setSelectedDate: (date: string) => void;
  clients: Client[];
  staff: Staff[];
  boxes: Box[];
  treatments: Treatment[];
  products: Product[];
  appointments: Appointment[];
  activeShift: (CashRegisterShift & { transactions: any[] }) | null;
  networkInfo: { localIp: string; port: number; staffPortalUrl: string } | null;
  loading: boolean;
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  refreshAppointments: () => Promise<void>;
  refreshAllData: () => Promise<void>;
  selectedAppointment: Appointment | null;
  setSelectedAppointment: (appt: Appointment | null) => void;
  isNewAppointmentOpen: boolean;
  setIsNewAppointmentOpen: (open: boolean) => void;
  isStaffQrModalOpen: boolean;
  setIsStaffQrModalOpen: (open: boolean) => void;
  isMobileQrModalOpen: boolean;
  setIsMobileQrModalOpen: (open: boolean) => void;
  conflicts: SyncConflict[];
  setConflicts: React.Dispatch<React.SetStateAction<SyncConflict[]>>;
  isConflictModalOpen: boolean;
  setIsConflictModalOpen: (open: boolean) => void;
  closeSystem: () => Promise<void>;
  isRealtimeConnected: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<NavigationTab>('agenda');
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });

  const [clients, setClients] = useState<Client[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [activeShift, setActiveShift] = useState<(CashRegisterShift & { transactions: any[] }) | null>(null);
  const [networkInfo, setNetworkInfo] = useState<{ localIp: string; port: number; staffPortalUrl: string } | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [toasts, setToasts] = useState<Toast[]>([]);
  
  // Modales globales
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isNewAppointmentOpen, setIsNewAppointmentOpen] = useState<boolean>(false);
  const [isStaffQrModalOpen, setIsStaffQrModalOpen] = useState<boolean>(false);
  const [isMobileQrModalOpen, setIsMobileQrModalOpen] = useState<boolean>(false);
  const [conflicts, setConflicts] = useState<SyncConflict[]>([]);
  const [isConflictModalOpen, setIsConflictModalOpen] = useState<boolean>(false);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState<boolean>(() => {
    try {
      return getSocket().connected;
    } catch {
      return false;
    }
  });

  // Escuchar y sincronizar discrepancias en el servidor
  useEffect(() => {
    fetch('/api/sync/pending-conflicts')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.conflicts)) {
          setConflicts(data.conflicts);
        }
      })
      .catch(() => {});

    const socket = getSocket();
    const handleConflict = (payload: { conflicts: SyncConflict[] }) => {
      if (payload?.conflicts) {
        setConflicts(payload.conflicts);
        if (payload.conflicts.length > 0) {
          setIsConflictModalOpen(true);
        }
      }
    };
    const handleResolved = () => {
      fetch('/api/sync/pending-conflicts')
        .then((res) => res.json())
        .then((data) => {
          if (data.success && Array.isArray(data.conflicts)) {
            setConflicts(data.conflicts);
          }
        })
        .catch(() => {});
    };

    socket.on('sync:conflict-detected', handleConflict);
    socket.on('sync:conflict-resolved', handleResolved);

    return () => {
      socket.off('sync:conflict-detected', handleConflict);
      socket.off('sync:conflict-resolved', handleResolved);
    };
  }, []);

  const addToast = (toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => removeToast(id), 5000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const refreshAppointments = async () => {
    try {
      const appts = await api.getAppointments({ date: selectedDate });
      setAppointments(appts);
      // Si hay un turno seleccionado abierto, actualizar sus datos
      if (selectedAppointment) {
        const updated = appts.find((a) => a.id === selectedAppointment.id);
        if (updated) setSelectedAppointment(updated);
      }
    } catch (error: any) {
      console.error('Error cargando turnos:', error);
    }
  };

  const refreshAllData = async () => {
    try {
      setLoading(true);
      const [c, s, b, t, p, appts, shift, info] = await Promise.all([
        api.getClients(),
        api.getStaff(),
        api.getBoxes(),
        api.getTreatments(),
        api.getProducts(),
        api.getAppointments({ date: selectedDate }),
        api.getCurrentShift(),
        api.getInfo().catch(() => null),
      ]);

      setClients(c);
      setStaff(s);
      setBoxes(b);
      setTreatments(t);
      setProducts(p);
      setAppointments(appts);
      setActiveShift(shift);
      if (info) setNetworkInfo(info);
    } catch (error: any) {
      console.error('Error cargando datos principales:', error);
      addToast({ type: 'error', title: 'Error de conexión', message: error.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshAllData();
  }, []);

  useEffect(() => {
    refreshAppointments();
  }, [selectedDate]);

  // Escuchar eventos en tiempo real vía Socket.io para sincronización bidireccional instantánea
  useEffect(() => {
    const socket = getSocket();
    setIsRealtimeConnected(socket.connected);

    const onConnect = () => setIsRealtimeConnected(true);
    const onDisconnect = () => setIsRealtimeConnected(false);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    // 1. Turnos / Citas
    const onApptCreated = (newAppt: Appointment) => {
      if (newAppt.start_time.startsWith(selectedDate)) {
        setAppointments((prev) => [...prev.filter((a) => a.id !== newAppt.id), newAppt]);
      }
      addToast({
        type: 'info',
        title: 'Nuevo turno agendado',
        message: `${newAppt.client?.first_name || 'Cliente'} ${newAppt.client?.last_name || ''} (${newAppt.sub_treatment?.name || 'Servicio'})`,
      });
    };

    const onApptUpdated = (updatedAppt: Appointment) => {
      setAppointments((prev) => prev.map((a) => (a.id === updatedAppt.id ? updatedAppt : a)));
      if (selectedAppointment && selectedAppointment.id === updatedAppt.id) {
        setSelectedAppointment(updatedAppt);
      }
    };

    const onApptDeleted = ({ id }: { id: string }) => {
      setAppointments((prev) => prev.filter((a) => a.id !== id));
      if (selectedAppointment && selectedAppointment.id === id) {
        setSelectedAppointment(null);
      }
    };

    socket.on('appointment:created', onApptCreated);
    socket.on('appointment:updated', onApptUpdated);
    socket.on('appointment:deleted', onApptDeleted);

    // 2. Clientes
    const onClientChange = async () => {
      try {
        const c = await api.getClients();
        setClients(c);
      } catch (e) {}
    };
    socket.on('client:created', onClientChange);
    socket.on('client:updated', onClientChange);
    socket.on('client:deleted', onClientChange);
    socket.on('client:batch-imported', onClientChange);

    // 3. Caja & Facturación
    const onCashChange = async () => {
      try {
        const shift = await api.getCurrentShift();
        setActiveShift(shift);
      } catch (e) {}
    };
    socket.on('cash:updated', onCashChange);
    socket.on('cash:shift-opened', onCashChange);
    socket.on('cash:shift-closed', onCashChange);
    socket.on('cash:transaction-created', onCashChange);

    // 4. Stock & Insumos
    const onProductChange = async () => {
      try {
        const p = await api.getProducts();
        setProducts(p);
      } catch (e) {}
    };
    socket.on('product:created', onProductChange);
    socket.on('product:updated', onProductChange);
    socket.on('product:deleted', onProductChange);

    // 5. Tratamientos, Boxes y Personal
    const onTreatmentChange = async () => {
      try {
        const t = await api.getTreatments();
        setTreatments(t);
      } catch (e) {}
    };
    socket.on('treatment:updated', onTreatmentChange);

    const onBoxChange = async () => {
      try {
        const b = await api.getBoxes();
        setBoxes(b);
      } catch (e) {}
    };
    socket.on('box:updated', onBoxChange);

    const onStaffChange = async () => {
      try {
        const s = await api.getStaff();
        setStaff(s);
      } catch (e) {}
    };
    socket.on('staff:updated', onStaffChange);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('appointment:created', onApptCreated);
      socket.off('appointment:updated', onApptUpdated);
      socket.off('appointment:deleted', onApptDeleted);
      socket.off('client:created', onClientChange);
      socket.off('client:updated', onClientChange);
      socket.off('client:deleted', onClientChange);
      socket.off('client:batch-imported', onClientChange);
      socket.off('cash:updated', onCashChange);
      socket.off('cash:shift-opened', onCashChange);
      socket.off('cash:shift-closed', onCashChange);
      socket.off('cash:transaction-created', onCashChange);
      socket.off('product:created', onProductChange);
      socket.off('product:updated', onProductChange);
      socket.off('product:deleted', onProductChange);
      socket.off('treatment:updated', onTreatmentChange);
      socket.off('box:updated', onBoxChange);
      socket.off('staff:updated', onStaffChange);
    };
  }, [selectedDate, selectedAppointment]);

  const closeSystem = async () => {
    addToast({
      type: 'info',
      title: '✦ Cerrando Hikari Suite',
      message: 'Generando copia de seguridad y finalizando la sesión...',
    });

    try {
      if (window.electronAPI?.closeApp) {
        await window.electronAPI.closeApp();
      } else {
        await api.shutdownSystem();
        setTimeout(() => {
          document.body.innerHTML = `
            <div style="height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:sans-serif;background:#FAF7F2;color:#333;">
              <h2 style="font-size:24px;margin-bottom:8px;">✦ Hikari Suite Cerrado</h2>
              <p style="font-size:14px;color:#666;">La copia de seguridad se ha guardado correctamente. Ya puedes cerrar esta pestaña.</p>
            </div>
          `;
        }, 600);
      }
    } catch (e) {
      console.error('Error cerrando sistema:', e);
    }
  };

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        selectedDate,
        setSelectedDate,
        clients,
        staff,
        boxes,
        treatments,
        products,
        appointments,
        activeShift,
        networkInfo,
        loading,
        toasts,
        addToast,
        removeToast,
        refreshAppointments,
        refreshAllData,
        selectedAppointment,
        setSelectedAppointment,
        isNewAppointmentOpen,
        setIsNewAppointmentOpen,
        isStaffQrModalOpen,
        setIsStaffQrModalOpen,
        isMobileQrModalOpen,
        setIsMobileQrModalOpen,
        conflicts,
        setConflicts,
        isConflictModalOpen,
        setIsConflictModalOpen,
        closeSystem,
        isRealtimeConnected,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp debe usarse dentro de un AppProvider');
  }
  return context;
};
