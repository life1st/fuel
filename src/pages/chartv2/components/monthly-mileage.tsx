import { useMemo } from 'react'
import { Column } from '@ant-design/plots'
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

  const ITEM_WIDTH = 20
  const chartWidth = useMemo(() => {
    if (!width || mileageData.length === 0) return width
    return Math.max(width, mileageData.length * ITEM_WIDTH)
  }, [width, mileageData.length])

  const config = {
    data: mileageData,
    xField: 'date',
    yField: 'value',
    width: chartWidth || width || 300,
    height: 260,
    autoFit: false,
    color: '#5B8FF9',
    scale: {
      y: { min: 0, nice: true },
    },
    label: {
      text: '里程',
      position: 'top',
      style: {
        fill: '#888',
        fontSize: 10,
      },
    },
    tooltip: {
      items: [(d: { date: string; value: number }) => ({ name: '里程', value: d.value })]
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

export default MonthlyMileage
