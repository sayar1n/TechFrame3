'use client'

import Link from 'next/link'
import IssMapScripts from '@/components/IssMapScripts'
import '@/styles/iss.scss'
import { IssProvider, useIss } from '@/contexts/IssContext'
import { IssMetrics } from '@/components/IssMetricCard'

function IssContent() {
  const { last, trend, loading, formatVelocity, formatAltitude, handleExportExcel, handleExportCSV } = useIss()

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="mb-0">МКС данные</h3>
        <div className="d-flex gap-2 export-buttons">
          <button onClick={handleExportExcel} className="btn btn-sm btn-success hover-scale" type="button" title="Экспорт в Excel">
            Excel
          </button>
          <button onClick={handleExportCSV} className="btn btn-sm btn-info hover-scale" type="button" title="Экспорт в CSV">
            CSV
          </button>
        </div>
      </div>

      <IssMetrics
        velocity={last.payload?.velocity}
        altitude={last.payload?.altitude}
        latitude={last.payload?.latitude}
        longitude={last.payload?.longitude}
        loading={loading}
        formatVelocity={formatVelocity}
        formatAltitude={formatAltitude}
        className="mb-3"
      />

      <div className="row g-3 mb-4">
        <div className="col-12">
          <div className="card shadow-sm">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="card-title mb-0">Положение и движение МКС</h5>
                <button id="clearIssMapBtn" className="btn btn-sm btn-outline-secondary">Очистить</button>
              </div>
              <div id="issMap" className="rounded mb-3 border" style={{ height: '300px' }} role="application" aria-label="Карта положения МКС"></div>
              <div className="row g-3">
                <div className="col-md-6">
                  <h6 className="small text-muted mb-2">График скорости</h6>
                  <canvas id="issSpeedChartPage" height="110" aria-label="График скорости МКС"></canvas>
                </div>
                <div className="col-md-6">
                  <h6 className="small text-muted mb-2">График высоты</h6>
                  <canvas id="issAltChartPage" height="110" aria-label="График высоты МКС"></canvas>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-3">
        <div className="col-md-6">
          <div className="card shadow-sm" style={{ animation: 'none' }}>
            <div className="card-body" style={{ animation: 'none' }}>
              <h5 className="card-title">Последний снимок</h5>
              {loading ? (
                <div className="text-muted">Загрузка данных...</div>
              ) : last.payload ? (
                <ul className="list-group" style={{ animation: 'none' }}>
                  <li className="list-group-item" style={{ animation: 'none', transition: 'none' }}>
                    Широта {last.payload.latitude !== undefined && last.payload.latitude !== null ? last.payload.latitude.toFixed(4) : '—'}°
                  </li>
                  <li className="list-group-item" style={{ animation: 'none', transition: 'none' }}>
                    Долгота {last.payload.longitude !== undefined && last.payload.longitude !== null ? last.payload.longitude.toFixed(4) : '—'}°
                  </li>
                  <li className="list-group-item" style={{ animation: 'none', transition: 'none' }}>
                    Высота {formatAltitude(last.payload.altitude)} км
                  </li>
                  <li className="list-group-item" style={{ animation: 'none', transition: 'none' }}>
                    Скорость {formatVelocity(last.payload.velocity)} км/ч
                  </li>
                  <li className="list-group-item" style={{ animation: 'none', transition: 'none' }}>
                    Время {last.fetched_at ? new Date(last.fetched_at).toLocaleString('ru-RU') : '—'}
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
              <div className="mt-3">
                <Link className="btn btn-outline-primary" href="/osdr">
                  Перейти к OSDR
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <IssMapScripts />
    </div>
  )
}

export default function IssPage() {
  return (
    <IssProvider>
      <IssContent />
    </IssProvider>
  )
}

