import { describe, it, expect } from 'vitest';
import { mergeRecordCollections, getRecordUpdatedAt, CloudRecordItem } from '../merge';
import type { Record } from '@/store/recordStore';

describe('Gist Sync - mergeRecordCollections 双向合并算法', () => {
  const sampleRecord1: Record = {
    id: 1001,
    type: 'refueling',
    oil: 30,
    electric: 0,
    cost: 200,
    kilometerOfDisplay: 1000,
    date: '2025-01-01',
    updatedAt: 1735689600000,
  };

  const sampleRecord2: Record = {
    id: 1002,
    type: 'charging',
    oil: 0,
    electric: 40,
    cost: 50,
    kilometerOfDisplay: 1200,
    date: '2025-01-05',
    updatedAt: 1736035200000,
  };

  it('应该能平滑兼容没有 updatedAt 的旧历史记录', () => {
    const oldRecord: Partial<Record> = {
      id: 9999,
      date: '2025-01-10',
    };
    const ts = getRecordUpdatedAt(oldRecord);
    expect(ts).toBeGreaterThan(0);
  });

  it('场景 1: 本地为空，远程有数据 -> 完整拉取合并到本地活跃列表', () => {
    const result = mergeRecordCollections({
      localRecords: [],
      localDeleted: [],
      remoteRawList: [sampleRecord1, sampleRecord2],
    });

    expect(result.mergedActiveRecords).toHaveLength(2);
    expect(result.mergedActiveRecords.map((r) => r.id)).toEqual([1001, 1002]);
    expect(result.hasLocalChanges).toBe(true);
    expect(result.hasCloudChanges).toBe(false);
  });

  it('场景 2: 本地有新增记录，远程为空 -> 正确保留并在云端载荷中体现', () => {
    const result = mergeRecordCollections({
      localRecords: [sampleRecord1],
      localDeleted: [],
      remoteRawList: [],
    });

    expect(result.mergedActiveRecords).toHaveLength(1);
    expect(result.mergedActiveRecords[0].id).toBe(1001);
    expect(result.hasLocalChanges).toBe(false);
    expect(result.hasCloudChanges).toBe(true);
    expect(result.cloudPayload.some((r) => r.id === 1001)).toBe(true);
  });

  it('场景 3: 冲突仲裁 (LWW) -> 同一记录被双端修改，保留 updatedAt 较新的版本', () => {
    const localVersion: Record = {
      ...sampleRecord1,
      cost: 220,
      updatedAt: 20000, // 较新
    };

    const remoteVersion: Record = {
      ...sampleRecord1,
      cost: 210,
      updatedAt: 10000, // 较旧
    };

    const result = mergeRecordCollections({
      localRecords: [localVersion],
      localDeleted: [],
      remoteRawList: [remoteVersion],
    });

    expect(result.mergedActiveRecords).toHaveLength(1);
    expect(result.mergedActiveRecords[0].cost).toBe(220);
    expect(result.hasCloudChanges).toBe(true); // 本地较新，需要写回云端
  });

  it('场景 4: 墓碑删除同步 -> 本地删除某记录后，合并后不应被云端数据复活', () => {
    const now = Date.now();
    const deletedTime = now - 1000;
    const remoteVersion: Record = {
      ...sampleRecord1,
      updatedAt: now - 5000, // 早于删除时间
    };

    const result = mergeRecordCollections({
      localRecords: [],
      localDeleted: [{ id: 1001, deletedAt: deletedTime }],
      remoteRawList: [remoteVersion],
    });

    // 活跃列表不应包含 1001
    expect(result.mergedActiveRecords).toHaveLength(0);
    // 墓碑应被保留在云端载荷中传递
    expect(result.mergedDeletedList).toEqual([{ id: 1001, deletedAt: deletedTime }]);
    expect(result.cloudPayload.some((r) => r.id === 1001 && r.deletedAt === deletedTime)).toBe(
      true
    );
  });

  it('场景 5: 远端删除同步 -> 远端带有 deletedAt 墓碑时，本地活跃记录应被剔除', () => {
    const now = Date.now();
    const remoteTombstone: CloudRecordItem = {
      ...sampleRecord2,
      deletedAt: now - 1000,
    };

    const localActive: Record = {
      ...sampleRecord2,
      updatedAt: now - 5000, // 早于远端删除时间
    };

    const result = mergeRecordCollections({
      localRecords: [localActive],
      localDeleted: [],
      remoteRawList: [remoteTombstone],
    });

    expect(result.mergedActiveRecords).toHaveLength(0);
    expect(result.hasLocalChanges).toBe(true);
    expect(result.mergedDeletedList.some((d) => d.id === 1002)).toBe(true);
  });

  it('场景 6: 删除后重新建立 -> 若 updatedAt 大于 deletedAt，则重新复活', () => {
    const now = Date.now();
    const recreateRecord: Record = {
      ...sampleRecord1,
      cost: 300,
      updatedAt: now, // 晚于删除时间
    };

    const result = mergeRecordCollections({
      localRecords: [recreateRecord],
      localDeleted: [{ id: 1001, deletedAt: now - 10000 }],
      remoteRawList: [],
    });

    expect(result.mergedActiveRecords).toHaveLength(1);
    expect(result.mergedActiveRecords[0].cost).toBe(300);
    expect(result.mergedDeletedList).toHaveLength(0);
  });

  it('场景 7: 墓碑过期垃圾回收 (GC) -> 超过指定天数的墓碑不再保留', () => {
    const expiredDeletedAt = Date.now() - 70 * 24 * 60 * 60 * 1000; // 70天前
    const result = mergeRecordCollections({
      localRecords: [],
      localDeleted: [{ id: 8888, deletedAt: expiredDeletedAt }],
      remoteRawList: [],
      tombstoneMaxAgeDays: 60,
    });

    expect(result.mergedActiveRecords).toHaveLength(0);
    expect(result.mergedDeletedList).toHaveLength(0);
  });
});
