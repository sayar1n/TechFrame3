import type { Metadata } from 'next'
import Link from 'next/link'
import Scripts from './scripts'
import '../styles/globals.scss'

export const metadata: Metadata = {
  title: 'Space Dashboard',
  description: 'Космические данные и дашборды',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru">
      <head>
        <link
          href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css"
          rel="stylesheet"
          crossOrigin="anonymous"
        />
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          crossOrigin="anonymous"
        />
      </head>
      <body>
        <nav className="navbar navbar-expand-lg bg-body-tertiary mb-3">
          <div className="container">
            <Link className="navbar-brand" href="/dashboard">
              Dashboard
            </Link>
            <Link className="nav-link" href="/iss">
              ISS
            </Link>
            <Link className="nav-link" href="/osdr">
              OSDR
            </Link>
          </div>
        </nav>
        {children}
        <Scripts />
      </body>
    </html>
  )
}

