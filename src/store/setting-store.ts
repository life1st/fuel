import { create } from 'zustand';
import { persist } from 'zustand/middleware'
import { DEFAULT_VEHICLE_ID } from '@/utils/consts';

export interface GistConfig {
  token: string
  filename: string
  gistId: string
}

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error' | 'offline';

interface SyncStore {
  vehicleId: string;
  setVehicleId: (id: string) => void;
  syncTime: number | null;
  updateSyncTime: () => void;
  gistConfig: GistConfig | null;
  setGistConfig: (config: GistConfig) => void;
  clearAllConfig: () => void;
  isOptimizeCost: boolean;
  setOptimizeCost: (isOptimizeCost: boolean) => void;
  syncStatus: SyncStatus;
  lastSyncError: string | null;
  setSyncStatus: (status: SyncStatus, error?: string | null) => void;
  pendingChanges: boolean;
  setPendingChanges: (pending: boolean) => void;
}

const useSettingStore = create<SyncStore>()(
  persist(
    (set) => ({
      vehicleId: DEFAULT_VEHICLE_ID,
      setVehicleId: (id: string) => {
        set({ vehicleId: id });
      },
      syncTime: null,
      updateSyncTime: () => {
        set({ syncTime: Date.now() });
      },
      gistConfig: null,
      setGistConfig: (config) => {
        set({ gistConfig: config });
      },
      clearAllConfig: () => {
        set({ gistConfig: null });
      },
      isOptimizeCost: false,
      setOptimizeCost: (isOptimizeCost) => {
        set({ isOptimizeCost });
      },
      syncStatus: 'idle',
      lastSyncError: null,
      setSyncStatus: (status: SyncStatus, error = null) => {
        set({ syncStatus: status, lastSyncError: error });
      },
      pendingChanges: false,
      setPendingChanges: (pending: boolean) => {
        set({ pendingChanges: pending });
      },
    }),
    {
      name: "setting-store",
      partialize: (state) => ({
        vehicleId: state.vehicleId,
        syncTime: state.syncTime,
        gistConfig: state.gistConfig,
        isOptimizeCost: state.isOptimizeCost,
        pendingChanges: state.pendingChanges,
      }),
    }
  )
);

export default useSettingStore; 