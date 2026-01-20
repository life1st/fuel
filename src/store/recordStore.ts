import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { EnergyType } from "@/utils/types";

interface RecordState {
  recordList: Record[];
  demoMode: boolean;
  setDemoMode: (demoMode: boolean) => void;
  insertDemoData: () => void;
  setRecordData: (data: Record) => void;
  mergeRecordData: (list: Record[]) => void;
  removeRecordById: (id: string) => void;
  updateRecordById: (id: number, data: Record) => void;
}

export interface Record {
  id: number;
  type: EnergyType;
  oil: number;
  electric: number;
  cost: number;
  kilometerOfDisplay: number;
  date: number | string;
}

const useRecordStore = create<RecordState>()(
  persist(
    (set) => ({
      recordList: [],
      demoMode: false,
      setDemoMode: (demoMode: boolean) => {
        set({ demoMode });
      },
      insertDemoData: async () => {
        const demoData = await import("@/utils/demoData.json");
        set({
          recordList: (demoData.default as any[]).map((item) => ({
            ...item,
            oil: Number(item.oil),
            electric: Number(item.electric),
            cost: Number(item.cost),
            kilometerOfDisplay: Number(item.kilometerOfDisplay),
          })) as Record[],
          demoMode: true,
        });
      },
      setRecordData: (data: Record) => {
        set((state) => ({
          demoMode: false,
          recordList: [
            ...state.recordList,
            {
              ...data,
              id: data.id || Date.now(),
            },
          ],
        }));
      },
      mergeRecordData: (list: Record[]) => {
        set((state) => ({
          recordList: [
            ...new Map(
              [...state.recordList, ...list].map((item) => [item.id, item])
            ).values(),
          ],
        }));
      },
      removeRecordById: (id: string) => {
        set((state) => ({
          recordList: state.recordList.filter((r) => r.id !== Number(id)),
        }));
      },
      updateRecordById: (id: number, data) => {
        set((state) => ({
          recordList: state.recordList.map((r) => {
            if (r.id === id) {
              return data;
            }
            return r;
          }),
        }));
      },
    }),
    {
      name: "record-store",
    }
  )
);

export default useRecordStore;
