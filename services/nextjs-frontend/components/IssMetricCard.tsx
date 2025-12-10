'use client'

import React from 'react'

interface IssMetricCardProps {
  label: string
  value: string | number | undefined
  unit?: string
  loading?: boolean
  delay?: number
  className?: string
}

export default function IssMetricCard({
  label,
  value,
  unit,
  loading = false,
  delay = 0,
  className = '',
}: IssMetricCardProps) {
  const displayValue = loading ? (
    <span className="text-muted">...</span>
  ) : value !== undefined && value !== null ? (
    typeof value === 'number' ? (
      value.toFixed(4)
    ) : (
      value
    )
  ) : (
    '—'
  )

  const animationClass = delay > 0 ? `fade-in-delay-${delay}` : 'fade-in'

  return (
    <div className={`col-6 col-md-3 ${className}`}>
      <div className={`border rounded p-2 text-center ${animationClass}`}>
        <div className="small text-muted">{label}</div>
        <div className="fs-4">{displayValue}</div>
        {value !== undefined && value !== null && !loading && unit && (
          <div className="small text-muted">{unit}</div>
        )}
      </div>
    </div>
  )
}

interface IssMetricsProps {
  velocity?: number
  altitude?: number
  latitude?: number
  longitude?: number
  loading?: boolean
  formatVelocity?: (velocity?: number) => string
  formatAltitude?: (altitude?: number) => string
  className?: string
}

export function IssMetrics({
  velocity,
  altitude,
  latitude,
  longitude,
  loading = false,
  formatVelocity,
  formatAltitude,
  className = '',
}: IssMetricsProps) {
  const formattedVelocity = formatVelocity ? formatVelocity(velocity) : (velocity !== undefined ? velocity.toFixed(2) : undefined)
  const formattedAltitude = formatAltitude ? formatAltitude(altitude) : (altitude !== undefined ? altitude.toFixed(2) : undefined)
  const formattedLatitude = latitude !== undefined ? latitude.toFixed(4) : undefined
  const formattedLongitude = longitude !== undefined ? longitude.toFixed(4) : undefined

  return (
    <div className={`row g-3 mb-2 ${className}`}>
      <IssMetricCard
        label="Скорость МКС"
        value={formattedVelocity}
        unit="км/ч"
        loading={loading}
        delay={0}
      />
      <IssMetricCard
        label="Высота МКС"
        value={formattedAltitude}
        unit="км"
        loading={loading}
        delay={1}
      />
      <IssMetricCard
        label="Широта МКС"
        value={formattedLatitude}
        unit="°"
        loading={loading}
        delay={2}
      />
      <IssMetricCard
        label="Долгота МКС"
        value={formattedLongitude}
        unit="°"
        loading={loading}
        delay={3}
      />
    </div>
  )
}

