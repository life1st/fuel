import { RouterProvider, createHashRouter } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import Skeleton from '@/components/skeleton'
import Layout from './components/layout'

const Home = lazy(() => import('./pages/home'))
const Record = lazy(() => import('./pages/record'))
const Preference = lazy(() => import('./pages/preference'))
const Chart = lazy(() => import('./pages/chart'))
const ChartV2 = lazy(() => import('./pages/chartv2'))

const router = createHashRouter([
  {
    path: '/',
    element: <Layout />,
    children: [{
      path: '/',
      element: (
        <Suspense fallback={<Skeleton loading active rows={4} />}>
          <Home />
        </Suspense>
      )
    }, {
      path: '/preference',
      element: (
        <Suspense fallback={<Skeleton loading active rows={4} />}>
          <Preference />
        </Suspense>
      )
    }, {
      path: '/chart',
      element: (
        <Suspense fallback={<Skeleton loading active rows={4} />}>
          <Chart />
        </Suspense>
      )
      }, {
        path: '/chartv2',
        element: (
          <Suspense fallback={<Skeleton loading active rows={4} />}>
            <ChartV2 />
          </Suspense>
        )
      },
    ]
  },
  {
    path: '/record/:id?',
    element: (
      <Suspense fallback={<Skeleton loading active rows={4} />}>
        <Record />
      </Suspense>
    )
  },
])

export default function Router() {
  return <RouterProvider router={router} />
}
