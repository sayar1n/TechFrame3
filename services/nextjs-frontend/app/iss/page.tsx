'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

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

interface IssTrend {
  movement?: boolean
  delta_km?: number
  dt_sec?: number
  velocity_kmh?: number
}

export default function IssPage() {
  const [last, setLast] = useState<IssLast>({})
  const [trend, setTrend] = useState<IssTrend>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const lastResponse = await fetch('/api/iss/last')
        const lastData = await lastResponse.json()
        setLast(lastData)

        const trendResponse = await fetch('/api/iss/trend')
        const trendData = await trendResponse.json()
        setTrend(trendData)
      } catch (e) {
        console.error('Error loading ISS data:', e)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  return (
    <div className="container py-4">
      <h3 className="mb-3">МКС данные</h3>

      <div className="row g-3">
        <div className="col-md-6">
          <div className="card shadow-sm">
            <div className="card-body">
              <h5 className="card-title">Последний снимок</h5>
              {loading ? (
                <div className="text-muted">Загрузка данных...</div>
              ) : last.payload ? (
                <ul className="list-group">
                  <li className="list-group-item">
                    Широта {last.payload.latitude ?? '—'}
                  </li>
                  <li className="list-group-item">
                    Долгота {last.payload.longitude ?? '—'}
                  </li>
                  <li className="list-group-item">
                    Высота км {last.payload.altitude ?? '—'}
                  </li>
                  <li className="list-group-item">
                    Скорость км/ч {last.payload.velocity ?? '—'}
                  </li>
                  <li className="list-group-item">Время {last.fetched_at ?? '—'}</li>
                </ul>
              ) : (
                <div className="text-muted">нет данных</div>
              )}
            </div>
          </div>
        </div>

        <div className="col-md-6">
          <div className="card shadow-sm">
            <div className="card-body">
              <h5 className="card-title">Тренд движения</h5>
              {loading ? (
                <div className="text-muted">Загрузка данных...</div>
              ) : trend.movement !== undefined ? (
                <ul className="list-group">
                  <li className="list-group-item">
                    Движение {trend.movement ? 'да' : 'нет'}
                  </li>
                  <li className="list-group-item">
                    Смещение км {trend.delta_km?.toFixed(3) ?? '—'}
                  </li>
                  <li className="list-group-item">
                    Интервал сек {trend.dt_sec?.toFixed(2) ?? '—'}
                  </li>
                  <li className="list-group-item">
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
    </div>
  )
}

