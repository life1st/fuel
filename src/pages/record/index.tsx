import { FC, useEffect, useState, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Selector, Input, Button, Toast } from 'antd-mobile'
import cls from 'classnames'
import CalendarPicker from './calendar-picker'
import useRecordStore, { Record as IRecord } from '@/store/recordStore'
import Navigate from '@/components/navigate'
import './index.scss'

const Record: FC = () => {
  const navigate = useNavigate()
  const params = useParams()
  const locationPromiseRef = useRef<Promise<{ latitude: number; longitude: number } | null> | null>(null)
  const reverseNamePromiseRef = useRef<Promise<string | undefined> | null>(null)
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

  useEffect(() => {
    if (params.id) {
      const record = recordList.find(r => Number(r.id) === Number(params.id))
      if (record) {
        setData(record)
      }
    } else if (!locationPromiseRef.current) {
      locationPromiseRef.current = new Promise((resolveLocation) => {
        if (!navigator.geolocation) {
          return resolveLocation(null);
        }
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            resolveLocation({ latitude, longitude });
            setData(prev => ({ ...prev, location: { latitude, longitude, reverseName: prev.location?.reverseName } }));

            reverseNamePromiseRef.current = new Promise(async (resolveName) => {
              try {
                const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                if (res.ok) {
                  const geoData = await res.json();
                  console.log(geoData)
                  if (geoData && geoData.address) {
                    const address = geoData.address;
                    // Try to get parts like: Street/Suburb -> City/District -> State/Province
                    const parts = [
                      address.road || address.pedestrian || address.street || address.suburb || address.village || address.neighbourhood,
                      address.city || address.town || address.county || address.district,
                      address.state || address.province || address['ISO3166-2-lvl4']
                    ].filter(Boolean);
                    
                    if (parts.length === 3) {
                      const formattedName = parts.join('，');
                      const rName = formattedName.length > 16 ? formattedName.substring(0, 16) + '...' : formattedName;
                      setData(prev => ({ ...prev, location: { latitude, longitude, reverseName: rName } }));
                      return resolveName(rName);
                    } else if (geoData.display_name) {
                      const rName = geoData.display_name.substring(0, 16);
                      setData(prev => ({ ...prev, location: { latitude, longitude, reverseName: rName } }));
                      return resolveName(rName);
                    }
                  }
                }
              } catch (e) {
                console.error('Failed to reverse geocode', e);
              }
              resolveName(undefined);
            });
          },
          (error) => {
            console.error('Failed to get location', error);
            resolveLocation(null);
          },
          { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
      });
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

          let reverseName: string | undefined = undefined;
          if (reverseNamePromiseRef.current) {
            reverseName = await reverseNamePromiseRef.current;
          }
          return { ...locationCoords, reverseName };
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
          <div className="record-form-item location-info" style={{ height: 'auto', padding: '10px 12px', alignItems: 'flex-start', borderTop: '1px dashed #eee' }}>
            <div className="record-form-item-label" style={{ width: '30%' }}>位置：</div>
            {data.location ? (
              <div className="record-form-item-input" style={{ width: '70%', borderBottom: 'none', display: 'flex', flexDirection: 'column', gap: '4px', color: '#666', fontSize: '14px' }}>
                <div>经度：{data.location.longitude.toFixed(6)}</div>
                <div>纬度：{data.location.latitude.toFixed(6)}</div>
                <div>{data.location.reverseName}</div>
              </div>
            ) : '-'}
          </div>
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