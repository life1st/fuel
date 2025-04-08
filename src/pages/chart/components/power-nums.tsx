import { useEffect, useMemo, useRef } from 'react'
import F2 from '@antv/f2'
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

  const chartId = useRef(String(Date.now()));
  
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

  const renderChart = () => {
    const chart = new F2.Chart({
      id: chartId.current,
      pixelRatio: window.devicePixelRatio, // 指定分辨率
    });
    chart.source(powerData);
    chart.interval().position('date*value').color('name').adjust({
      type: 'dodge',
      marginRatio: 0.05 // 设置分组间柱子的间距
    });
    chart.render();
  }

  useEffect(() => {
    if (width) {
      renderChart();
    }
  }, [width]);

  return (
    <div className="power-chart chart-container">
      <canvas id={chartId.current} width={width || 100} height="260"></canvas>
    </div>
  );
}

export default PowerNums
