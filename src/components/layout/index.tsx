import { Outlet, useSearchParams } from 'react-router-dom'
import TabBar from '../tab-bar'
import { TopBanner } from '@/components/top-banner'
import { useNetworkState } from '@/hooks/useNetworkState'
import './style.scss'

const Layout = () => {
  const [params] = useSearchParams()
  const isOnline = useNetworkState()
  const hideTab = params.get('notab') === '1'
  return (
    <>
      <TopBanner visible={!isOnline} title={'Offline Mode'} />
      <Outlet />
      {hideTab ? null : <TabBar />}
    </>
  )
}

export default Layout 