import { FC, useMemo } from 'react'
import { ConfigProvider } from 'antd-mobile'
import dayjs from 'dayjs'
import type { MonthlyStatisticsItemProps } from './types'
import "./style.scss"

const MonthlyStatisticsItem: FC<MonthlyStatisticsItemProps> = (props) => {
  const {
    month,
    mileage,
    refuelingRecords,
    chargingRecords,
    onClick,
  } = props;

  // 使用 useMemo 优化加油数据计算
  const { refuelingAmount, refuelingCost, refuelingCount } = useMemo(() => {
    const refuelingData = refuelingRecords.reduce((acc, record) => {
      acc.amount += record.amount;
      acc.cost += record.cost;
      return acc;
    }, { amount: 0, cost: 0 });

    return {
      refuelingAmount: Number(refuelingData.amount.toFixed(2)),
      refuelingCost: Number(refuelingData.cost.toFixed(2)),
      refuelingCount: refuelingRecords.length
    };
  }, [refuelingRecords]);

  // 使用 useMemo 优化充电数据计算
  const { chargingAmount, chargingCost, chargingCount } = useMemo(() => {
    const chargingData = chargingRecords.reduce((acc, record) => {
      acc.amount += record.amount;
      acc.cost += record.cost;
      return acc;
    }, { amount: 0, cost: 0 });

    return {
      chargingAmount: Number(chargingData.amount.toFixed(2)),
      chargingCost: Number(chargingData.cost.toFixed(2)),
      chargingCount: chargingRecords.length
    };
  }, [chargingRecords]);

  // 计算总花费
  const totalCost = useMemo(() => {
    return Number((refuelingCost + chargingCost).toFixed(2));
  }, [refuelingCost, chargingCost]);

  // 使用 dayjs 格式化月份显示
  const formatMonth = (monthStr: string) => {
    return dayjs(monthStr).format('YYYY年MM月');
  };

  return (
    <ConfigProvider>
      <div className="monthly-statistics-item" onClick={onClick}>
        <div className="statistics-header">
          <span className="month-label">{formatMonth(month)}</span>
          <div className="mileage-section">
            <span className="mileage-label">里程：</span>
            <span className="mileage-value">{mileage || '- '}km</span>
          </div>
        </div>
        
        <div className="statistics-content">
          <div className="energy-stats">
            <div className="energy-item">
              <div className="label-group">
                <span className="label">加油</span>
                <span className="count">
                  <span className="number">{refuelingCount}</span>
                  <span className="text">次</span>
                </span>
              </div>
              <div className="value-group">
                <span className="value">
                  <span className="number" style={{ color: '#1677ff' }}>{refuelingAmount}</span>
                  <span className="unit">L</span>
                </span>
              </div>
            </div>
            <div className="energy-item">
              <div className="label-group">
                <span className="label">充电</span>
                <span className="count">
                  <span className="number">{chargingCount}</span>
                  <span className="text">次</span>
                </span>
              </div>
              <div className="value-group">
                <span className="value">
                  <span className="number" style={{ color: '#52c41a' }}>{chargingAmount}</span>
                  <span className="unit">kWh</span>
                </span>
              </div>
            </div>
          </div>
          
          <div className="cost-formula-row">
            <span className="label">总花费</span>
            <div className="formula">
              <span className="refueling-cost">
                <span className="currency">¥</span>{refuelingCost}
              </span>
              <span className="separator">+</span>
              <span className="charging-cost">
                <span className="currency">¥</span>{chargingCost}
              </span>
              <span className="equals">=</span>
              <span className="total-cost">
                <span className="currency">¥</span>{totalCost}
              </span>
            </div>
          </div>
        </div>
      </div>
    </ConfigProvider>
  );
};

export default MonthlyStatisticsItem
