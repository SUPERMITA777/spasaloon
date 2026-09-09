import { offlineStorage, OfflineMutation } from './offlineStorage';

export interface SyncConflict {
  mutationId: string;
  entity: 'appointment' | 'client';
  entityId: string;
  entityDescription: string;
  mobileData: any;
  serverData: any;
  diffFields: string[];
}

type SyncListener = (status: {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  conflicts: SyncConflict[];
  lastSyncedAt: string | null;
}) => void;

class SyncService {
  private isOnline: boolean = navigator.onLine;
  private isSyncing: boolean = false;
  private pendingCount: number = 0;
  private conflicts: SyncConflict[] = [];
  private lastSyncedAt: string | null = null;
  private listeners: Set<SyncListener> = new Set();
  private intervalId: any = null;

  constructor() {
    window.addEventListener('online', () => this.handleNetworkChange(true));
    window.addEventListener('offline', () => this.handleNetworkChange(false));
  }

  public subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    this.notify();
    return () => this.listeners.delete(listener);
  }

  public onConflict(callback: (conflicts: SyncConflict[]) => void): () => void {
    return this.subscribe((status) => {
      callback(status.conflicts);
    });
  }

  private notify() {
    const state = {
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
      pendingCount: this.pendingCount,
      conflicts: this.conflicts,
      lastSyncedAt: this.lastSyncedAt,
    };
    this.listeners.forEach((l) => l(state));
  }

  public async start() {
    await this.updatePendingCount();
    await this.checkConnectivityAndSync();

    if (!this.intervalId) {
      this.intervalId = setInterval(() => {
        this.checkConnectivityAndSync();
      }, 12000);
    }
  }

  public stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private async handleNetworkChange(online: boolean) {
    this.isOnline = online;
    this.notify();
    if (online) {
      await this.syncNow();
    }
  }

  public async updatePendingCount() {
    const mutations = await offlineStorage.getPendingMutations();
    this.pendingCount = mutations.length;
    this.notify();
  }

  public async checkConnectivityAndSync() {
    try {
      // Ping ligero al servidor
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const res = await fetch('/api/info', {
        signal: controller.signal,
        headers: { 'Cache-Control': 'no-cache' },
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        this.isOnline = true;
        await this.syncNow();
      } else {
        this.isOnline = false;
      }
    } catch {
      this.isOnline = false;
    }
    this.notify();
  }

  // Ejecuta la sincronización bidireccional completa
  public async syncNow(): Promise<{ success: boolean; message?: string }> {
    if (this.isSyncing) return { success: false, message: 'Sincronización ya en curso' };

    try {
      this.isSyncing = true;
      this.notify();

      // 1. Enviar mutaciones pendientes del móvil al servidor
      const mutations = await offlineStorage.getPendingMutations();
      this.pendingCount = mutations.length;

      if (mutations.length > 0) {
        const lastSynced = (await offlineStorage.getSnapshot())?.lastSyncedAt;
        const enrichedMutations = mutations.map((m) => ({
          ...m,
          lastSyncedAt: lastSynced,
        }));

        const res = await fetch('/api/sync/batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mutations: enrichedMutations }),
        });

        if (res.ok) {
          const result = await res.json();
          if (result.success) {
            if (result.processedIds && result.processedIds.length > 0) {
              await offlineStorage.removeProcessedMutations(result.processedIds);
            }
            if (result.conflicts && result.conflicts.length > 0) {
              this.conflicts = [...this.conflicts, ...result.conflicts];
            }
          }
        }
      }

      // 2. Traer snapshot fresco desde el servidor y guardar en IndexedDB
      const snapRes = await fetch('/api/sync/snapshot', {
        headers: { 'Cache-Control': 'no-cache' },
      });

      if (snapRes.ok) {
        const snapData = await snapRes.json();
        if (snapData.success && snapData.data) {
          await offlineStorage.saveSnapshot(snapData.data);
          this.lastSyncedAt = snapData.timestamp;
        }
      }

      await this.updatePendingCount();
      return { success: true };
    } catch (err: any) {
      return { success: false, message: err.message };
    } finally {
      this.isSyncing = false;
      this.notify();
    }
  }

  // Registrar acción offline y sincronizar si hay conexión
  public async recordOfflineAction(
    entity: 'appointment' | 'client',
    action: 'create' | 'update' | 'delete',
    entityId: string,
    data: any
  ) {
    const mutation: OfflineMutation = {
      id: `mut_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      entity,
      action,
      entityId,
      data,
      clientTimestamp: new Date().toISOString(),
    };

    await offlineStorage.queueMutation(mutation);
    await this.updatePendingCount();

    if (this.isOnline) {
      // Intentar sincronizar de fondo de inmediato
      this.syncNow().catch(() => {});
    }
  }

  // Resolver discrepancia con la decisión del operador
  public async resolveConflict(
    conflict: SyncConflict,
    resolution: 'use_mobile' | 'use_server',
    customData?: any
  ): Promise<boolean> {
    try {
      const chosenData = resolution === 'use_mobile' ? conflict.mobileData : customData || conflict.serverData;

      const res = await fetch('/api/sync/resolve-conflict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entity: conflict.entity,
          entityId: conflict.entityId,
          resolution,
          chosenData,
        }),
      });

      if (res.ok) {
        // Remover de la lista local de conflictos
        this.conflicts = this.conflicts.filter((c) => c.mutationId !== conflict.mutationId);
        await offlineStorage.removeProcessedMutations([conflict.mutationId]);
        this.notify();
        await this.syncNow();
        return true;
      }
      return false;
    } catch (e) {
      console.error('Error al resolver conflicto:', e);
      return false;
    }
  }
}

export const syncService = new SyncService();
