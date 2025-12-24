import { useMemo } from 'react'
import F2 from '@antv/f2'
import F2Base from './f2-base'
import dayjs from 'dayjs'
import useRecordStore from '@/store/recordStore'

enum PowerName {
  Charging = '充电',
  Oil = '加油',
}

type PowerData = {
  date: string
  name: PowerName
  value: number
}

const PowerNums = ({
  width,
}: {
  width: number
}) => {
  const { recordList } = useRecordStore()

  const chartId = "power-chart"
  
  const powerData = useMemo(() => {
    const chargingResult: PowerData[] = []
    const oilResult: PowerData[] = []
    recordList.forEach((item) => {
      const date = dayjs(item.date).format('YY/MM')
      if (item.type === 'charging') {
        if (date === chargingResult[chargingResult.length - 1]?.date) {
          chargingResult[chargingResult.length - 1].value += 1
        } else {
          chargingResult.push({
            date,
            name: PowerName.Charging,
            value: 1,
          })
        }
      }
      if (item.type === 'refueling') {
        if (date === oilResult[oilResult.length - 1]?.date) {
          oilResult[oilResult.length - 1].value += 1
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
    chart.source(powerData);
    chart.interval().position('date*value').color('name', (val) => {
      return val === PowerName.Charging ? '#2FC25B' : '#1890FF'
    }).adjust({
      type: 'dodge',
      marginRatio: 0.05 // 设置分组间柱子的间距
    });
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

export default PowerNums
