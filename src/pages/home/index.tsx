import { FC, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { NoticeBar } from 'antd-mobile'
import ConsumptionItem from '@/components/consumption-item'
import EnergyRecordItem from '@/components/energy-record-item'
import FloatButton from '@/components/float-button'
import useRecordStore from '@/store/recordStore'
import demoDeta from '@/utils/demoData.json'
import { usePWAInstall } from '@/utils/pwa'
import './style.scss'

const Home: FC = () => {
  const { recordList } = useRecordStore()
  const navigate = useNavigate()
  const { isStandalone, install } = usePWAInstall()
  const [bannerDismissed, setBannerDismissed] = useState(
    () => localStorage.getItem('pwa_banner_dismissed') === '1'
  )
  const hasData = recordList.length > 0
  const data = useMemo(() => {
    const source = hasData ? recordList : demoDeta
    return source.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((data) => ({ type: 'energy', data }))
  }, [
    recordList,
  ])
  return (
    <div className="home-container">
      {!isStandalone && !bannerDismissed && (
        <div className="pwa-install-banner">
          <NoticeBar
            content="💡 添加到手机主屏幕，享受全屏秒开与离线记账！"
            color="info"
            closeable
            onClose={() => {
              setBannerDismissed(true)
              localStorage.setItem('pwa_banner_dismissed', '1')
            }}
            extra={
              <span
                style={{ color: '#1677ff', fontWeight: 600, cursor: 'pointer', marginLeft: 8 }}
                onClick={install}
              >
                添加
              </span>
            }
          />
        </div>
      )}
      <section className="section">
        <h2>补能统计{!hasData && '(DEMO MODE)'}</h2>
        <div className="energy-list">
          {data.map(({ type, data }, index) => {
            if (type === "consumption") {
              return (
                <ConsumptionItem
                  key={index}
                  {...data}
                  onClick={() => {
                    console.log("consumption clicked:", data);
                  }}
                />
              );
            }
            return (
              <EnergyRecordItem
                key={index}
                {...data}
                onClick={() => {
                  console.log("energy clicked:", data);
                }}
              />
            );
          })}
        </div>
      </section>
      <FloatButton
        onClick={() => {
          void navigate("/record");
        }}
      />
    </div>
  );
}

export default Home 