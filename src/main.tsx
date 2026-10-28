import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/main.scss'
import Router from './router'

const darkMode = async () => {
  const { auto } = await import('darkreader')
  auto({
    brightness: 100,
    contrast: 90,
    sepia: 10,
  })
}

void darkMode();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Router />
  </StrictMode>,
)