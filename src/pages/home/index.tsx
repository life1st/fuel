import { FC, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { NoticeBar } from 'antd-mobile'
import dayjs from 'dayjs'
import EnergyRecordItem from '@/components/energy-record-item'
import MonthlyStatisticsItem from '@/components/monthly-statistics-item'
import YearStatEntry from '@/components/year-stat-entry'
import Filter from '@/components/filter'
import SyncIndicator from '@/components/sync-indicator'
import useRecordStore from '@/store/recordStore'
import useFilterStore from '@/store/filterStore'
import { usePWAInstall } from '@/utils/pwa'
import './style.scss'

const Home: FC = () => {
  const navigate = useNavigate()
  const { recordList } = useRecordStore()
  const { energyType, month, onlySummary } = useFilterStore()
  const { isStandalone, install } = usePWAInstall()
  const [bannerDismissed, setBannerDismissed] = useState(
    () => localStorage.getItem('pwa_banner_dismissed') === '1'
  )

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
        const currentYear = currentDate.year();
        const now = dayjs();
        
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

        // 年度统计入口检查:
        if (acc.currentYear && acc.currentYear !== currentYear) {
          const lastMonthYear = dayjs(acc.currentMonth).year();
          if (lastMonthYear !== currentYear) {
            const showYearStat = lastMonthYear < now.year() || (lastMonthYear === now.year() && now.month() >= 11);
            if (showYearStat) {
              acc.result.push({
                type: 'yearStat',
                year: lastMonthYear
              });
            }
          }
        }

        // 更新当前年份
        acc.currentYear = currentYear;
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
        if (!onlySummary) {
          acc.result.push({ type: 'energy', record });
        }
        
        return acc;
      }, {
        result: [],
        currentMonth: null,
        currentYear: null,
        currentRefuelingRecords: [],
        currentChargingRecords: [],
        currentMileage: 0,
        lastMonthMileage: 0
      } as {
        result: any[],
        currentMonth: string | null,
        currentYear: number | null,
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

      // 处理最后一年的年度统计（如果有）
      const lastYear = dayjs(energyList.currentMonth).year();
      const now = dayjs();
      const showYearStat = lastYear < now.year() || (lastYear === now.year() && now.month() >= 11);

      if (showYearStat) {
        energyList.result.push({
          type: 'yearStat',
          year: lastYear
        });
      }
    }

    return energyList.result.reverse(); // 最后反转整个列表，实现时间倒序显示
  }, [recordList, energyType, month, onlySummary])

  return (
    <div className="home-container">
      {!isStandalone && !bannerDismissed && (
        <div className="pwa-install-banner">
          <NoticeBar
            content="💡 添加到手机主屏幕，享受全屏秒开与离线记账！"
            color="info"
            closeable
            onClose={() => {
              setBannerDismissed(true)
              localStorage.setItem('pwa_banner_dismissed', '1')
            }}
            extra={
              <span
                style={{ color: '#1677ff', fontWeight: 600, cursor: 'pointer', marginLeft: 8 }}
                onClick={install}
              >
                添加
              </span>
            }
          />
        </div>
      )}
      <section className="section">
        <div className="section-header">
          <div className="title-area">
            <h2>补能统计</h2>
            <SyncIndicator />
          </div>
          <Filter />
        </div>
        <div className="energy-list">
          {data.map(({ type, record, ...restData }, index) => {
            if (type === "yearStat") {
              return (
                <YearStatEntry
                  key={`year-stat-${restData.year}`}
                  year={restData.year}
                  onClick={() => navigate(`/year-stat/${restData.year}`)}
                />
              )
            }
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
