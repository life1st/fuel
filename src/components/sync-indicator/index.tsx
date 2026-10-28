import { FC } from 'react';
import { Toast } from 'antd-mobile';
import { LoopOutline, CheckCircleFill, ExclamationCircleFill } from 'antd-mobile-icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import useSettingStore from '@/store/setting-store';
import syncManager from '@/utils/sync/sync-manager';
import './style.scss';

dayjs.extend(relativeTime);

export const SyncIndicator: FC<{ className?: string }> = ({ className = '' }) => {
  const { gistConfig, syncStatus, syncTime, lastSyncError, pendingChanges } = useSettingStore();

  if (!gistConfig?.token || !gistConfig.gistId) {
    return null;
  }

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (syncStatus === 'syncing') {
      Toast.show({ content: '正在同步云端数据...' });
      return;
    }

    if (syncStatus === 'error') {
      Toast.show({
        icon: 'fail',
        content: lastSyncError ?? '同步失败，请检查网络或配置',
      });
      return;
    }

    if (syncStatus === 'offline') {
      Toast.show({ content: '当前离线，已保存本地，连网后将自动同步' });
      return;
    }

    const timeDesc = syncTime ? dayjs(syncTime).fromNow() : '尚未同步';
    Toast.show({
      content: `云端已连接 (${timeDesc})，点击可立即同步`,
      afterClose: () => {
        void syncManager.sync();
      },
    });
  };

  return (
    <div
      className={`sync-indicator ${syncStatus} ${pendingChanges ? 'has-pending' : ''} ${className}`}
      onClick={handleClick}
      title="Gist 同步状态"
    >
      {syncStatus === 'syncing' && (
        <span className="icon-wrapper spinning">
          <LoopOutline />
        </span>
      )}
      {syncStatus === 'synced' && (
        <span className="icon-wrapper success">
          <CheckCircleFill />
        </span>
      )}
      {syncStatus === 'error' && (
        <span className="icon-wrapper error">
          <ExclamationCircleFill />
        </span>
      )}
      {(syncStatus === 'idle' || syncStatus === 'offline') && (
        <span className={`dot ${pendingChanges ? 'pending' : 'synced'}`} />
      )}
    </div>
  );
};

export default SyncIndicator;
