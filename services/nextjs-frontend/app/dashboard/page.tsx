'use client'

import '@/styles/dashboard.scss'
import DashboardScripts from '@/components/DashboardScripts'
import { DashboardProvider, useDashboard } from '@/contexts/DashboardContext'
import { IssMetrics } from '@/components/IssMetricCard'

function DashboardContent() {
  const { issData, trend, loading, formatVelocity, formatAltitude } = useDashboard()

  return (
    <div className="container pb-5">
      {/* Метрики МКС */}
      <section className="mb-4">
        <h2 className="h5 mb-3">Метрики МКС</h2>
        <IssMetrics
          velocity={issData.payload?.velocity}
          altitude={issData.payload?.altitude}
          latitude={issData.payload?.latitude}
          longitude={issData.payload?.longitude}
          loading={loading}
          formatVelocity={formatVelocity}
          formatAltitude={formatAltitude}
        />
      </section>

      {/* Визуализация МКС */}
      <section className="mb-4" style={{ animation: 'none' }}>
        <h2 className="h5 mb-3">Визуализация МКС</h2>
        <div className="row g-3">
          <div className="col-12">
            <div className="card shadow-sm h-100">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h5 className="card-title mb-0">МКС — положение и движение</h5>
                  <button id="clearMapBtn" className="btn btn-sm btn-outline-secondary">Очистить</button>
                </div>
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

          <div className="col-md-6">
            <div className="card shadow-sm" style={{ animation: 'none' }}>
              <div className="card-body" style={{ animation: 'none' }}>
                <h5 className="card-title">Последний снимок</h5>
                {loading ? (
                  <div className="text-muted">Загрузка данных...</div>
                ) : issData.payload ? (
                  <ul className="list-group" style={{ animation: 'none' }}>
                    <li className="list-group-item" style={{ animation: 'none', transition: 'none' }}>
                      Широта {issData.payload.latitude !== undefined && issData.payload.latitude !== null ? issData.payload.latitude.toFixed(4) : '—'}°
                    </li>
                    <li className="list-group-item" style={{ animation: 'none', transition: 'none' }}>
                      Долгота {issData.payload.longitude !== undefined && issData.payload.longitude !== null ? issData.payload.longitude.toFixed(4) : '—'}°
                    </li>
                    <li className="list-group-item" style={{ animation: 'none', transition: 'none' }}>
                      Высота {formatAltitude(issData.payload.altitude)} км
                    </li>
                    <li className="list-group-item" style={{ animation: 'none', transition: 'none' }}>
                      Скорость {formatVelocity(issData.payload.velocity)} км/ч
                    </li>
                    <li className="list-group-item" style={{ animation: 'none', transition: 'none' }}>
                      Время {issData.fetched_at ? new Date(issData.fetched_at).toLocaleString('ru-RU') : '—'}
                    </li>
                  </ul>
                ) : (
                  <div className="text-muted">нет данных</div>
                )}
              </div>
            </div>
          </div>

          <div className="col-md-6">
            <div className="card shadow-sm" style={{ animation: 'none' }}>
              <div className="card-body" style={{ animation: 'none' }}>
                <h5 className="card-title">Тренд движения</h5>
                {loading ? (
                  <div className="text-muted">Загрузка данных...</div>
                ) : trend.movement !== undefined ? (
                  <ul className="list-group" style={{ animation: 'none' }}>
                    <li className="list-group-item" style={{ animation: 'none', transition: 'none' }}>
                      Движение {trend.movement ? 'да' : 'нет'}
                    </li>
                    <li className="list-group-item" style={{ animation: 'none', transition: 'none' }}>
                      Смещение км {trend.delta_km?.toFixed(3) ?? '—'}
                    </li>
                    <li className="list-group-item" style={{ animation: 'none', transition: 'none' }}>
                      Интервал сек {trend.dt_sec?.toFixed(2) ?? '—'}
                    </li>
                    <li className="list-group-item" style={{ animation: 'none', transition: 'none' }}>
                      Скорость км/ч {trend.velocity_kmh ?? '—'}
                    </li>
                  </ul>
                ) : (
                  <div className="text-muted">нет данных</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Данные космоса */}
      <section className="mb-4">
        <h2 className="h5 mb-3">Данные космоса</h2>
        <div className="row g-3">
          <div className="col-md-6 col-lg-3">
            <div className="card shadow-sm h-100 fade-in" id="apodCard">
              <div className="card-body p-0">
                <div className="text-muted small p-2">Загрузка...</div>
              </div>
            </div>
          </div>

          <div className="col-md-6 col-lg-3">
            <div className="card shadow-sm h-100 fade-in-delay-1" id="neoCard">
              <div className="card-body">
                <div className="d-flex align-items-center mb-2">
                  <h6 className="card-title m-0">Объекты, сближающиеся с Землёй</h6>
                </div>
                <div className="small text-muted mb-2">Близкие сближения сегодня</div>
              </div>
            </div>
          </div>

          <div className="col-md-6 col-lg-3">
            <div className="card shadow-sm h-100 fade-in-delay-2" id="solarCard">
              <div className="card-body">
                <div className="d-flex align-items-center mb-2">
                  <h6 className="card-title m-0">Солнечная активность</h6>
                </div>
                <div className="text-muted small">Загрузка...</div>
              </div>
            </div>
          </div>

          <div className="col-md-6 col-lg-3">
            <div className="card shadow-sm h-100 fade-in-delay-3" id="spacexCard">
              <div className="card-body">
                <div className="d-flex align-items-center mb-2">
                  <h6 className="card-title m-0">SpaceX</h6>
                </div>
                <div className="text-muted small">Загрузка...</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Галерея JWST */}
      <section className="mb-4">
        <h2 className="h5 mb-3">Галерея JWST</h2>
        <div className="row g-3">
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
      </section>

      {/* Астрономические события */}
      <section className="mb-4">
        <h2 className="h5 mb-3">Астрономические события</h2>
        <div className="row g-3">
          <div className="col-12">
            <div className="card shadow-sm">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                  <h5 className="card-title m-0">Астрономические события (NeoWs)</h5>
                  <div className="d-flex gap-2">
                    <button id="exportAstroExcel" className="btn btn-sm btn-success" type="button" title="Экспорт в Excel">
                      Excel
                    </button>
                    <button id="exportAstroCSV" className="btn btn-sm btn-info" type="button" title="Экспорт в CSV">
                      CSV
                    </button>
                  </div>
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

                <div className="row g-2 mb-3">
                  <div className="col-md-3">
                    <label className="form-label small">Сортировать по:</label>
                    <select id="astroSortColumn" className="form-select form-select-sm">
                      <option value="index">#</option>
                      <option value="body">Тело</option>
                      <option value="event">Событие</option>
                      <option value="date">Когда (UTC)</option>
                    </select>
                  </div>
                  <div className="col-md-3">
                    <label className="form-label small">Порядок:</label>
                    <select id="astroSortOrder" className="form-select form-select-sm">
                      <option value="asc">По возрастанию</option>
                      <option value="desc">По убыванию</option>
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small">Поиск:</label>
                    <input
                      type="text"
                      id="astroSearch"
                      className="form-control form-control-sm"
                      placeholder="Поиск по телу, событию, дате..."
                    />
                  </div>
                </div>

                <div className="table-responsive">
                  <table className="table table-sm align-middle table-hover">
                    <thead className="table-light">
                      <tr>
                        <th className="sortable-th" data-sort="index" style={{ cursor: 'pointer' }}>
                          # <span id="sortIndex" className="text-muted">↕</span>
                        </th>
                        <th className="sortable-th" data-sort="body" style={{ cursor: 'pointer' }}>
                          Тело <span id="sortBody" className="text-muted">↕</span>
                        </th>
                        <th className="sortable-th" data-sort="event" style={{ cursor: 'pointer' }}>
                          Событие <span id="sortEvent" className="text-muted">↕</span>
                        </th>
                        <th className="sortable-th" data-sort="date" style={{ cursor: 'pointer' }}>
                          Когда (UTC) <span id="sortDate" className="text-muted">↕</span>
                        </th>
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
        </div>
      </section>

      <DashboardScripts />
    </div>
  )
}

export default function DashboardPage() {
  return (
    <DashboardProvider>
      <DashboardContent />
    </DashboardProvider>
  )
}

