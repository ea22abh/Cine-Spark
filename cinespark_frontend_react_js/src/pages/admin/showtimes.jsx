import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Header from '../../components/layout/Header'
import Footer from '../../components/layout/Footer'
import { showtimesAPI, adminAPI } from '../../services/api'

const blank = { movie_id: '', screen_id: '', show_date: '', show_time: '', price: '', available_seats: '' }

const isPast = (s) => {
  const dt = new Date(`${s.show_date?.slice(0, 10)}T${s.show_time}`)
  return dt < new Date()
}

const today = new Date().toISOString().split('T')[0]

export default function AdminShowtimes() {
  const [showtimes, setShowtimes] = useState([])
  const [movies, setMovies] = useState([])
  const [screens, setScreens] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(blank)
  const [err, setErr] = useState('')
  const [saving, setSaving] = useState(false)

  const load = () => {
    setLoading(true)
    Promise.all([showtimesAPI.getAll(), adminAPI.getAllMovies(), adminAPI.getScreens()])
      .then(([st, mv, sc]) => {
        setShowtimes(st.data)
        setMovies(mv.data)
        setScreens(sc.data)
        // Pre-fill defaults in form
        setForm((f) => ({
          ...f,
          movie_id: mv.data[0]?.id || '',
          screen_id: sc.data[0]?.id || '',
          available_seats: sc.data[0]?.total_seats || '',
        }))
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this showtime?')) return
    try {
      await showtimesAPI.delete(id)
      setShowtimes((p) => p.filter((s) => s.id !== id))
    } catch (e) { alert(e.response?.data?.message || 'Delete failed') }
  }

  const handleAdd = async () => {
    if (!form.movie_id) { setErr('Select a movie'); return }
    if (!form.screen_id) { setErr('Select a screen'); return }
    if (!form.show_date) { setErr('Date is required'); return }
    if (!form.show_time.trim()) { setErr('Time is required'); return }
    if (!form.price) { setErr('Price is required'); return }
    setSaving(true); setErr('')
    try {
      await showtimesAPI.create({
        movie_id: Number(form.movie_id),
        screen_id: Number(form.screen_id),
        show_date: form.show_date,
        show_time: form.show_time,
        price: Number(form.price),
        available_seats: Number(form.available_seats),
      })
      setShowModal(false)
      setForm(blank)
      load()
    } catch (e) { setErr(e.response?.data?.message || 'Failed to add showtime') }
    finally { setSaving(false) }
  }

  const set = (k) => (e) => { setForm((p) => ({ ...p, [k]: e.target.value })); setErr('') }

  const handleScreenChange = (e) => {
    const screenId = e.target.value
    const screen = screens.find((s) => String(s.id) === screenId)
    setForm((p) => ({ ...p, screen_id: screenId, available_seats: screen?.total_seats || '' }))
    setErr('')
  }

  return (
    <>
      <Header />
      <main className="container">
        <div className="admin-topbar">
          <div>
            <Link to="/admin" className="text-sm text-gray-400 hover:text-cinema-gold transition-colors">← Back to Dashboard</Link>
            <h1 className="page-title" style={{ marginBottom: 0, marginTop: '0.4rem' }}>Manage Showtimes</h1>
          </div>
          <button className="btn-primary" onClick={() => {
            const firstScreen = screens[0]
            setErr('')
            setForm({
              ...blank,
              movie_id: movies[0]?.id || '',
              screen_id: firstScreen?.id || '',
              available_seats: firstScreen?.total_seats || '',
            })
            setShowModal(true)
          }}>+ Add Showtime</button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-cinema-gold border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr><th>Movie</th><th>Date</th><th>Time</th><th>Screen</th><th>Price</th><th>Seats Left</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {showtimes.length === 0 ? (
                  <tr><td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>No showtimes yet. Add one above.</td></tr>
                ) : showtimes.map((s) => (
                  <tr key={s.id}>
                    <td className="table-title">{s.movie_title}</td>
                    <td style={{ color: 'var(--text-muted)' }}>
                      {s.show_date?.slice(0, 10)}
                      {isPast(s) && (
                        <span style={{ marginLeft: '6px', fontSize: '0.65rem', background: '#ef4444', color: '#fff', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>
                          EXPIRED
                        </span>
                      )}
                    </td>
                    <td style={{ color: 'var(--text-muted)' }}>{s.show_time?.slice(0, 5)}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{s.screen_name}</td>
                    <td style={{ fontWeight: 700 }}>£{s.price}</td>
                    <td>
                      <div className="seat-availability">
                        <span className="seat-count">{s.available_seats}</span>
                      </div>
                    </td>
                    <td>
                      <button className="action-btn delete" onClick={() => handleDelete(s.id)}>Remove</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Add Showtime</h2>
            <div className="modal-form">
              <select value={form.movie_id} onChange={set('movie_id')}>
                <option value="">Select Movie</option>
                {movies.map((m) => <option key={m.id} value={m.id}>{m.title}</option>)}
              </select>
              <select value={form.screen_id} onChange={handleScreenChange}>
                <option value="">Select Screen</option>
                {screens.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.total_seats} seats)</option>)}
              </select>
              {form.screen_id && form.available_seats && (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '-4px' }}>
                  Screen capacity: <strong style={{ color: 'var(--cinema-gold)' }}>{form.available_seats} seats</strong>
                </p>
              )}
              <input type="date" value={form.show_date} onChange={set('show_date')} min={today} />
              <input type="time" placeholder="Show Time" value={form.show_time} onChange={set('show_time')} />
              <input type="number" placeholder="Ticket Price (£)" value={form.price} onChange={set('price')} min="1" />
            </div>
            {err && <p className="modal-error">{err}</p>}
            {movies.length === 0 && <p className="modal-error">Add movies first before creating showtimes.</p>}
            {screens.length === 0 && <p className="modal-error">Add screens first (via Admin Dashboard).</p>}
            <div className="modal-actions">
              <button className="btn-primary" onClick={handleAdd} disabled={saving}>
                {saving ? 'Adding…' : 'Add Showtime'}
              </button>
              <button className="action-btn" onClick={() => setShowModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  )
}
