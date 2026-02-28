import { create } from 'zustand';
import { persist } from 'zustand/middleware'
import { DEFAULT_VEHICLE_ID } from '@/utils/consts';

export interface GistConfig {
  token: string
  filename: string
  gistId: string
}

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
    }),
    {
      name: "setting-store",
    }
  )
);

export default useSettingStore; 