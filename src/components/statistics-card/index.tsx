import { FC, useMemo } from 'react';
import { Toast } from 'antd-mobile';
import { InformationCircleOutline } from 'antd-mobile-icons';
import useRecordStore, { Record } from '@/store/recordStore';
import useSettingStore from '@/store/setting-store';
import './style.scss';

interface StatisticsCardProps {
  recordList?: Record[];
  startMileage?: number;
}

const StatisticsCard: FC<StatisticsCardProps> = ({ recordList: propsRecordList, startMileage }) => {
  const { recordList: storeRecordList } = useRecordStore();
  const { isOptimizeCost } = useSettingStore();
  const recordList = propsRecordList || storeRecordList;

  const statistics = useMemo(() => {
    // 按时间排序，找到最早和最新的里程数
    const sortedRecords = [...recordList].sort((a: Record, b: Record) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const lastRecord = sortedRecords[sortedRecords.length - 1];

    // 计算总里程
    const latestOdo = lastRecord?.kilometerOfDisplay ?? 0;
    const totalKilometers = startMileage !== undefined ? Math.max(0, latestOdo - startMileage) : latestOdo;

    let recordsForStats = sortedRecords;
    if (isOptimizeCost && lastRecord?.type === 'refueling') {
      recordsForStats = sortedRecords.slice(0, -1);
    }

    // 分别统计加油和充电的总花费
    const statisticsNums = recordsForStats.reduce((acc: any, record: Record) => {
        if (record.type === 'refueling') {
          acc.refuelingCost += Number(record.cost);

          acc.equalOilCount += Number(record.oil);
        } else {
          acc.chargingCost += Number(record.cost);
          
          acc.equalElecCount += Number(record.electric);
        }
        return acc;
      }, 
    { refuelingCost: 0, chargingCost: 0, equalOilCount: 0, equalElecCount: 0 });

    return {
      ...statisticsNums,
      totalKilometers,
    };
  }, [recordList, isOptimizeCost, startMileage]);

  // 计算每百公里平均花费
  const averageCostPer100km = useMemo(() => {
    if (statistics.totalKilometers <= 0) return 0;
    const totalCost = statistics.refuelingCost + statistics.chargingCost;
    return (totalCost / statistics.totalKilometers) * 100;
  }, [statistics]);

  const { refuelingCost, chargingCost, equalOilCount, equalElecCount } = statistics

  return (
    <div className="statistics-card">
      <h3 className="statistics-title">能源消耗统计</h3>
      <div className="statistics-content">
        <div className="statistics-item">
          <span className="label">
            每百公里平均花费
            {isOptimizeCost && (
              <InformationCircleOutline
                style={{ marginLeft: 4, color: '#1890ff' }}
                onClick={() => Toast.show({ content: '已开启优化计算', position: 'bottom' })}
              />
            )}
          </span>
          <span className="value">{averageCostPer100km.toFixed(2)} 元</span>
        </div>
        <div className="statistics-details">
          <div className="statistics-item">
            <span className="label">补能总量：</span>
            <span className="value">
              <span className="oil">{equalOilCount.toFixed(2)}</span> L +
              <span className="charge">{equalElecCount.toFixed(2)}</span> kWh
            </span>
          </div>
          <div className="statistics-item">
            <span className="label">
              等效：
            </span>
            <div className="value">
              <span className="oil">{(equalOilCount + equalElecCount / 3.5).toFixed(2)}</span> L /
              <span className="charge">{(equalElecCount + equalOilCount * 3.5).toFixed(2)}</span> kWh
            </div>
          </div>
        </div>
        <div className="statistics-details">
          <div className="statistics-item">
            <span className="label">
              总花费：
            </span>
            <div className="mid-label">
              <span className="oil">{refuelingCost.toFixed(2)}</span> 元 +
              <span className="charge">{chargingCost.toFixed(2)}</span> 元
            </div>
            <span className="value">{(refuelingCost + chargingCost).toFixed(2)}元</span>
          </div>
          <div className="statistics-item">
            <span className="label">总里程</span>
            <span className="value">{statistics.totalKilometers} km</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatisticsCard; 