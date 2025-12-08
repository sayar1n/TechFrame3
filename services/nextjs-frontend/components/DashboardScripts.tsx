'use client'

import { useEffect } from 'react'

declare global {
  interface Window {
    L: any
    Chart: any
  }
}

export default function DashboardScripts() {
  useEffect(() => {
    // Загрузка данных ISS и инициализация карты/графиков
    if (typeof window !== 'undefined' && window.L && window.Chart) {
      const initDashboard = async () => {
        try {
          // Загрузка последних данных ISS
          const lastResponse = await fetch('/api/iss/last')
          const lastData = await lastResponse.json()
          const payload = lastData.payload || {}
          
          // Инициализация карты
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
            
            // Инициализация графиков
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
            
            // Функция загрузки тренда
            const loadTrend = async () => {
              try {
                const trendResponse = await fetch('/api/iss/trend?limit=240')
                const trendData = await trendResponse.json()
                const points = trendData.points || []
                
                if (points.length) {
                  const pts = points.map((p: any) => [p.lat, p.lon])
                  trail.setLatLngs(pts)
                  marker.setLatLng(pts[pts.length - 1])
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
            
            loadTrend()
            setInterval(loadTrend, 15000)
            
            mapEl.dataset.initialized = 'true'
          }
        } catch (e) {
          console.error('Error initializing dashboard:', e)
        }
      }
      
      initDashboard()
      
      // Загрузка данных космоса (APOD, NEO, Солнечная активность, SpaceX)
      const loadSpaceData = async () => {
        try {
          const response = await fetch('/api/space/summary')
          const data = await response.json()
          
          // APOD карточка
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
          
          // NEO карточка
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
          
          // Солнечная активность карточка
          const solarCard = document.getElementById('solarCard')
          if (solarCard) {
            const flr = data.flr?.payload || []
            const cme = data.cme?.payload || []
            
            // Безопасная проверка массивов
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
          
          // SpaceX карточка
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
    
    // JWST галерея
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
    
    // Навигация JWST - скроллим по ширине контейнера (4 элемента)
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
    
    // Стартовые данные JWST
    loadFeed({ source: 'jpg', perPage: '24' })
    
    // Astronomy события - исправленная версия на основе оригинального кода
    const astroForm = document.getElementById('astroForm') as HTMLFormElement
    const astroBody = document.getElementById('astroBody')
    const astroRaw = document.getElementById('astroRaw')
    
    if (astroForm && astroBody && astroRaw) {
      const normalize = (node: any) => {
        const name = node.name || node.body || node.object || node.target || ''
        const type = node.type || node.event_type || node.category || node.kind || ''
        // Используем поле "when" напрямую, если оно есть
        const when = node.when || node.time || node.date || node.occursAt || node.peak || node.instant || ''
        // Используем поле "extra" напрямую, если оно есть
        const extra = node.extra || node.magnitude || node.mag || node.altitude || node.note || ''
        return { name, type, when, extra }
      }
      
      const loadAstro = async (q: Record<string, string>) => {
        astroBody.innerHTML = '<tr><td colspan="5" class="text-muted">Загрузка…</td></tr>'
        
        // Преобразуем параметры для нового API (только days и limit)
        const params: Record<string, string> = {}
        if (q.days) params.days = q.days
        if (q.limit) params.limit = q.limit
        
        const url = '/api/astro/events?' + new URLSearchParams(params).toString()
        
        try {
          const r = await fetch(url)
          const js = await r.json()
          astroRaw.textContent = JSON.stringify(js, null, 2)
          
          // Проверяем, есть ли ошибка в ответе
          if (js.error) {
            astroBody.innerHTML = `<tr><td colspan="5" class="text-danger">${js.error}</td></tr>`
            return
          }
          
          // Новый формат: события находятся в js.events
          const events = js.events || []
          if (!events.length) {
            astroBody.innerHTML = '<tr><td colspan="5" class="text-muted">события не найдены</td></tr>'
            return
          }
          
          // Нормализуем события для отображения
          const rows = events.map((event: any) => {
            const normalized = normalize(event)
            // Используем номер события из данных, если есть
            return {
              ...normalized,
              number: event.number || event.number || ''
            }
          })
          
          astroBody.innerHTML = rows
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
      
      // Автозагрузка при загрузке страницы
      const daysInput = astroForm.querySelector('[name="days"]') as HTMLInputElement
      const limitInput = astroForm.querySelector('[name="limit"]') as HTMLInputElement
      if (daysInput && limitInput) {
        loadAstro({
          days: daysInput.value || '7',
          limit: limitInput.value || '10',
        })
      }
    }
  }, [])
  
  return null
}

