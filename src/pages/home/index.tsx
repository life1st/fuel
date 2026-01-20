import { FC, useMemo } from 'react'
import dayjs from 'dayjs'
import EnergyRecordItem from '@/components/energy-record-item'
import MonthlyStatisticsItem from '@/components/monthly-statistics-item'
import Filter from '@/components/filter'
import useRecordStore from '@/store/recordStore'
import useFilterStore from '@/store/filterStore'
import './style.scss'

const Home: FC = () => {
  const { recordList } = useRecordStore()
  const { energyType, month } = useFilterStore()

  const data = useMemo(() => {
    const source = recordList
    
    // 应用筛选条件
    const filteredData = source.filter(record => {
      // 筛选能源类型
      if (energyType !== 'all' && record.type !== energyType) {
        return false;
      }
      
      // 筛选月份
      if (month) {
        const recordDate = dayjs(record.date);
        const filterMonth = dayjs(month);
        if (
          !recordDate.isValid() ||
          recordDate.year() !== filterMonth.year() || 
          recordDate.month() !== filterMonth.month()
        ) {
          return false;
        }
      }
      
      return true;
    });
    
    const energyList = filteredData
      .sort((a, b) => {
        const dateA = dayjs(a.date);
        const dateB = dayjs(b.date);
        
        if (!dateA.isValid() && !dateB.isValid()) return 0;
        if (!dateA.isValid()) return 1;
        if (!dateB.isValid()) return -1;
        
        return dateA.valueOf() - dateB.valueOf(); // 改为正序
      })
      .reduce((acc, record) => {
        const currentDate = dayjs(record.date);
        const currentMonth = currentDate.format('YYYY-MM');
        
        // 如果当前记录属于新的月份，先处理上个月的月度统计
        if (acc.currentMonth && acc.currentMonth !== currentMonth) {
          // 计算本月里程：本月最后里程 - 上个月最后里程
          const monthlyMileage = acc.currentMileage - acc.lastMonthMileage;
          
          // 添加月度统计数据
          acc.result.push({
            type: 'monthodo',
            month: acc.currentMonth,
            refuelingRecords: acc.currentRefuelingRecords,
            chargingRecords: acc.currentChargingRecords,
            mileage: monthlyMileage
          });
          
          // 保存本月最后里程作为下个月的上个月里程
          acc.lastMonthMileage = acc.currentMileage;
          
          // 清空当前月份的数据，重新开始计算
          acc.currentRefuelingRecords = [];
          acc.currentChargingRecords = [];
          acc.currentMileage = 0;
        }
        
        // 更新当前月份标识
        acc.currentMonth = currentMonth;
        
        // 根据记录类型分类数据
        if (record.type === 'refueling') {
          acc.currentRefuelingRecords.push({
            amount: Number(record.oil) || 0,
            cost: Number(record.cost) || 0
          });
        } else if (record.type === 'charging') {
          acc.currentChargingRecords.push({
            amount: Number(record.electric) || 0,
            cost: Number(record.cost) || 0
          });
        }
        
        // 记录当前月份的最后一条记录的里程
        acc.currentMileage = record.kilometerOfDisplay || 0;
        
        // 添加能源记录
        acc.result.push({ type: 'energy', record });
        
        return acc;
      }, {
        result: [],
        currentMonth: null,
        currentRefuelingRecords: [],
        currentChargingRecords: [],
        currentMileage: 0,
        lastMonthMileage: 0
      } as {
        result: any[],
        currentMonth: string | null,
        currentRefuelingRecords: any[],
        currentChargingRecords: any[],
        currentMileage: number,
        lastMonthMileage: number 
      });

    // 处理最后一个月的月度统计数据
    if (energyList.currentMonth && 
        (energyList.currentRefuelingRecords.length > 0 || energyList.currentChargingRecords.length > 0)) {
      // 计算最后一个月里程：本月最后里程 - 上个月最后里程
      const lastMonthlyMileage = energyList.currentMileage - energyList.lastMonthMileage;
      
      energyList.result.push({
        type: 'monthodo',
        month: energyList.currentMonth,
        refuelingRecords: energyList.currentRefuelingRecords,
        chargingRecords: energyList.currentChargingRecords,
        mileage: lastMonthlyMileage
      });
    }

    return energyList.result.reverse(); // 最后反转整个列表，实现时间倒序显示
  }, [recordList, energyType, month])

  return (
    <div className="home-container">
      <section className="section">
        <div className="section-header">
          <h2>补能统计</h2>
          <Filter />
        </div>
        <div className="energy-list">
          {data.map(({ type, record, ...restData }, index) => {
            if (type === "monthodo") {
              return (
                <MonthlyStatisticsItem
                  key={`month-${index}`}
                  {...restData}
                  mileage={energyType !== 'all' ? null : restData.mileage}
                  onClick={() => {
                    console.log("月度统计点击:", month);
                  }}
                />
              );
            }
            if (type === "energy") {
              return (
                <EnergyRecordItem
                  key={index}
                  {...record}
                  onClick={() => {
                    console.log("energy clicked:", restData);
                  }}
                />
              );
            }
            return null
          })}
        </div>
      </section>
    </div>
  );
}

export default Home 