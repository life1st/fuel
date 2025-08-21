import dayjs from 'dayjs';

/**
 * 将任意日期格式转换为时间戳
 * 支持时间戳数字、日期字符串、Date对象
 */
export const toTimestamp = (date: string | number | Date | undefined): number => {
  if (date === undefined || date === null) {
    return Date.now();
  }

  // 如果已经是数字且是有效时间戳，直接返回
  if (typeof date === 'number' && !isNaN(date) && date > 0) {
    return date;
  }

  // 尝试使用 dayjs 解析
  const dayjsDate = dayjs(date);
  if (dayjsDate.isValid()) {
    return dayjsDate.valueOf();
  }

  // 如果无法解析，返回当前时间
  return Date.now();
};

/**
 * 格式化时间戳为指定格式
 */
export const formatDate = (timestamp: number | string | Date, format: string = 'YYYY-MM-DD'): string => {
  const ts = toTimestamp(timestamp);
  return dayjs(ts).format(format);
};

/**
 * 检查两个日期是否在同一个月
 */
export const isSameMonth = (date1: number | string | Date, date2: number | string | Date): boolean => {
  const d1 = dayjs(toTimestamp(date1));
  const d2 = dayjs(toTimestamp(date2));
  return d1.year() === d2.year() && d1.month() === d2.month();
};

/**
 * 获取当前月份的开始时间戳
 */
export const getMonthStart = (date: number | string | Date): number => {
  return dayjs(toTimestamp(date)).startOf('month').valueOf();
};

/**
 * 获取当前月份的结束时间戳
 */
export const getMonthEnd = (date: number | string | Date): number => {
  return dayjs(toTimestamp(date)).endOf('month').valueOf();
};
