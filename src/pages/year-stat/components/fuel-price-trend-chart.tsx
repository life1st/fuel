import { Chart, Line, Axis, Tooltip, Area } from '@antv/f2'
import F2Canvas from '@antv/f2-react'
import dayjs from 'dayjs'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const AnyCanvas = F2Canvas as any

interface Props {
  data: { date: number; price: number }[]
}

const FuelPriceTrendChart = ({ data }: Props) => {
  if (!data || data.length === 0) return null

  // F2 移动端图表，X轴如果点太多显示会挤，这里可以 format 一下
  const chartData = data.map(item => ({
    timeStr: dayjs(item.date),
    price: item.price,
    date: item.date
  }));

  return (
    <div style={{ width: '100%', height: '180px' }}>
      <AnyCanvas pixelRatio={window.devicePixelRatio}>
        <Chart data={chartData} scale={{
            date: {
                type: 'timeCat',
                tickCount: 5,
                mask: 'MM-DD'
            },
            price: { nice: true }
        }}>
          <Axis
            field="timeStr"
            tickCount={5}
            style={{
                label: { fontSize: 10 }
            }}
            formatter={(val) => dayjs(val).format('MM-DD')}
          />
          <Axis 
            field="price" 
            tickCount={5}
            style={{
                label: { fontSize: 10 }
            }}
          />
          <Line
            x="timeStr"
            y="price"
            shape="smooth"
            color="#ff8f1f" // Orange for fuel
          />
          <Area
            x="timeStr"
            y="price"
            color="l(90) 0:#ff8f1f 1:rgba(255,143,31,0.1)"
            shape="smooth"
          />
          <Tooltip 
             showItemMarker
             triggerOn='click'
          />
        </Chart>
      </AnyCanvas>
    </div>
  )
}

export default FuelPriceTrendChart
