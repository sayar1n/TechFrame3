'use client'

import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react'

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

interface OsdrContextType {
  items: OsdrItem[]
  loading: boolean
  searchQuery: string
  setSearchQuery: (query: string) => void
  limit: number
  setLimit: (limit: number) => void
  totalCount: number
  expandedItems: Set<number>
  toggleItem: (id: number) => void
  formatDate: (dateStr?: string) => string
  loadData: () => Promise<void>
  sortColumn: string
  setSortColumn: (column: string) => void
  sortOrder: 'asc' | 'desc'
  setSortOrder: (order: 'asc' | 'desc') => void
  filteredAndSortedItems: OsdrItem[]
}

const OsdrContext = createContext<OsdrContextType | undefined>(undefined)

export function OsdrProvider({ children }: { children: ReactNode }) {
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set())
  const [items, setItems] = useState<OsdrItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [limit, setLimit] = useState(20)
  const [totalCount, setTotalCount] = useState(0)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [sortColumn, setSortColumn] = useState<string>('inserted_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const flattenOsdr = (items: any[]): OsdrItem[] => {
    const out: OsdrItem[] = []
    for (const row of items) {
      if (typeof row === 'object' && row !== null) {
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

  const loadData = async () => {
    try {
      setLoading(true)
      const url = new URL('/api/osdr/list', window.location.origin)
      url.searchParams.set('limit', limit.toString())
      if (searchQuery.trim()) {
        url.searchParams.set('search', searchQuery.trim())
      }

      const response = await fetch(url.toString())
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

  useEffect(() => {
    loadData()
  }, [limit])

  useEffect(() => {
    // Debounce поиска: ждем 500ms после последнего изменения
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    searchTimeoutRef.current = setTimeout(() => {
      loadData()
    }, 500)

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [searchQuery])

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

  // ДОБАВЛЕНО: Фильтрация и сортировка элементов
  const filteredAndSortedItems = [...items].sort((a, b) => {
    let aValue: any
    let bValue: any

    switch (sortColumn) {
      case 'dataset_id':
        aValue = (a.dataset_id || '').toLowerCase()
        bValue = (b.dataset_id || '').toLowerCase()
        break
      case 'title':
        aValue = (a.title || '').toLowerCase()
        bValue = (b.title || '').toLowerCase()
        break
      case 'status':
        aValue = (a.status || '').toLowerCase()
        bValue = (b.status || '').toLowerCase()
        break
      case 'inserted_at':
        aValue = new Date(a.inserted_at || 0).getTime()
        bValue = new Date(b.inserted_at || 0).getTime()
        break
      case 'updated_at':
        aValue = new Date(a.updated_at || 0).getTime()
        bValue = new Date(b.updated_at || 0).getTime()
        break
      default:
        return 0
    }

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      const comparison = aValue.localeCompare(bValue, 'ru')
      return sortOrder === 'asc' ? comparison : -comparison
    } else {
      const comparison = aValue - bValue
      return sortOrder === 'asc' ? comparison : -comparison
    }
  })

  return (
    <OsdrContext.Provider
      value={{
        items,
        loading,
        searchQuery,
        setSearchQuery,
        limit,
        setLimit,
        totalCount,
        expandedItems,
        toggleItem,
        formatDate,
        loadData,
        sortColumn,
        setSortColumn,
        sortOrder,
        setSortOrder,
        filteredAndSortedItems,
      }}
    >
      {children}
    </OsdrContext.Provider>
  )
}

export function useOsdr() {
  const context = useContext(OsdrContext)
  if (context === undefined) {
    throw new Error('useOsdr must be used within an OsdrProvider')
  }
  return context
}
