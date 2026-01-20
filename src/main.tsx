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
  try {
    const observer = new PerformanceObserver((list) => {
      if (list.getEntries().some(e => e.name === 'first-contentful-paint')) {
        // FCP 完成后（包括之前已经发生的），在空闲时间执行 darkMode
        requestIdleCallback(() => {
          void darkMode()
        }, { timeout: 2000 })
        observer.disconnect()
      }
    })

    // 观察 FCP，设置 buffered: true。
    // 这会让 observer 立即收到之前已经发生的 FCP 事件，彻底解决竞态问题。
    observer.observe({ type: 'paint', buffered: true })
  } catch (e) {
    // 降级处理：如果浏览器不支持 PerformanceObserver 或 buffered 参数，则直接执行
    void darkMode()
  }
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