'use client'

import { useEffect, useState } from 'react'
import '@/styles/dashboard.scss'
import DashboardScripts from '@/components/DashboardScripts'

interface IssLast {
  id?: number
  fetched_at?: string
  source_url?: string
  payload?: {
    latitude?: number
    longitude?: number
    altitude?: number
    velocity?: number
  }
}

export default function DashboardPage() {
  const [issData, setIssData] = useState<IssLast>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadIssData = async () => {
      try {
        const response = await fetch('/api/iss/last')
        const data = await response.json()
        setIssData(data)
      } catch (e) {
        console.error('Error loading ISS data:', e)
      } finally {
        setLoading(false)
      }
    }

    loadIssData()
    // Обновляем данные каждые 15 секунд
    const interval = setInterval(loadIssData, 15000)
    return () => clearInterval(interval)
  }, [])

  const formatVelocity = (velocity?: number) => {
    if (!velocity) return '—'
    return Math.round(velocity).toLocaleString('ru-RU')
  }

  const formatAltitude = (altitude?: number) => {
    if (!altitude) return '—'
    return Math.round(altitude).toLocaleString('ru-RU')
  }

  return (
    <div className="container pb-5">
      {/* Данные космоса */}
      <div className="row g-3 mb-3">
        <div className="col-12">
          <h4 className="mb-3">Данные космоса</h4>
        </div>
        
        {/* APOD карточка */}
        <div className="col-md-6 col-lg-3">
          <div className="card shadow-sm h-100" id="apodCard">
            <div className="card-body p-0">
              <div className="text-muted small p-2">Загрузка...</div>
            </div>
          </div>
        </div>

        {/* NEO карточка */}
        <div className="col-md-6 col-lg-3">
          <div className="card shadow-sm h-100" id="neoCard">
            <div className="card-body">
              <div className="d-flex align-items-center mb-2">
                <h6 className="card-title m-0">Объекты, сближающиеся с Землёй</h6>
              </div>
              <div className="small text-muted mb-2">Близкие сближения сегодня</div>
            </div>
          </div>
        </div>

        {/* Солнечная активность карточка */}
        <div className="col-md-6 col-lg-3">
          <div className="card shadow-sm h-100" id="solarCard">
            <div className="card-body">
              <div className="d-flex align-items-center mb-2">
                <h6 className="card-title m-0">Солнечная активность</h6>
              </div>
              <div className="text-muted small">Загрузка...</div>
            </div>
          </div>
        </div>

        {/* SpaceX карточка */}
        <div className="col-md-6 col-lg-3">
          <div className="card shadow-sm h-100" id="spacexCard">
            <div className="card-body">
              <div className="d-flex align-items-center mb-2">
                <h6 className="card-title m-0">SpaceX</h6>
              </div>
              <div className="text-muted small">Загрузка...</div>
            </div>
          </div>
        </div>
      </div>

      {/* Верхние карточки */}
      <div className="row g-3 mb-2">
        <div className="col-6 col-md-3">
          <div className="border rounded p-2 text-center">
            <div className="small text-muted">Скорость МКС</div>
            <div className="fs-4">
              {loading ? (
                <span className="text-muted">...</span>
              ) : (
                formatVelocity(issData.payload?.velocity)
              )}
            </div>
            {issData.payload?.velocity && (
              <div className="small text-muted">км/ч</div>
            )}
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="border rounded p-2 text-center">
            <div className="small text-muted">Высота МКС</div>
            <div className="fs-4">
              {loading ? (
                <span className="text-muted">...</span>
              ) : (
                formatAltitude(issData.payload?.altitude)
              )}
            </div>
            {issData.payload?.altitude && (
              <div className="small text-muted">км</div>
            )}
          </div>
        </div>
      </div>

            <div className="row g-3">
        {/* Карта МКС */}
        <div className="col-12">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <h5 className="card-title">МКС — положение и движение</h5>
              <div id="map" className="rounded mb-2 border" style={{ height: '300px' }} role="application" aria-label="Карта положения МКС"></div>
              <div className="row g-2">
                <div className="col-6">
                  <canvas id="issSpeedChart" height="110" aria-label="График скорости МКС"></canvas>
                </div>
                <div className="col-6">
                  <canvas id="issAltChart" height="110" aria-label="График высоты МКС"></canvas>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Нижняя полоса: новая галерея JWST */}
        <div className="col-12">
          <div className="card shadow-sm">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h5 className="card-title m-0">JWST — последние изображения</h5>
                <form id="jwstFilter" className="row g-2 align-items-center">
                  <div className="col-auto">
                    <select className="form-select form-select-sm" name="source" id="srcSel" defaultValue="jpg">
                      <option value="jpg">Все JPG</option>
                      <option value="suffix">По суффиксу</option>
                      <option value="program">По программе</option>
                    </select>
                  </div>
                  <div className="col-auto">
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      name="suffix"
                      id="suffixInp"
                      placeholder="_cal / _thumb"
                      style={{ width: '140px', display: 'none' }}
                    />
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      name="program"
                      id="progInp"
                      placeholder="2734"
                      style={{ width: '110px', display: 'none' }}
                    />
                  </div>
                  <div className="col-auto">
                    <select className="form-select form-select-sm" name="instrument" style={{ width: '130px' }} defaultValue="">
                      <option value="">Любой инструмент</option>
                      <option>NIRCam</option>
                      <option>MIRI</option>
                      <option>NIRISS</option>
                      <option>NIRSpec</option>
                      <option>FGS</option>
                    </select>
                  </div>
                  <div className="col-auto">
                    <select className="form-select form-select-sm" name="perPage" style={{ width: '90px' }} defaultValue="24">
                      <option>12</option>
                      <option>24</option>
                      <option>36</option>
                      <option>48</option>
                    </select>
                  </div>
                  <div className="col-auto">
                    <button className="btn btn-sm btn-primary" type="submit">
                      Показать
                    </button>
                  </div>
                </form>
              </div>

              <div className="jwst-slider">
                <button
                  className="btn btn-light border jwst-nav jwst-prev"
                  type="button"
                  aria-label="Предыдущие изображения"
                  title="Предыдущие изображения"
                >
                  ‹
                </button>
                <div id="jwstTrack" className="jwst-track border rounded" role="region" aria-label="Галерея JWST изображений"></div>
                <button
                  className="btn btn-light border jwst-nav jwst-next"
                  type="button"
                  aria-label="Следующие изображения"
                  title="Следующие изображения"
                >
                  ›
                </button>
              </div>

              <div id="jwstInfo" className="small text-muted mt-2"></div>
            </div>
          </div>
        </div>
      </div>

      {/* ASTRO — события */}
      <div className="col-12 mt-3">
        <div className="card shadow-sm">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h5 className="card-title m-0">Астрономические события (NeoWs)</h5>
              <form id="astroForm" className="row g-2 align-items-center">
                <div className="col-auto">
                  <label className="form-label small m-0 me-1">Дней:</label>
                  <input
                    type="number"
                    min="1"
                    max="7"
                    className="form-control form-control-sm"
                    name="days"
                    defaultValue="7"
                    style={{ width: '70px' }}
                    title="Количество дней от сегодня (1-7)"
                  />
                </div>
                <div className="col-auto">
                  <label className="form-label small m-0 me-1">Событий:</label>
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    className="form-control form-control-sm"
                    name="limit"
                    defaultValue="10"
                    style={{ width: '80px' }}
                    title="Количество событий для отображения"
                  />
                </div>
                <div className="col-auto">
                  <button className="btn btn-sm btn-primary" type="submit">
                    Показать
                  </button>
                </div>
              </form>
            </div>

            <div className="table-responsive">
              <table className="table table-sm align-middle">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Тело</th>
                    <th>Событие</th>
                    <th>Когда (UTC)</th>
                    <th>Дополнительно</th>
                  </tr>
                </thead>
                <tbody id="astroBody">
                  <tr>
                    <td colSpan={5} className="text-muted">
                      нет данных
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <details className="mt-2">
              <summary>Полный JSON</summary>
              <pre
                id="astroRaw"
                className="bg-light rounded p-2 small m-0"
                style={{ whiteSpace: 'pre-wrap' }}
                role="region"
                aria-label="Полный JSON ответ от AstronomyAPI"
              ></pre>
            </details>
          </div>
        </div>
      </div>

      <DashboardScripts />
    </div>
  )
}

