import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Header from '../../components/layout/Header'
import Footer from '../../components/layout/Footer'
import { adminAPI } from '../../services/api'

export default function AdminBookings() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadErr, setLoadErr] = useState('')
  const [filter, setFilter] = useState('all')
  const [updating, setUpdating] = useState(null)

  useEffect(() => {
    adminAPI.getBookings()
      .then((res) => setBookings(res.data))
      .catch(() => setLoadErr('Failed to load bookings. Please refresh the page.'))
      .finally(() => setLoading(false))
  }, [])

  const handleStatusChange = async (id, status) => {
    if (!window.confirm(`Mark this booking as ${status}?`)) return
    setUpdating(id)
    try {
      await adminAPI.updateBookingStatus(id, status)
      setBookings((prev) => prev.map((b) => b.id === id ? { ...b, status } : b))
    } catch (e) { alert(e.response?.data?.message || 'Update failed') }
    finally { setUpdating(null) }
  }

  const filtered = filter === 'all' ? bookings : bookings.filter((b) => b.status === filter)
  const totalRevenue = filtered.filter((b) => b.status === 'confirmed').reduce((s, b) => s + Number(b.total_price), 0)

  return (
    <>
      <Header />
      <main className="container">
        <div className="admin-topbar">
          <div>
            <Link to="/admin" className="text-sm text-gray-400 hover:text-cinema-gold transition-colors">← Back to Dashboard</Link>
            <h1 className="page-title" style={{ marginBottom: 0, marginTop: '0.4rem' }}>Bookings Overview</h1>
          </div>
          <div className="bookings-summary">
            <span className="booking-stat">{filtered.filter((b) => b.status === 'confirmed').length} confirmed</span>
            <span className="booking-stat revenue">£{totalRevenue.toLocaleString('en-GB')} revenue</span>
          </div>
        </div>

        <div className="filter-tabs">
          {['all', 'confirmed', 'cancelled'].map((f) => (
            <button key={f} className={`filter-tab ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
              <span className="tab-count">
                {f === 'all' ? bookings.length : bookings.filter((b) => b.status === f).length}
              </span>
            </button>
          ))}
        </div>

        {loadErr && <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 mb-4">{loadErr}</p>}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-cinema-gold border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr><th>Reference</th><th>Customer</th><th>Movie</th><th>Seats</th><th>Total</th><th>Date</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan="8" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>No bookings found.</td></tr>
                ) : filtered.map((b) => (
                  <tr key={b.id}>
                    <td><code className="ref-code">{b.booking_ref}</code></td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{b.user_name}<br /><span style={{ opacity: 0.6 }}>{b.user_email}</span></td>
                    <td className="table-title">{b.movie_title}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{b.seats}</td>
                    <td style={{ fontWeight: 700 }}>£{Number(b.total_price).toLocaleString('en-GB')}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{b.show_date?.slice(0, 10)}</td>
                    <td><span className={`booking-status ${b.status}`}>{b.status === 'confirmed' ? '✓ Confirmed' : '✕ Cancelled'}</span></td>
                    <td>
                      {b.status === 'confirmed' ? (
                        <button className="action-btn delete" onClick={() => handleStatusChange(b.id, 'cancelled')} disabled={updating === b.id}>
                          {updating === b.id ? '…' : 'Cancel'}
                        </button>
                      ) : (
                        <button className="action-btn edit" onClick={() => handleStatusChange(b.id, 'confirmed')} disabled={updating === b.id}>
                          {updating === b.id ? '…' : 'Restore'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
      <Footer />
    </>
  )
}
