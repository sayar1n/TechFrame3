'use client'

import { useEffect, useState } from 'react'

interface CmsBlockProps {
  slug: string
}

export default function CmsBlock({ slug }: CmsBlockProps) {
  const [content, setContent] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadContent = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await fetch(`/api/cms/block?slug=${slug}`)
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        
        const data = await response.json()
        console.log('CMS Block data:', data)
        
        if (data.content) {
          setContent(data.content)
        } else if (data.message) {
          setError(data.message)
        } else {
          setContent(null)
        }
      } catch (e: any) {
        console.error('Error loading CMS block:', e)
        setError(e.message || 'Ошибка загрузки блока')
      } finally {
        setLoading(false)
      }
    }

    loadContent()
  }, [slug])

  return (
    <div className="card mt-3">
      <div className="card-header fw-semibold">CMS — блок из БД</div>
      <div className="card-body">
        {loading ? (
          <div className="text-muted">Загрузка...</div>
        ) : error ? (
          <div className="text-danger">ошибка БД: {error}</div>
        ) : content ? (
          <div dangerouslySetInnerHTML={{ __html: content }} />
        ) : (
          <div className="text-muted">блок не найден</div>
        )}
      </div>
    </div>
  )
}

