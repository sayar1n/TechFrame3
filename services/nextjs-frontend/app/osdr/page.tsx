'use client'

import '@/styles/osdr.scss'
import { OsdrProvider, useOsdr } from '@/contexts/OsdrContext'

function OsdrContent() {
  const {
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
  } = useOsdr()

  const filteredItems = filteredAndSortedItems

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

      <div className="card shadow-sm mb-4 osdr-filters">
        <div className="card-body">
          <div className="row g-3 align-items-end">
            <div className="col-md-4">
              <label className="form-label small text-muted">Поиск</label>
              <input
                type="text"
                className="form-control osdr-search"
                placeholder="Поиск по названию, ID или статусу..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="col-md-2">
              <label className="form-label small text-muted">Сортировать по</label>
              <select
                className="form-select"
                value={sortColumn}
                onChange={(e) => setSortColumn(e.target.value)}
              >
                <option value="inserted_at">Дата добавления</option>
                <option value="updated_at">Дата обновления</option>
                <option value="dataset_id">ID набора</option>
                <option value="title">Название</option>
                <option value="status">Статус</option>
              </select>
            </div>
            <div className="col-md-2">
              <label className="form-label small text-muted">Порядок</label>
              <select
                className="form-select"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
              >
                <option value="asc">По возрастанию</option>
                <option value="desc">По убыванию</option>
              </select>
            </div>
            <div className="col-md-2">
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
            <div className="col-md-2">
              <label className="form-label small text-muted">&nbsp;</label>
              <button className="btn btn-primary w-100" onClick={loadData} disabled={loading}>
                {loading ? 'Загрузка...' : 'Обновить'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5 loading-spinner">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Загрузка...</span>
          </div>
          <div className="mt-3 text-muted">Загрузка данных...</div>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="card shadow-sm">
          <div className="card-body text-center empty-state">
            <div className="text-muted">Наборы данных не найдены</div>
          </div>
        </div>
      ) : (
        <div className="row g-3 osdr-list">
          {filteredItems.map((item: any, index: number) => {
            const isExpanded = expandedItems.has(item.id)
            return (
              <div key={item.id} className="col-md-6 col-lg-4" style={{ '--index': index } as React.CSSProperties}>
                <div className="card shadow-sm h-100 osdr-card">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div>
                        <h6 className="card-title mb-1 fw-bold">{item.dataset_id || `ID: ${item.id}`}</h6>
                        {item.status && (
                          <span className="badge bg-success status-badge">{item.status}</span>
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
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {!loading && filteredItems.length > 0 && (
        <div className="mt-4 text-center text-muted small">
          Показано {filteredItems.length} из {totalCount} наборов данных
          {searchQuery && ` (найдено по запросу "${searchQuery}")`}
        </div>
      )}
    </div>
  )
}

export default function OsdrPage() {
  return (
    <OsdrProvider>
      <OsdrContent />
    </OsdrProvider>
  )
}
