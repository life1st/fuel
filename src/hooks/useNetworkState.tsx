import { useState, useEffect, useCallback } from 'react'

export const useNetworkState = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  
  // 添加网络状态检查函数
  const checkConnection = useCallback(async () => {
    try {
      // 尝试请求一个小资源来验证实际的网络连接
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch('/fuel/icon.svg', {
        method: 'HEAD',
        signal: controller.signal,
        cache: 'no-store'
      });

      clearTimeout(timeoutId);
      setIsOnline(response.ok);
    } catch (error) {
      setIsOnline(false);
    }
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // 当系统报告在线时，进行实际检查
      checkConnection();
    }

    const handleOffline = () => {
      setIsOnline(false);
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // 初始检查
    checkConnection();
    // 定期检查网络状态
    const intervalId = setInterval(checkConnection, 30000);

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      clearInterval(intervalId);
    }
  }, [checkConnection])

  return isOnline
}
