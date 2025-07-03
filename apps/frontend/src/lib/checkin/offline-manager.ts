interface OfflineCheckin {
  id: string;
  guest_id: string;
  checkin_method: 'qr_code' | 'manual';
  device_info: string;
  location: string;
  notes?: string;
  offline_timestamp: string;
  qr_code?: string;
  guest_data?: {
    first_name: string;
    last_name: string;
    email: string;
    tier_name: string;
  };
  additional_guests?: { id: string; name: string }[];
}

interface SyncResult {
  total_processed: number;
  success_count: number;
  error_count: number;
  duplicate_count: number;
  successful_syncs: Array<{
    offline_id: string;
    server_checkin_id: string;
    guest_name: string;
  }>;
  failed_syncs: Array<{
    offline_id: string;
    error_message: string;
    error_code: string;
  }>;
  conflicts: Array<{
    offline_id: string;
    conflict_type: string;
    server_data: any;
  }>;
  sync_timestamp: string;
}

class OfflineManager {
  private readonly STORAGE_KEY = 'daawa_offline_checkins';
  private readonly SYNC_STATUS_KEY = 'daawa_sync_status';
  private isOnline: boolean = typeof window !== 'undefined' ? navigator.onLine : true;
  private syncInProgress: boolean = false;
  private listeners: Array<(status: { isOnline: boolean; syncInProgress: boolean; queueCount: number }) => void> = [];

  constructor() {
    this.setupEventListeners();
    this.loadSyncStatus();
  }

  private setupEventListeners() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.isOnline = true;
        this.notifyListeners();
        this.autoSync();
      });

      window.addEventListener('offline', () => {
        this.isOnline = false;
        this.notifyListeners();
      });
    }
  }

  private loadSyncStatus() {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(this.SYNC_STATUS_KEY);
      if (stored) {
        try {
          const status = JSON.parse(stored);
          this.syncInProgress = status.syncInProgress || false;
        } catch (error) {
          console.error('Failed to load sync status:', error);
        }
      }
    }
  }

  private saveSyncStatus() {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.SYNC_STATUS_KEY, JSON.stringify({
        syncInProgress: this.syncInProgress,
        lastSync: new Date().toISOString(),
      }));
    }
  }

  addListener(callback: (status: { isOnline: boolean; syncInProgress: boolean; queueCount: number }) => void) {
    this.listeners.push(callback);
    // Immediately notify with current status
    this.notifyListeners();
  }

  removeListener(callback: (status: { isOnline: boolean; syncInProgress: boolean; queueCount: number }) => void) {
    this.listeners = this.listeners.filter(listener => listener !== callback);
  }

  private notifyListeners() {
    const status = {
      isOnline: this.isOnline,
      syncInProgress: this.syncInProgress,
      queueCount: this.getQueuedCheckins().length,
    };
    this.listeners.forEach(listener => listener(status));
  }

  async queueCheckin(checkinData: {
    guest_id: string;
    checkin_method: 'qr_code' | 'manual';
    device_info: string;
    location: string;
    notes?: string;
    qr_code?: string;
    guest_data?: {
      first_name: string;
      last_name: string;
      email: string;
      tier_name: string;
    };
    additional_guests?: { id: string; name: string }[];
  }): Promise<OfflineCheckin> {
    const offlineCheckin: OfflineCheckin = {
      id: this.generateId(),
      ...checkinData,
      offline_timestamp: new Date().toISOString(),
    };

    const existingCheckins = this.getQueuedCheckins();
    existingCheckins.push(offlineCheckin);
    
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(existingCheckins));
    }
    this.notifyListeners();
    
    return offlineCheckin;
  }

  getQueuedCheckins(): OfflineCheckin[] {
    if (typeof window === 'undefined') return [];
    
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (!stored) return [];
    
    try {
      return JSON.parse(stored);
    } catch (error) {
      console.error('Failed to parse queued check-ins:', error);
      return [];
    }
  }

  async syncCheckins(): Promise<SyncResult | null> {
    if (!this.isOnline || this.syncInProgress) {
      return null;
    }

    const queuedCheckins = this.getQueuedCheckins();
    if (queuedCheckins.length === 0) {
      return {
        total_processed: 0,
        success_count: 0,
        error_count: 0,
        duplicate_count: 0,
        successful_syncs: [],
        failed_syncs: [],
        conflicts: [],
        sync_timestamp: new Date().toISOString(),
      };
    }

    this.syncInProgress = true;
    this.saveSyncStatus();
    this.notifyListeners();

    try {
      // Convert to the format expected by the backend
      const syncRequest = {
        offline_checkins: queuedCheckins.map(checkin => ({
          offline_id: checkin.id,
          guest_id: checkin.guest_id,
          checkin_method: checkin.checkin_method,
          device_info: checkin.device_info,
          location: checkin.location,
          notes: checkin.notes,
          offline_timestamp: checkin.offline_timestamp,
          additional_guest_ids: checkin.additional_guests?.map(g => g.id) || [],
        })),
      };

      // Make API call to sync endpoint
      const response = await fetch('/api/checkin/sync-offline', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify(syncRequest),
      });

      if (!response.ok) {
        throw new Error(`Sync failed: ${response.status} ${response.statusText}`);
      }

      const result: SyncResult = await response.json();

      // Remove successfully synced items from local storage
      const successfulIds = result.successful_syncs.map(sync => sync.offline_id);
      const remainingCheckins = queuedCheckins.filter(
        checkin => !successfulIds.includes(checkin.id)
      );

      if (typeof window !== 'undefined') {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(remainingCheckins));
      }
      
      return result;

    } catch (error) {
      console.error('Sync failed:', error);
      return {
        total_processed: queuedCheckins.length,
        success_count: 0,
        error_count: queuedCheckins.length,
        duplicate_count: 0,
        successful_syncs: [],
        failed_syncs: queuedCheckins.map(checkin => ({
          offline_id: checkin.id,
          error_message: error instanceof Error ? error.message : 'Unknown sync error',
          error_code: 'SYNC_FAILED',
        })),
        conflicts: [],
        sync_timestamp: new Date().toISOString(),
      };
    } finally {
      this.syncInProgress = false;
      this.saveSyncStatus();
      this.notifyListeners();
    }
  }

  private async autoSync() {
    // Auto-sync after a short delay when coming online
    setTimeout(() => {
      this.syncCheckins();
    }, 2000);
  }

  clearQueue() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.STORAGE_KEY);
    }
    this.notifyListeners();
  }

  getStatus() {
    return {
      isOnline: this.isOnline,
      syncInProgress: this.syncInProgress,
      queueCount: this.getQueuedCheckins().length,
    };
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}

// Export singleton instance
export const offlineManager = new OfflineManager(); 