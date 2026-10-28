import { useMemo } from 'react'
import { Chart, Line, Axis, Tooltip, Area } from '@antv/f2'
import F2Canvas from '@antv/f2-react'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const AnyCanvas = F2Canvas as any

interface Props {
  data: number[] // Sorted electric values
}

const ChargingDistributionChart = ({ data }: Props) => {
  const chartData = useMemo(() => {
    return data.map((val, index) => ({
      index: index + 1,
      value: val
    }))
  }, [data])

  if (!data || data.length === 0) return null

  return (
    <div style={{ width: '100%', height: '180px' }}>
      <AnyCanvas pixelRatio={window.devicePixelRatio}>
        <Chart data={chartData} scale={{
          range: { nice: false }
        }}>
          <Axis
            field="index"
            tickCount={5}
            formatter={() => ``}
          />
          <Axis 
            field="value" 
            tickCount={5} 
          />
          <Line
            x="index"
            y="value"
            shape="smooth"
            color="#52c41a"
          />
          <Area
            x="index"
            y="value"
            color="l(90) 0:#52c41a 1:rgba(22,119,255,0.1)"
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

export default ChargingDistributionChart
