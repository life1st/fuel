import { Outlet, useSearchParams } from 'react-router-dom'
import { useEffect } from 'react'
import TabBar from '../tab-bar'
import { TopBanner } from '@/components/top-banner'
import DemoModeIndicator from '@/components/demo-mode-indicator'
import { useNetworkState } from '@/hooks/useNetworkState'
import useRecordStore from '@/store/recordStore'
import useSettingStore from '@/store/setting-store'
import './style.scss'

const Layout = () => {
  const [params] = useSearchParams()
  const isOnline = useNetworkState()
  const hideTab = params.get('notab') === '1'

  const { recordList, insertDemoData } = useRecordStore()
  const { gistConfig } = useSettingStore()

  useEffect(() => {
    if (recordList.length === 0 && !gistConfig) {
      insertDemoData()
    }
  }, [])

  return (
    <>
      <TopBanner visible={!isOnline} title={'Offline Mode'} />
      <DemoModeIndicator />
      <Outlet />
      {hideTab ? null : <TabBar />}
    </>
  )
}

export default Layout 