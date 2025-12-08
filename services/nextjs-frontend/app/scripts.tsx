'use client'

import { useEffect } from 'react'

export default function Scripts() {
  useEffect(() => {
    // Загрузка внешних скриптов
    const loadScript = (src: string) => {
      return new Promise((resolve, reject) => {
        const script = document.createElement('script')
        script.src = src
        script.async = true
        script.onload = resolve
        script.onerror = reject
        document.head.appendChild(script)
      })
    }

    // Загружаем скрипты только на клиенте
    if (typeof window !== 'undefined') {
      Promise.all([
        loadScript('https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'),
        loadScript('https://cdn.jsdelivr.net/npm/chart.js'),
        loadScript('https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js'),
      ]).catch((error) => {
        console.error('Ошибка загрузки скриптов:', error)
      })
    }
  }, [])

  return null
}

