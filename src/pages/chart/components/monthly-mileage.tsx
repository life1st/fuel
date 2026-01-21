import { useMemo } from 'react'
import { Chart, Interval, Axis, Tooltip, ScrollBar } from '@antv/f2'
import F2Canvas from '@antv/f2-react'
import dayjs from 'dayjs'
import { type Record } from '@/store/recordStore'

const MonthlyMileage = ({ recordList, width }: { recordList: Record[]; width: number }) => {

  const mileageData = useMemo(() => {
    const sortedList = [...recordList].sort((a, b) => dayjs(a.date).valueOf() - dayjs(b.date).valueOf())
    const mileageList = sortedList.reduce<{ date: string; value: number }[][]>((acc, item) => {
      const date = dayjs(item.date).format('YY/MM')
      if (acc.length === 0) {
        acc.push([{ date, value: item.kilometerOfDisplay }])
      } else {
        const lastGroup = acc[acc.length - 1]
        const prevDate = lastGroup[0].date
        if (date === prevDate) {
          lastGroup.push({ date, value: item.kilometerOfDisplay })
        } else {
          acc.push([{ date, value: item.kilometerOfDisplay }])
        }
      }
      return acc
    }, [])

    return mileageList.map((list: { date: string; value: number }[], index: number) => {
      if (index === 0) {
        return {
          date: list[0].date,
          value: Number(list[list.length - 1].value),
        }
      } else {
        const prevList = mileageList[index - 1]
        const startMileage = prevList[prevList.length - 1].value
        return {
          date: list[0].date,
          value: list[list.length - 1].value - startMileage,
        }
      }
    })
  }, [recordList])

  if (!width || mileageData.length === 0) return null

  const ITEM_WIDTH = 20
  const displayCount = Math.floor(width / ITEM_WIDTH)
  const totalCount = mileageData.length
  const end = 1
  const start = Math.max(0, 1 - displayCount / totalCount)

  return (
    <div style={{ width: '100%', height: '260px' }}>
      <F2Canvas pixelRatio={window.devicePixelRatio}>
        <Chart data={mileageData}>
          <Axis field="date" tickCount={5} />
          <Axis field="value" tickCount={5} />
          <Interval
            x="date"
            y="value"
            color="#5B8FF9"
            size={ITEM_WIDTH}
          />
          <Tooltip showItemMarker />
          <ScrollBar
            mode="x"
            range={[start, end]}
          />
        </Chart>
      </F2Canvas >
    </div>
  )
}

export default MonthlyMileage
