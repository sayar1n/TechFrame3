import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="container py-4">
      <h2>Страница из БД</h2>
      <div className="alert alert-warning">Страница не найдена</div>
    </div>
  )
}

