'use client'

import { useEffect, useState } from 'react'

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

export default function IssScripts() {
  const [last, setLast] = useState<IssLast>({})
  const [trend, setTrend] = useState<IssTrend>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        // Загрузка последних данных
        const lastResponse = await fetch('/api/iss/last')
        const lastData = await lastResponse.json()
        setLast(lastData)

        // Загрузка тренда
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

  if (loading) {
    return <div className="text-muted">Загрузка данных...</div>
  }

  return null
}

