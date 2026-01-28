import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { EnergyType } from "@/utils/types";

export interface FilterState {
  energyType: EnergyType | 'all';
  month: string | null; // 格式：YYYY-MM
  onlySummary: boolean;
  setEnergyType: (type: EnergyType | 'all') => void;
  setMonth: (month: string | null) => void;
  setOnlySummary: (onlySummary: boolean) => void;
  resetFilters: () => void;
}

const useFilterStore = create<FilterState>()(
  persist(
    (set) => ({
      energyType: 'all',
      month: null,
      onlySummary: false,
      setEnergyType: (type) => {
        set({ energyType: type });
      },
      setMonth: (month) => {
        set({ month });
      },
      setOnlySummary: (onlySummary) => {
        set({ onlySummary });
      },
      resetFilters: () => {
        set({ energyType: 'all', month: null, onlySummary: false });
      },
    }),
    {
      name: "filter-store",
    }
  )
);

export default useFilterStore;
