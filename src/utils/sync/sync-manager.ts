import gistSync from './gist-provider';
import { mergeRecordCollections, CloudRecordItem } from './merge';
import useSettingStore from '@/store/setting-store';
import useRecordStore, { registerDataChangeListener } from '@/store/recordStore';

interface HttpErrorLike {
  response?: {
    status?: number;
  };
  message?: string;
}

class SyncManager {
  private isSyncing = false;
  private queuedSync = false;
  private autoSyncTimer: ReturnType<typeof setTimeout> | null = null;
  private isInitialized = false;

  /**
   * 执行完整的双向增量智能同步
   * @param specificVehicleId 可指定车辆，未指定时同步当前选中的车辆
   * @param silent 是否静默（出错时不强干扰）
   */
  async sync(specificVehicleId?: string, silent = true): Promise<boolean> {
    const { gistConfig, setSyncStatus, updateSyncTime, setPendingChanges } =
      useSettingStore.getState();

    if (!gistConfig?.token || !gistConfig.gistId) {
      setSyncStatus('idle');
      return false;
    }

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setSyncStatus('offline');
      setPendingChanges(true);
      return false;
    }

    // 并发控制：如果正在同步，排队下一次
    if (this.isSyncing) {
      this.queuedSync = true;
      return true;
    }

    this.isSyncing = true;
    setSyncStatus('syncing');
    gistSync.setToken(gistConfig.token);

    const vehicleId =
      specificVehicleId ??
      useSettingStore.getState().vehicleId;

    try {
      // 1. 获取云端最新状态
      const response = await gistSync.get(gistConfig.gistId);
      const files = response.data.files;
      const targetFile = files[vehicleId] as { content?: string } | undefined;
      let remoteRawList: CloudRecordItem[] = [];

      if (targetFile?.content) {
        try {
          const parsed: unknown = JSON.parse(targetFile.content);
          if (Array.isArray(parsed)) {
            remoteRawList = parsed as CloudRecordItem[];
          }
        } catch (e) {
          console.warn('[SyncManager] 云端文件解析非有效数组，将以空列表合并', e);
        }
      }

      // 2. 提取本地当前车辆记录与墓碑
      const recordState = useRecordStore.getState();
      const localRecords = recordState.recordList;
      const localDeleted = recordState.deletedRecords;

      // 3. 执行双向三方增量合并
      const mergeResult = mergeRecordCollections({
        localRecords,
        localDeleted,
        remoteRawList,
      });

      // 4. 若本地需要更新，静默写入 store
      if (mergeResult.hasLocalChanges) {
        recordState.replaceCurrentVehicleData(
          mergeResult.mergedActiveRecords,
          mergeResult.mergedDeletedList
        );
      }

      // 5. 若云端需要更新（或初次建档），静默推回 Gist
      if (mergeResult.hasCloudChanges || !targetFile) {
        const payloadJson = JSON.stringify(mergeResult.cloudPayload);
        const updateRes = await gistSync.update(gistConfig.gistId, {
          filename: vehicleId,
          content: payloadJson,
        });

        if (!updateRes || updateRes.status !== 200) {
          throw new Error('更新 Gist 失败');
        }
      }

      // 6. 同步成功状态收尾
      updateSyncTime();
      setPendingChanges(false);
      setSyncStatus('synced');

      // 3秒后将微状态平滑恢复到 idle
      setTimeout(() => {
        if (useSettingStore.getState().syncStatus === 'synced') {
          useSettingStore.getState().setSyncStatus('idle');
        }
      }, 3000);

      return true;
    } catch (err: unknown) {
      const errorObj = err as HttpErrorLike;
      const status = errorObj.response?.status;
      const errorMsg =
        status === 401
          ? 'GitHub Token 已失效或无 Gist 权限'
          : status === 404
            ? 'Gist ID 不存在或无访问权限'
            : (errorObj.message ?? '网络连接或同步异常');

      setPendingChanges(true);
      setSyncStatus('error', errorMsg);
      if (!silent) {
        console.error('[SyncManager Error]', errorMsg, err);
      }
      return false;
    } finally {
      this.isSyncing = false;
      if (this.queuedSync) {
        this.queuedSync = false;
        // 队列执行下一次同步
        setTimeout(() => {
          void this.sync(specificVehicleId, silent);
        }, 100);
      }
    }
  }

  /**
   * 防抖触发后台自动同步
   * @param delay 防抖延迟毫秒 (默认 2000ms)
   */
  scheduleSync(delay = 2000) {
    const { gistConfig, setPendingChanges } = useSettingStore.getState();
    if (!gistConfig?.token || !gistConfig.gistId) {
      return;
    }

    setPendingChanges(true);

    if (this.autoSyncTimer) {
      clearTimeout(this.autoSyncTimer);
    }

    this.autoSyncTimer = setTimeout(() => {
      this.autoSyncTimer = null;
      void this.sync();
    }, delay);
  }

  /**
   * 初始化无感生命周期监听 (单例初始化)
   */
  initLifecycle() {
    if (this.isInitialized || typeof window === 'undefined') {
      return;
    }
    this.isInitialized = true;

    // 1. 本地数据变更：触发防抖静默同步
    registerDataChangeListener(() => {
      this.scheduleSync(2000);
    });

    // 2. 页面可见性恢复 / 切回前台：静默检测拉取云端
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const { gistConfig, syncTime } = useSettingStore.getState();
        // 若超过 20 秒未同步过，则在前台恢复时静默拉取
        const shouldSync =
          Boolean(gistConfig?.token) &&
          (!syncTime || Date.now() - syncTime > 20 * 1000);

        if (shouldSync) {
          void this.sync(undefined, true);
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);

    // 3. 网络恢复：自动消费重试挂起的离线变更
    const handleOnline = () => {
      const { pendingChanges } = useSettingStore.getState();
      if (pendingChanges) {
        this.scheduleSync(1000);
      }
    };
    window.addEventListener('online', handleOnline);

    // 4. 初次启动：尝试静默同步拉取云端
    setTimeout(() => {
      const { gistConfig } = useSettingStore.getState();
      if (gistConfig?.token && gistConfig.gistId) {
        void this.sync(undefined, true);
      }
    }, 1000);
  }
}

export const syncManager = new SyncManager();
export default syncManager;
