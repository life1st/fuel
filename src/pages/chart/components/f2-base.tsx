import { useEffect } from 'react'
interface F2BaseProps {
  chartId: string
  width: number
  renderChart: () => void
}

const F2Base = ({
  chartId,
  width,
  renderChart,
}: F2BaseProps) => {

  useEffect(() => {
    if (width) {
      renderChart();
    }
  }, [width]);

  return (
    <div className={`${chartId} chart-container`}>
      <canvas id={chartId} width={width || 100} height="260"></canvas>
    </div>
  )
}

export default F2Base