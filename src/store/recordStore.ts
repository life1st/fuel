import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { EnergyType } from "@/utils/types";
import { DEFAULT_VEHICLE_ID } from "@/utils/consts";
import type { DeletedTombstone } from "@/utils/sync/merge";

export interface EnergyRecord {
  id: number;
  type: EnergyType;
  oil: number;
  electric: number;
  cost: number;
  kilometerOfDisplay: number;
  date: number | string;
  location?: {
    latitude: number;
    longitude: number;
    reverseName?: string;
  };
  updatedAt?: number;
  deletedAt?: number | null;
}

export type Record = EnergyRecord;

interface VehicleData {
  recordList: EnergyRecord[];
  deletedRecords: DeletedTombstone[];
}

interface RawDemoItem {
  oil: string | number;
  electric: string | number;
  cost: string | number;
  kilometerOfDisplay: string | number;
  [key: string]: unknown;
}

interface RecordState {
  recordList: EnergyRecord[];
  deletedRecords: DeletedTombstone[];
  vehiclesData: globalThis.Record<string, VehicleData>;
  currentVehicleId: string;
  demoMode: boolean;
  setDemoMode: (demoMode: boolean) => void;
  insertDemoData: () => void;
  switchVehicle: (vehicleId: string) => void;
  setRecordData: (data: EnergyRecord) => void;
  mergeRecordData: (list: EnergyRecord[]) => void;
  replaceCurrentVehicleData: (records: EnergyRecord[], deleted?: DeletedTombstone[]) => void;
  removeRecordById: (id: string | number) => void;
  updateRecordById: (id: number, data: EnergyRecord) => void;
}

let onDataChangeCallback: (() => void) | null = null;
export const registerDataChangeListener = (callback: () => void) => {
  onDataChangeCallback = callback;
};

const notifyDataChange = () => {
  if (onDataChangeCallback) {
    onDataChangeCallback();
  }
};

const useRecordStore = create<RecordState>()(
  persist(
    (set) => ({
      recordList: [],
      deletedRecords: [],
      vehiclesData: {},
      currentVehicleId: DEFAULT_VEHICLE_ID,
      demoMode: false,

      setDemoMode: (demoMode: boolean) => {
        set({ demoMode });
      },

      insertDemoData: async () => {
        const demoData = await import("@/utils/demoData.json");
        const list = (demoData.default as RawDemoItem[]).map((item) => ({
          ...item,
          oil: Number(item.oil),
          electric: Number(item.electric),
          cost: Number(item.cost),
          kilometerOfDisplay: Number(item.kilometerOfDisplay),
          updatedAt: Date.now(),
        })) as unknown as EnergyRecord[];
        set({
          recordList: list,
          demoMode: true,
        });
      },

      switchVehicle: (targetVehicleId: string) => {
        set((state) => {
          if (!targetVehicleId || targetVehicleId === state.currentVehicleId) {
            return state;
          }

          // 保存当前车辆数据
          const updatedVehicles: globalThis.Record<string, VehicleData> = {
            ...state.vehiclesData,
            [state.currentVehicleId]: {
              recordList: state.recordList,
              deletedRecords: state.deletedRecords,
            },
          };

          // 提取目标车辆数据
          const targetData: VehicleData = updatedVehicles[targetVehicleId] ?? {
            recordList: [],
            deletedRecords: [],
          };

          return {
            currentVehicleId: targetVehicleId,
            recordList: targetData.recordList,
            deletedRecords: targetData.deletedRecords,
            vehiclesData: updatedVehicles,
            demoMode: false,
          };
        });
      },

      setRecordData: (data: EnergyRecord) => {
        set((state) => {
          const list = state.demoMode ? [] : state.recordList;
          const id = data.id || Date.now();
          const updatedAt = data.updatedAt ?? Date.now();
          const newRecord: EnergyRecord = {
            ...data,
            id,
            updatedAt,
            deletedAt: null,
          };

          const newRecordList = [...list, newRecord];
          const newDeleted = state.deletedRecords.filter((d) => d.id !== id);

          const updatedVehicles: globalThis.Record<string, VehicleData> = {
            ...state.vehiclesData,
            [state.currentVehicleId]: {
              recordList: newRecordList,
              deletedRecords: newDeleted,
            },
          };

          return {
            demoMode: false,
            recordList: newRecordList,
            deletedRecords: newDeleted,
            vehiclesData: updatedVehicles,
          };
        });
        notifyDataChange();
      },

      mergeRecordData: (list: EnergyRecord[]) => {
        set((state) => {
          const baseList = state.demoMode ? [] : state.recordList;
          const map = new Map<number, EnergyRecord>();

          baseList.forEach((r) => map.set(r.id, r));
          list.forEach((r) => {
            const existing = map.get(r.id);
            if (!existing || (r.updatedAt ?? 0) >= (existing.updatedAt ?? 0)) {
              map.set(r.id, {
                ...r,
                updatedAt: r.updatedAt ?? Date.now(),
              });
            }
          });

          const newRecordList = Array.from(map.values());
          const updatedVehicles: globalThis.Record<string, VehicleData> = {
            ...state.vehiclesData,
            [state.currentVehicleId]: {
              recordList: newRecordList,
              deletedRecords: state.deletedRecords,
            },
          };

          return {
            demoMode: false,
            recordList: newRecordList,
            vehiclesData: updatedVehicles,
          };
        });
        notifyDataChange();
      },

      replaceCurrentVehicleData: (records: EnergyRecord[], deleted: DeletedTombstone[] = []) => {
        set((state) => {
          const updatedVehicles: globalThis.Record<string, VehicleData> = {
            ...state.vehiclesData,
            [state.currentVehicleId]: {
              recordList: records,
              deletedRecords: deleted,
            },
          };
          return {
            demoMode: false,
            recordList: records,
            deletedRecords: deleted,
            vehiclesData: updatedVehicles,
          };
        });
      },

      removeRecordById: (id: string | number) => {
        const numId = Number(id);
        set((state) => {
          const newRecordList = state.recordList.filter((r) => r.id !== numId);
          const newDeleted = [
            ...state.deletedRecords.filter((d) => d.id !== numId),
            { id: numId, deletedAt: Date.now() },
          ];

          const updatedVehicles: globalThis.Record<string, VehicleData> = {
            ...state.vehiclesData,
            [state.currentVehicleId]: {
              recordList: newRecordList,
              deletedRecords: newDeleted,
            },
          };

          return {
            recordList: newRecordList,
            deletedRecords: newDeleted,
            vehiclesData: updatedVehicles,
          };
        });
        notifyDataChange();
      },

      updateRecordById: (id: number, data: EnergyRecord) => {
        set((state) => {
          const updatedAt = Date.now();
          const newRecordList = state.recordList.map((r) => {
            if (r.id === id) {
              return {
                ...data,
                id,
                updatedAt,
                deletedAt: null,
              };
            }
            return r;
          });

          const updatedVehicles: globalThis.Record<string, VehicleData> = {
            ...state.vehiclesData,
            [state.currentVehicleId]: {
              recordList: newRecordList,
              deletedRecords: state.deletedRecords,
            },
          };

          return {
            recordList: newRecordList,
            vehiclesData: updatedVehicles,
          };
        });
        notifyDataChange();
      },
    }),
    {
      name: "record-store",
      migrate: (persistedState: unknown) => {
        if (!persistedState || typeof persistedState !== 'object') {
          return persistedState as RecordState;
        }
        const stateObj = persistedState as Partial<RecordState>;
        const currentVehicleId = stateObj.currentVehicleId ?? DEFAULT_VEHICLE_ID;
        const recordList = stateObj.recordList ?? [];
        const deletedRecords = stateObj.deletedRecords ?? [];
        const vehiclesData = stateObj.vehiclesData ?? {
          [currentVehicleId]: {
            recordList,
            deletedRecords,
          },
        };
        return {
          ...stateObj,
          currentVehicleId,
          recordList,
          deletedRecords,
          vehiclesData,
        } as RecordState;
      },
    }
  )
);

export default useRecordStore;
