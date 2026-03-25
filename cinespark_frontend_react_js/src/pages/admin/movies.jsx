import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Header from '../../components/layout/Header'
import Footer from '../../components/layout/Footer'
import { moviesAPI, adminAPI } from '../../services/api'

const blank = {
  title: '', description: '', genre: '', duration: '', language: 'English',
  release_date: '', poster_url: '', backdrop_url: '', rating: '',
  is_featured: false, is_premiere: false, is_now_showing: false, is_coming_soon: false, is_active: true,
}

export default function AdminMovies() {
  const [movies, setMovies] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(blank)
  const [err, setErr] = useState('')
  const [saving, setSaving] = useState(false)

  const load = () => {
    setLoading(true)
    adminAPI.getAllMovies()
      .then((res) => setMovies(res.data))
      .catch(() => setErr('Failed to load movies'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const openAdd = () => { setEditing(null); setForm(blank); setErr(''); setShowModal(true) }
  const openEdit = (m) => {
    setEditing(m)
    setForm({
      title: m.title,
      description: m.description || '',
      genre: m.genre || '',
      duration: m.duration || '',
      language: m.language || 'English',
      release_date: m.release_date?.slice(0, 10) || '',
      poster_url: m.poster_url || '',
      backdrop_url: m.backdrop_url || '',
      rating: m.rating || '',
      is_featured: !!m.is_featured,
      is_premiere: !!m.is_premiere,
      is_now_showing: !!m.is_now_showing,
      is_coming_soon: !!m.is_coming_soon,
      is_active: !!m.is_active,
    })
    setErr(''); setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this movie?')) return
    try {
      await moviesAPI.delete(id)
      setMovies((p) => p.filter((m) => m.id !== id))
    } catch (e) { alert(e.response?.data?.message || 'Delete failed') }
  }

  const handleSave = async () => {
    if (!form.title.trim()) { setErr('Title is required'); return }
    setSaving(true); setErr('')
    try {
      const payload = { ...form }
      if (editing) {
        await moviesAPI.update(editing.id, payload)
      } else {
        await moviesAPI.create(payload)
      }
      setShowModal(false)
      load()
    } catch (e) { setErr(e.response?.data?.message || 'Save failed') }
    finally { setSaving(false) }
  }

  const set = (k) => (e) => { setForm((p) => ({ ...p, [k]: e.target.value })); setErr('') }
  const toggle = (k) => () => { setForm((p) => ({ ...p, [k]: !p[k] })); setErr('') }

  const sectionTags = (m) => {
    const tags = []
    if (m.is_featured) tags.push({ label: 'Hero Banner', color: '#d4af37' })
    if (m.is_now_showing) tags.push({ label: 'Now Showing', color: '#22c55e' })
    if (m.is_coming_soon) tags.push({ label: 'Coming Soon', color: '#3b82f6' })
    return tags
  }

  return (
    <>
      <Header />
      <main className="container">
        <div className="admin-topbar">
          <div>
            <Link to="/admin" className="text-sm text-gray-400 hover:text-cinema-gold transition-colors">← Back to Dashboard</Link>
            <h1 className="page-title" style={{ marginBottom: 0, marginTop: '0.4rem' }}>Manage Movies</h1>
          </div>
          <button className="btn-primary" onClick={openAdd}>+ Add Movie</button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-cinema-gold border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr><th>Poster</th><th>Title</th><th>Genre</th><th>Sections</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {movies.length === 0 ? (
                  <tr><td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>No movies yet. Add one above.</td></tr>
                ) : movies.map((m) => (
                  <tr key={m.id}>
                    <td>
                      <img
                        src={m.poster_url || 'https://placehold.co/60x90/1a1a2e/d4af37?text=🎬'}
                        alt={m.title}
                        className="table-poster"
                        onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/60x90/1a1a2e/d4af37?text=🎬' }}
                      />
                    </td>
                    <td className="table-title">{m.title}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{m.genre || '—'}</td>
                    <td>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {sectionTags(m).length === 0
                          ? <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>—</span>
                          : sectionTags(m).map((t) => (
                            <span key={t.label} style={{
                              background: `${t.color}22`, color: t.color,
                              border: `1px solid ${t.color}55`,
                              borderRadius: '12px', padding: '2px 8px', fontSize: '0.72rem', fontWeight: 600
                            }}>{t.label}</span>
                          ))
                        }
                      </div>
                    </td>
                    <td>
                      <span className={`status-chip ${m.is_active ? 'active' : 'upcoming'}`}>
                        {m.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button className="action-btn edit" onClick={() => openEdit(m)}>Edit</button>
                        <button className="action-btn delete" onClick={() => handleDelete(m.id)}>Delete</button>
                      </div>
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
          <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '540px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 className="modal-title">{editing ? 'Edit Movie' : 'Add Movie'}</h2>
            <div className="modal-form">
              <input placeholder="Title *" value={form.title} onChange={set('title')} />
              <textarea placeholder="Description" value={form.description} onChange={set('description')} rows={3}
                style={{ resize: 'vertical', background: 'var(--cinema-800)', border: '1px solid var(--cinema-600)', borderRadius: '8px', padding: '12px', color: 'white', fontFamily: 'inherit', fontSize: '0.9rem' }} />
              <input placeholder="Genre (e.g. Action/Drama)" value={form.genre} onChange={set('genre')} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <input placeholder="Duration (minutes)" type="number" value={form.duration} onChange={set('duration')} />
                <input placeholder="Rating (e.g. 8.5)" type="number" step="0.1" min="0" max="10" value={form.rating} onChange={set('rating')} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <input placeholder="Language" value={form.language} onChange={set('language')} />
                <input placeholder="Release Date" type="date" value={form.release_date} onChange={set('release_date')} />
              </div>
              <input placeholder="Poster URL  (https://image.tmdb.org/t/p/w500/...)" value={form.poster_url} onChange={set('poster_url')} />
              <input placeholder="Backdrop URL for hero banner  (https://image.tmdb.org/t/p/w1280/...)" value={form.backdrop_url} onChange={set('backdrop_url')} />

              {/* Image previews */}
              {(form.poster_url || form.backdrop_url) && (
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  {form.poster_url && (
                    <div>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '6px' }}>Poster</p>
                      <img src={form.poster_url} alt="poster" style={{ width: '80px', height: '120px', objectFit: 'cover', borderRadius: '6px', border: '1px solid var(--cinema-600)' }}
                        onError={(e) => { e.target.style.display = 'none' }} />
                    </div>
                  )}
                  {form.backdrop_url && (
                    <div style={{ flex: 1 }}>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '6px' }}>Backdrop</p>
                      <img src={form.backdrop_url} alt="backdrop" style={{ width: '100%', height: '80px', objectFit: 'cover', borderRadius: '6px', border: '1px solid var(--cinema-600)' }}
                        onError={(e) => { e.target.style.display = 'none' }} />
                    </div>
                  )}
                </div>
              )}

              {/* Active / Inactive toggle */}
              <label onClick={toggle('is_active')} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer', padding: '10px', borderRadius: '6px', border: `1px solid ${form.is_active ? '#22c55e66' : '#ef444466'}`, background: form.is_active ? '#22c55e11' : '#ef444411', transition: 'all 0.2s' }}>
                <div style={{ width: '18px', height: '18px', borderRadius: '4px', border: `2px solid ${form.is_active ? '#22c55e' : '#ef4444'}`, background: form.is_active ? '#22c55e' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px', transition: 'all 0.2s' }}>
                  {form.is_active && <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1.5 5L4 7.5L8.5 2.5" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                </div>
                <div>
                  <p style={{ color: form.is_active ? '#22c55e' : '#ef4444', fontWeight: 600, fontSize: '0.85rem', lineHeight: 1.2 }}>
                    {form.is_active ? 'Active' : 'Inactive'}
                  </p>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                    {form.is_active ? 'Visible on the public site' : 'Hidden from the public site'}
                  </p>
                </div>
              </label>

              {/* Section checkboxes */}
              <div style={{ background: 'var(--cinema-800)', border: '1px solid var(--cinema-600)', borderRadius: '8px', padding: '14px' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Assign to Sections</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  {[
                    { key: 'is_featured',    label: 'Hero Banner',  color: '#d4af37', desc: 'Big rotating banner at top' },
                    { key: 'is_now_showing', label: 'Now Showing',  color: '#22c55e', desc: 'Now Showing section' },
                    { key: 'is_coming_soon', label: 'Coming Soon',  color: '#3b82f6', desc: 'Coming Soon section' },
                  ].map(({ key, label, color, desc }) => (
                    <label key={key} onClick={toggle(key)} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer', padding: '8px', borderRadius: '6px', border: `1px solid ${form[key] ? color + '66' : 'var(--cinema-600)'}`, background: form[key] ? color + '11' : 'transparent', transition: 'all 0.2s' }}>
                      <div style={{ width: '18px', height: '18px', borderRadius: '4px', border: `2px solid ${form[key] ? color : '#555'}`, background: form[key] ? color : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px', transition: 'all 0.2s' }}>
                        {form[key] && <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1.5 5L4 7.5L8.5 2.5" stroke="#000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                      </div>
                      <div>
                        <p style={{ color: form[key] ? color : 'white', fontWeight: 600, fontSize: '0.85rem', lineHeight: 1.2 }}>{label}</p>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>{desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {err && <p className="modal-error">{err}</p>}
            <div className="modal-actions">
              <button className="btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : editing ? 'Save Changes' : 'Add Movie'}
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
