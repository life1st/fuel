import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import syncManager from '../sync-manager';
import gistSync, { GistResponse } from '../gist-provider';
import useSettingStore from '@/store/setting-store';
import useRecordStore from '@/store/recordStore';

describe('Gist Sync - SyncManager 同步调度与离线保障', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    useSettingStore.setState({
      gistConfig: {
        token: 'mock-token',
        gistId: 'mock-gist-id',
        filename: 'default_vehicle',
      },
      syncStatus: 'idle',
      pendingChanges: false,
      vehicleId: 'default_vehicle',
      syncTime: null,
    });
    useRecordStore.setState({
      recordList: [],
      deletedRecords: [],
      vehiclesData: {},
      currentVehicleId: 'default_vehicle',
      demoMode: false,
    });
  });

  it('未配置 Gist 时，调用 sync 应安全退出且不发起网络请求', async () => {
    useSettingStore.setState({ gistConfig: null });
    const getSpy = vi.spyOn(gistSync, 'get');

    const result = await syncManager.sync();
    expect(result).toBe(false);
    expect(getSpy).not.toHaveBeenCalled();
    expect(useSettingStore.getState().syncStatus).toBe('idle');
  });

  it('同步流程：正常拉取云端数据并合并到本地 store', async () => {
    const remoteData = [
      {
        id: 2001,
        type: 'charging' as const,
        cost: 60,
        oil: 0,
        electric: 50,
        kilometerOfDisplay: 500,
        date: '2025-02-01',
        updatedAt: 1738368000000,
      },
    ];

    const mockResponse: AxiosResponse<GistResponse> = {
      data: {
        id: 'mock-gist-id',
        updated_at: new Date().toISOString(),
        files: {
          default_vehicle: {
            content: JSON.stringify(remoteData),
          },
        },
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as InternalAxiosRequestConfig,
    };

    vi.spyOn(gistSync, 'get').mockResolvedValue(mockResponse);
    vi.spyOn(gistSync, 'update').mockResolvedValue({
      status: 200,
      data: mockResponse.data,
      statusText: 'OK',
      headers: {},
      config: {} as InternalAxiosRequestConfig,
    });

    const success = await syncManager.sync();
    expect(success).toBe(true);
    expect(useRecordStore.getState().recordList).toHaveLength(1);
    expect(useRecordStore.getState().recordList[0].id).toBe(2001);
    expect(useSettingStore.getState().pendingChanges).toBe(false);
  });

  it('车辆隔离：多车辆切换时，不交叉污染账本', () => {
    const store = useRecordStore.getState();
    // 车辆 A 添加记录
    store.switchVehicle('京A11111');
    store.setRecordData({
      id: 3001,
      type: 'refueling',
      cost: 300,
      oil: 40,
      electric: 0,
      kilometerOfDisplay: 1000,
      date: '2025-02-10',
    });

    expect(useRecordStore.getState().recordList).toHaveLength(1);
    expect(useRecordStore.getState().recordList[0].id).toBe(3001);

    // 切换到车辆 B
    useRecordStore.getState().switchVehicle('粤B22222');
    expect(useRecordStore.getState().recordList).toHaveLength(0); // 车辆 B 初始应为空

    // 切回车辆 A
    useRecordStore.getState().switchVehicle('京A11111');
    expect(useRecordStore.getState().recordList).toHaveLength(1);
    expect(useRecordStore.getState().recordList[0].id).toBe(3001);
  });
});
