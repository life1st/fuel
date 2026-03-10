import { FC, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Selector, Input, Button, Toast } from 'antd-mobile'
import cls from 'classnames'
import CalendarPicker from './calendar-picker'
import useRecordStore, { Record as IRecord } from '@/store/recordStore'
import useLocation from '@/hooks/useLocation'
import Navigate from '@/components/navigate'
import './index.scss'

const Record: FC = () => {
  const navigate = useNavigate()
  const params = useParams()
  const [data, setData] = useState<IRecord>({
    id: 0,
    type: 'charging',
    oil: 0,
    electric: 0,
    cost: 0,
    kilometerOfDisplay: 0,
    date: Date.now(),
  })
  const { setRecordData, removeRecordById, updateRecordById, recordList } = useRecordStore();

  const { location, locationPromiseRef, locationReadyPromiseRef } = useLocation(!params.id);

  useEffect(() => {
    if (params.id) {
      const record = recordList.find(r => Number(r.id) === Number(params.id))
      if (record) {
        setData(record)
      }
    }
  }, [params.id])

  const updateItem = (item: { key: string }, value: string) => {
    setData({
      ...data,
      [item.key]: value,
    });
  };

  const handleDelete = () => {
    if (params.id) {
      removeRecordById(params.id);
      void navigate(-1);
    }
  };

  const handleSubmit = async () => {
    if (params.id) {
      updateRecordById(Number(params.id), data);
      void navigate(-1);
    } else {
      let finalData = { ...data };
      if (locationPromiseRef.current) {

        let toastHandler: ReturnType<typeof Toast.show> | null = null;
        let isResolved = false;

        const combinedPromise = (async () => {
          const locationCoords = await locationPromiseRef.current;
          if (!locationCoords) return null;

          if (locationReadyPromiseRef.current) {
            return await locationReadyPromiseRef.current;
          }
          return locationCoords;
        })();

        const timeoutPromise = new Promise((resolve) => {
          setTimeout(() => {
            if (!isResolved && !toastHandler) {
              toastHandler = Toast.show({
                icon: 'loading',
                content: '正在获取位置...',
                duration: 0,
              });
            }
          }, 100);
          setTimeout(() => resolve(null), 3000)
        });

        const locationResult = await Promise.race([
          combinedPromise,
          timeoutPromise
        ]);

        isResolved = true;
        if (toastHandler) {
          (toastHandler as any).close();
        }

        if (locationResult) {
          finalData = { ...finalData, location: locationResult as any };
        }
      }
      setRecordData(finalData);
      void navigate(-1);
    }
  };

  const displayLocation = params.id ? data.location : location;

  const formData = [
    {
      key: "type",
      label: "类型：",
      value: data.type,
      dataType: "select",
      data: {
        options: [
          { label: "加油", value: "refueling" },
          { label: "充电", value: "charging" },
        ],
      },
    },
    data.type === "refueling" && {
      key: "oil",
      label: "油量：",
      value: data.oil,
      dataType: "number",
      unit: "升",
    },
    data.type === "charging" && {
      key: "electric",
      label: "电量：",
      value: data.electric,
      dataType: "number",
      unit: "度",
    },
    {
      key: "cost",
      label: "费用：",
      value: data.cost,
      dataType: "number",
      unit: "元（CNY）",
    },
    {
      key: "kilometerOfDisplay",
      label: "表显里程：",
      value: data.kilometerOfDisplay,
      dataType: "number",
      unit: "Km",
    },
    {
      key: "date",
      label: "时间",
      value: data.date,
      dataType: "date",
    },
  ].filter((item) => !!item);

  return (
    <div className="record-container">
      <Navigate
        title={params.id ? "编辑记录" : "新增记录"}
        right={
          params.id && (
            <Button
              fill="none"
              onClick={handleDelete}
              style={{ color: "#ff4d4f" }}
            >
              删除
            </Button>
          )
        }
      />
      <div className={cls("type-line", data.type)} />
      <div className="record-content">
        <div className="record-form">
          {formData.map((item) => (
            <div className="record-form-item" key={item.key}>
              <div className="record-form-item-label">{item.label}</div>
              <div className="record-form-item-input">
                {item.dataType === "select" ? (
                  <Selector
                    className={cls("record-form-item-selector", {
                      'charging': item.value === 'charging',
                      'refueling': item.value === 'refueling',
                    })}
                    options={item.data!.options}
                    value={[item.value as string]}
                    onChange={(array) => {
                      updateItem(item, array[0]);
                    }}
                  />
                ) : null}
                {item.dataType === "number" ? (
                  <Input
                    onClick={(e) => {
                      (e.target as HTMLInputElement).select();
                    }}
                    type="number"
                    value={String(item.value)}
                    onChange={(value) => {
                      updateItem(item, value);
                    }}
                  />
                ) : null}
                {item.dataType === "date" ? (
                  <CalendarPicker
                    onChange={(value) => {
                      updateItem(item, value.toString());
                    }}
                    defaultValue={new Date(item.value as number)}
                  />
                ) : null}
                <p className="record-form-item-unit">{item.unit}</p>
              </div>
            </div>
          ))}
          {displayLocation && (
            <div className="record-form-item location-info" style={{ height: 'auto', padding: '10px 12px', alignItems: 'flex-start', borderTop: '1px dashed #eee' }}>
              <div className="record-form-item-label" style={{ width: '30%' }}>位置：</div>
              <div className="record-form-item-input" style={{ width: '70%', borderBottom: 'none', display: 'flex', flexDirection: 'column', gap: '4px', color: '#666', fontSize: '14px' }}>
                <div>经度：{displayLocation.longitude.toFixed(6)}</div>
                <div>纬度：{displayLocation.latitude.toFixed(6)}</div>
                <div>{displayLocation.reverseName || '-'}</div>
              </div>
            </div>
          )}
        </div>
        <Button
          type="submit"
          color="primary"
          className="record-form-submit"
          onClick={handleSubmit}
        >
          提交
        </Button>
      </div>
    </div>
  );
}

export default Record; 