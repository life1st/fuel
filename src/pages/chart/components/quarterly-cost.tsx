import { useMemo } from 'react'
import { Chart, Line, Interval, Axis, Tooltip, Legend, ScrollBar } from '@antv/f2'
import F2Canvas from '@antv/f2-react'
import dayjs from 'dayjs'
import { type Record } from '@/store/recordStore'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const AnyCanvas = F2Canvas as any

const QuarterlyCost = ({ recordList, width, startMileage }: { recordList: Record[]; width: number; startMileage: number }) => {

  const { barData, lineData } = useMemo(() => {
    const sortedList = [...recordList].sort((a, b) => dayjs(a.date).valueOf() - dayjs(b.date).valueOf())
    
    // 按季度分组记录
    const quarterGroups = sortedList.reduce<{ [key: string]: Record[] }>((acc, r) => {
      const q = `${dayjs(r.date).year()}-Q${Math.floor(dayjs(r.date).month() / 3) + 1}`
      if (!acc[q]) acc[q] = []
      acc[q].push(r)
      return acc
    }, {})

    // 收集原始数据
    const rawStats: any[] = []
    Object.keys(quarterGroups).sort().forEach(qKey => {
      const qRecords = quarterGroups[qKey]
      const sumCost = qRecords.reduce((s, r) => s + Number(r.cost), 0)
      const lastRec = qRecords[qRecords.length - 1]
      
      const firstRecIdx = sortedList.indexOf(qRecords[0])
      let deltaKm = 0
      if (firstRecIdx > 0) {
        const prevRec = sortedList[firstRecIdx - 1]
        deltaKm = Number(lastRec.kilometerOfDisplay) - Number(prevRec.kilometerOfDisplay)
      } else {
        deltaKm = Number(lastRec.kilometerOfDisplay) - startMileage
      }

      if (deltaKm > 0) {
        rawStats.push({
          quarter: qKey,
          mileage: deltaKm,
          totalCost: Number(sumCost.toFixed(2)),
          avgCost: Number(((sumCost / deltaKm) * 100).toFixed(2))
        })
      }
    })

    if (rawStats.length === 0) return { barData: [], lineData: [] }

    // 计算柱状图维度的最大值用于归一化
    const maxMileage = Math.max(...rawStats.map(s => s.mileage)) || 1
    const maxTotalCost = Math.max(...rawStats.map(s => s.totalCost)) || 1

    const bData: any[] = []
    const lData: any[] = []

    rawStats.forEach(s => {
      // 柱状图归一化
      bData.push(
        { 
          quarter: s.quarter, 
          type: '里程', 
          val: s.mileage, 
          normalizedVal: Number(((s.mileage / maxMileage) * 100).toFixed(2)) 
        },
        { 
          quarter: s.quarter, 
          type: '总花费', 
          val: s.totalCost, 
          normalizedVal: Number(((s.totalCost / maxTotalCost) * 100).toFixed(2)) 
        }
      )
      // 折线图直接使用原始数值
      lData.push({ 
        quarter: s.quarter, 
        costPer100: s.avgCost
      })
    })

    return { barData: bData, lineData: lData }
  }, [recordList, startMileage])

  if (!width || barData.length === 0) return null

  const ITEM_WIDTH = 40
  const displayCount = Math.floor(width / ITEM_WIDTH)
  const totalCount = lineData.length
  const end = 1
  const start = Math.max(0, 1 - displayCount / totalCount)

  return (
    <>
      {/* 图表1: 季度里程与总花费 (归一化柱状图) */}
      <div style={{ width: '100%', height: '260px', marginBottom: '16px' }}>
        <AnyCanvas pixelRatio={window.devicePixelRatio}>
          <Chart 
            data={barData}
            scale={{
              normalizedVal: { min: 0, max: 100 }
            }}
          >
            <Axis field="quarter" tickCount={5} />
            
            <Interval
              x="quarter"
              y="val"
              color={{
                field: 'type',
                range: ['#5B8FF9', '#2FC25B'],
              }}
              adjust={{
                type: 'dodge',
                marginRatio: 0.1,
              }}
            />
            <Tooltip 
              showItemMarker
              triggerOn='click'
            />
            <Legend
              position="top"
            />
            <ScrollBar
              mode="x"
              range={[start, end]}
            />
          </Chart>
        </AnyCanvas>
      </div>

      {/* 图表2: 均耗趋势 (独立折线图) */}
      <div style={{ width: '100%', height: '130px' }}>
        <AnyCanvas pixelRatio={window.devicePixelRatio}>
          <Chart data={lineData}>
            <Axis field="quarter" tickCount={5} />
            <Axis 
              field="costPer100" 
              tickCount={3} 
              formatter={(val) => `${val}`}
            />
            <Line
              x="quarter"
              y="costPer100"
              color="#FACC14"
              shape="smooth"
            />
            <Tooltip 
              showItemMarker 
              // @ts-ignore
              onChange={(ev: any) => {
                const { items } = ev;
                if (!items) return;
                items.forEach((item: any) => {
                  item.name = '均耗';
                  item.value = `${item.origin.costPer100} 元/百公里`;
                });
              }}
            />
            <ScrollBar
              mode="x"
              range={[start, end]}
            />
          </Chart>
        </AnyCanvas>
      </div>
    </>
  )
}

export default QuarterlyCost
