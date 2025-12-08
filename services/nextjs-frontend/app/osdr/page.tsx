'use client'

import { useState, useEffect } from 'react'

interface OsdrItem {
  id: number
  dataset_id?: string
  title?: string
  rest_url?: string
  updated_at?: string
  inserted_at?: string
  status?: string
  raw?: any
}

export default function OsdrPage() {
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set())
  const [items, setItems] = useState<OsdrItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [limit, setLimit] = useState(20)
  const [totalCount, setTotalCount] = useState(0)

  useEffect(() => {
    loadData()
  }, [limit])

  const loadData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/osdr/list?limit=${limit}`)
      const data = await response.json()
      
      const flattened = flattenOsdr(data.items || [])
      setItems(flattened)
      setTotalCount(data.total || flattened.length)
    } catch (e) {
      console.error('Error loading OSDR data:', e)
    } finally {
      setLoading(false)
    }
  }

  const flattenOsdr = (items: any[]): OsdrItem[] => {
    const out: OsdrItem[] = []
    for (const row of items) {
      if (typeof row === 'object' && row !== null) {
        // Проверяем, является ли raw словарём с ключами OSD-xxx
        const raw = row.raw || row
        if (looksOsdrDict(raw)) {
          for (const [k, v] of Object.entries(raw)) {
            if (typeof v === 'object' && v !== null && isString(k) && k.startsWith('OSD-')) {
              const rest = (v as any).REST_URL || (v as any).rest_url || (v as any).rest || null
              const title = (v as any).title || (v as any).name || null
              out.push({
                id: row.id || out.length + 1,
                dataset_id: k,
                title: title || (rest ? basename(rest) : null),
                rest_url: rest,
                updated_at: row.updated_at,
                inserted_at: row.inserted_at,
                status: row.status || 'published',
                raw: v,
              })
            }
          }
        } else {
          out.push({
            id: row.id || out.length + 1,
            dataset_id: row.dataset_id,
            title: row.title,
            rest_url: row.rest_url || (raw?.REST_URL || raw?.rest_url || null),
            updated_at: row.updated_at,
            inserted_at: row.inserted_at,
            status: row.status || 'published',
            raw: raw,
          })
        }
      }
    }
    return out
  }

  const looksOsdrDict = (raw: any): boolean => {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return false
    for (const k of Object.keys(raw)) {
      if (typeof k === 'string' && k.startsWith('OSD-')) return true
      if (raw[k] && typeof raw[k] === 'object' && (raw[k].REST_URL || raw[k].rest_url)) return true
    }
    return false
  }

  const isString = (val: any): val is string => typeof val === 'string'

  const basename = (url: string): string => {
    try {
      return url.split('/').filter(Boolean).pop() || url
    } catch {
      return url
    }
  }

  const toggleItem = (id: number) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedItems(newExpanded)
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—'
    try {
      return new Date(dateStr).toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    } catch {
      return dateStr
    }
  }

  const filteredItems = items.filter((item) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      item.dataset_id?.toLowerCase().includes(query) ||
      item.title?.toLowerCase().includes(query) ||
      item.status?.toLowerCase().includes(query)
    )
  })

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="mb-1">NASA OSDR наборы данных</h3>
          <div className="small text-muted">Репозиторий открытых данных</div>
        </div>
        <div className="text-end">
          <div className="fs-5 fw-bold">{totalCount}</div>
          <div className="small text-muted">всего</div>
        </div>
      </div>

      {/* Фильтры и поиск */}
      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <div className="row g-3 align-items-end">
            <div className="col-md-6">
              <label className="form-label small text-muted">Поиск</label>
              <input
                type="text"
                className="form-control"
                placeholder="Поиск по названию, ID или статусу..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="col-md-3">
              <label className="form-label small text-muted">Показать</label>
              <select
                className="form-select"
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
            <div className="col-md-3">
              <button className="btn btn-primary w-100" onClick={loadData} disabled={loading}>
                {loading ? 'Загрузка...' : 'Обновить'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Список наборов данных */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Загрузка...</span>
          </div>
          <div className="mt-3 text-muted">Загрузка данных...</div>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="card shadow-sm">
          <div className="card-body text-center py-5">
            <div className="text-muted">Наборы данных не найдены</div>
          </div>
        </div>
      ) : (
        <div className="row g-3">
          {filteredItems.map((item) => {
            const isExpanded = expandedItems.has(item.id)
            return (
              <div key={item.id} className="col-md-6 col-lg-4">
                <div className="card shadow-sm h-100">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div>
                        <h6 className="card-title mb-1 fw-bold">{item.dataset_id || `ID: ${item.id}`}</h6>
                        {item.status && (
                          <span className="badge bg-success">{item.status}</span>
                        )}
                      </div>
                      {item.rest_url && (
                        <a
                          href={item.rest_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-sm btn-outline-secondary"
                          title="Открыть в новом окне"
                        >
                          <svg
                            width="16"
                            height="16"
                            fill="currentColor"
                            viewBox="0 0 16 16"
                          >
                            <path d="M8.636 3.5a.5.5 0 0 0-.5-.5H1.5A1.5 1.5 0 0 0 0 4.5v10A1.5 1.5 0 0 0 1.5 16h10a1.5 1.5 0 0 0 1.5-1.5V7.864a.5.5 0 0 0-1 0V14.5a.5.5 0 0 1-.5.5h-10a.5.5 0 0 1-.5-.5v-10a.5.5 0 0 1 .5-.5h6.636a.5.5 0 0 0 .5-.5z" />
                            <path d="M16 .5a.5.5 0 0 0-.5-.5h-5a.5.5 0 0 0 0 1h3.793L6.146 9.146a.5.5 0 1 0 .708.708L15 1.707V5.5a.5.5 0 0 0 1 0v-5z" />
                          </svg>
                        </a>
                      )}
                    </div>
                    
                    {item.title && (
                      <p className="card-text small text-muted mb-2" style={{
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}>
                        {item.title}
                      </p>
                    )}

                    <div className="small text-muted mb-2">
                      <div>Обновлено: {formatDate(item.updated_at)}</div>
                      <div>Добавлено: {formatDate(item.inserted_at)}</div>
                    </div>

                    <button
                      className="btn btn-sm btn-outline-secondary w-100"
                    >
                    </button>

                    {isExpanded && (
                      <div className="mt-3">
                        <pre
                          className="bg-light rounded p-2 small mb-0"
                          style={{ maxHeight: '300px', overflow: 'auto' }}
                        >
                          {JSON.stringify(item.raw ?? {}, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Информация о результатах */}
      {!loading && filteredItems.length > 0 && (
        <div className="mt-4 text-center text-muted small">
          Показано {filteredItems.length} из {items.length} наборов данных
          {searchQuery && ` (отфильтровано по запросу "${searchQuery}")`}
        </div>
      )}
    </div>
  )
}
