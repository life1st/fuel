import { FC, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import EnergyRecordItem from '@/components/energy-record-item'
import MonthlyStatisticsItem from '@/components/monthly-statistics-item'
import YearStatEntry from '@/components/year-stat-entry'
import Filter from '@/components/filter'
import useRecordStore from '@/store/recordStore'
import useFilterStore from '@/store/filterStore'
import './style.scss'

const Home: FC = () => {
  const navigate = useNavigate()
  const { recordList } = useRecordStore()
  const { energyType, month, onlySummary } = useFilterStore()

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
        // 在每年第一条数据（正序遍历时）处检查是否需要插入上一年的年度总结？
        // 不，我们是正序遍历，然后reverse显示。要在"最新"（即列表顶部）插入，
        // 则在正序的"最后"（即该年最后一条数据之后）？
        // 或者在"每年最后一条数据"（正序遍历）处理时插入吗？
        // 实际上，我们反转后 "2025年12月" 会在 2025年的最上面。
        // 所以我们需要在正序遍历时，当检测到年份变化（进入下一年），或者数据结束时，插入上一年的统计？
        // 难点：我们希望它在 "2025年12月" (Item) 的 *上方*。
        // 在反转后的列表中，上方意味着在数组的 *后面* (如果我们在 push 之后 reverse)。
        // 让我们看看结构： [...Items, MonthStat, ...Items, MonthStat] -> reverse -> [MonthStat, Items..., MonthStat, Items...]
        // 如果我们要在 MonthStat 之上插入 YearStat，那么在正序数组中，它应该在 MonthStat *之后* push。
        // 也就是当 Month 变化 且 Year 也变化时？

        // 逻辑修正：
        // 检测年份变化。
        // acc.currentYear 记录正在处理的年份
        if (acc.currentYear && acc.currentYear !== currentYear) {
          // 年份发生了变化 (例如从 2024 -> 2025)
          // 这意味着 2024年的数据处理完了。
          // 此时应该插入 2024年的 YearStat (如果符合条件)

          // 下面的 MonthStat 逻辑会先执行，把 2024年12月(或最后月) 的 MonthStat push 进去。
          // 然后我们再 push YearStat。
          // 这样 reverse 后： YearStat, MonthStat(Dec), ... 

          // 注意：下面的 MonthStat 逻辑是检测 Month 变化的。
          // 年份变化必然导致月份变化。所以 MonthStat 逻辑会先触发吗？
          // 看上面的代码：  if (acc.currentMonth && acc.currentMonth !== currentMonth)
          // 是的，年份变了，currentMonth (YYYY-MM) 肯定变了。
          // 所以上面的代码块会先执行，push 'monthodo'。
          // 那么我们只需要在这里（monthodo push之后），再 push 'yearStat' 即可？
          // 但是上面的代码块只是处理"上个月"。
          // 当年份变化时，上个月肯定是以往年份的最后一个月。

          // 我们需要知道"上个月"是不是"上一年"的最后一个月。
          const lastMonthYear = dayjs(acc.currentMonth).year();
          if (lastMonthYear !== currentYear) {
            // 确实跨年了
            const showYearStat = lastMonthYear < now.year() || (lastMonthYear === now.year() && now.month() >= 11);
            if (showYearStat) {
              acc.result.push({
                type: 'yearStat',
                year: lastMonthYear
              });
            }
          }
        }

        // 上面的逻辑需要插入到 MonthStat push 之后。
        // 但 MonthStat 的 push 是在 if (acc.currentMonth ...) 里的。
        // 我们可以复用那个 if 块，或者修改整个结构。
        // 为了最小化修改，我们可以在那里加逻辑。

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
      // 逻辑：如果是过去年份，显示；如果是今年且月份>=11(12月)，显示
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
      <section className="section">
        <div className="section-header">
          <h2>补能统计</h2>
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