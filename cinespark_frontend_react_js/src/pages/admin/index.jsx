import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Header from '../../components/layout/Header'
import Footer from '../../components/layout/Footer'
import { adminAPI } from '../../services/api'

export default function AdminDashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    adminAPI.getDashboard()
      .then((res) => setData(res.data))
      .catch(() => setError('Failed to load dashboard data. Check your connection and try again.'))
      .finally(() => setLoading(false))
  }, [])

  const stats = data ? [
    { label: 'Total Movies', value: data.totalMovies, icon: '🎬', color: '#e50914' },
    { label: 'Total Bookings', value: data.totalBookings, icon: '🎟️', color: '#4ade80' },
    { label: 'Total Users', value: data.totalUsers, icon: '👥', color: '#f97316' },
    { label: 'Revenue (£)', value: Number(data.totalRevenue).toLocaleString('en-GB'), icon: '💰', color: '#60a5fa' },
  ] : []

  return (
    <>
      <Header />
      <main className="container">
        <div className="admin-topbar">
          <h1 className="page-title" style={{ marginBottom: 0 }}>Admin Dashboard</h1>
          <span className="admin-badge">Admin Mode</span>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-cinema-gold border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 mb-6">{error}</p>
        ) : (
          <>
            <div className="admin-stats">
              {stats.map((s) => (
                <div key={s.label} className="stat-card">
                  <div className="stat-icon" style={{ color: s.color }}>{s.icon}</div>
                  <div className="stat-value">{s.value}</div>
                  <div className="stat-label">{s.label}</div>
                </div>
              ))}
            </div>

            {data?.revenueByMovie?.length > 0 && (
              <>
                <h2 className="admin-section-title">Revenue by Movie</h2>
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr><th>Movie</th><th>Bookings</th><th>Revenue</th></tr>
                    </thead>
                    <tbody>
                      {data.revenueByMovie.map((m) => (
                        <tr key={m.title}>
                          <td className="table-title">{m.title}</td>
                          <td style={{ color: 'var(--text-muted)' }}>{m.bookings}</td>
                          <td style={{ fontWeight: 700 }}>£{Number(m.revenue).toLocaleString('en-GB')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {data?.recentBookings?.length > 0 && (
              <>
                <h2 className="admin-section-title">Recent Bookings</h2>
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr><th>Reference</th><th>Customer</th><th>Movie</th><th>Total</th><th>Status</th></tr>
                    </thead>
                    <tbody>
                      {data.recentBookings.map((b) => (
                        <tr key={b.id}>
                          <td><code className="ref-code">{b.booking_ref}</code></td>
                          <td style={{ color: 'var(--text-muted)' }}>{b.user_name}</td>
                          <td className="table-title">{b.movie_title}</td>
                          <td style={{ fontWeight: 700 }}>£{Number(b.total_price).toLocaleString('en-GB')}</td>
                          <td><span className={`booking-status ${b.status}`}>{b.status === 'confirmed' ? '✓ Confirmed' : '✕ Cancelled'}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </>
        )}

        <h2 className="admin-section-title">Manage</h2>
        <div className="admin-grid">
          <Link to="/admin/movies" className="admin-card"><span className="admin-card-icon">🎬</span>Manage Movies</Link>
          <Link to="/admin/screens" className="admin-card"><span className="admin-card-icon">🏛️</span>Manage Screens</Link>
          <Link to="/admin/showtimes" className="admin-card"><span className="admin-card-icon">🕐</span>Manage Showtimes</Link>
          <Link to="/admin/bookings" className="admin-card"><span className="admin-card-icon">🎟️</span>View Bookings</Link>
          <Link to="/admin/settings" className="admin-card"><span className="admin-card-icon">⚙️</span>Settings</Link>
        </div>
      </main>
      <Footer />
    </>
  )
}
