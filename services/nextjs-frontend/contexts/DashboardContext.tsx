'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

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

interface DashboardContextType {
  issData: IssLast
  trend: IssTrend
  loading: boolean
  formatVelocity: (velocity?: number) => string
  formatAltitude: (altitude?: number) => string
  refreshData: () => Promise<void>
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined)

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [issData, setIssData] = useState<IssLast>({})
  const [trend, setTrend] = useState<IssTrend>({})
  const [loading, setLoading] = useState(true)

  const loadIssData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/iss/last')
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      if (data.error) {
        console.error('API error:', data.error)
        return
      }
      setIssData(data)

      const trendResponse = await fetch('/api/iss/trend')
      if (!trendResponse.ok) {
        throw new Error(`HTTP error! status: ${trendResponse.status}`)
      }
      const trendData = await trendResponse.json()
      if (trendData.error) {
        console.error('API error:', trendData.error)
        return
      }
      setTrend(trendData)
    } catch (e) {
      console.error('Error loading ISS data:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadIssData()
    const interval = setInterval(() => {
      loadIssData()
    }, 15000)
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
    <DashboardContext.Provider
      value={{
        issData,
        trend,
        loading,
        formatVelocity,
        formatAltitude,
        refreshData: loadIssData,
      }}
    >
      {children}
    </DashboardContext.Provider>
  )
}

export function useDashboard() {
  const context = useContext(DashboardContext)
  if (context === undefined) {
    throw new Error('useDashboard must be used within a DashboardProvider')
  }
  return context
}
