import { FC, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { NavBar, Card } from 'antd-mobile';
import dayjs from 'dayjs';
import useRecordStore from '@/store/recordStore';
import ChargingDistributionChart from './components/charging-distribution-chart';
import './style.scss';

const YearStat: FC = () => {
  const { year } = useParams<{ year: string }>();
  const navigate = useNavigate();
  const { recordList } = useRecordStore();

  const statData = useMemo(() => {
    if (!year) return null;
    const targetYear = parseInt(year, 10);
    
    // Filter records for the target year
    const yearRecords = recordList.filter(record => dayjs(record.date).year() === targetYear);
    
    if (yearRecords.length === 0) return null;

    // Separate refueling and charging records
    const refuelingRecords = yearRecords.filter(r => r.type === 'refueling');
    const chargingRecords = yearRecords.filter(r => r.type === 'charging');

    // Calculate Totals
    const totalCost = yearRecords.reduce((sum, r) => sum + Number(r.cost), 0);
    const totalOil = refuelingRecords.reduce((sum, r) => sum + Number(r.oil), 0);
    const totalElectric = chargingRecords.reduce((sum, r) => sum + Number(r.electric), 0);
    
    // Calculate Mileage
    // Sort by date to find first and last record of the year
    const sortedRecords = [...yearRecords].sort((a, b) => dayjs(a.date).valueOf() - dayjs(b.date).valueOf());
    const startMileage = Number(sortedRecords[0]?.kilometerOfDisplay) || 0;
    const endMileage = Number(sortedRecords[sortedRecords.length - 1]?.kilometerOfDisplay) || 0;
    const totalMileage = endMileage > startMileage ? endMileage - startMileage : 0;
    
    const avgCostPer100Km = totalMileage > 0 ? (totalCost / totalMileage) * 100 : 0;

    // Refueling Extremes
    let maxPriceRecord: any = null;
    let minPriceRecord: any = null;
    let maxVolumeRecord: any = null;
    let totalUnitPrice = 0;
    
    // Helper to calculate unit price
    const getUnitPrice = (record: any) => {
        const cost = Number(record.cost);
        const oil = Number(record.oil);
        // Avoid division by zero
        if (!oil) return 0;
        return cost / oil;
    };

    refuelingRecords.forEach(record => {
        const unitPrice = getUnitPrice(record);
        const volume = Number(record.oil);

        if (unitPrice > 0) {
            totalUnitPrice += unitPrice;
        }

        if (!maxPriceRecord || unitPrice > getUnitPrice(maxPriceRecord)) {
            maxPriceRecord = record;
        }
        if (!minPriceRecord || unitPrice < getUnitPrice(minPriceRecord)) {
            minPriceRecord = record;
        }
        if (!maxVolumeRecord || volume > Number(maxVolumeRecord.oil)) {
            maxVolumeRecord = record;
        }
    });

    const avgFuelPrice = refuelingRecords.length > 0 ? totalUnitPrice / refuelingRecords.length : 0;

    // Charging Analysis
    let maxElectricRecord: any = null;
    const electricValues: number[] = [];

    chargingRecords.forEach(record => {
        const electric = Number(record.electric);
        if (electric > 0) {
            electricValues.push(electric);
            if (!maxElectricRecord || electric > Number(maxElectricRecord.electric)) {
                maxElectricRecord = record;
            }
        }
    });

    // Estimate Battery Capacity
    // Algo: Remove bottom 20% of data, take average of remainder, multiply by 1.1
    let estimatedCapacity = 0;
    if (electricValues.length > 0) {
        // Sort ascending
        electricValues.sort((a, b) => a - b);
        // Calculate index to start slice (remove bottom 20%)
        const startIndex = Math.floor(electricValues.length * 0.2);
        const validValues = electricValues.slice(startIndex);
        
        if (validValues.length > 0) {
            const sum = validValues.reduce((a, b) => a + b, 0);
            const avg = sum / validValues.length;
            estimatedCapacity = avg * 1.2;
        }
    }

    return {
      year: targetYear,
      totalCost,
      totalMileage,
      avgCostPer100Km,
      totalOil,
      totalElectric,
      refuelingCount: refuelingRecords.length,
      chargingCount: chargingRecords.length,
      maxPriceRecord: maxPriceRecord ? { ...maxPriceRecord, unitPrice: getUnitPrice(maxPriceRecord) } : null,
      minPriceRecord: minPriceRecord ? { ...minPriceRecord, unitPrice: getUnitPrice(minPriceRecord) } : null,
      maxVolumeRecord: maxVolumeRecord ? { ...maxVolumeRecord, unitPrice: getUnitPrice(maxVolumeRecord) } : null,
      maxElectricRecord,
      estimatedCapacity,
        electricValues, // Return the sorted array for the chart
        avgFuelPrice
    };
  }, [recordList, year]);

  if (!statData) {
    return (
        <div className="year-stat-page">
            <NavBar onBack={() => navigate(-1)}>年度统计</NavBar>
            <div style={{ padding: 20, textAlign: 'center' }}>
                暂无 {year} 年数据
            </div>
        </div>
    )
  }

  return (
    <div className="year-stat-page">
      <NavBar onBack={() => navigate(-1)}>{year} 年度用车报告</NavBar>
      
      <div className="content">
        <div className="summary-header">
            <div className="main-stat">
                <span className="label">年度总花费</span>
                <span className="value">¥{statData.totalCost.toFixed(2)}</span>
            </div>
            <div className="sub-stats">
                 <div className="stat-item">
                    <span className="label">总里程</span>
                    <span className="value">{statData.totalMileage.toFixed(0)} km</span>
                </div>
                <div className="stat-item">
                    <span className="label">年度平均百公里花费</span>
                    <span className="value">¥{statData.avgCostPer100Km.toFixed(2)}</span>
                </div>
            </div>
        </div>

        <Card title="年度之最 (加油)" className="stat-card">
            {statData.avgFuelPrice > 0 && (
                <div className="record-row">
                    <div className="row-title">平均油价</div>
                    <div className="row-content">
                        <div className="highlight-value">¥{statData.avgFuelPrice.toFixed(2)}/L</div>
                    </div>
                </div>
            )}
            {statData.maxPriceRecord && (
                <div className="record-row">
                    <div className="row-title">单价最高</div>
                    <div className="row-content">
                        <div className="highlight-value">¥{statData.maxPriceRecord.unitPrice.toFixed(2)}/L</div>
                        <div className="date">{dayjs(statData.maxPriceRecord.date).format('MM-DD')}</div>
                    </div>
                </div>
            )}
             {statData.minPriceRecord && (
                <div className="record-row">
                    <div className="row-title">单价最低</div>
                    <div className="row-content">
                        <div className="highlight-value">¥{statData.minPriceRecord.unitPrice.toFixed(2)}/L</div>
                        <div className="date">{dayjs(statData.minPriceRecord.date).format('MM-DD')}</div>
                    </div>
                </div>
            )}
             {statData.maxVolumeRecord && (
                <div className="record-row">
                    <div className="row-title">单次加油最多</div>
                    <div className="row-content">
                        <div className="highlight-value">{Number(statData.maxVolumeRecord.oil).toFixed(2)} L</div>
                        <div className="date">¥{statData.maxVolumeRecord.unitPrice.toFixed(2)}/L · {dayjs(statData.maxVolumeRecord.date).format('MM-DD')}</div>
                    </div>
                </div>
            )}
            {!statData.maxPriceRecord && <div className="empty-tip">本年度无加油记录</div>}
        </Card>
        
        {(statData.maxElectricRecord || statData.estimatedCapacity > 0) && (
            <Card title="年度之最 (充电)" className="stat-card">
                {statData.maxElectricRecord && (
                    <div className="record-row">
                        <div className="row-title">单次充电最多</div>
                        <div className="row-content">
                            <div className="highlight-value">{Number(statData.maxElectricRecord.electric).toFixed(2)} kWh</div>
                            <div className="date">{dayjs(statData.maxElectricRecord.date).format('MM-DD')}</div>
                        </div>
                    </div>
                )}
                {statData.estimatedCapacity > 0 && (
                    <div className="record-row">
                        <div className="row-title">预估电池容量</div>
                        <div className="row-content">
                            <div className="highlight-value">{statData.estimatedCapacity.toFixed(2)} kWh</div>
                            <div className="date">基于年度数据估算</div>
                        </div>
                    </div>
                )}

                {statData.electricValues.length > 0 && (
                    <div>
                        <div style={{ padding: '10px 0' }}>
                            <ChargingDistributionChart data={statData.electricValues} />
                        </div>
                        <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--adm-color-weak)', marginTop: 8 }}>
                            X轴：单次充电量从低到高 / Y轴：充电量 (kWh)
                        </div>
                    </div>
                )}
            </Card>
        )}

        <Card title="补能统计" className="stat-card">
            <div className="type-stat">
                <div className="type-header">
                    <span className="type-name">加油</span>
                    <span className="count">共 <span className="num refueling">{statData.refuelingCount}</span> 次</span>
                </div>
                <div className="type-details">
                    <span>总量: {statData.totalOil.toFixed(2)} L</span>
                </div>
            </div>
            <div className="divider" />
            <div className="type-stat">
                <div className="type-header">
                    <span className="type-name">充电</span>
                    <span className="count">共 <span className="num charging">{statData.chargingCount}</span> 次</span>
                </div>
                <div className="type-details">
                    <span>总量: {statData.totalElectric.toFixed(2)} kWh</span>
                </div>
            </div>
        </Card>

      </div>
    </div>
  );
};

export default YearStat;
