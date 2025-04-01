import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/main.scss'
import Router from './router'

const darkMode = async () => {
  const { auto, isEnabled } = await import('darkreader')
  auto({
    brightness: 100,
    contrast: 90,
    sepia: 10,
  })
  const appendMeta = () => {
    const metaEl = document.createElement('meta')
    metaEl.setAttribute('name', 'theme-color')
    const bodyBgc = isEnabled() ? getComputedStyle(document.body).backgroundColor : '#fff'
    metaEl.setAttribute('content', bodyBgc)
    document.head.append(metaEl)
  }

  appendMeta()
}

// 使用 requestIdleCallback 延迟加载
const initDarkMode = () => {
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.name === 'first-contentful-paint') {
        // FCP 完成后，在空闲时间执行 darkMode
        requestIdleCallback(() => {
          void darkMode()
        }, { timeout: 2000 }) // 设置 2 秒超时，确保最终会执行
        observer.disconnect()
      }
    }
  })

  // 观察 FCP
  observer.observe({ entryTypes: ['paint'] })
}

initDarkMode()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Router />
  </StrictMode>,
)

// default safearea variable
document.documentElement.style.setProperty('--safe-area-top', '0px');
document.documentElement.style.setProperty('--safe-area-bottom', '0px');