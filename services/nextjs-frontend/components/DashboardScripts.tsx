'use client'

import { useEffect } from 'react'
import { exportAstroEventsToExcel, exportAstroEventsToCSV } from '@/utils/exportUtils'

declare global {
  interface Window {
    L: any
    Chart: any
  }
}

export default function DashboardScripts() {
  useEffect(() => {
    if (typeof window !== 'undefined' && window.L && window.Chart) {
      const initDashboard = async () => {
        try {
          const lastResponse = await fetch('/api/iss/last')
          const lastData = await lastResponse.json()
          const payload = lastData.payload || {}
          
          const lat0 = Number(payload.latitude || 0)
          const lon0 = Number(payload.longitude || 0)
          const mapEl = document.getElementById('map')
          
          if (mapEl && !mapEl.dataset.initialized) {
            const map = window.L.map('map', { attributionControl: false }).setView(
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
            
            const speedChart = new window.Chart(document.getElementById('issSpeedChart'), {
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
            
            const altChart = new window.Chart(document.getElementById('issAltChart'), {
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
            
            const clearBtn = document.getElementById('clearMapBtn')
            if (clearBtn) {
              clearBtn.addEventListener('click', clearMapData)
            }
            
            loadTrend()
            const trendInterval = setInterval(loadTrend, 15000)
            
            mapEl.dataset.intervalId = trendInterval.toString()
            
            mapEl.dataset.initialized = 'true'
          }
        } catch (e) {
          console.error('Error initializing dashboard:', e)
        }
      }
      
      initDashboard()
      
      const loadSpaceData = async () => {
        try {
          const response = await fetch('/api/space/summary')
          const data = await response.json()
          
          const apodCard = document.getElementById('apodCard')
          if (apodCard && data.apod?.payload) {
            const apod = data.apod.payload
            const imageUrl = apod.url || apod.thumbnail_url || ''
            const title = apod.title || ''
            const explanation = apod.explanation || ''
            apodCard.querySelector('.card-body')!.innerHTML = `
              ${imageUrl ? `<img src="${imageUrl}" class="card-img-top" alt="${title}" style="height: 200px; object-fit: cover;">` : ''}
              <div class="card-body">
                <h6 class="card-title">${title}</h6>
                <p class="card-text small text-muted">${explanation.substring(0, 100)}${explanation.length > 100 ? '...' : ''}</p>
              </div>
            `
          }
          
          const neoCard = document.getElementById('neoCard')
          if (neoCard && data.neo?.payload) {
            const neo = data.neo.payload
            let todayCount = 0
            let hazardousCount = 0
            
            if (neo.near_earth_objects) {
              const today = new Date().toISOString().split('T')[0]
              const todayObjects = neo.near_earth_objects[today] || []
              todayCount = todayObjects.length
              hazardousCount = todayObjects.filter((obj: any) => obj.is_potentially_hazardous_asteroid).length
            }
            
            neoCard.querySelector('.card-body .text-muted')!.innerHTML = `
              <div class="fs-4 fw-bold">${todayCount}</div>
              <div class="mb-2">астероидов</div>
              ${hazardousCount > 0 ? `<span class="badge bg-danger">${hazardousCount} потенциально опасны</span>` : ''}
            `
          }
          
          const solarCard = document.getElementById('solarCard')
          if (solarCard) {
            const flr = data.flr?.payload || []
            const cme = data.cme?.payload || []
            
            const flrArray = Array.isArray(flr) ? flr : []
            const cmeArray = Array.isArray(cme) ? cme : []
            const flrCount = flrArray.length || 0
            const cmeCount = cmeArray.length || 0
            const totalCount = flrCount + cmeCount
            
            const hasEvents = totalCount > 0
            
            solarCard.querySelector('.text-muted')!.textContent = hasEvents 
              ? `${totalCount} событий` 
              : 'Нет свежих событий'
          }
          
          const spacexCard = document.getElementById('spacexCard')
          if (spacexCard && data.spacex?.payload) {
            const spacex = data.spacex.payload
            const name = spacex.name || ''
            const date = spacex.date_local ? new Date(spacex.date_local).toLocaleDateString('ru-RU', { 
              day: 'numeric', 
              month: 'long', 
              year: 'numeric' 
            }) : ''
            const webcast = spacex.links?.webcast || ''
            
            spacexCard.querySelector('.text-muted')!.innerHTML = `
              <div class="fw-bold mb-1">${name}</div>
              <div class="small mb-2">${date}</div>
              ${webcast ? `<a href="${webcast}" target="_blank" class="btn btn-sm btn-outline-primary">Смотреть трансляцию</a>` : '<span class="badge bg-secondary">Скоро</span>'}
            `
          }
        } catch (e) {
          console.error('Error loading space data:', e)
        }
      }
      
      loadSpaceData()
    }

    const track = document.getElementById('jwstTrack')
    const info = document.getElementById('jwstInfo')
    const form = document.getElementById('jwstFilter') as HTMLFormElement
    const srcSel = document.getElementById('srcSel') as HTMLSelectElement
    const sfxInp = document.getElementById('suffixInp') as HTMLInputElement
    const progInp = document.getElementById('progInp') as HTMLInputElement
    
    if (srcSel && sfxInp && progInp) {
      const toggleInputs = () => {
        if (sfxInp) sfxInp.style.display = srcSel.value === 'suffix' ? '' : 'none'
        if (progInp) progInp.style.display = srcSel.value === 'program' ? '' : 'none'
      }
      srcSel.addEventListener('change', toggleInputs)
      toggleInputs()
    }
    
    const loadFeed = async (qs: Record<string, string>) => {
      if (!track || !info) return
      
      track.innerHTML = '<div class="p-3 text-muted">Загрузка…</div>'
      info.textContent = ''
      
      try {
        const url = '/api/jwst/feed?' + new URLSearchParams(qs).toString()
        const r = await fetch(url)
        const js = await r.json()
        
        track.innerHTML = ''
        ;(js.items || []).forEach((it: any) => {
          const fig = document.createElement('figure')
          fig.className = 'jwst-item m-0'
          fig.innerHTML = `
            <a href="${it.link || it.url}" target="_blank" rel="noreferrer">
              <img loading="lazy" src="${it.url}" alt="JWST">
            </a>
            <figcaption class="jwst-cap">${(it.caption || '').replaceAll('<', '&lt;')}</figcaption>
          `
          track.appendChild(fig)
        })
        
        info.textContent = `Источник: ${js.source} · Показано ${js.count || 0}`
      } catch (e) {
        track.innerHTML = '<div class="p-3 text-danger">Ошибка загрузки</div>'
      }
    }
    
    if (form) {
      form.addEventListener('submit', (ev) => {
        ev.preventDefault()
        const fd = new FormData(form)
        const q = Object.fromEntries(fd.entries()) as Record<string, string>
        loadFeed(q)
      })
    }
    
    const prevBtn = document.querySelector('.jwst-prev')
    const nextBtn = document.querySelector('.jwst-next')
    if (prevBtn && track) {
      prevBtn.addEventListener('click', () => {
        const scrollAmount = track.clientWidth
        track.scrollBy({ left: -scrollAmount, behavior: 'smooth' })
      })
    }
    if (nextBtn && track) {
      nextBtn.addEventListener('click', () => {
        const scrollAmount = track.clientWidth
        track.scrollBy({ left: scrollAmount, behavior: 'smooth' })
      })
    }
    
    loadFeed({ source: 'jpg', perPage: '24' })
    
    const astroForm = document.getElementById('astroForm') as HTMLFormElement
    const astroBody = document.getElementById('astroBody')
    const astroRaw = document.getElementById('astroRaw')
    
    let astroDataForExport: any[] = []
    let astroData: any[] = []
    let currentSortColumn = 'date'
    let currentSortOrder: 'asc' | 'desc' = 'desc'
    let currentSearchQuery = ''
    
    if (astroForm && astroBody && astroRaw) {
      const normalize = (node: any) => {
        const name = node.name || node.body || node.object || node.target || ''
        const type = node.type || node.event_type || node.category || node.kind || ''
        const when = node.when || node.time || node.date || node.occursAt || node.peak || node.instant || ''
        const extra = node.extra || node.magnitude || node.mag || node.altitude || node.note || ''
        return { name, type, when, extra }
      }
      
      const loadAstro = async (q: Record<string, string>) => {
        astroBody.innerHTML = '<tr><td colspan="5" class="text-muted">Загрузка…</td></tr>'
        
        const params: Record<string, string> = {}
        if (q.days) params.days = q.days
        if (q.limit) params.limit = q.limit
        
        const url = '/api/astro/events?' + new URLSearchParams(params).toString()
        
        try {
          const r = await fetch(url)
          const js = await r.json()
          astroRaw.textContent = JSON.stringify(js, null, 2)
          
          if (js.error) {
            astroBody.innerHTML = `<tr><td colspan="5" class="text-danger">${js.error}</td></tr>`
            return
          }
          
          const events = js.events || []
          if (!events.length) {
            astroBody.innerHTML = '<tr><td colspan="5" class="text-muted">события не найдены</td></tr>'
            return
          }
          
          const rows = events.map((event: any, i: number) => {
            const normalized = normalize(event)
            return {
              ...normalized,
              number: event.number || (i + 1)
            }
          })
          
          astroDataForExport = rows
          astroData = rows
          
          renderAstroTable()
          setupAstroExportButtons()
        } catch (e: any) {
          console.error('Error loading astronomy events:', e)
          astroBody.innerHTML = '<tr><td colspan="5" class="text-danger">ошибка загрузки</td></tr>'
        }
      }
      
      astroForm.addEventListener('submit', (ev) => {
        ev.preventDefault()
        const q = Object.fromEntries(new FormData(astroForm).entries()) as Record<string, string>
        loadAstro(q)
      })
      
      const renderAstroTable = () => {
        if (!astroBody) return

        let filtered = astroData
        if (currentSearchQuery.trim()) {
          const query = currentSearchQuery.toLowerCase()
          filtered = astroData.filter((r: any) => {
            return (
              (r.name || '').toLowerCase().includes(query) ||
              (r.type || '').toLowerCase().includes(query) ||
              (r.when || '').toLowerCase().includes(query) ||
              (r.extra || '').toLowerCase().includes(query)
            )
          })
        }

        filtered = [...filtered].sort((a: any, b: any) => {
          let aValue: any
          let bValue: any

          switch (currentSortColumn) {
            case 'index':
              aValue = parseInt(a.number || '0') || 0
              bValue = parseInt(b.number || '0') || 0
              break
            case 'body':
              aValue = (a.name || '').toLowerCase()
              bValue = (b.name || '').toLowerCase()
              break
            case 'event':
              aValue = (a.type || '').toLowerCase()
              bValue = (b.type || '').toLowerCase()
              break
            case 'date':
              aValue = new Date(a.when || 0).getTime()
              bValue = new Date(b.when || 0).getTime()
              break
            default:
              return 0
          }

          if (typeof aValue === 'string' && typeof bValue === 'string') {
            const comparison = aValue.localeCompare(bValue, 'ru')
            return currentSortOrder === 'asc' ? comparison : -comparison
          } else {
            const comparison = aValue - bValue
            return currentSortOrder === 'asc' ? comparison : -comparison
          }
        })

        // Обновление индикаторов сортировки
        const sortIndicators = ['sortIndex', 'sortBody', 'sortEvent', 'sortDate']
        sortIndicators.forEach(id => {
          const el = document.getElementById(id)
          if (el) el.textContent = '↕'
        })
        
        const activeIndicator = document.getElementById(`sort${currentSortColumn.charAt(0).toUpperCase() + currentSortColumn.slice(1)}`)
        if (activeIndicator) {
          activeIndicator.textContent = currentSortOrder === 'asc' ? '↑' : '↓'
        }

        astroBody.innerHTML = filtered
          .map(
            (r: any, i: number) => `
            <tr>
              <td>${r.number || (i + 1)}</td>
              <td>${r.name || '—'}</td>
              <td>${r.type || '—'}</td>
              <td><code>${r.when || '—'}</code></td>
              <td>${r.extra || ''}</td>
            </tr>
          `
          )
          .join('')

        if (filtered.length === 0) {
          astroBody.innerHTML = '<tr><td colspan="5" class="text-muted">нет данных</td></tr>'
        }
      }

      const handleAstroSort = (column: string) => {
        if (currentSortColumn === column) {
          currentSortOrder = currentSortOrder === 'asc' ? 'desc' : 'asc'
        } else {
          currentSortColumn = column
          currentSortOrder = 'asc'
        }
        renderAstroTable()
      }

      const setupAstroExportButtons = () => {
        const exportExcelBtn = document.getElementById('exportAstroExcel')
        const exportCSVBtn = document.getElementById('exportAstroCSV')
        
        if (exportExcelBtn) {
          exportExcelBtn.onclick = () => {
            if (astroDataForExport.length > 0) {
              exportAstroEventsToExcel(astroDataForExport)
            } else {
              alert('Нет данных для экспорта')
            }
          }
        }
        
        if (exportCSVBtn) {
          exportCSVBtn.onclick = () => {
            if (astroDataForExport.length > 0) {
              exportAstroEventsToCSV(astroDataForExport)
            } else {
              alert('Нет данных для экспорта')
            }
          }
        }
      }

      const sortColumnSelect = document.getElementById('astroSortColumn') as HTMLSelectElement
      const sortOrderSelect = document.getElementById('astroSortOrder') as HTMLSelectElement
      const searchInput = document.getElementById('astroSearch') as HTMLInputElement

      if (sortColumnSelect) {
        sortColumnSelect.addEventListener('change', (e) => {
          currentSortColumn = (e.target as HTMLSelectElement).value
          renderAstroTable()
        })
      }

      if (sortOrderSelect) {
        sortOrderSelect.addEventListener('change', (e) => {
          currentSortOrder = (e.target as HTMLSelectElement).value as 'asc' | 'desc'
          renderAstroTable()
        })
      }

      if (searchInput) {
        searchInput.addEventListener('input', (e) => {
          currentSearchQuery = (e.target as HTMLInputElement).value
          renderAstroTable()
        })
      }

      const setupSortableHeaders = () => {
        const sortableHeaders = document.querySelectorAll('.sortable-th')
        sortableHeaders.forEach((header) => {
          if (header instanceof HTMLElement && !header.dataset.listenerAdded) {
            const column = header.getAttribute('data-sort')
            if (column) {
              header.dataset.listenerAdded = 'true'
              header.addEventListener('click', () => {
                handleAstroSort(column)
              })
            }
          }
        })
      }
      
      // Автозагрузка при загрузке страницы
      const daysInput = astroForm.querySelector('[name="days"]') as HTMLInputElement
      const limitInput = astroForm.querySelector('[name="limit"]') as HTMLInputElement
      if (daysInput && limitInput) {
        loadAstro({
          days: daysInput.value || '7',
          limit: limitInput.value || '10',
        })
      }
      
      setTimeout(() => {
        setupAstroExportButtons()
        setupSortableHeaders()
      }, 500)
    }
  }, [])
  
  return null
}

