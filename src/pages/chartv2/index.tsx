import { useEffect, useMemo, useRef, useState } from 'react'
import { Line } from '@ant-design/plots'
import dayjs from 'dayjs'
import { Link } from 'react-router-dom'
import { Button } from 'antd-mobile'
import useRecordStore, { type Record } from '@/store/recordStore'
import StatisticsCard from '@/components/statistics-card'
import PowerNums from './components/power-nums'
import MonthlyMileage from './components/monthly-mileage'
import '../chart/style.scss'

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

  const ITEM_WIDTH = 30
  const chartWidth = useMemo(() => {
    if (!width || uniqueDateCount === 0) return width
    return Math.max(width, uniqueDateCount * ITEM_WIDTH)
  }, [width, uniqueDateCount])

  const config = {
    data: chargingData,
    width: chartWidth,
    height: 260,
    autoFit: false,
    xField: 'date',
    yField: 'value',
    colorField: 'type',
    scale: {
      color: {
        range: ['#1890FF', '#2FC25B', '#FACC14'],
      },
      // 费用和电量共享一个 Y 轴，单价独立一个轴
      y: { min: 0, nice: true },
    },
    // 使用 layer/children 语法来实现双轴效果 (G2 v5)
    children: [
      {
        type: 'line',
        data: chargingData.filter(d => d.type !== '单价'),
        encode: { x: 'date', y: 'value', color: 'type' },
        axis: { y: { title: '费用/电量', position: 'left' } },
        shapeField: 'smooth',
      },
      {
        type: 'line',
        data: chargingData.filter(d => d.type === '单价'),
        encode: { x: 'date', y: 'value', color: 'type' },
        axis: { y: { title: '单价', position: 'right', grid: null } },
        scale: { y: { independent: true, min: 0 } },
        shapeField: 'smooth',
      }
    ],
    animation: {
      appear: {
        animation: 'path-in',
        duration: 1000,
      },
    },
    axis: {
      x: { 
        labelAutoRotate: false,
        labelFormatter: (val: string) => dayjs(val).format('MM/DD'),
      },
    },
    tooltip: {
      title: (data: { date: string }) => {
        return dayjs(data.date).format('YY/MM/DD HH:mm')
      },
      items: [(d: { type: string; value: number; color: string }) => ({ name: d.type, value: d.value, color: d.color })],
    },
    legend: {
      color: { position: 'top', layout: { justifyContent: 'center' } },
    },
  }

  return (
    <div className="chart-scroll-wrapper">
      <div style={{ width: chartWidth }}>
        <Line {...config} />
      </div>
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

  const ITEM_WIDTH = 10
  const chartWidth = useMemo(() => {
    if (!width || data.length === 0) return width
    return Math.max(width, data.length * ITEM_WIDTH)
  }, [width, data.length])

  const config = {
    data,
    width: chartWidth,
    height: 260,
    autoFit: false,
    xField: 'range',
    yField: 'value',
    shapeField: 'smooth',
    scale: {
      y: { min: 0, nice: true },
    },
    tooltip: {
      items: [{ name: '平均费用', channel: 'y' }],
    },
  }

  return (
    <div className="chart-scroll-wrapper">
      <div style={{ width: chartWidth }}>
        <Line {...config} />
      </div>
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
      <div style={{ padding: '16px', textAlign: 'center' }}>
        <Link to="/chart">
          <Button color='primary' fill='outline' size='mini'>
            返回旧版图表
          </Button>
        </Link>
      </div>
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
