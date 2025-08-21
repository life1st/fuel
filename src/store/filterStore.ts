import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { EnergyType } from "@/utils/types";

export interface FilterState {
  energyType: EnergyType | 'all';
  month: string | null; // 格式：YYYY-MM
  setEnergyType: (type: EnergyType | 'all') => void;
  setMonth: (month: string | null) => void;
  resetFilters: () => void;
}

const useFilterStore = create<FilterState>()(
  persist(
    (set) => ({
      energyType: 'all',
      month: null,
      setEnergyType: (type) => {
        set({ energyType: type });
      },
      setMonth: (month) => {
        set({ month });
      },
      resetFilters: () => {
        set({ energyType: 'all', month: null });
      },
    }),
    {
      name: "filter-store",
    }
  )
);

export default useFilterStore;
