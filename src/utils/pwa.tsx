import { useState, useEffect } from 'react'
import { Modal, Toast } from 'antd-mobile'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

let deferredPrompt: BeforeInstallPromptEvent | null = null
const listeners = new Set<() => void>()

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferredPrompt = e as BeforeInstallPromptEvent
    listeners.forEach((fn) => {
      fn()
    })
  })

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null
    listeners.forEach((fn) => {
      fn()
    })
    Toast.show({
      icon: 'success',
      content: '已成功添加到主屏幕！',
    })
  })
}

/** 检测是否处于独立应用 (PWA Standalone) 模式运行 */
export const isStandaloneMode = (): boolean => {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
    document.referrer.includes('android-app://')
  )
}

/** 检测是否为 iOS 设备 (Safari / Webkit) */
export const isIOS = (): boolean => {
  if (typeof window === 'undefined') return false
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) &&
    !(window as unknown as { MSStream?: unknown }).MSStream
  )
}

/** 弹出添加到主屏幕的指引弹窗 */
export const showInstallGuide = () => {
  if (isIOS()) {
    void Modal.alert({
      title: '添加到 iPhone / iPad 主屏幕',
      content: (
        <div style={{ textAlign: 'left', fontSize: '14px', lineHeight: '1.6', color: '#333' }}>
          <p style={{ margin: '8px 0', color: '#666' }}>
            按照以下两步，即可像原生 App 一样全屏使用并支持离线记账：
          </p>
          <div style={{ background: '#f5f7fa', padding: '12px', borderRadius: '8px', margin: '12px 0' }}>
            <p style={{ margin: '0 0 8px 0' }}>
              <strong>第 1 步：</strong>点击 Safari 底部栏中间的<strong>「分享」</strong>按钮（带有向上箭头的图标 <span style={{ fontSize: '16px' }}>⎋</span>）。
            </p>
            <p style={{ margin: 0 }}>
              <strong>第 2 步：</strong>在分享面板中向下滑动，轻触<strong>「添加到主屏幕」</strong>，点击右上角<strong>「添加」</strong>即可完成。
            </p>
          </div>
        </div>
      ),
      confirmText: '我知道了',
    })
  } else {
    void Modal.alert({
      title: '添加到主屏幕',
      content: (
        <div style={{ textAlign: 'left', fontSize: '14px', lineHeight: '1.6', color: '#333' }}>
          <p style={{ margin: '8px 0', color: '#666' }}>
            建议使用 Chrome、Edge 或手机系统浏览器打开：
          </p>
          <div style={{ background: '#f5f7fa', padding: '12px', borderRadius: '8px', margin: '12px 0' }}>
            <p style={{ margin: '0 0 8px 0' }}>
              <strong>第 1 步：</strong>点击浏览器右上角或底部的<strong>菜单按钮（三个点 ···）</strong>。
            </p>
            <p style={{ margin: 0 }}>
              <strong>第 2 步：</strong>找到并选择<strong>「添加到主屏幕」</strong>或<strong>「安装应用」</strong>。
            </p>
          </div>
        </div>
      ),
      confirmText: '我知道了',
    })
  }
}

/** PWA 安装与状态管理 Hook */
export const usePWAInstall = () => {
  const [isStandalone, setIsStandalone] = useState(isStandaloneMode())
  const [canInstall, setCanInstall] = useState(!!deferredPrompt)

  useEffect(() => {
    const update = () => {
      setIsStandalone(isStandaloneMode())
      setCanInstall(!!deferredPrompt)
    }

    listeners.add(update)
    window.addEventListener('resize', update)
    return () => {
      listeners.delete(update)
      window.removeEventListener('resize', update)
    }
  }, [])

  const install = async () => {
    if (isStandalone) {
      Toast.show({
        icon: 'success',
        content: '应用已在独立沉浸模式下运行',
      })
      return
    }

    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt()
        const { outcome } = await deferredPrompt.userChoice
        if (outcome === 'accepted') {
          deferredPrompt = null
          setCanInstall(false)
        }
      } catch (e) {
        console.error('Install prompt error:', e)
        showInstallGuide()
      }
    } else {
      showInstallGuide()
    }
  }

  return {
    isStandalone,
    canInstall,
    isIOS: isIOS(),
    install,
    showInstallGuide,
  }
}
