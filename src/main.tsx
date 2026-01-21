import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/main.scss'
import Router from './router'

const applyDarkMode = async () => {
  const { auto, isEnabled } = await import('darkreader')
  auto({
    brightness: 100,
    contrast: 90,
    sepia: 10,
  })
  
  const metaEl = document.querySelector('meta[name="theme-color"]')
  if (metaEl) {
    const bodyBgc = isEnabled() ? getComputedStyle(document.body).backgroundColor : '#fff'
    metaEl.setAttribute('content', bodyBgc)
  }
}

// 立即执行以确保视觉一致性
applyDarkMode()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Router />
  </StrictMode>,
)

// default safearea variable
document.documentElement.style.setProperty('--safe-area-top', '0px');
document.documentElement.style.setProperty('--safe-area-bottom', '0px');