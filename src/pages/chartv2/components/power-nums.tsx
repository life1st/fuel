import { useMemo } from 'react'
import { Column } from '@ant-design/plots'
import dayjs from 'dayjs'
import { type Record } from '@/store/recordStore'

enum PowerName {
  Charging = '充电',
  Oil = '加油',
}

interface PowerData {
  date: string
  name: PowerName
  value: number
}

const PowerNums = ({ recordList, width }: { recordList: Record[]; width: number }) => {

  const powerData = useMemo(() => {
    const chargingResult: PowerData[] = []
    const oilResult: PowerData[] = []
    const sortedList = [...recordList].sort((a, b) => dayjs(a.date).valueOf() - dayjs(b.date).valueOf())
    sortedList.forEach((item) => {
      const date = dayjs(item.date).format('YY/MM')
      if (item.type === 'charging') {
        const last = chargingResult[chargingResult.length - 1] as PowerData | undefined
        if (last && date === last.date) {
          last.value += 1
        } else {
          chargingResult.push({
            date,
            name: PowerName.Charging,
            value: 1,
          })
        }
      }
      if (item.type === 'refueling') {
        const last = oilResult[oilResult.length - 1] as PowerData | undefined
        if (last && date === last.date) {
          last.value += 1
        } else {
          oilResult.push({
            date,
            name: PowerName.Oil,
            value: 1,
          })
        }
      }
    })
    return [...chargingResult, ...oilResult].sort((a, b) => {
      const da = a.date.split('/')
      const db = b.date.split('/')
      const diffMonth = Number(da[0]) - Number(db[0])
      if (diffMonth === 0) {
        return Number(da[1]) - Number(db[1])
      }
      return diffMonth
    })
  }, [recordList])

  const uniqueDateCount = useMemo(() => {
    return new Set(powerData.map((d) => d.date)).size
  }, [powerData])

  const ITEM_WIDTH = 60
  const chartWidth = useMemo(() => {
    if (!width || uniqueDateCount === 0) return width
    return Math.max(width, uniqueDateCount * ITEM_WIDTH)
  }, [width, uniqueDateCount])

  const config = {
    data: powerData,
    xField: 'date',
    yField: 'value',
    colorField: 'name',
    group: true,
    width: chartWidth || width || 300,
    height: 260,
    autoFit: false,
    scale: {
      color: {
        domain: [PowerName.Charging, PowerName.Oil],
        range: ['#2FC25B', '#1890FF'],
      },
      y: { min: 0, nice: true },
    },
    tooltip: {
      items: [(d: { name: string; value: number }) => ({ name: d.name, value: d.value })],
    },
  }

  return (
    <div className="chart-scroll-wrapper">
      <div style={{ width: chartWidth }}>
        <Column {...config} />
      </div>
    </div>
  )
}

export default PowerNums
