import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Users,
  PlusCircle,
  RefreshCw,
  Wifi,
  WifiOff,
  Clock,
  User,
  Sparkles,
  Phone,
  CheckCircle2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  Check,
  X,
  Smartphone,
  DollarSign,
  Tag,
  Edit3,
  Trash2,
  CheckSquare,
  Flame,
  MessageCircle,
  Activity,
  Package,
  LayoutGrid,
  UserCheck,
  Share2,
  ArrowDownLeft,
  ArrowUpRight,
  Menu,
  Download,
  ShieldCheck,
  FileText,
  ArrowRight,
} from 'lucide-react';
import { HikariLogo } from '../common/HikariLogo';
import { offlineStorage } from '../../services/offlineStorage';
import { syncService, SyncConflict } from '../../services/syncService';
import { ConflictResolutionModal } from './ConflictResolutionModal';
import { MobileDownloadPortal } from './MobileDownloadPortal';

export type MobileTab =
  | 'agenda'
  | 'clients'
  | 'new_appointment'
  | 'body_charts'
  | 'facial_charts'
  | 'staff'
  | 'treatments'
  | 'boxes'
  | 'products'
  | 'cash'
  | 'marketing'
  | 'sync'
  | 'download';

export const MobileAppView: React.FC = () => {
  // Comprobar si la URL solicita explícitamente el portal de instalación
  const initialIsDownload = typeof window !== 'undefined' && window.location.search.includes('install');
  const [activeTab, setActiveTab] = useState<MobileTab>(initialIsDownload ? 'download' : 'agenda');
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [conflicts, setConflicts] = useState<SyncConflict[]>([]);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  // Datos locales réplica en IndexedDB
  const [appointments, setAppointments] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [treatments, setTreatments] = useState<any[]>([]);
  const [boxes, setBoxes] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [cashShifts, setCashShifts] = useState<any[]>([]);
  const [cashTransactions, setCashTransactions] = useState<any[]>([]);
  const [bodyCharts, setBodyCharts] = useState<any[]>([]);
  const [facialCharts, setFacialCharts] = useState<any[]>([]);

  // Filtros de agenda
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [agendaStatusFilter, setAgendaStatusFilter] = useState<string>('all');

  // Modal de Edición de Turno / Cita
  const [editingAppointment, setEditingAppointment] = useState<any | null>(null);
  const [editStartTime, setEditStartTime] = useState<string>('');
  const [editStaffId, setEditStaffId] = useState<string>('');
  const [editBoxId, setEditBoxId] = useState<string>('');
  const [editStatus, setEditStatus] = useState<string>('scheduled');
  const [editNotes, setEditNotes] = useState<string>('');
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editDeposit, setEditDeposit] = useState<number>(0);

  // Formulario de Nuevo Turno
  const [newClientId, setNewClientId] = useState<string>('');
  const [newStaffId, setNewStaffId] = useState<string>('');
  const [newBoxId, setNewBoxId] = useState<string>('');
  const [newSubTreatmentId, setNewSubTreatmentId] = useState<string>('');
  const [newDate, setNewDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [newTime, setNewTime] = useState<string>('10:00');
  const [newDeposit, setNewDeposit] = useState<number>(0);
  const [newNotes, setNewNotes] = useState<string>('');
  const [formSuccess, setFormSuccess] = useState<string>('');

  // Búsqueda y Modales de Clientes
  const [clientSearch, setClientSearch] = useState<string>('');
  const [showNewClientModal, setShowNewClientModal] = useState<boolean>(false);
  const [editingClient, setEditingClient] = useState<any | null>(null);
  const [clientFirst, setClientFirst] = useState<string>('');
  const [clientLast, setClientLast] = useState<string>('');
  const [clientPhone, setClientPhone] = useState<string>('');
  const [clientEmail, setClientEmail] = useState<string>('');
  const [clientNotes, setClientNotes] = useState<string>('');

  // Gestión de Precios y Servicios
  const [editingPriceItem, setEditingPriceItem] = useState<any | null>(null);
  const [newPriceValue, setNewPriceValue] = useState<number>(0);
  const [showNewServiceModal, setShowNewServiceModal] = useState<boolean>(false);
  const [newServiceName, setNewServiceName] = useState<string>('');
  const [newServicePrice, setNewServicePrice] = useState<number>(0);
  const [newServiceDuration, setNewServiceDuration] = useState<number>(60);
  const [newServiceTreatmentId, setNewServiceTreatmentId] = useState<string>('');

  // Ficha Corporal y Facial
  const [selectedChartClientId, setSelectedChartClientId] = useState<string>('');
  const [bodyView, setBodyView] = useState<'front' | 'back'>('front');
  const [bodyCondition, setBodyCondition] = useState<string>('adiposidad');
  const [bodyPoints, setBodyPoints] = useState<any[]>([]);
  const [bodyMeasurements, setBodyMeasurements] = useState<any>({
    weight_kg: 60,
    waist_cm: 70,
    abdomen_high_cm: 78,
    abdomen_low_cm: 85,
    hips_cm: 98,
  });
  const [facialSkinType, setFacialSkinType] = useState<string>('mixta');
  const [facialPhototype, setFacialPhototype] = useState<string>('III');
  const [facialNotes, setFacialNotes] = useState<string>('');
  const [chartSuccess, setChartSuccess] = useState<string>('');

  // Stock y Productos
  const [productSearch, setProductSearch] = useState<string>('');
  const [showNewProductModal, setShowNewProductModal] = useState<boolean>(false);
  const [newProductName, setNewProductName] = useState<string>('');
  const [newProductCategory, setNewProductCategory] = useState<string>('general');
  const [newProductSalePrice, setNewProductSalePrice] = useState<number>(0);
  const [newProductCostPrice, setNewProductCostPrice] = useState<number>(0);
  const [newProductStock, setNewProductStock] = useState<number>(10);
  const [newProductMinStock, setNewProductMinStock] = useState<number>(3);

  // Caja y Facturación
  const [showNewCashMovementModal, setShowNewCashMovementModal] = useState<boolean>(false);
  const [cashMovementType, setCashMovementType] = useState<'income' | 'expense'>('income');
  const [cashMovementAmount, setCashMovementAmount] = useState<number>(0);
  const [cashMovementMethod, setCashMovementMethod] = useState<string>('cash');
  const [cashMovementDesc, setCashMovementDesc] = useState<string>('');
  const [cashMovementCategory, setCashMovementCategory] = useState<string>('servicios');

  // Marketing & WhatsApp
  const [selectedMarketingClient, setSelectedMarketingClient] = useState<any | null>(null);
  const [customMarketingMessage, setCustomMarketingMessage] = useState<string>('');

  // PWA banner y detección de App Autónoma (Standalone)
  const [showPwaBanner, setShowPwaBanner] = useState<boolean>(true);
  const isStandalone =
    typeof window !== 'undefined' &&
    (window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true);

  // Iniciar sincronización y listeners
  useEffect(() => {
    syncService.start();

    const unsubscribe = syncService.subscribe((status) => {
      setIsOnline(status.isOnline);
      setIsSyncing(status.isSyncing);
      setPendingCount(status.pendingCount);
      setConflicts(status.conflicts);
      setLastSyncedAt(status.lastSyncedAt);
    });

    loadLocalData();

    return () => {
      unsubscribe();
    };
  }, []);

  const loadLocalData = async () => {
    const snapshot = await offlineStorage.getSnapshot();
    if (snapshot) {
      setAppointments(snapshot.appointments || []);
      setClients(snapshot.clients || []);
      setTreatments(snapshot.treatments || []);
      setBoxes(snapshot.boxes || []);
      setStaff(snapshot.staff || []);
      setProducts(snapshot.products || []);
      setCashShifts(snapshot.cash_shifts || []);
      setCashTransactions(snapshot.cash_transactions || []);
      setBodyCharts(snapshot.body_charts || []);
      setFacialCharts(snapshot.facial_charts || []);
      setLastSyncedAt(snapshot.lastSyncedAt);

      if (!newStaffId && snapshot.staff?.length > 0) {
        setNewStaffId(snapshot.staff[0].id);
      }
      if (!newBoxId && snapshot.boxes?.length > 0) {
        setNewBoxId(snapshot.boxes[0].id);
      }
      if (!newSubTreatmentId && snapshot.treatments?.[0]?.sub_treatments?.[0]) {
        setNewSubTreatmentId(snapshot.treatments[0].sub_treatments[0].id);
      }
      if (!newServiceTreatmentId && snapshot.treatments?.length > 0) {
        setNewServiceTreatmentId(snapshot.treatments[0].id);
      }
      if (!selectedChartClientId && snapshot.clients?.length > 0) {
        setSelectedChartClientId(snapshot.clients[0].id);
      }
    }
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    await syncService.syncNow();
    await loadLocalData();
    setIsSyncing(false);
  };

  // Cambio de fecha en agenda
  const changeDateOffset = (offset: number) => {
    const current = new Date(selectedDate + 'T00:00:00');
    current.setDate(current.getDate() + offset);
    setSelectedDate(current.toISOString().split('T')[0]);
  };

  // Citas filtradas
  const dayAppointments = appointments.filter((a) => {
    if (!a.start_time) return false;
    const dateMatch = a.start_time.startsWith(selectedDate);
    if (!dateMatch) return false;
    if (agendaStatusFilter === 'all') return true;
    return a.status === agendaStatusFilter;
  });

  // ==========================================
  // 1. GESTIÓN DE CITAS / TURNOS
  // ==========================================
  const handleOpenEditAppointment = (appt: any) => {
    setEditingAppointment(appt);
    setEditStartTime(appt.start_time?.substring(11, 16) || '10:00');
    setEditStaffId(appt.staff_id || '');
    setEditBoxId(appt.box_id || '');
    setEditStatus(appt.status || 'scheduled');
    setEditNotes(appt.notes || '');
    setEditPrice(appt.service_price || 0);
    setEditDeposit(appt.deposit_amount || 0);
  };

  const handleSaveEditAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAppointment) return;

    const fullStartTime = `${editingAppointment.start_time.split('T')[0]}T${editStartTime}:00`;
    const startDateObj = new Date(fullStartTime);
    const endDateObj = new Date(startDateObj.getTime() + 60 * 60 * 1000);
    const fullEndTime = endDateObj.toISOString().substring(0, 19);

    const updated = {
      ...editingAppointment,
      start_time: fullStartTime,
      end_time: fullEndTime,
      staff_id: editStaffId,
      box_id: editBoxId,
      status: editStatus,
      notes: editNotes,
      service_price: Number(editPrice),
      deposit_amount: Number(editDeposit),
      staff: staff.find((s) => s.id === editStaffId) || editingAppointment.staff,
      box: boxes.find((b) => b.id === editBoxId) || editingAppointment.box,
    };

    const newAppts = appointments.map((a) => (a.id === updated.id ? updated : a));
    setAppointments(newAppts);
    await offlineStorage.saveSnapshot({ appointments: newAppts });

    await syncService.recordOfflineAction('appointment', 'update', updated.id, {
      start_time: fullStartTime,
      end_time: fullEndTime,
      staff_id: editStaffId,
      box_id: editBoxId,
      status: editStatus,
      notes: editNotes,
      service_price: Number(editPrice),
      deposit_amount: Number(editDeposit),
    });

    setEditingAppointment(null);
  };

  // Cobro rápido de turno directamente a caja
  const handleQuickCheckoutAppointment = async (appt: any) => {
    const confirmCheckout = window.confirm(
      `¿Registrar cobro de $${Number(appt.service_price || 0).toLocaleString('es-AR')} para ${appt.client?.first_name || 'este cliente'}?`
    );
    if (!confirmCheckout) return;

    // 1. Marcar turno como completado
    const updatedAppt = { ...appt, status: 'completed' };
    const newAppts = appointments.map((a) => (a.id === appt.id ? updatedAppt : a));
    setAppointments(newAppts);
    await offlineStorage.saveSnapshot({ appointments: newAppts });
    await syncService.recordOfflineAction('appointment', 'update', appt.id, { status: 'completed' });

    // 2. Registrar movimiento de ingreso en caja
    const activeShift = cashShifts.find((s) => s.status === 'open') || cashShifts[0];
    const transId = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newTx = {
      id: transId,
      shift_id: activeShift?.id || 'main_shift',
      type: 'income',
      amount: Number(appt.service_price) || 0,
      payment_method: 'cash',
      category: 'cobro_turno',
      description: `Cobro de turno #${appt.id.substring(0, 6)} - ${appt.client?.first_name || 'Cliente'}`,
      client_id: appt.client_id,
      created_at: new Date().toISOString(),
    };

    const newTxs = [newTx, ...cashTransactions];
    setCashTransactions(newTxs);
    await offlineStorage.saveSnapshot({ cash_transactions: newTxs });
    await syncService.recordOfflineAction('cash_transaction', 'create', transId, newTx);

    alert('¡Turno cobrado y registrado en caja con éxito!');
  };

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientId || !newSubTreatmentId) {
      alert('Por favor selecciona un cliente y un tratamiento.');
      return;
    }

    const startDateTime = `${newDate}T${newTime}:00`;
    const startDateObj = new Date(startDateTime);
    const endDateObj = new Date(startDateObj.getTime() + 60 * 60 * 1000);
    const endDateTime = endDateObj.toISOString().substring(0, 19);

    const newId = `appt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const clientObj = clients.find((c) => c.id === newClientId);
    const staffObj = staff.find((s) => s.id === newStaffId);
    const boxObj = boxes.find((b) => b.id === newBoxId);

    let foundSub: any = null;
    let foundTreat: any = null;
    for (const t of treatments) {
      const sub = t.sub_treatments?.find((st: any) => st.id === newSubTreatmentId);
      if (sub) {
        foundSub = sub;
        foundTreat = t;
        break;
      }
    }

    const newAppt = {
      id: newId,
      client_id: newClientId,
      staff_id: newStaffId || null,
      box_id: newBoxId || null,
      sub_treatment_id: newSubTreatmentId,
      start_time: startDateTime,
      end_time: endDateTime,
      service_price: foundSub?.price || 0,
      deposit_amount: Number(newDeposit) || 0,
      status: 'scheduled',
      notes: newNotes,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      client: clientObj,
      staff: staffObj,
      box: boxObj,
      sub_treatment: foundSub,
      treatment: foundTreat,
    };

    const newAppts = [newAppt, ...appointments];
    setAppointments(newAppts);
    await offlineStorage.saveSnapshot({ appointments: newAppts });

    await syncService.recordOfflineAction('appointment', 'create', newId, {
      client_id: newClientId,
      staff_id: newStaffId,
      box_id: newBoxId,
      sub_treatment_id: newSubTreatmentId,
      start_time: startDateTime,
      end_time: endDateTime,
      service_price: foundSub?.price || 0,
      deposit_amount: Number(newDeposit) || 0,
      status: 'scheduled',
      notes: newNotes,
    });

    setFormSuccess('¡Turno agendado con éxito!');
    setTimeout(() => {
      setFormSuccess('');
      setSelectedDate(newDate);
      setActiveTab('agenda');
    }, 1200);
  };

  // ==========================================
  // 2. GESTIÓN DE CLIENTES
  // ==========================================
  const handleSaveClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientFirst.trim()) return;

    if (editingClient) {
      const updated = {
        ...editingClient,
        first_name: clientFirst.trim(),
        last_name: clientLast.trim(),
        phone: clientPhone.trim(),
        email: clientEmail.trim(),
        notes: clientNotes.trim(),
        updated_at: new Date().toISOString(),
      };

      const newClients = clients.map((c) => (c.id === updated.id ? updated : c));
      setClients(newClients);
      await offlineStorage.saveSnapshot({ clients: newClients });

      await syncService.recordOfflineAction('client', 'update', updated.id, {
        first_name: updated.first_name,
        last_name: updated.last_name,
        phone: updated.phone,
        email: updated.email,
        notes: updated.notes,
      });

      setEditingClient(null);
    } else {
      const newId = `cli_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const newCli = {
        id: newId,
        first_name: clientFirst.trim(),
        last_name: clientLast.trim(),
        phone: clientPhone.trim(),
        email: clientEmail.trim(),
        notes: clientNotes.trim(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const newClients = [newCli, ...clients];
      setClients(newClients);
      await offlineStorage.saveSnapshot({ clients: newClients });

      await syncService.recordOfflineAction('client', 'create', newId, {
        first_name: newCli.first_name,
        last_name: newCli.last_name,
        phone: newCli.phone,
        email: newCli.email,
        notes: newCli.notes,
      });

      setNewClientId(newId);
      setShowNewClientModal(false);
    }

    setClientFirst('');
    setClientLast('');
    setClientPhone('');
    setClientEmail('');
    setClientNotes('');
  };

  const openEditClientModal = (cli: any) => {
    setEditingClient(cli);
    setClientFirst(cli.first_name || '');
    setClientLast(cli.last_name || '');
    setClientPhone(cli.phone || '');
    setClientEmail(cli.email || '');
    setClientNotes(cli.notes || '');
  };

  // ==========================================
  // 3. FICHAS CORPORAL & FACIAL
  // ==========================================
  const handleAddBodyPoint = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);

    const newPt = {
      id: Math.random().toString(36).substring(2, 8),
      x,
      y,
      view: bodyView,
      condition: bodyCondition,
    };
    setBodyPoints([...bodyPoints, newPt]);
  };

  const handleSaveBodyChart = async () => {
    if (!selectedChartClientId) {
      alert('Selecciona un cliente para guardar la ficha corporal.');
      return;
    }
    const chartId = `bchart_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newChart = {
      id: chartId,
      client_id: selectedChartClientId,
      date: new Date().toISOString().split('T')[0],
      points_json: bodyPoints,
      measurements_json: bodyMeasurements,
      notes: `Ficha corporal registrada desde App Móvil (${bodyPoints.length} puntos anatómicos)`,
      created_at: new Date().toISOString(),
    };

    const updatedCharts = [newChart, ...bodyCharts];
    setBodyCharts(updatedCharts);
    await offlineStorage.saveSnapshot({ body_charts: updatedCharts });
    await syncService.recordOfflineAction('body_chart', 'create', chartId, newChart);

    setChartSuccess('¡Ficha corporal guardada con éxito!');
    setTimeout(() => setChartSuccess(''), 2000);
  };

  const handleSaveFacialChart = async () => {
    if (!selectedChartClientId) {
      alert('Selecciona un cliente para guardar la ficha facial.');
      return;
    }
    const chartId = `fchart_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newChart = {
      id: chartId,
      client_id: selectedChartClientId,
      date: new Date().toISOString().split('T')[0],
      skin_type: facialSkinType,
      phototype: facialPhototype,
      notes: facialNotes,
      recommended_homecare: 'Rutina recomendada desde App Móvil',
      created_at: new Date().toISOString(),
    };

    const updatedCharts = [newChart, ...facialCharts];
    setFacialCharts(updatedCharts);
    await offlineStorage.saveSnapshot({ facial_charts: updatedCharts });
    await syncService.recordOfflineAction('facial_chart', 'create', chartId, newChart);

    setChartSuccess('¡Ficha facial guardada con éxito!');
    setTimeout(() => setChartSuccess(''), 2000);
  };

  // ==========================================
  // 4. PRECIOS Y SERVICIOS
  // ==========================================
  const handleSavePriceUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPriceItem) return;

    const newPrice = Number(newPriceValue);
    const updatedTreatments = treatments.map((t) => ({
      ...t,
      sub_treatments: t.sub_treatments?.map((st: any) =>
        st.id === editingPriceItem.id ? { ...st, price: newPrice } : st
      ),
    }));

    setTreatments(updatedTreatments);
    await offlineStorage.saveSnapshot({ treatments: updatedTreatments });

    await syncService.recordOfflineAction('sub_treatment', 'update_price', editingPriceItem.id, {
      price: newPrice,
    });

    setEditingPriceItem(null);
  };

  const handleCreateNewService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServiceName.trim() || !newServiceTreatmentId) return;

    const newId = `sub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newService = {
      id: newId,
      treatment_id: newServiceTreatmentId,
      name: newServiceName.trim(),
      price: Number(newServicePrice) || 0,
      duration_minutes: Number(newServiceDuration) || 60,
      is_active: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const updatedTreatments = treatments.map((t) => {
      if (t.id === newServiceTreatmentId) {
        return {
          ...t,
          sub_treatments: [...(t.sub_treatments || []), newService],
        };
      }
      return t;
    });

    setTreatments(updatedTreatments);
    await offlineStorage.saveSnapshot({ treatments: updatedTreatments });

    await syncService.recordOfflineAction('sub_treatment', 'create', newId, {
      treatment_id: newServiceTreatmentId,
      name: newService.name,
      price: newService.price,
      duration_minutes: newService.duration_minutes,
    });

    setShowNewServiceModal(false);
    setNewServiceName('');
    setNewServicePrice(0);
    setNewServiceDuration(60);
  };

  // ==========================================
  // 5. STOCK & PRODUCTOS
  // ==========================================
  const handleQuickAdjustStock = async (prod: any, delta: number) => {
    const newQuantity = Math.max(0, Number(prod.stock_quantity || 0) + delta);
    const updatedProducts = products.map((p) =>
      p.id === prod.id ? { ...p, stock_quantity: newQuantity } : p
    );
    setProducts(updatedProducts);
    await offlineStorage.saveSnapshot({ products: updatedProducts });
    await syncService.recordOfflineAction('product', 'update_stock', prod.id, {
      stock_quantity: newQuantity,
    });
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductName.trim()) return;

    const newId = `prod_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newProd = {
      id: newId,
      name: newProductName.trim(),
      category: newProductCategory,
      sale_price: Number(newProductSalePrice) || 0,
      cost_price: Number(newProductCostPrice) || 0,
      stock_quantity: Number(newProductStock) || 0,
      min_stock_alert: Number(newProductMinStock) || 3,
      unit: 'unidad',
      created_at: new Date().toISOString(),
    };

    const updatedProds = [newProd, ...products];
    setProducts(updatedProds);
    await offlineStorage.saveSnapshot({ products: updatedProds });
    await syncService.recordOfflineAction('product', 'create', newId, newProd);

    setShowNewProductModal(false);
    setNewProductName('');
    setNewProductSalePrice(0);
    setNewProductCostPrice(0);
    setNewProductStock(10);
  };

  // ==========================================
  // 6. CAJA & FACTURACIÓN
  // ==========================================
  const handleSaveCashMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cashMovementAmount || cashMovementAmount <= 0) return;

    const activeShift = cashShifts.find((s) => s.status === 'open') || cashShifts[0];
    const transId = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newTx = {
      id: transId,
      shift_id: activeShift?.id || 'main_shift',
      type: cashMovementType,
      amount: Number(cashMovementAmount),
      payment_method: cashMovementMethod,
      category: cashMovementCategory,
      description: cashMovementDesc || (cashMovementType === 'income' ? 'Ingreso registrado' : 'Egreso registrado'),
      created_at: new Date().toISOString(),
    };

    const newTxs = [newTx, ...cashTransactions];
    setCashTransactions(newTxs);
    await offlineStorage.saveSnapshot({ cash_transactions: newTxs });
    await syncService.recordOfflineAction('cash_transaction', 'create', transId, newTx);

    setShowNewCashMovementModal(false);
    setCashMovementAmount(0);
    setCashMovementDesc('');
  };

  // ==========================================
  // 7. MARKETING & WHATSAPP
  // ==========================================
  const handleSendWhatsAppTemplate = (client: any, templateType: 'reminder' | 'birthday' | 'thanks' | 'promo') => {
    if (!client?.phone) {
      alert('Este cliente no tiene teléfono registrado.');
      return;
    }
    const cleanPhone = client.phone.replace(/[^0-9]/g, '');
    let text = '';

    if (templateType === 'reminder') {
      text = `¡Hola ${client.first_name}! Te escribimos de Hikari Suite para recordarte tu turno programado. ¿Nos confirmas tu asistencia? ¡Te esperamos! ✨`;
    } else if (templateType === 'birthday') {
      text = `¡Feliz Cumpleaños, ${client.first_name}! 🎂✨ Desde Hikari Suite te deseamos un día maravilloso y te regalamos un 20% de descuento en tu próxima sesión.`;
    } else if (templateType === 'thanks') {
      text = `¡Muchas gracias por visitarnos hoy, ${client.first_name}! Esperamos que hayas disfrutado tu tratamiento en Hikari Suite. ¡Hasta pronto! 💖`;
    } else if (templateType === 'promo') {
      text = `¡Hola ${client.first_name}! Tenemos promociones especiales de temporada en Hikari Suite pensadas para ti. Consúltanos para reservar tu lugar. ✨`;
    }

    const encoded = encodeURIComponent(text);
    window.open(`https://wa.me/${cleanPhone}?text=${encoded}`, '_blank');
  };

  // Filtrado de clientes
  const filteredClients = clients.filter((c) => {
    if (!clientSearch) return true;
    const q = clientSearch.toLowerCase();
    const full = `${c.first_name || ''} ${c.last_name || ''} ${c.phone || ''} ${c.dni || ''}`.toLowerCase();
    return full.includes(q);
  });

  // Filtrado de productos
  const filteredProducts = products.filter((p) => {
    if (!productSearch) return true;
    return (p.name || '').toLowerCase().includes(productSearch.toLowerCase());
  });

  // Si se solicitó la pantalla de descarga
  if (activeTab === 'download') {
    return <MobileDownloadPortal onEnterApp={() => setActiveTab('agenda')} />;
  }

  return (
    <div className="flex flex-col h-screen w-screen bg-silk-50 font-sans text-graphite-900 select-none overflow-hidden">
      {/* Top Mobile Header */}
      <header className="px-4 py-3 bg-white border-b border-rose-gold-200/70 shadow-xs flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="p-1.5 rounded-xl bg-silk-100 hover:bg-silk-200 text-graphite-800 transition-colors"
            title="Abrir menú completo de módulos"
          >
            <Menu className="w-5 h-5 text-rose-gold-700" />
          </button>

          <HikariLogo size={28} />
          <div>
            <h1 className="font-serif font-bold text-sm text-graphite-900 leading-tight">
              Hikari Suite Mobile
            </h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  isOnline ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'
                }`}
              />
              <span className="text-[10px] text-graphite-500 font-medium">
                {isOnline ? 'Servidor PC Online' : 'Modo Offline Autónomo'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {pendingCount > 0 && (
            <button
              onClick={() => setActiveTab('sync')}
              className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1 shadow-xs"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              {pendingCount} pend.
            </button>
          )}

          <button
            onClick={handleManualSync}
            disabled={isSyncing}
            className="p-2 rounded-xl bg-silk-100 hover:bg-silk-200 text-rose-gold-800 border border-rose-gold-200 transition-colors"
            title="Sincronizar con la PC"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>

      {/* Banner Offline */}
      {!isOnline && (
        <div className="bg-amber-500 text-white px-4 py-1.5 text-[11px] font-semibold flex items-center justify-between shadow-xs shrink-0">
          <div className="flex items-center gap-2">
            <WifiOff className="w-3.5 h-3.5" />
            <span>Trabajando con base de datos de respaldo en tu teléfono.</span>
          </div>
          <span className="text-[10px] bg-white/20 px-1.5 py-0.2 rounded font-mono">OFFLINE</span>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-4 pb-24 space-y-4">
        {/* ========================================================= */}
        {/* TAB 1: AGENDA / TURNOS                                    */}
        {/* ========================================================= */}
        {activeTab === 'agenda' && (
          <div className="space-y-4 max-w-lg mx-auto">
            {/* Barra de Navegación de Fecha */}
            <div className="bg-white p-3 rounded-2xl border border-rose-gold-200 shadow-soft flex items-center justify-between">
              <button
                onClick={() => changeDateOffset(-1)}
                className="p-2 rounded-xl bg-silk-100 hover:bg-silk-200 text-graphite-700"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="text-center">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="font-bold text-xs text-graphite-800 bg-transparent text-center border-b border-rose-gold-300 pb-0.5 outline-none cursor-pointer"
                />
                <div className="text-[10px] text-graphite-500 capitalize mt-0.5">
                  {new Date(selectedDate + 'T00:00:00').toLocaleDateString('es-AR', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'short',
                  })}
                </div>
              </div>

              <button
                onClick={() => changeDateOffset(1)}
                className="p-2 rounded-xl bg-silk-100 hover:bg-silk-200 text-graphite-700"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Filtro rápido de estado */}
            <div className="flex gap-1 overflow-x-auto pb-1 text-[10px]">
              {[
                { key: 'all', label: 'Todos' },
                { key: 'scheduled', label: 'Agendados' },
                { key: 'in_progress', label: 'En Curso' },
                { key: 'completed', label: 'Cobrados' },
                { key: 'cancelled', label: 'Cancelados' },
              ].map((f) => (
                <button
                  key={f.key}
                  onClick={() => setAgendaStatusFilter(f.key)}
                  className={`px-3 py-1 rounded-xl font-bold whitespace-nowrap transition-all ${
                    agendaStatusFilter === f.key
                      ? 'bg-rose-gold-600 text-white shadow-xs'
                      : 'bg-white text-graphite-600 border border-rose-gold-100'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Listado de Turnos del Día */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between px-1">
                <h2 className="font-bold text-xs text-graphite-700 uppercase tracking-wider">
                  Turnos ({dayAppointments.length})
                </h2>
                <button
                  onClick={() => setActiveTab('new_appointment')}
                  className="text-xs font-bold text-rose-gold-700 flex items-center gap-1 hover:underline"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Nuevo Turno</span>
                </button>
              </div>

              {dayAppointments.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-rose-gold-200 text-graphite-400 space-y-2">
                  <Calendar className="w-8 h-8 mx-auto text-rose-gold-300 opacity-70" />
                  <p className="text-xs font-medium">No hay turnos para este criterio.</p>
                  <button
                    onClick={() => setActiveTab('new_appointment')}
                    className="px-4 py-2 bg-rose-gold-600 hover:bg-rose-gold-700 text-white rounded-xl font-bold text-xs shadow-soft transition-all"
                  >
                    + Agendar Turno
                  </button>
                </div>
              ) : (
                dayAppointments.map((appt) => {
                  const statusColors: Record<string, { bg: string; text: string; label: string }> = {
                    scheduled: { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-800', label: 'Agendado' },
                    in_progress: { bg: 'bg-sky-50 border-sky-200', text: 'text-sky-800', label: 'En Curso' },
                    completed: { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-800', label: 'Cobrado' },
                    cancelled: { bg: 'bg-rose-50 border-rose-200', text: 'text-rose-800', label: 'Cancelado' },
                  };
                  const currentStatus = statusColors[appt.status] || statusColors.scheduled;

                  return (
                    <div
                      key={appt.id}
                      className="p-3.5 bg-white rounded-2xl border border-rose-gold-200/80 shadow-soft space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs px-2 py-0.5 bg-silk-100 rounded-lg text-graphite-800 border border-rose-gold-200/50">
                            {appt.start_time?.substring(11, 16)}
                          </span>
                          <span className="font-bold text-xs text-graphite-900">
                            {appt.client?.first_name} {appt.client?.last_name}
                          </span>
                        </div>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${currentStatus.bg} ${currentStatus.text}`}
                        >
                          {currentStatus.label}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-graphite-600">
                        <div className="flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-rose-gold-600" />
                          <span className="font-medium">
                            {appt.sub_treatment?.name || appt.treatment?.name || 'Tratamiento'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 font-mono text-[11px]">
                          {appt.deposit_amount > 0 && (
                            <span className="text-emerald-700 font-bold">
                              Seña: ${Number(appt.deposit_amount).toLocaleString('es-AR')}
                            </span>
                          )}
                          <span className="font-bold text-graphite-800">
                            ${Number(appt.service_price || 0).toLocaleString('es-AR')}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-silk-200 text-[10px] text-graphite-500">
                        <span>Prof: {appt.staff?.first_name || 'Sin asignar'}</span>
                        <div className="flex items-center gap-2">
                          {appt.status !== 'completed' && (
                            <button
                              onClick={() => handleQuickCheckoutAppointment(appt)}
                              className="px-2 py-1 rounded-lg bg-emerald-100 text-emerald-800 font-bold hover:bg-emerald-200 transition-colors"
                              title="Cobrar este turno a caja"
                            >
                              💵 Cobrar
                            </button>
                          )}
                          <button
                            onClick={() => handleOpenEditAppointment(appt)}
                            className="text-rose-gold-700 font-bold hover:underline"
                          >
                            Editar ✎
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: CLIENTES                                           */}
        {/* ========================================================= */}
        {activeTab === 'clients' && (
          <div className="space-y-4 max-w-lg mx-auto">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-sm text-graphite-800">Fichas de Clientes</h2>
              <button
                onClick={() => {
                  setEditingClient(null);
                  setClientFirst('');
                  setClientLast('');
                  setClientPhone('');
                  setClientEmail('');
                  setClientNotes('');
                  setShowNewClientModal(true);
                }}
                className="px-3 py-1.5 bg-rose-gold-600 hover:bg-rose-gold-700 text-white rounded-xl text-xs font-bold shadow-soft flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nuevo Cliente</span>
              </button>
            </div>

            {/* Buscador */}
            <div className="relative">
              <Search className="w-4 h-4 text-graphite-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Buscar por nombre, teléfono o DNI..."
                value={clientSearch}
                onChange={(e) => setClientSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white rounded-xl border border-rose-gold-200 text-xs focus:ring-1 focus:ring-rose-gold-500 outline-none"
              />
            </div>

            {/* Listado */}
            <div className="space-y-2">
              {filteredClients.map((c) => (
                <div
                  key={c.id}
                  className="p-3.5 bg-white rounded-2xl border border-rose-gold-200 shadow-soft space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-xs text-graphite-900">
                        {c.first_name} {c.last_name}
                      </h3>
                      {c.phone && (
                        <p className="text-[11px] text-graphite-500 flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-rose-gold-600" />
                          <span>{c.phone}</span>
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      {c.phone && (
                        <a
                          href={`https://wa.me/${c.phone.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                          title="WhatsApp"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </a>
                      )}
                      <button
                        onClick={() => {
                          openEditClientModal(c);
                          setShowNewClientModal(true);
                        }}
                        className="p-2 rounded-xl bg-silk-100 text-graphite-700 hover:bg-silk-200"
                        title="Editar Ficha"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-silk-100 flex items-center justify-between text-[10px]">
                    <button
                      onClick={() => {
                        setSelectedChartClientId(c.id);
                        setActiveTab('body_charts');
                      }}
                      className="text-rose-gold-700 font-bold hover:underline flex items-center gap-1"
                    >
                      <Activity className="w-3 h-3" />
                      <span>Ficha Corporal</span>
                    </button>
                    <button
                      onClick={() => {
                        setSelectedChartClientId(c.id);
                        setActiveTab('facial_charts');
                      }}
                      className="text-rose-gold-700 font-bold hover:underline flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Ficha Facial</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: NUEVO TURNO                                        */}
        {/* ========================================================= */}
        {activeTab === 'new_appointment' && (
          <div className="max-w-lg mx-auto bg-white p-5 rounded-3xl border border-rose-gold-200 shadow-soft space-y-4">
            <h2 className="font-bold text-sm text-graphite-900 flex items-center gap-2">
              <PlusCircle className="w-4 h-4 text-rose-gold-600" />
              <span>Agendar Nuevo Turno a Distancia</span>
            </h2>

            {formSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-bold text-center animate-fade-in">
                {formSuccess}
              </div>
            )}

            <form onSubmit={handleCreateAppointment} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-graphite-700 mb-1">
                  Cliente *
                </label>
                <div className="flex gap-1.5">
                  <select
                    value={newClientId}
                    onChange={(e) => setNewClientId(e.target.value)}
                    required
                    className="flex-1 p-2 bg-silk-50 rounded-xl border border-rose-gold-200 outline-none text-xs"
                  >
                    <option value="">-- Seleccionar Cliente --</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.first_name} {c.last_name} {c.phone ? `(${c.phone})` : ''}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingClient(null);
                      setShowNewClientModal(true);
                    }}
                    className="px-2.5 py-1.5 bg-rose-gold-100 hover:bg-rose-gold-200 text-rose-gold-900 rounded-xl font-bold text-xs"
                    title="Crear Nuevo Cliente"
                  >
                    + Nuevo
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-graphite-700 mb-1">
                  Servicio / Tratamiento *
                </label>
                <select
                  value={newSubTreatmentId}
                  onChange={(e) => setNewSubTreatmentId(e.target.value)}
                  required
                  className="w-full p-2 bg-silk-50 rounded-xl border border-rose-gold-200 outline-none text-xs"
                >
                  <option value="">-- Seleccionar Servicio --</option>
                  {treatments.map((t) => (
                    <optgroup key={t.id} label={t.name}>
                      {t.sub_treatments?.map((st: any) => (
                        <option key={st.id} value={st.id}>
                          {st.name} — ${Number(st.price || 0).toLocaleString('es-AR')} ({st.duration_minutes}m)
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-graphite-700 mb-1">
                    Fecha *
                  </label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    required
                    className="w-full p-2 bg-silk-50 rounded-xl border border-rose-gold-200 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-graphite-700 mb-1">
                    Hora Inicio *
                  </label>
                  <input
                    type="time"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    required
                    className="w-full p-2 bg-silk-50 rounded-xl border border-rose-gold-200 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-graphite-700 mb-1">
                    Profesional
                  </label>
                  <select
                    value={newStaffId}
                    onChange={(e) => setNewStaffId(e.target.value)}
                    className="w-full p-2 bg-silk-50 rounded-xl border border-rose-gold-200 text-xs"
                  >
                    <option value="">-- Automático --</option>
                    {staff.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.first_name} {s.last_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-graphite-700 mb-1">
                    Box / Cabina
                  </label>
                  <select
                    value={newBoxId}
                    onChange={(e) => setNewBoxId(e.target.value)}
                    className="w-full p-2 bg-silk-50 rounded-xl border border-rose-gold-200 text-xs"
                  >
                    <option value="">-- Automático --</option>
                    {boxes.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-graphite-700 mb-1">
                  Seña Recibida ($)
                </label>
                <input
                  type="number"
                  min="0"
                  step="500"
                  value={newDeposit}
                  onChange={(e) => setNewDeposit(Number(e.target.value))}
                  placeholder="0"
                  className="w-full p-2 bg-silk-50 rounded-xl border border-rose-gold-200 text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-graphite-700 mb-1">
                  Notas / Observaciones
                </label>
                <textarea
                  rows={2}
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Detalles sobre el turno o preferencias..."
                  className="w-full p-2 bg-silk-50 rounded-xl border border-rose-gold-200 text-xs resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-gradient-to-r from-rose-gold-600 to-rose-gold-700 text-white rounded-xl font-bold text-xs shadow-soft hover:shadow-md transition-all active:scale-[0.98]"
              >
                Confirmar y Guardar Turno
              </button>
            </form>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 4: FICHA CORPORAL                                     */}
        {/* ========================================================= */}
        {activeTab === 'body_charts' && (
          <div className="space-y-4 max-w-lg mx-auto bg-white p-4 rounded-3xl border border-rose-gold-200 shadow-soft">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-sm text-graphite-800 flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-rose-gold-600" />
                <span>Ficha Corporal Táctil</span>
              </h2>
              <button
                onClick={() => setBodyPoints([])}
                className="text-[10px] text-rose-gold-700 font-bold hover:underline"
              >
                Limpiar puntos
              </button>
            </div>

            {chartSuccess && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-bold text-center">
                {chartSuccess}
              </div>
            )}

            <div>
              <label className="block text-[10px] font-bold text-graphite-600 mb-1">Cliente:</label>
              <select
                value={selectedChartClientId}
                onChange={(e) => setSelectedChartClientId(e.target.value)}
                className="w-full p-2 bg-silk-50 rounded-xl border border-rose-gold-200 text-xs"
              >
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.first_name} {c.last_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Controles de Vista y Condición */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-graphite-600 mb-1">Vista:</label>
                <div className="flex bg-silk-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setBodyView('front')}
                    className={`flex-1 py-1 rounded-lg font-bold text-[10px] ${
                      bodyView === 'front' ? 'bg-white text-rose-gold-800 shadow-xs' : 'text-graphite-600'
                    }`}
                  >
                    Frente
                  </button>
                  <button
                    type="button"
                    onClick={() => setBodyView('back')}
                    className={`flex-1 py-1 rounded-lg font-bold text-[10px] ${
                      bodyView === 'back' ? 'bg-white text-rose-gold-800 shadow-xs' : 'text-graphite-600'
                    }`}
                  >
                    Espalda
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-graphite-600 mb-1">Condición:</label>
                <select
                  value={bodyCondition}
                  onChange={(e) => setBodyCondition(e.target.value)}
                  className="w-full p-1.5 bg-silk-50 rounded-xl border border-rose-gold-200 text-[11px]"
                >
                  <option value="adiposidad">Adiposidad localizada</option>
                  <option value="celulitis">Celulitis</option>
                  <option value="flacidez">Flacidez</option>
                  <option value="estrias">Estrías</option>
                  <option value="dolor">Tensión / Dolor</option>
                </select>
              </div>
            </div>

            {/* Lienzo Interactivo Corporal */}
            <div className="border border-rose-gold-200 rounded-2xl p-2 bg-silk-50/50 flex flex-col items-center">
              <span className="text-[10px] text-graphite-500 mb-1">
                Toca sobre la silueta para marcar zonas tratadas:
              </span>
              <div
                onClick={handleAddBodyPoint}
                className="relative w-48 h-64 bg-white rounded-xl border border-dashed border-rose-gold-300 flex items-center justify-center cursor-crosshair overflow-hidden shadow-inner"
              >
                {/* Silueta vectorial esquemática */}
                <svg viewBox="0 0 100 150" className="w-full h-full opacity-40">
                  <circle cx="50" cy="20" r="12" fill="#C59B7E" />
                  <path
                    d="M 35,35 Q 50,42 65,35 L 60,85 Q 50,92 40,85 Z"
                    fill="#C59B7E"
                  />
                  <path d="M 40,85 L 36,140 L 45,140 L 48,87 Z" fill="#C59B7E" />
                  <path d="M 60,85 L 64,140 L 55,140 L 52,87 Z" fill="#C59B7E" />
                </svg>

                {/* Marcadores colocados */}
                {bodyPoints
                  .filter((p) => p.view === bodyView)
                  .map((p) => (
                    <div
                      key={p.id}
                      style={{ left: `${p.x}%`, top: `${p.y}%` }}
                      className="absolute -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-rose-gold-600 text-white flex items-center justify-center text-[8px] font-bold shadow-md border-2 border-white"
                      title={p.condition}
                    >
                      ●
                    </div>
                  ))}
              </div>
              <span className="text-[10px] text-graphite-400 mt-1">
                {bodyPoints.filter((p) => p.view === bodyView).length} puntos en vista {bodyView}
              </span>
            </div>

            {/* Medidas Antropométricas */}
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <label className="block text-[10px] text-graphite-600">Cintura (cm)</label>
                <input
                  type="number"
                  value={bodyMeasurements.waist_cm}
                  onChange={(e) => setBodyMeasurements({ ...bodyMeasurements, waist_cm: Number(e.target.value) })}
                  className="w-full p-1.5 bg-silk-50 rounded-xl border border-rose-gold-200 text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-[10px] text-graphite-600">Cadera (cm)</label>
                <input
                  type="number"
                  value={bodyMeasurements.hips_cm}
                  onChange={(e) => setBodyMeasurements({ ...bodyMeasurements, hips_cm: Number(e.target.value) })}
                  className="w-full p-1.5 bg-silk-50 rounded-xl border border-rose-gold-200 text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-[10px] text-graphite-600">Peso (kg)</label>
                <input
                  type="number"
                  value={bodyMeasurements.weight_kg}
                  onChange={(e) => setBodyMeasurements({ ...bodyMeasurements, weight_kg: Number(e.target.value) })}
                  className="w-full p-1.5 bg-silk-50 rounded-xl border border-rose-gold-200 text-xs font-mono"
                />
              </div>
            </div>

            <button
              onClick={handleSaveBodyChart}
              className="w-full py-2.5 bg-gradient-to-r from-rose-gold-600 to-rose-gold-700 text-white rounded-xl font-bold text-xs shadow-soft transition-all"
            >
              Guardar Ficha Corporal en Teléfono
            </button>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 5: FICHA FACIAL                                       */}
        {/* ========================================================= */}
        {activeTab === 'facial_charts' && (
          <div className="space-y-4 max-w-lg mx-auto bg-white p-4 rounded-3xl border border-rose-gold-200 shadow-soft">
            <h2 className="font-bold text-sm text-graphite-800 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-rose-gold-600" />
              <span>Ficha Facial & Cosmetológica</span>
            </h2>

            {chartSuccess && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-bold text-center">
                {chartSuccess}
              </div>
            )}

            <div>
              <label className="block text-[10px] font-bold text-graphite-600 mb-1">Cliente:</label>
              <select
                value={selectedChartClientId}
                onChange={(e) => setSelectedChartClientId(e.target.value)}
                className="w-full p-2 bg-silk-50 rounded-xl border border-rose-gold-200 text-xs"
              >
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.first_name} {c.last_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-graphite-600 mb-1">Tipo de Piel:</label>
                <select
                  value={facialSkinType}
                  onChange={(e) => setFacialSkinType(e.target.value)}
                  className="w-full p-2 bg-silk-50 rounded-xl border border-rose-gold-200 text-xs"
                >
                  <option value="normal">Normal / Equilibrada</option>
                  <option value="seca">Seca / Alípica</option>
                  <option value="grasa">Grasa / Seborreica</option>
                  <option value="mixta">Mixta</option>
                  <option value="sensible">Sensible / Reactiva</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-graphite-600 mb-1">Fototipo (Fitzpatrick):</label>
                <select
                  value={facialPhototype}
                  onChange={(e) => setFacialPhototype(e.target.value)}
                  className="w-full p-2 bg-silk-50 rounded-xl border border-rose-gold-200 text-xs font-mono"
                >
                  <option value="I">Fototipo I (Muy clara)</option>
                  <option value="II">Fototipo II (Clara)</option>
                  <option value="III">Fototipo III (Media)</option>
                  <option value="IV">Fototipo IV (Mediterránea)</option>
                  <option value="V">Fototipo V (Oscura)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-graphite-600 mb-1">Diagnóstico y Observaciones:</label>
              <textarea
                rows={3}
                value={facialNotes}
                onChange={(e) => setFacialNotes(e.target.value)}
                placeholder="Poros dilatados, comedones en zona T, hidratación requerida..."
                className="w-full p-2 bg-silk-50 rounded-xl border border-rose-gold-200 text-xs resize-none"
              />
            </div>

            <button
              onClick={handleSaveFacialChart}
              className="w-full py-2.5 bg-gradient-to-r from-rose-gold-600 to-rose-gold-700 text-white rounded-xl font-bold text-xs shadow-soft transition-all"
            >
              Guardar Ficha Facial en Teléfono
            </button>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 6: PERSONAL & COMISIONES                              */}
        {/* ========================================================= */}
        {activeTab === 'staff' && (
          <div className="space-y-4 max-w-lg mx-auto">
            <h2 className="font-bold text-sm text-graphite-800 flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-rose-gold-600" />
              <span>Personal & Profesionales ({staff.length})</span>
            </h2>

            <div className="space-y-2.5">
              {staff.map((s) => {
                // Calcular turnos asignados hoy
                const staffDayAppts = dayAppointments.filter((a) => a.staff_id === s.id);
                const totalCharged = staffDayAppts.reduce((sum, a) => sum + Number(a.service_price || 0), 0);
                const estimatedComm = totalCharged * 0.3; // 30% promedio

                return (
                  <div key={s.id} className="p-3.5 bg-white rounded-2xl border border-rose-gold-200 shadow-soft space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: s.color_code || '#C59B7E' }}
                        />
                        <h3 className="font-bold text-xs text-graphite-900">
                          {s.first_name} {s.last_name}
                        </h3>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-silk-100 text-graphite-700 border border-rose-gold-200">
                        {s.role || 'Profesional'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-silk-100 text-[11px]">
                      <div>
                        <span className="text-graphite-500 block text-[10px]">Turnos hoy:</span>
                        <span className="font-bold text-graphite-800">{staffDayAppts.length} citas</span>
                      </div>
                      <div>
                        <span className="text-graphite-500 block text-[10px]">Prod. Estimada:</span>
                        <span className="font-mono font-bold text-emerald-700">
                          ${totalCharged.toLocaleString('es-AR')}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 7: PRECIOS Y TRATAMIENTOS                             */}
        {/* ========================================================= */}
        {activeTab === 'treatments' && (
          <div className="space-y-4 max-w-lg mx-auto">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-bold text-sm text-graphite-800">Precios y Tratamientos</h2>
                <p className="text-[11px] text-graphite-500">
                  Modifica precios al instante desde tu teléfono
                </p>
              </div>
              <button
                onClick={() => setShowNewServiceModal(true)}
                className="px-3 py-1.5 bg-rose-gold-600 hover:bg-rose-gold-700 text-white rounded-xl text-xs font-bold shadow-soft flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nuevo</span>
              </button>
            </div>

            <div className="space-y-3">
              {treatments.map((t) => (
                <div key={t.id} className="bg-white p-3.5 rounded-2xl border border-rose-gold-200 shadow-soft space-y-2">
                  <div className="flex items-center gap-2 border-b border-silk-200 pb-1.5">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: t.color_code || '#C59B7E' }}
                    />
                    <h3 className="font-bold text-xs text-graphite-900">{t.name}</h3>
                  </div>

                  <div className="space-y-2">
                    {t.sub_treatments?.map((st: any) => (
                      <div
                        key={st.id}
                        className="p-2.5 bg-silk-50/60 rounded-xl border border-rose-gold-100 flex items-center justify-between"
                      >
                        <div>
                          <h4 className="font-bold text-xs text-graphite-800">{st.name}</h4>
                          <span className="text-[10px] text-graphite-500">
                            {st.duration_minutes} minutos
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-graphite-900">
                            ${Number(st.price || 0).toLocaleString('es-AR')}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingPriceItem(st);
                              setNewPriceValue(st.price || 0);
                            }}
                            className="p-1.5 rounded-lg bg-white border border-rose-gold-200 text-rose-gold-700 hover:bg-rose-gold-50 shadow-xs flex items-center gap-1 text-[11px] font-bold"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>Editar</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 8: BOXES & CABINAS                                    */}
        {/* ========================================================= */}
        {activeTab === 'boxes' && (
          <div className="space-y-4 max-w-lg mx-auto">
            <h2 className="font-bold text-sm text-graphite-800 flex items-center gap-1.5">
              <LayoutGrid className="w-4 h-4 text-rose-gold-600" />
              <span>Boxes & Cabinas ({boxes.length})</span>
            </h2>

            <div className="grid grid-cols-2 gap-2.5">
              {boxes.map((b) => {
                const boxDayAppts = dayAppointments.filter((a) => a.box_id === b.id);
                return (
                  <div key={b.id} className="p-3 bg-white rounded-2xl border border-rose-gold-200 shadow-soft space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: b.color_code || '#C59B7E' }}
                      />
                      <h3 className="font-bold text-xs text-graphite-900 truncate">{b.name}</h3>
                    </div>
                    <p className="text-[10px] text-graphite-500">
                      {boxDayAppts.length} turnos programados hoy
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 9: STOCK & PRODUCTOS                                  */}
        {/* ========================================================= */}
        {activeTab === 'products' && (
          <div className="space-y-4 max-w-lg mx-auto">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-bold text-sm text-graphite-800">Stock & Insumos</h2>
                <p className="text-[11px] text-graphite-500">Control de inventario en tiempo real</p>
              </div>
              <button
                onClick={() => setShowNewProductModal(true)}
                className="px-3 py-1.5 bg-rose-gold-600 hover:bg-rose-gold-700 text-white rounded-xl text-xs font-bold shadow-soft flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nuevo</span>
              </button>
            </div>

            {/* Buscador de productos */}
            <div className="relative">
              <Search className="w-4 h-4 text-graphite-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Buscar por nombre de producto..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white rounded-xl border border-rose-gold-200 text-xs focus:ring-1 focus:ring-rose-gold-500 outline-none"
              />
            </div>

            <div className="space-y-2">
              {filteredProducts.map((p) => {
                const isLowStock = Number(p.stock_quantity || 0) <= Number(p.min_stock_alert || 3);
                return (
                  <div key={p.id} className="p-3 bg-white rounded-2xl border border-rose-gold-200 shadow-soft flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-bold text-xs text-graphite-900">{p.name}</h3>
                        {isLowStock && (
                          <span className="px-1.5 py-0.2 rounded bg-rose-100 text-rose-800 text-[9px] font-bold">
                            Bajo Stock
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-graphite-500 mt-0.5 font-mono">
                        <span>Venta: ${Number(p.sale_price || 0).toLocaleString('es-AR')}</span>
                        <span>•</span>
                        <span className="font-bold text-graphite-800">Stock: {p.stock_quantity || 0}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleQuickAdjustStock(p, -1)}
                        className="w-7 h-7 rounded-xl bg-silk-100 hover:bg-silk-200 text-graphite-700 font-bold flex items-center justify-center text-xs"
                        title="Restar 1 unidad"
                      >
                        -
                      </button>
                      <button
                        onClick={() => handleQuickAdjustStock(p, 1)}
                        className="w-7 h-7 rounded-xl bg-silk-100 hover:bg-silk-200 text-graphite-700 font-bold flex items-center justify-center text-xs"
                        title="Sumar 1 unidad"
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 10: CAJA & FACTURACIÓN                                */}
        {/* ========================================================= */}
        {activeTab === 'cash' && (
          <div className="space-y-4 max-w-lg mx-auto">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-bold text-sm text-graphite-800">Caja & Facturación</h2>
                <p className="text-[11px] text-graphite-500">Balance y control diario de ingresos</p>
              </div>
              <button
                onClick={() => setShowNewCashMovementModal(true)}
                className="px-3 py-1.5 bg-rose-gold-600 hover:bg-rose-gold-700 text-white rounded-xl text-xs font-bold shadow-soft flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Movimiento</span>
              </button>
            </div>

            {/* Resumen de Caja */}
            {(() => {
              const activeShift = cashShifts.find((s) => s.status === 'open') || cashShifts[0];
              const incomes = cashTransactions.filter((t) => t.type === 'income').reduce((sum, t) => sum + Number(t.amount || 0), 0);
              const expenses = cashTransactions.filter((t) => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount || 0), 0);
              const netTotal = (activeShift?.initial_cash || 0) + incomes - expenses;

              return (
                <div className="p-4 bg-gradient-to-r from-rose-gold-700 to-rose-gold-800 text-white rounded-3xl shadow-md space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-white/80 uppercase tracking-wider">
                      Estado: {activeShift?.status === 'open' ? '🟢 Caja Abierta' : '🔴 Caja Cerrada'}
                    </span>
                    <span className="text-[10px] font-mono text-white/70">
                      Inicio: ${Number(activeShift?.initial_cash || 0).toLocaleString('es-AR')}
                    </span>
                  </div>

                  <div>
                    <span className="text-[11px] text-white/80">Total Disponible en Caja:</span>
                    <h3 className="text-2xl font-bold font-mono tracking-tight">
                      ${netTotal.toLocaleString('es-AR')}
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/20 text-xs">
                    <div className="flex items-center gap-1.5 text-emerald-200">
                      <ArrowDownLeft className="w-4 h-4" />
                      <span>Ingresos: ${incomes.toLocaleString('es-AR')}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-rose-200">
                      <ArrowUpRight className="w-4 h-4" />
                      <span>Egresos: ${expenses.toLocaleString('es-AR')}</span>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Últimos movimientos de caja */}
            <div className="space-y-2">
              <h3 className="font-bold text-xs text-graphite-700 uppercase tracking-wider">
                Movimientos Recientes ({cashTransactions.length})
              </h3>
              {cashTransactions.slice(0, 15).map((t) => (
                <div key={t.id} className="p-3 bg-white rounded-2xl border border-rose-gold-200 shadow-soft flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-xs text-graphite-900">{t.description || 'Movimiento'}</h4>
                    <span className="text-[10px] text-graphite-500 capitalize">
                      {t.payment_method} • {t.category || 'general'}
                    </span>
                  </div>
                  <span
                    className={`font-mono font-bold text-xs ${
                      t.type === 'income' ? 'text-emerald-700' : 'text-rose-700'
                    }`}
                  >
                    {t.type === 'income' ? '+' : '-'}${Number(t.amount || 0).toLocaleString('es-AR')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 11: MARKETING & WHATSAPP                              */}
        {/* ========================================================= */}
        {activeTab === 'marketing' && (
          <div className="space-y-4 max-w-lg mx-auto bg-white p-5 rounded-3xl border border-rose-gold-200 shadow-soft">
            <div>
              <h2 className="font-bold text-sm text-graphite-800 flex items-center gap-1.5">
                <Share2 className="w-4 h-4 text-rose-gold-600" />
                <span>Marketing & Envíos WhatsApp</span>
              </h2>
              <p className="text-[11px] text-graphite-500 mt-0.5">
                Envía mensajes directos a tus clientes en un solo toque
              </p>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-graphite-700 mb-1">
                Seleccionar Cliente:
              </label>
              <select
                value={selectedMarketingClient?.id || ''}
                onChange={(e) => {
                  const c = clients.find((cli) => cli.id === e.target.value);
                  setSelectedMarketingClient(c || null);
                }}
                className="w-full p-2 bg-silk-50 rounded-xl border border-rose-gold-200 text-xs"
              >
                <option value="">-- Elige un cliente --</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.first_name} {c.last_name} {c.phone ? `(${c.phone})` : '• Sin teléfono'}
                  </option>
                ))}
              </select>
            </div>

            {selectedMarketingClient ? (
              <div className="space-y-2.5 pt-2 border-t border-silk-200">
                <h3 className="font-bold text-xs text-graphite-800">Plantillas Rápidas:</h3>
                <div className="grid grid-cols-1 gap-2">
                  <button
                    onClick={() => handleSendWhatsAppTemplate(selectedMarketingClient, 'reminder')}
                    className="p-3 bg-silk-50 hover:bg-silk-100 rounded-xl border border-rose-gold-200 text-left text-xs space-y-0.5"
                  >
                    <span className="font-bold text-rose-gold-900 block">📅 Recordatorio de Turno</span>
                    <span className="text-[10px] text-graphite-500">Recordatorio cordial solicitando confirmación</span>
                  </button>

                  <button
                    onClick={() => handleSendWhatsAppTemplate(selectedMarketingClient, 'thanks')}
                    className="p-3 bg-silk-50 hover:bg-silk-100 rounded-xl border border-rose-gold-200 text-left text-xs space-y-0.5"
                  >
                    <span className="font-bold text-emerald-900 block">💖 Agradecimiento por Visita</span>
                    <span className="text-[10px] text-graphite-500">Mensaje de fidelización pos-tratamiento</span>
                  </button>

                  <button
                    onClick={() => handleSendWhatsAppTemplate(selectedMarketingClient, 'birthday')}
                    className="p-3 bg-silk-50 hover:bg-silk-100 rounded-xl border border-rose-gold-200 text-left text-xs space-y-0.5"
                  >
                    <span className="font-bold text-amber-900 block">🎂 Saludo de Cumpleaños</span>
                    <span className="text-[10px] text-graphite-500">Felicitación con beneficio promocional</span>
                  </button>

                  <button
                    onClick={() => handleSendWhatsAppTemplate(selectedMarketingClient, 'promo')}
                    className="p-3 bg-silk-50 hover:bg-silk-100 rounded-xl border border-rose-gold-200 text-left text-xs space-y-0.5"
                  >
                    <span className="font-bold text-purple-900 block">✨ Promoción de Temporada</span>
                    <span className="text-[10px] text-graphite-500">Invitación a nuevos tratamientos y ofertas</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center text-graphite-400 text-xs italic">
                Selecciona un cliente arriba para enviar mensajes de WhatsApp.
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 12: SINCRONIZACIÓN & RESPALDO                         */}
        {/* ========================================================= */}
        {activeTab === 'sync' && (
          <div className="space-y-4 max-w-lg mx-auto">
            <div className="bg-white p-5 rounded-3xl border border-rose-gold-200 shadow-soft space-y-3 text-center">
              <div
                className={`w-12 h-12 mx-auto rounded-2xl flex items-center justify-center ${
                  isOnline ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                }`}
              >
                {isOnline ? <Wifi className="w-6 h-6" /> : <WifiOff className="w-6 h-6" />}
              </div>

              <div>
                <h2 className="font-bold text-sm text-graphite-900">
                  {isOnline ? 'Servidor PC Conectado y En Línea' : 'Trabajando Fuera de Línea'}
                </h2>
                <p className="text-[11px] text-graphite-500 mt-0.5">
                  {isOnline
                    ? 'Tus cambios se sincronizan en tiempo real con la computadora.'
                    : 'La app funciona con la base de datos de respaldo guardada en este teléfono.'}
                </p>
              </div>

              <div className="p-3 bg-silk-50 rounded-2xl border border-rose-gold-200/60 text-[11px] text-graphite-600 space-y-1">
                <div className="flex justify-between">
                  <span>Cambios locales pendientes:</span>
                  <span className="font-mono font-bold text-graphite-900">{pendingCount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Última sincronización:</span>
                  <span className="font-mono font-bold text-graphite-900">
                    {lastSyncedAt ? new Date(lastSyncedAt).toLocaleTimeString('es-AR') : 'Recién iniciado'}
                  </span>
                </div>
              </div>

              <button
                onClick={handleManualSync}
                disabled={isSyncing}
                className="w-full py-2.5 bg-rose-gold-600 hover:bg-rose-gold-700 text-white rounded-xl font-bold text-xs shadow-soft flex items-center justify-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Sincronizando...' : 'Forzar Sincronización Ahora'}</span>
              </button>

              {/* Descargar Respaldo JSON Local */}
              <button
                onClick={() => offlineStorage.downloadBackupJson()}
                className="w-full py-2 bg-silk-100 hover:bg-silk-200 text-rose-gold-900 border border-rose-gold-200 rounded-xl font-bold text-xs shadow-xs flex items-center justify-center gap-2 transition-colors"
              >
                <Download className="w-4 h-4 text-rose-gold-700" />
                <span>Descargar Copia de Respaldo Local (.json)</span>
              </button>

              {/* Botón para ver portal de descarga e instalación */}
              <button
                onClick={() => setActiveTab('download')}
                className="w-full py-2 bg-white hover:bg-silk-50 text-graphite-700 border border-rose-gold-200 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors"
              >
                <Smartphone className="w-4 h-4 text-rose-gold-700" />
                <span>Ver Portal de Descarga e Instalación</span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* ========================================================= */}
      {/* MENÚ DESLIZANTE LATERAL (DRAWER CON TODOS LOS MÓDULOS)     */}
      {/* ========================================================= */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-graphite-950/70 backdrop-blur-xs flex justify-start animate-fade-in">
          <div className="w-72 bg-white h-full flex flex-col justify-between p-4 shadow-2xl border-r border-rose-gold-200 overflow-y-auto">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-silk-200">
                <div className="flex items-center gap-2.5">
                  <HikariLogo size={28} />
                  <div>
                    <h3 className="font-serif font-bold text-sm text-graphite-900">Hikari Suite</h3>
                    <span className="text-[10px] text-rose-gold-700 font-semibold">Todas las Funciones</span>
                  </div>
                </div>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-1 rounded-full text-graphite-400 hover:text-graphite-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-1 text-xs">
                {[
                  { key: 'agenda', label: 'Agenda & Boxes', icon: Calendar },
                  { key: 'clients', label: 'Clientes & Fichas', icon: Users },
                  { key: 'new_appointment', label: 'Nuevo Turno', icon: PlusCircle },
                  { key: 'body_charts', label: 'Ficha Corporal', icon: Activity },
                  { key: 'facial_charts', label: 'Ficha Facial', icon: Sparkles },
                  { key: 'staff', label: 'Personal & Comisiones', icon: UserCheck },
                  { key: 'treatments', label: 'Tratamientos & Precios', icon: Tag },
                  { key: 'boxes', label: 'Boxes & Cabinas', icon: LayoutGrid },
                  { key: 'products', label: 'Stock & Insumos', icon: Package },
                  { key: 'cash', label: 'Caja & Facturación', icon: DollarSign },
                  { key: 'marketing', label: 'Marketing WhatsApp', icon: Share2 },
                  { key: 'sync', label: 'Sincronización & Respaldo', icon: RefreshCw },
                  { key: 'download', label: 'Descargar / Instalar App', icon: Smartphone },
                ].map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.key;
                  return (
                    <button
                      key={item.key}
                      onClick={() => {
                        setActiveTab(item.key as MobileTab);
                        setIsDrawerOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all font-medium ${
                        isActive
                          ? 'bg-rose-gold-100 text-rose-gold-900 font-bold border border-rose-gold-300'
                          : 'text-graphite-700 hover:bg-silk-100'
                      }`}
                    >
                      <Icon className="w-4 h-4 text-rose-gold-700" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 border-t border-silk-200 text-[10px] text-graphite-500 text-center">
              Hikari Suite Mobile • v1.0.15
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: EDITAR TURNO / CITA                                */}
      {/* ========================================================= */}
      {editingAppointment && (
        <div className="fixed inset-0 z-50 bg-graphite-950/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-md w-full p-5 border border-rose-gold-200 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-silk-200 pb-2">
              <h3 className="font-serif font-bold text-sm text-graphite-900">
                Editar Cita: {editingAppointment.client?.first_name} {editingAppointment.client?.last_name}
              </h3>
              <button
                onClick={() => setEditingAppointment(null)}
                className="p-1 rounded-full text-graphite-400 hover:text-graphite-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditAppointment} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-graphite-700 mb-1">
                    Hora Inicio
                  </label>
                  <input
                    type="time"
                    value={editStartTime}
                    onChange={(e) => setEditStartTime(e.target.value)}
                    required
                    className="w-full p-2 bg-silk-50 rounded-xl border border-rose-gold-200 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-graphite-700 mb-1">
                    Estado
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full p-2 bg-silk-50 rounded-xl border border-rose-gold-200 text-xs"
                  >
                    <option value="scheduled">Agendado</option>
                    <option value="in_progress">En Curso</option>
                    <option value="completed">Cobrado / Listo</option>
                    <option value="cancelled">Cancelado</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-graphite-700 mb-1">
                    Profesional
                  </label>
                  <select
                    value={editStaffId}
                    onChange={(e) => setEditStaffId(e.target.value)}
                    className="w-full p-2 bg-silk-50 rounded-xl border border-rose-gold-200 text-xs"
                  >
                    <option value="">-- Sin asignar --</option>
                    {staff.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.first_name} {s.last_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-graphite-700 mb-1">
                    Box
                  </label>
                  <select
                    value={editBoxId}
                    onChange={(e) => setEditBoxId(e.target.value)}
                    className="w-full p-2 bg-silk-50 rounded-xl border border-rose-gold-200 text-xs"
                  >
                    <option value="">-- General --</option>
                    {boxes.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-graphite-700 mb-1">
                    Precio Total ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editPrice}
                    onChange={(e) => setEditPrice(Number(e.target.value))}
                    className="w-full p-2 bg-silk-50 rounded-xl border border-rose-gold-200 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-graphite-700 mb-1">
                    Seña Recibida ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editDeposit}
                    onChange={(e) => setEditDeposit(Number(e.target.value))}
                    className="w-full p-2 bg-silk-50 rounded-xl border border-rose-gold-200 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-graphite-700 mb-1">
                  Notas
                </label>
                <textarea
                  rows={2}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full p-2 bg-silk-50 rounded-xl border border-rose-gold-200 text-xs resize-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingAppointment(null)}
                  className="flex-1 py-2.5 bg-silk-100 text-graphite-700 rounded-xl font-bold text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-rose-gold-600 hover:bg-rose-gold-700 text-white rounded-xl font-bold text-xs shadow-soft"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: NUEVO / EDITAR CLIENTE                             */}
      {/* ========================================================= */}
      {showNewClientModal && (
        <div className="fixed inset-0 z-50 bg-graphite-950/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-md w-full p-5 border border-rose-gold-200 shadow-2xl space-y-3">
            <div className="flex items-center justify-between border-b border-silk-200 pb-2">
              <h3 className="font-serif font-bold text-sm text-graphite-900">
                {editingClient ? 'Editar Ficha de Cliente' : 'Nuevo Cliente'}
              </h3>
              <button
                onClick={() => setShowNewClientModal(false)}
                className="p-1 rounded-full text-graphite-400 hover:text-graphite-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveClient} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-graphite-700 mb-1">Nombre *</label>
                  <input
                    type="text"
                    required
                    value={clientFirst}
                    onChange={(e) => setClientFirst(e.target.value)}
                    className="w-full p-2 bg-silk-50 rounded-xl border border-rose-gold-200 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-graphite-700 mb-1">Apellido</label>
                  <input
                    type="text"
                    value={clientLast}
                    onChange={(e) => setClientLast(e.target.value)}
                    className="w-full p-2 bg-silk-50 rounded-xl border border-rose-gold-200 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-graphite-700 mb-1">Teléfono / WhatsApp</label>
                <input
                  type="tel"
                  placeholder="Ej: 11 5555 5555"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  className="w-full p-2 bg-silk-50 rounded-xl border border-rose-gold-200 text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-graphite-700 mb-1">Email</label>
                <input
                  type="email"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  className="w-full p-2 bg-silk-50 rounded-xl border border-rose-gold-200 text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-graphite-700 mb-1">Observaciones</label>
                <textarea
                  rows={2}
                  value={clientNotes}
                  onChange={(e) => setClientNotes(e.target.value)}
                  className="w-full p-2 bg-silk-50 rounded-xl border border-rose-gold-200 text-xs resize-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewClientModal(false)}
                  className="flex-1 py-2.5 bg-silk-100 text-graphite-700 rounded-xl font-bold text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-rose-gold-600 hover:bg-rose-gold-700 text-white rounded-xl font-bold text-xs shadow-soft"
                >
                  Guardar Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: EDITAR PRECIO EN VIVO                              */}
      {/* ========================================================= */}
      {editingPriceItem && (
        <div className="fixed inset-0 z-50 bg-graphite-950/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-sm w-full p-5 border border-rose-gold-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-silk-200 pb-2">
              <h3 className="font-serif font-bold text-sm text-graphite-900">
                Modificar Precio
              </h3>
              <button
                onClick={() => setEditingPriceItem(null)}
                className="p-1 rounded-full text-graphite-400 hover:text-graphite-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] text-graphite-500">Servicio seleccionado:</span>
              <p className="font-bold text-sm text-graphite-800">{editingPriceItem.name}</p>
            </div>

            <form onSubmit={handleSavePriceUpdate} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-graphite-700 mb-1">
                  Nuevo Precio ($)
                </label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  required
                  value={newPriceValue}
                  onChange={(e) => setNewPriceValue(Number(e.target.value))}
                  className="w-full p-2.5 bg-silk-50 rounded-xl border border-rose-gold-300 font-mono font-bold text-sm outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingPriceItem(null)}
                  className="flex-1 py-2.5 bg-silk-100 text-graphite-700 rounded-xl font-bold text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-rose-gold-600 hover:bg-rose-gold-700 text-white rounded-xl font-bold text-xs shadow-soft"
                >
                  Actualizar Precio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: NUEVO SERVICIO                                     */}
      {/* ========================================================= */}
      {showNewServiceModal && (
        <div className="fixed inset-0 z-50 bg-graphite-950/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-md w-full p-5 border border-rose-gold-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-silk-200 pb-2">
              <h3 className="font-serif font-bold text-sm text-graphite-900">
                Nuevo Servicio / Tratamiento
              </h3>
              <button
                onClick={() => setShowNewServiceModal(false)}
                className="p-1 rounded-full text-graphite-400 hover:text-graphite-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNewService} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-graphite-700 mb-1">
                  Categoría / Tratamiento *
                </label>
                <select
                  value={newServiceTreatmentId}
                  onChange={(e) => setNewServiceTreatmentId(e.target.value)}
                  required
                  className="w-full p-2 bg-silk-50 rounded-xl border border-rose-gold-200 text-xs"
                >
                  {treatments.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-graphite-700 mb-1">
                  Nombre del Servicio *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Limpieza Profunda con Punta de Diamante"
                  value={newServiceName}
                  onChange={(e) => setNewServiceName(e.target.value)}
                  className="w-full p-2 bg-silk-50 rounded-xl border border-rose-gold-200 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-graphite-700 mb-1">
                    Precio ($) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    required
                    value={newServicePrice}
                    onChange={(e) => setNewServicePrice(Number(e.target.value))}
                    className="w-full p-2 bg-silk-50 rounded-xl border border-rose-gold-200 text-xs font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-graphite-700 mb-1">
                    Duración (min) *
                  </label>
                  <input
                    type="number"
                    min="10"
                    step="5"
                    required
                    value={newServiceDuration}
                    onChange={(e) => setNewServiceDuration(Number(e.target.value))}
                    className="w-full p-2 bg-silk-50 rounded-xl border border-rose-gold-200 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewServiceModal(false)}
                  className="flex-1 py-2.5 bg-silk-100 text-graphite-700 rounded-xl font-bold text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-rose-gold-600 hover:bg-rose-gold-700 text-white rounded-xl font-bold text-xs shadow-soft"
                >
                  Guardar Servicio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: NUEVO PRODUCTO                                     */}
      {/* ========================================================= */}
      {showNewProductModal && (
        <div className="fixed inset-0 z-50 bg-graphite-950/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-md w-full p-5 border border-rose-gold-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-silk-200 pb-2">
              <h3 className="font-serif font-bold text-sm text-graphite-900">
                Nuevo Producto / Insumo
              </h3>
              <button
                onClick={() => setShowNewProductModal(false)}
                className="p-1 rounded-full text-graphite-400 hover:text-graphite-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-graphite-700 mb-1">Nombre *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Crema Hidratante Facial con Ácido Hialurónico"
                  value={newProductName}
                  onChange={(e) => setNewProductName(e.target.value)}
                  className="w-full p-2 bg-silk-50 rounded-xl border border-rose-gold-200 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-graphite-700 mb-1">Precio Venta ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={newProductSalePrice}
                    onChange={(e) => setNewProductSalePrice(Number(e.target.value))}
                    className="w-full p-2 bg-silk-50 rounded-xl border border-rose-gold-200 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-graphite-700 mb-1">Stock Inicial</label>
                  <input
                    type="number"
                    min="0"
                    value={newProductStock}
                    onChange={(e) => setNewProductStock(Number(e.target.value))}
                    className="w-full p-2 bg-silk-50 rounded-xl border border-rose-gold-200 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewProductModal(false)}
                  className="flex-1 py-2.5 bg-silk-100 text-graphite-700 rounded-xl font-bold text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-rose-gold-600 hover:bg-rose-gold-700 text-white rounded-xl font-bold text-xs shadow-soft"
                >
                  Guardar Producto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: MOVIMIENTO DE CAJA                                 */}
      {/* ========================================================= */}
      {showNewCashMovementModal && (
        <div className="fixed inset-0 z-50 bg-graphite-950/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-md w-full p-5 border border-rose-gold-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-silk-200 pb-2">
              <h3 className="font-serif font-bold text-sm text-graphite-900">
                Registrar Movimiento de Caja
              </h3>
              <button
                onClick={() => setShowNewCashMovementModal(false)}
                className="p-1 rounded-full text-graphite-400 hover:text-graphite-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCashMovement} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setCashMovementType('income')}
                  className={`py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 ${
                    cashMovementType === 'income'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-silk-100 text-graphite-600'
                  }`}
                >
                  <ArrowDownLeft className="w-4 h-4" />
                  <span>Ingreso (+)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCashMovementType('expense')}
                  className={`py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 ${
                    cashMovementType === 'expense'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-silk-100 text-graphite-600'
                  }`}
                >
                  <ArrowUpRight className="w-4 h-4" />
                  <span>Egreso (-)</span>
                </button>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-graphite-700 mb-1">Monto ($) *</label>
                <input
                  type="number"
                  min="1"
                  step="500"
                  required
                  value={cashMovementAmount || ''}
                  onChange={(e) => setCashMovementAmount(Number(e.target.value))}
                  placeholder="0"
                  className="w-full p-2.5 bg-silk-50 rounded-xl border border-rose-gold-200 font-mono font-bold text-sm outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-graphite-700 mb-1">Medio de Pago</label>
                <select
                  value={cashMovementMethod}
                  onChange={(e) => setCashMovementMethod(e.target.value)}
                  className="w-full p-2 bg-silk-50 rounded-xl border border-rose-gold-200 text-xs"
                >
                  <option value="cash">Efectivo</option>
                  <option value="card_debit">Tarjeta Débito</option>
                  <option value="card_credit">Tarjeta Crédito</option>
                  <option value="transfer">Transferencia</option>
                  <option value="qr_mercadopago">Mercado Pago / QR</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-graphite-700 mb-1">Descripción / Concepto</label>
                <input
                  type="text"
                  placeholder="Ej: Pago de insumos, adelanto, etc."
                  value={cashMovementDesc}
                  onChange={(e) => setCashMovementDesc(e.target.value)}
                  className="w-full p-2 bg-silk-50 rounded-xl border border-rose-gold-200 text-xs"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewCashMovementModal(false)}
                  className="flex-1 py-2.5 bg-silk-100 text-graphite-700 rounded-xl font-bold text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-rose-gold-600 hover:bg-rose-gold-700 text-white rounded-xl font-bold text-xs shadow-soft"
                >
                  Confirmar Movimiento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* NAVEGACIÓN INFERIOR (BOTTOM BAR)                          */}
      {/* ========================================================= */}
      <nav className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-rose-gold-200/80 px-2 py-2 flex items-center justify-around shadow-lg z-40">
        <button
          onClick={() => setActiveTab('agenda')}
          className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all ${
            activeTab === 'agenda'
              ? 'text-rose-gold-700 font-bold'
              : 'text-graphite-400 hover:text-graphite-700'
          }`}
        >
          <Calendar className="w-5 h-5" />
          <span className="text-[10px]">Agenda</span>
        </button>

        <button
          onClick={() => setActiveTab('clients')}
          className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all ${
            activeTab === 'clients'
              ? 'text-rose-gold-700 font-bold'
              : 'text-graphite-400 hover:text-graphite-700'
          }`}
        >
          <Users className="w-5 h-5" />
          <span className="text-[10px]">Clientes</span>
        </button>

        <button
          onClick={() => setActiveTab('new_appointment')}
          className="flex flex-col items-center -mt-5"
        >
          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-rose-gold-600 to-rose-gold-700 text-white flex items-center justify-center shadow-lg border-2 border-white hover:scale-105 active:scale-95 transition-all">
            <Plus className="w-6 h-6" />
          </div>
          <span className="text-[10px] font-bold text-rose-gold-700 mt-1">Nuevo</span>
        </button>

        <button
          onClick={() => setActiveTab('cash')}
          className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all ${
            activeTab === 'cash'
              ? 'text-rose-gold-700 font-bold'
              : 'text-graphite-400 hover:text-graphite-700'
          }`}
        >
          <DollarSign className="w-5 h-5" />
          <span className="text-[10px]">Caja</span>
        </button>

        <button
          onClick={() => setIsDrawerOpen(true)}
          className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all ${
            isDrawerOpen
              ? 'text-rose-gold-700 font-bold'
              : 'text-graphite-400 hover:text-graphite-700'
          }`}
        >
          <Menu className="w-5 h-5" />
          <span className="text-[10px]">Módulos</span>
        </button>
      </nav>
    </div>
  );
};
