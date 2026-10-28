export interface MonthlyStatisticsItemProps {
  month: string; // 月份，格式如 "2024-01"
  mileage?: number; // 里程
  refuelingRecords: Array<{ amount: number; cost: number }>; // 加油记录数组
  chargingRecords: Array<{ amount: number; cost: number }>; // 充电记录数组
  onClick?: () => void;
}
