import { useMemo } from 'react'
import F2 from '@antv/f2'
import F2Base from './f2-base'
import dayjs from 'dayjs'
import useRecordStore from '@/store/recordStore'

const MonthlyMileage = ({
  width,
}: {
  width: number
}) => {
  const { recordList } = useRecordStore()

  const chartId = "monthly-mileage-chart"

  const mileageData = useMemo(() => {
    let mileageList = recordList.reduce((acc, item) => {
      const date = dayjs(item.date).format('YY/MM')
      if (acc.length === 0) {
        acc.push([{ date, value: item.kilometerOfDisplay }])
      } else {
        let prevDate = acc[acc.length - 1][0].date
        if (date === prevDate) {
          acc[acc.length - 1].push({ date, value: item.kilometerOfDisplay })
        } else {
          acc.push([{ date, value: item.kilometerOfDisplay }])
        }
      }
      return acc
    }, [] as any[])

    return mileageList.map((list, index) => {
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

  const renderChart = () => {
    const chart = new F2.Chart({
      id: chartId,
      pixelRatio: window.devicePixelRatio, // 指定分辨率
    });
    chart.source(mileageData);
    chart.line().position('date*value')
    chart.render();
  }

  return (
    <F2Base
      chartId={chartId}
      width={width}
      renderChart={renderChart}
    />
  );
}

export default MonthlyMileage
