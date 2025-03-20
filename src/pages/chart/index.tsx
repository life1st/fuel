import { useEffect, useMemo, useRef, useState } from 'react'
import F2, { LegendItem } from "@antv/f2";
import dayjs from 'dayjs'
import useRecordStore, { type Record } from '@/store/recordStore'
import StatisticsCard from '@/components/statistics-card'
import './style.scss'

const BasicChart = ({
  recordList,
  width,
}: {
  recordList: Record[];
  width: number;
}) => {
  const chartId = useRef(String(Date.now()));

  const chargingData = useMemo(() => {
    const result: {
      date: string;
      value: number;
      type: string;
    }[] = [];
    recordList
      .filter((r) => r.type === "charging")
      .forEach((r) => {
        const date = dayjs(r.date).format("MM/DD");
        result.push(
          {
            date,
            value: Number(r.cost),
            type: "费用",
          },
          {
            date,
            value: Number((r.cost / r.electric).toFixed(2)),
            type: "单价",
          },
          {
            date,
            value: r.electric,
            type: "电量",
          }
        );
      });
    return result;
  }, [recordList]);

  const renderChart = () => {
    const chart = new F2.Chart({
      id: chartId.current,
      pixelRatio: window.devicePixelRatio, // 指定分辨率
    });
    chart.source(chargingData, {
      cost: {
        tickCount: 5,
        min: 0,
      },
    });
    chart.tooltip({
      custom: true, // 自定义 tooltip 内容框
      onChange: function onChange(obj) {
        const legend = chart.get("legendController").legends.top![0];
        const tooltipItems = obj.items;
        const legendItems = legend.items;
        const map = new Map();
        legendItems.forEach(function (item) {
          map.set(item.name, { ...item });
        });
        tooltipItems.forEach(function (item) {
          const name = item.name;
          const value = item.value;
          if (map.get(name)) {
            map.set(name, { ...item, value });
          }
        });
        legend.setItems(Array.from(map.values()) as LegendItem[]);
      },
      onHide: function onHide() {
        const legend = chart.get("legendController").legends.top![0];
        legend.setItems(chart.getLegendItems().type ?? []);
      },
    });
    chart.line().position("date*value").color("type");

    chart.render();
  };
  useEffect(() => {
    if (width) {
      renderChart();
    }
  }, [width]);

  return (
    <div className="basic-chart chart-container">
      <canvas id={chartId.current} width={width || 100} height="260"></canvas>
    </div>
  );
};

const CostPer100KMChart = ({
  recordList,
  width,
}: {
  recordList: Record[];
  width: number;
}) => {
  const chartId = "per-cost-chart";
  const data = useMemo(() => {
    const result: {
      range: number;
      value: number;
    }[] = [];
    let costCount = 0;
    recordList.forEach(({ kilometerOfDisplay, cost }) => {
      costCount += Number(cost);
      if (kilometerOfDisplay >= result.length * 100) {
        result.push({
          range: result.length * 100,
          value: Number(((costCount / kilometerOfDisplay) * 100).toFixed(2)),
        });
      }
    });
    return result.filter((r) => r.value < 100);
  }, [recordList]);

  const renderChart = () => {
    const chart = new F2.Chart({
      id: chartId,
      pixelRatio: window.devicePixelRatio, // 指定分辨率
    });
    chart.source(data, {
      range: {
        tickCount: 5,
      },
      value: {
        alias: "平均花费",
      },
    });
    chart.line().position("range*value").shape("smooth");

    chart.render();
  };
  useEffect(() => {
    if (width) {
      renderChart();
    }
  }, [width]);

  return (
    <div className="per-cost-chart chart-container">
      <canvas id={chartId} width={width || 100} height="260"></canvas>
    </div>
  );
};

const ChartPage = () => {
  const { recordList } = useRecordStore()
  const chartRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState<number>(0)

  useEffect(() => {
    const updateWidth = () => {
      const rect = chartRef.current!.getBoundingClientRect()
      setWidth(rect.width - 32)
    }
    if (chartRef.current) {
      updateWidth()
    }
    window.addEventListener('resize', updateWidth)
    return () => {
      window.removeEventListener('resize', updateWidth)
    }
  }, [chartRef])
  return (
    <div className='chart-page'>
      <StatisticsCard />
      <div className='content' ref={chartRef}>
        <BasicChart recordList={recordList} width={width} />
        <p className='chart-legend'>充电记录</p>
        <CostPer100KMChart recordList={recordList} width={width} />
        <p className='chart-legend'>每百公里平均费用</p>
      </div>
    </div>
  )
}

export default ChartPage 