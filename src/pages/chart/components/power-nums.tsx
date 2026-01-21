import { useMemo } from 'react'
import { Chart, Interval, Axis, Tooltip, Legend, ScrollBar } from '@antv/f2'
import Canvas from '@antv/f2-react'
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const AnyCanvas = Canvas as any

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

  if (!width || powerData.length === 0) return null

  const ITEM_WIDTH = 30
  const displayCount = Math.floor(width / ITEM_WIDTH)
  const totalCount = uniqueDateCount
  const end = 1
  const start = Math.max(0, 1 - displayCount / totalCount)

  return (
    <div style={{ width: '100%', height: '260px' }}>
      <AnyCanvas pixelRatio={window.devicePixelRatio}>
        <Chart data={powerData}>
          <Axis field="date" tickCount={5} />
          <Axis field="value" tickCount={5} />
          <Interval
            x="date"
            y="value"
            color={{
              field: 'name',
              range: ['#2FC25B', '#1890FF'],
            }}
            adjust={{
              type: 'dodge',
              marginRatio: 0.1,
            }}
          />
          <Tooltip showItemMarker />
          <Legend position="top" align="center" />
          <ScrollBar
            mode="x"
            range={[start, end]}
          />
        </Chart>
      </AnyCanvas>
    </div>
  )
}

export default PowerNums
