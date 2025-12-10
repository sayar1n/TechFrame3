'use client'

import { useEffect } from 'react'

declare global {
  interface Window {
    L: any
    Chart: any
  }
}

export default function IssMapScripts() {
  useEffect(() => {
    // Загрузка данных ISS и инициализация карты/графиков для страницы ISS
    if (typeof window !== 'undefined' && window.L && window.Chart) {
      const initIssMap = async () => {
        try {
          // Загрузка последних данных ISS
          const lastResponse = await fetch('/api/iss/last')
          const lastData = await lastResponse.json()
          const payload = lastData.payload || {}
          
          // Инициализация карты для страницы ISS
          const lat0 = Number(payload.latitude || 0)
          const lon0 = Number(payload.longitude || 0)
          const mapEl = document.getElementById('issMap')
          
          if (mapEl && !mapEl.dataset.initialized) {
            const map = window.L.map('issMap', { attributionControl: false }).setView(
              [lat0 || 0, lon0 || 0],
              lat0 ? 3 : 2
            )
            window.L.tileLayer('https://{s}.tile.openstreetmap.de/{z}/{x}/{y}.png', {
              noWrap: true,
            }).addTo(map)
            
            const trail = window.L.polyline([], { weight: 3 }).addTo(map)
            const marker = window.L.marker([lat0 || 0, lon0 || 0])
              .addTo(map)
              .bindPopup('МКС')
            
            // Инициализация графиков для страницы ISS
            const speedChart = new window.Chart(document.getElementById('issSpeedChartPage'), {
              type: 'line',
              data: {
                labels: [],
                datasets: [{ label: 'Скорость', data: [] }],
              },
              options: {
                responsive: true,
                scales: { x: { display: false } },
              },
            })
            
            const altChart = new window.Chart(document.getElementById('issAltChartPage'), {
              type: 'line',
              data: {
                labels: [],
                datasets: [{ label: 'Высота', data: [] }],
              },
              options: {
                responsive: true,
                scales: { x: { display: false } },
              },
            })
            
            // Функция загрузки тренда
            const loadTrend = async () => {
              try {
                const lastResponse = await fetch('/api/iss/last')
                const lastData = await lastResponse.json()
                
                if (lastData.error) {
                  console.error('ISS API error:', lastData.error)
                  return
                }
                
                const currentPayload = lastData.payload || {}
                const currentLat = Number(currentPayload.latitude)
                const currentLon = Number(currentPayload.longitude)
                
                const trendResponse = await fetch('/api/iss/trend?limit=240')
                const trendData = await trendResponse.json()
                
                if (trendData.error) {
                  console.error('Trend API error:', trendData.error)
                  return
                }
                
                const points = trendData.points || []
                
                if (points.length) {
                  const pts = points.map((p: any) => [p.lat, p.lon])
                  trail.setLatLngs(pts)
                  
                  const targetLat = !isNaN(currentLat) && currentLat !== 0 ? currentLat : pts[pts.length - 1][0]
                  const targetLon = !isNaN(currentLon) && currentLon !== 0 ? currentLon : pts[pts.length - 1][1]
                  
                  if (!isNaN(targetLat) && !isNaN(targetLon)) {
                    marker.setLatLng([targetLat, targetLon])
                    map.panTo([targetLat, targetLon], { animate: false })
                  }
                } else if (!isNaN(currentLat) && !isNaN(currentLon) && currentLat !== 0 && currentLon !== 0) {
                  marker.setLatLng([currentLat, currentLon])
                  map.panTo([currentLat, currentLon], { animate: false })
                }
                
                const times = points.map((p: any) => new Date(p.at).toLocaleTimeString())
                speedChart.data.labels = times
                speedChart.data.datasets[0].data = points.map((p: any) => p.velocity)
                speedChart.update()
                
                altChart.data.labels = times
                altChart.data.datasets[0].data = points.map((p: any) => p.altitude)
                altChart.update()
              } catch (e) {
                console.error('Error loading trend:', e)
              }
            }
            
            const clearMapData = async () => {
              try {
                const response = await fetch('/api/iss/clear', {
                  method: 'DELETE',
                })
                const result = await response.json()
                
                if (result.success) {
                  trail.setLatLngs([])
                  speedChart.data.labels = []
                  speedChart.data.datasets[0].data = []
                  speedChart.update()
                  altChart.data.labels = []
                  altChart.data.datasets[0].data = []
                  altChart.update()
                } else {
                  console.error('Failed to clear ISS data:', result.error)
                  alert('Ошибка при очистке данных: ' + (result.error || 'Неизвестная ошибка'))
                }
              } catch (e) {
                console.error('Error clearing ISS data:', e)
                alert('Ошибка при очистке данных')
              }
            }
            
            const clearBtn = document.getElementById('clearIssMapBtn')
            if (clearBtn) {
              clearBtn.addEventListener('click', clearMapData)
            }
            
            loadTrend()
            const trendInterval = setInterval(loadTrend, 15000)
            
            mapEl.dataset.intervalId = trendInterval.toString()
            
            mapEl.dataset.initialized = 'true'
          }
        } catch (e) {
          console.error('Error initializing ISS map:', e)
        }
      }
      
      initIssMap()
    }
  }, [])
  
  return null
}

