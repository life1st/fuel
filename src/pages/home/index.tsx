import { FC, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import EnergyRecordItem from '@/components/energy-record-item'
import Filter from '@/components/filter'
import useRecordStore from '@/store/recordStore'
import useFilterStore from '@/store/filterStore'
import type { EnergyType } from '@/utils/types'
import demoDeta from '@/utils/demoData.json'
import './style.scss'
import ConsumptionItem from '@/components/consumption-item'

const Home: FC = () => {
  const { recordList } = useRecordStore()
  const { energyType, month } = useFilterStore()
  // const navigate = useNavigate()
  const hasData = recordList?.length > 0
  const data = useMemo(() => {
    const source = hasData ? recordList : demoDeta
    
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
    
    return filteredData
      .sort((a, b) => {
        const dateA = dayjs(a.date);
        const dateB = dayjs(b.date);
        
        if (!dateA.isValid() && !dateB.isValid()) return 0;
        if (!dateA.isValid()) return 1;
        if (!dateB.isValid()) return -1;
        
        return dateB.valueOf() - dateA.valueOf();
      }).map((data) => ({ type: 'energy', data }));
  }, [recordList, energyType, month, hasData])

  return (
    <div className="home-container">
      <section className="section">
        <div className="section-header">
          <h2>补能统计{!hasData && '(DEMO MODE)'}</h2>
          <Filter />
        </div>

        <div className="energy-list">
          {data.map(({ type, data }, index) => {
            if (type === "consumption") {
              return (
                <ConsumptionItem
                  key={index}
                  {...data}
                  onClick={() => {
                    console.log("consumption clicked:", data);
                  }}
                />
              );
            }
            return (
              <EnergyRecordItem
                key={index}
                {...data}
                onClick={() => {
                  console.log("energy clicked:", data);
                }}
              />
            );
          })}
        </div>
      </section>
    </div>
  );
}

export default Home 