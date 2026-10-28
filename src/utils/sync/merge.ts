import dayjs from 'dayjs';
import type { Record } from '@/store/recordStore';

export interface DeletedTombstone {
  id: number;
  deletedAt: number;
}

export type CloudRecordItem = Record & { deletedAt?: number | null; deleted?: boolean };

export interface MergeInput {
  localRecords: Record[];
  localDeleted?: DeletedTombstone[];
  remoteRawList: CloudRecordItem[];
  tombstoneMaxAgeDays?: number;
}

export interface MergeResult {
  /** 合并后的本地活跃记录列表 (不含已删除记录) */
  mergedActiveRecords: Record[];
  /** 合并后保留的删除墓碑列表 */
  mergedDeletedList: DeletedTombstone[];
  /** 准备持久化同步至 Gist 的全量数据 (包含活跃记录和近期有效墓碑) */
  cloudPayload: (Record & { deletedAt?: number | null })[];
  /** 本地活跃数据相较于合并前是否有变动 */
  hasLocalChanges: boolean;
  /** 云端数据相较于本次合并结果是否有变动 (是否需要回写 Gist) */
  hasCloudChanges: boolean;
}

/** 规范化获取记录的更新时间戳 */
export const getRecordUpdatedAt = (record: Partial<Record>): number => {
  if (record.updatedAt && !isNaN(Number(record.updatedAt))) {
    return Number(record.updatedAt);
  }
  const dateVal = dayjs(record.date).valueOf();
  if (dateVal && !isNaN(dateVal)) {
    return dateVal;
  }
  if (record.id && !isNaN(Number(record.id))) {
    return Number(record.id);
  }
  return 0;
};

/**
 * 离线分布式双向智能合并算法
 * 采用 Last-Write-Wins (LWW) 与 Tombstones (墓碑) 机制保证最终一致性
 */
export function mergeRecordCollections({
  localRecords = [],
  localDeleted = [],
  remoteRawList = [],
  tombstoneMaxAgeDays = 60,
}: MergeInput): MergeResult {
  const now = Date.now();
  const maxAgeMs = tombstoneMaxAgeDays * 24 * 60 * 60 * 1000;

  // 1. 解析远程活跃记录与远程删除墓碑
  const remoteActiveMap = new Map<number, Record>();
  const allTombstonesMap = new Map<number, number>();

  // 载入本地墓碑
  localDeleted.forEach((t) => {
    if (t.id) {
      allTombstonesMap.set(t.id, t.deletedAt || now);
    }
  });

  // 载入远程数据
  remoteRawList.forEach((item) => {
    if (!item.id) return;
    const id = Number(item.id);
    const isDeleted = Boolean(item.deletedAt ?? item.deleted);
    if (isDeleted) {
      const remoteDelAt = Number(item.deletedAt) || now;
      const currentDelAt = allTombstonesMap.get(id) ?? 0;
      allTombstonesMap.set(id, Math.max(currentDelAt, remoteDelAt));
    } else {
      remoteActiveMap.set(id, {
        ...item,
        id,
        updatedAt: getRecordUpdatedAt(item),
      });
    }
  });

  // 2. 本地活跃记录 Map
  const localActiveMap = new Map<number, Record>();
  localRecords.forEach((item) => {
    if (!item.id) return;
    const id = Number(item.id);
    localActiveMap.set(id, {
      ...item,
      id,
      updatedAt: getRecordUpdatedAt(item),
    });
  });

  // 3. 全量 ID 候选集
  const allIds = new Set<number>([
    ...localActiveMap.keys(),
    ...remoteActiveMap.keys(),
    ...allTombstonesMap.keys(),
  ]);

  const finalActiveList: Record[] = [];
  const finalTombstones: DeletedTombstone[] = [];

  allIds.forEach((id) => {
    const loc = localActiveMap.get(id);
    const rem = remoteActiveMap.get(id);
    const delAt = allTombstonesMap.get(id);

    const locUpdatedAt = loc ? getRecordUpdatedAt(loc) : 0;
    const remUpdatedAt = rem ? getRecordUpdatedAt(rem) : 0;
    const maxUpdatedAt = Math.max(locUpdatedAt, remUpdatedAt);

    // 如果存在删除墓碑
    if (delAt !== undefined) {
      // 冲突解决：如果在删除之后，又有更新的编辑/新增（maxUpdatedAt > delAt），则复活并保留该更新
      if (maxUpdatedAt > delAt) {
        if (loc && locUpdatedAt >= remUpdatedAt) {
          finalActiveList.push(loc);
        } else if (rem) {
          finalActiveList.push(rem);
        }
      } else {
        // 确实处于已删除状态，若墓碑未过期则保留
        if (now - delAt <= maxAgeMs) {
          finalTombstones.push({ id, deletedAt: delAt });
        }
      }
    } else {
      // 不在墓碑中，两端均认为是活跃记录
      if (loc && rem) {
        const winner = locUpdatedAt >= remUpdatedAt ? loc : rem;
        finalActiveList.push(winner);
      } else if (loc) {
        finalActiveList.push(loc);
      } else if (rem) {
        finalActiveList.push(rem);
      }
    }
  });

  // 按日期正序排序
  finalActiveList.sort((a, b) => {
    const dateA = dayjs(a.date).valueOf() || a.id;
    const dateB = dayjs(b.date).valueOf() || b.id;
    return dateA - dateB;
  });

  // 构建云端持久化载荷 (活跃记录 + 未过期的墓碑记录)
  const cloudPayload: (Record & { deletedAt?: number | null })[] = [
    ...finalActiveList,
    ...finalTombstones.map((t) => ({
      id: t.id,
      deletedAt: t.deletedAt,
      type: 'charging' as const,
      oil: 0,
      electric: 0,
      cost: 0,
      kilometerOfDisplay: 0,
      date: t.deletedAt,
      updatedAt: t.deletedAt,
    })),
  ];

  // 4. 计算是否有本地或云端变更
  // 检查本地是否有变动
  const hasLocalChanges =
    finalActiveList.length !== localRecords.length ||
    finalActiveList.some((item, index) => {
      const orig = localRecords[index];
      return orig.id !== item.id || getRecordUpdatedAt(orig) !== getRecordUpdatedAt(item);
    });

  // 检查云端是否有变动
  const remoteMap = new Map<number, CloudRecordItem>();
  remoteRawList.forEach((r) => {
    if (r.id) remoteMap.set(Number(r.id), r);
  });

  let hasCloudChanges = false;
  if (cloudPayload.length !== remoteRawList.length) {
    hasCloudChanges = true;
  } else {
    for (const item of cloudPayload) {
      const rem = remoteMap.get(item.id);
      if (!rem) {
        hasCloudChanges = true;
        break;
      }
      const itemDel = item.deletedAt ? Number(item.deletedAt) : 0;
      const remDel = rem.deletedAt ? Number(rem.deletedAt) : 0;
      if (
        itemDel !== remDel ||
        getRecordUpdatedAt(item) !== getRecordUpdatedAt(rem) ||
        Number(item.cost) !== Number(rem.cost) ||
        Number(item.kilometerOfDisplay) !== Number(rem.kilometerOfDisplay)
      ) {
        hasCloudChanges = true;
        break;
      }
    }
  }

  return {
    mergedActiveRecords: finalActiveList,
    mergedDeletedList: finalTombstones,
    cloudPayload,
    hasLocalChanges,
    hasCloudChanges,
  };
}
