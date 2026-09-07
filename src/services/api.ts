import {
  Client, Staff, Box, Treatment, SubTreatment, Appointment,
  CartItem, BodyChart, FacialChart, InformedConsent, Product,
  CashRegisterShift, CashTransaction, StaffCommission,
  MarketingMedia, MarketingPost, BackupItem, BackupConfig
} from '../types';

const API_BASE = '/api';

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(errorData.error || `Error ${res.status}: ${res.statusText}`);
  }

  return res.json();
}

export const api = {
  // Info & Red
  getInfo: () => request<{ status: string; localIp: string; port: number; staffPortalUrl: string }>('/info'),

  // Clientes
  getClients: (search?: string) => request<Client[]>(`/clients${search ? `?search=${encodeURIComponent(search)}` : ''}`),
  getClientById: (id: string) => request<Client & { appointments: any[]; bodyCharts: BodyChart[]; facialCharts: FacialChart[]; informedConsents: InformedConsent[] }>(`/clients/${id}`),
  createClient: (data: Partial<Client>) => request<Client>('/clients', { method: 'POST', body: JSON.stringify(data) }),
  updateClient: (id: string, data: Partial<Client>) => request<Client>(`/clients/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteClient: (id: string) => request<{ success: boolean }>(`/clients/${id}`, { method: 'DELETE' }),

  // Personal / Staff
  getStaff: () => request<Staff[]>('/staff'),
  getStaffByToken: (token: string) => request<any>(`/staff/by-token/${token}`),
  verifyStaffPin: (token: string, pin: string) => request<any>('/staff/verify-pin', { method: 'POST', body: JSON.stringify({ token, pin }) }),
  createStaff: (data: any) => request<Staff>('/staff', { method: 'POST', body: JSON.stringify(data) }),
  updateStaff: (id: string, data: any) => request<Staff>(`/staff/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteStaff: (id: string) => request<{ success: boolean }>(`/staff/${id}`, { method: 'DELETE' }),
  regenerateStaffQr: (id: string) => request<{ success: boolean; new_token: string }>(`/staff/${id}/regenerate-qr`, { method: 'POST' }),

  // Boxes
  getBoxes: () => request<Box[]>('/boxes'),
  createBox: (data: Partial<Box>) => request<Box>('/boxes', { method: 'POST', body: JSON.stringify(data) }),
  updateBox: (id: string, data: Partial<Box>) => request<Box>(`/boxes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteBox: (id: string) => request<{ success: boolean }>(`/boxes/${id}`, { method: 'DELETE' }),

  // Tratamientos y Sub-tratamientos
  getTreatments: () => request<Treatment[]>('/treatments'),
  createTreatment: (data: Partial<Treatment>) => request<Treatment>('/treatments', { method: 'POST', body: JSON.stringify(data) }),
  updateTreatment: (id: string, data: Partial<Treatment>) => request<Treatment>(`/treatments/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteTreatment: (id: string) => request<{ success: boolean }>(`/treatments/${id}`, { method: 'DELETE' }),
  createSubTreatment: (treatmentId: string, data: any) => request<SubTreatment>(`/treatments/${treatmentId}/sub-treatments`, { method: 'POST', body: JSON.stringify(data) }),
  updateSubTreatment: (subId: string, data: any) => request<SubTreatment>(`/treatments/sub-treatments/${subId}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteSubTreatment: (subId: string) => request<{ success: boolean }>(`/treatments/sub-treatments/${subId}`, { method: 'DELETE' }),

  // Turnos / Citas
  getAppointments: (params?: { date?: string; start_date?: string; end_date?: string; staff_id?: string; box_id?: string }) => {
    const query = new URLSearchParams();
    if (params?.date) query.append('date', params.date);
    if (params?.start_date) query.append('start_date', params.start_date);
    if (params?.end_date) query.append('end_date', params.end_date);
    if (params?.staff_id) query.append('staff_id', params.staff_id);
    if (params?.box_id) query.append('box_id', params.box_id);
    return request<Appointment[]>(`/appointments?${query.toString()}`);
  },
  getAppointmentById: (id: string) => request<Appointment>(`/appointments/${id}`),
  createAppointment: (data: any) => request<Appointment>('/appointments', { method: 'POST', body: JSON.stringify(data) }),
  updateAppointment: (id: string, data: any) => request<Appointment>(`/appointments/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  addCartItem: (appointmentId: string, item: any) => request<Appointment>(`/appointments/${appointmentId}/cart`, { method: 'POST', body: JSON.stringify(item) }),
  removeCartItem: (appointmentId: string, cartItemId: string) => request<Appointment>(`/appointments/${appointmentId}/cart/${cartItemId}`, { method: 'DELETE' }),
  sendWhatsAppReminder: (appointmentId: string) => request<{ success: boolean; whatsappUrl: string; message: string; appointment: Appointment }>(`/appointments/${appointmentId}/whatsapp-reminder`, { method: 'POST' }),

  // Fichas Corporales y Cosmetológicas
  getBodyChartsByClient: (clientId: string) => request<BodyChart[]>(`/body-charts/client/${clientId}`),
  createBodyChart: (data: any) => request<BodyChart>('/body-charts', { method: 'POST', body: JSON.stringify(data) }),
  getFacialChartsByClient: (clientId: string) => request<FacialChart[]>(`/facial-charts/client/${clientId}`),
  createFacialChart: (data: any) => request<FacialChart>('/facial-charts', { method: 'POST', body: JSON.stringify(data) }),

  // Consentimientos Informados
  getConsentsByClient: (clientId: string) => request<InformedConsent[]>(`/consents/client/${clientId}`),
  createConsent: (data: any) => request<InformedConsent>('/consents', { method: 'POST', body: JSON.stringify(data) }),

  // Productos & Stock
  getProducts: (params?: { category?: string; is_for_sale?: boolean; is_internal_supply?: boolean; low_stock?: boolean }) => {
    const query = new URLSearchParams();
    if (params?.category) query.append('category', params.category);
    if (params?.is_for_sale !== undefined) query.append('is_for_sale', String(params.is_for_sale));
    if (params?.is_internal_supply !== undefined) query.append('is_internal_supply', String(params.is_internal_supply));
    if (params?.low_stock) query.append('low_stock', 'true');
    return request<Product[]>(`/products?${query.toString()}`);
  },
  createProduct: (data: Partial<Product>) => request<Product>('/products', { method: 'POST', body: JSON.stringify(data) }),
  updateProduct: (id: string, data: Partial<Product>) => request<Product>(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProduct: (id: string) => request<{ success: boolean }>(`/products/${id}`, { method: 'DELETE' }),
  registerStockMovement: (productId: string, data: any) => request<Product>(`/products/${productId}/movements`, { method: 'POST', body: JSON.stringify(data) }),

  // Importación Masiva desde Planilla
  batchImportClients: (items: any[]) => request<{ success: boolean; count: number; message: string }>('/clients/batch', { method: 'POST', body: JSON.stringify({ items }) }),
  batchImportProducts: (items: any[]) => request<{ success: boolean; count: number; message: string }>('/products/batch', { method: 'POST', body: JSON.stringify({ items }) }),
  batchImportStaff: (items: any[]) => request<{ success: boolean; count: number; message: string }>('/staff/batch', { method: 'POST', body: JSON.stringify({ items }) }),
  batchImportTreatments: (items: any[]) => request<{ success: boolean; count: number; message: string }>('/treatments/batch', { method: 'POST', body: JSON.stringify({ items }) }),

  // Caja & Comisiones
  getCurrentShift: () => request<CashRegisterShift & { transactions: CashTransaction[] } | null>('/cash/current-shift'),
  openShift: (data: { initial_cash: number; opened_by: string; notes?: string }) => request<CashRegisterShift>('/cash/open-shift', { method: 'POST', body: JSON.stringify(data) }),
  closeShift: (id: string, data: { actual_cash: number; closed_by: string; notes?: string }) => request<CashRegisterShift>(`/cash/close-shift/${id}`, { method: 'POST', body: JSON.stringify(data) }),
  createCashTransaction: (data: any) => request<CashTransaction>('/cash/transactions', { method: 'POST', body: JSON.stringify(data) }),
  getCommissions: (params?: { staff_id?: string; period?: string }) => {
    const query = new URLSearchParams();
    if (params?.staff_id) query.append('staff_id', params.staff_id);
    if (params?.period) query.append('period', params.period);
    return request<StaffCommission[]>(`/cash/commissions?${query.toString()}`);
  },

  // Marketing
  getMarketingMedia: (params?: { treatment_id?: string; sub_treatment_id?: string }) => {
    const query = new URLSearchParams();
    if (params?.treatment_id) query.append('treatment_id', params.treatment_id);
    if (params?.sub_treatment_id) query.append('sub_treatment_id', params.sub_treatment_id);
    return request<MarketingMedia[]>(`/marketing/media?${query.toString()}`);
  },
  createMarketingMedia: (data: any) => request<MarketingMedia>('/marketing/media', { method: 'POST', body: JSON.stringify(data) }),
  getMarketingPosts: () => request<MarketingPost[]>('/marketing/posts'),
  createMarketingPost: (data: any) => request<MarketingPost>('/marketing/posts', { method: 'POST', body: JSON.stringify(data) }),
  publishMarketingPost: (id: string) => request<MarketingPost>(`/marketing/posts/${id}/publish`, { method: 'POST' }),

  // Copias de Seguridad (Backups) & Cierre
  getBackupConfig: () => request<{ success: boolean; config: BackupConfig }>('/backup/config'),
  updateBackupConfig: (config: Partial<BackupConfig>) => request<{ success: boolean; config: BackupConfig }>('/backup/config', { method: 'POST', body: JSON.stringify(config) }),
  getBackups: () => request<{ success: boolean; backups: BackupItem[] }>('/backup/list'),
  createBackup: (isAutomatic = false) => request<{ success: boolean; backup: BackupItem }>('/backup/create', { method: 'POST', body: JSON.stringify({ isAutomatic }) }),
  restoreBackup: (fileName: string) => request<{ success: boolean; message: string }>('/backup/restore', { method: 'POST', body: JSON.stringify({ fileName }) }),
  deleteBackup: (fileName: string) => request<{ success: boolean; message: string }>(`/backup/${encodeURIComponent(fileName)}`, { method: 'DELETE' }),
  openBackupFolder: () => request<{ success: boolean }>('/backup/open-folder', { method: 'POST' }),
  shutdownSystem: () => request<{ success: boolean; message: string }>('/system/shutdown', { method: 'POST' }),

  // Verificación de Actualizaciones (GitHub / Google Drive)
  checkUpdates: () => request<{
    success: boolean;
    updateAvailable: boolean;
    currentVersion: string;
    latestVersion: string;
    downloadUrl: string;
    installerFileName: string;
    changelog: string;
    releaseDate?: string;
    error?: string;
  }>('/system/check-updates'),
};

