import Canvas from '@antv/f2-react'
import { Chart, Line, Axis, Tooltip, Legend, ScrollBar } from '@antv/f2'
import dayjs from 'dayjs'
import { Link } from 'react-router-dom'
import { Button } from 'antd-mobile'
import { useEffect, useMemo, useRef, useState } from 'react'
import useRecordStore, { type Record } from '@/store/recordStore'
import StatisticsCard from '@/components/statistics-card'
import PowerNums from './components/power-nums'
import MonthlyMileage from './components/monthly-mileage'
import '../chart/style.scss'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const AnyCanvas = Canvas as any

const ChargingChart = ({ recordList, width }: { recordList: Record[]; width: number }) => {
  const chargingData = useMemo(() => {
    const result: { date: string; value: number; type: string }[] = []
    const sortedList = [...recordList]
      .filter((r) => r.type === 'charging')
      .sort((a, b) => dayjs(a.date).valueOf() - dayjs(b.date).valueOf())

    sortedList.forEach((r) => {
      const fullDate = dayjs(r.date).format('YYYY-MM-DD HH:mm:ss')
      const price = Number((r.cost / r.electric).toFixed(2))
      result.push(
        { date: fullDate, value: Number(r.cost), type: '费用' },
        { date: fullDate, value: price, type: '单价' },
        { date: fullDate, value: r.electric, type: '电量' }
      )
    })
    return result
  }, [recordList])

  const uniqueDateCount = useMemo(() => {
    return new Set(chargingData.map((d) => d.date)).size
  }, [chargingData])

  if (!width || chargingData.length === 0) return null

  const ITEM_WIDTH = 30
  const displayCount = Math.floor(width / ITEM_WIDTH)
  const totalCount = uniqueDateCount
  const end = 1
  const start = Math.max(0, 1 - displayCount / totalCount)

  return (
    <div style={{ width: '100%', height: '260px' }}>
      <AnyCanvas pixelRatio={window.devicePixelRatio}>
        <Chart
          data={chargingData}
          scale={{
            date: { nice: false }
          }}
        >
          <Axis
            field="date"
            tickCount={5}
            formatter={(val: string | number) => dayjs(val).format('MM/DD')}
          />
          <Axis
            field="value"
            tickCount={5}
            position="left"
          />
          {/* F2 v5 实现多轴较为复杂，这里先简化为单轴，或者通过数据缩放模拟。
              由于 F2 v5 的 Line 组件默认绑定到全局 scale，
              这里我们采用统一 Y 轴，但颜色区分。
          */}
          <Line
            x="date"
            y="value"
            color={{
              field: 'type',
              range: ['#1890FF', '#2FC25B', '#FACC14'],
            }}
            shape="smooth"
          />
          <Tooltip showCrosshairs showItemMarker />
          <Legend
            position="top"
            align="center"
          />
          <ScrollBar
            mode="x"
            range={[start, end]}
          />
        </Chart>
      </AnyCanvas >
    </div>
  )
}

const CostPer100KMChart = ({ recordList, width }: { recordList: Record[]; width: number }) => {
  const data = useMemo(() => {
    const result: { range: number; value: number }[] = []
    let costCount = 0
    const sortedList = [...recordList].sort((a, b) => a.kilometerOfDisplay - b.kilometerOfDisplay)

    sortedList.forEach(({ kilometerOfDisplay, cost }) => {
      costCount += Number(cost)
      if (kilometerOfDisplay >= result.length * 100) {
        const value = Number(((costCount / kilometerOfDisplay) * 100).toFixed(2))
        const lens = Math.floor((kilometerOfDisplay - result.length * 100) / 100)
        for (let i = 0; i < lens; i++) {
          result.push({
            range: result.length * 100,
            value,
          })
        }
      }
    })
    return result.filter((r) => r.value < 100)
  }, [recordList])

  if (!width || data.length === 0) return null

  const ITEM_WIDTH = 30
  const displayCount = Math.floor(width / ITEM_WIDTH)
  const totalCount = data.length
  const end = 1
  const start = Math.max(0, 1 - displayCount / totalCount)

  return (
    <div style={{ width: '100%', height: '260px' }}>
      <AnyCanvas pixelRatio={window.devicePixelRatio}>
        <Chart
          data={data}
          scale={{
            range: { nice: false }
          }}
        >
          <Axis field="range" tickCount={5} />
          <Axis field="value" tickCount={5} />
          <Line x="range" y="value" shape="smooth" color="#1890FF" />
          <Tooltip showCrosshairs showItemMarker />
          <ScrollBar
            mode="x"
            range={[start, end]}
          />
        </Chart>
      </AnyCanvas >
    </div>
  )
}

const ChartV2Page = () => {
  const { recordList } = useRecordStore()
  const chartRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState<number>(0)

  useEffect(() => {
    const updateWidth = () => {
      if (chartRef.current) {
        const rect = chartRef.current.getBoundingClientRect()
        setWidth(rect.width)
      }
    }
    updateWidth()
    window.addEventListener('resize', updateWidth)
    return () => {
      window.removeEventListener('resize', updateWidth)
    }
  }, [])

  return (
    <div className='chart-page'>
      <StatisticsCard />
      <div className='content' ref={chartRef} style={{ padding: '0 16px 16px' }}>
        <div className='chart-container'>
          <ChargingChart recordList={recordList} width={width} />
        </div>
        <p className='chart-legend'>充电记录</p>

        <div className='chart-container'>
          <CostPer100KMChart recordList={recordList} width={width} />
        </div>
        <p className='chart-legend'>每百公里平均费用</p>

        <div className='chart-container'>
          <PowerNums recordList={recordList} width={width} />
        </div>
        <p className='chart-legend'>充电加油记录</p>

        <div className='chart-container'>
          <MonthlyMileage recordList={recordList} width={width} />
        </div>
        <p className='chart-legend'>每月行驶里程</p>
      </div>
    </div>
  )
}

export default ChartV2Page
