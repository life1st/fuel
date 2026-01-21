import { RouterProvider, createHashRouter, replace } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import Skeleton from '@/components/skeleton'
import Layout from './components/layout'

const Home = lazy(() => import('./pages/home'))
const Record = lazy(() => import('./pages/record'))
const Preference = lazy(() => import('./pages/preference'))
const Chart = lazy(() => import('./pages/chart'))

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
  {
    path: '*',
    loader: () => replace('/')
  }
])

export default function Router() {
  return <RouterProvider router={router} />
}
