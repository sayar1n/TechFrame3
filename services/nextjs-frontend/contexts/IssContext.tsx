'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { exportIssDataToExcel, exportIssDataToCSV } from '@/utils/exportUtils'

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

interface IssContextType {
  last: IssLast
  trend: IssTrend
  loading: boolean
  formatVelocity: (velocity?: number) => string
  formatAltitude: (altitude?: number) => string
  handleExportExcel: () => void
  handleExportCSV: () => void
  refreshData: () => Promise<void>
}

const IssContext = createContext<IssContextType | undefined>(undefined)

export function IssProvider({ children }: { children: ReactNode }) {
  const [last, setLast] = useState<IssLast>({})
  const [trend, setTrend] = useState<IssTrend>({})
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    try {
      setLoading(true)
      const lastResponse = await fetch('/api/iss/last')
      if (!lastResponse.ok) {
        throw new Error(`HTTP error! status: ${lastResponse.status}`)
      }
      const lastData = await lastResponse.json()
      if (lastData.error) {
        console.error('API error:', lastData.error)
        return
      }
      setLast(lastData)

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
    loadData()
    const interval = setInterval(() => {
      loadData()
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

  const handleExportExcel = () => {
    exportIssDataToExcel(last, trend)
  }

  const handleExportCSV = () => {
    exportIssDataToCSV(last, trend)
  }

  return (
    <IssContext.Provider
      value={{
        last,
        trend,
        loading,
        formatVelocity,
        formatAltitude,
        handleExportExcel,
        handleExportCSV,
        refreshData: loadData,
      }}
    >
      {children}
    </IssContext.Provider>
  )
}

export function useIss() {
  const context = useContext(IssContext)
  if (context === undefined) {
    throw new Error('useIss must be used within an IssProvider')
  }
  return context
}
