import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { EnergyType } from "@/utils/types";

interface RecordState {
  recordList: Record[];
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
      setRecordData: (data: Record) => {
        set((state) => ({
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
