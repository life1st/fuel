import { useMemo } from 'react'
import FloatButton from '@/components/float-button'
import { useLocation, useNavigate } from 'react-router-dom'
import { UnorderedListOutline, HistogramOutline, SetOutline } from 'antd-mobile-icons'
import './style.scss'

const TabBar = () => {
  const navigate = useNavigate()
  const location = useLocation()

  const tabs = [
    { icon: UnorderedListOutline, label: '历史', path: '/' },
    { icon: HistogramOutline, label: '统计', path: '/chart' },
    { icon: SetOutline, label: '偏好', path: '/preference' }
  ]

  const showTabBar = useMemo(() => {
    const hidePaths = ['/year-stat']
    if (hidePaths.some(p => location.pathname.startsWith(p))) {
      return false
    }
    return true
  }, [location])

  if (!showTabBar) {
    return null
  }

  return (
      <div className='tab-bar'>
        <div className="float-btn-gro">
          <FloatButton
            onClick={() => {
              void navigate("/record");
            }}
          />
        </div>
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = location.pathname === tab.path
          return (
            <div
              key={tab.path}
              className={`tab-item ${isActive ? "active" : ""}`}
              onClick={() => {
                void navigate(tab.path);
              }}
            >
              <Icon size={24} />
              <div className="label">{tab.label}</div>
            </div>
          );
        })}
      </div>
  )
}

export default TabBar 