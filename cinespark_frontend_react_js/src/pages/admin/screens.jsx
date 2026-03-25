import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Header from '../../components/layout/Header'
import Footer from '../../components/layout/Footer'
import { adminAPI } from '../../services/api'

const SEAT_PRESETS = [
  { label: 'Small (3 rows × 8)', rows: ['A', 'B', 'C'], seats_per_row: 8 },
  { label: 'Medium (5 rows × 10)', rows: ['A', 'B', 'C', 'D', 'E'], seats_per_row: 10 },
  { label: 'Large (6 rows × 12)', rows: ['A', 'B', 'C', 'D', 'E', 'F'], seats_per_row: 12 },
]

export default function AdminScreens() {
  const [screens, setScreens] = useState([])
  const [loading, setLoading] = useState(true)

  // Add screen form
  const [showAddModal, setShowAddModal] = useState(false)
  const [screenForm, setScreenForm] = useState({ name: '', total_seats: '' })
  const [screenErr, setScreenErr] = useState('')
  const [screenSaving, setScreenSaving] = useState(false)

  // Edit screen form
  const [editModal, setEditModal] = useState(null) // screen object
  const [editForm, setEditForm] = useState({ name: '', total_seats: '' })
  const [editErr, setEditErr] = useState('')
  const [editSaving, setEditSaving] = useState(false)

  // Generate seats form
  const [genModal, setGenModal] = useState(null) // screen object
  const [preset, setPreset] = useState(0)
  const [customRows, setCustomRows] = useState('A,B,C,D,E')
  const [seatsPerRow, setSeatsPerRow] = useState(10)
  const [seatType, setSeatType] = useState('standard')
  const [genErr, setGenErr] = useState('')
  const [genSuccess, setGenSuccess] = useState('')
  const [generating, setGenerating] = useState(false)

  const load = () => {
    setLoading(true)
    adminAPI.getScreens()
      .then((res) => setScreens(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const handleAddScreen = async () => {
    if (!screenForm.name.trim()) { setScreenErr('Screen name is required'); return }
    if (!screenForm.total_seats) { setScreenErr('Total seats required'); return }
    setScreenSaving(true); setScreenErr('')
    try {
      await adminAPI.createScreen({ name: screenForm.name.trim(), total_seats: Number(screenForm.total_seats) })
      setShowAddModal(false)
      setScreenForm({ name: '', total_seats: '' })
      load()
    } catch (e) { setScreenErr(e.response?.data?.message || 'Failed to add screen') }
    finally { setScreenSaving(false) }
  }

  const handleDeleteScreen = async (id) => {
    if (!window.confirm('Delete this screen? All its seats and showtimes will also be removed.')) return
    try {
      await adminAPI.deleteScreen(id)
      setScreens((p) => p.filter((s) => s.id !== id))
    } catch (e) { alert(e.response?.data?.message || 'Delete failed') }
  }

  const handleGenerateSeats = async () => {
    setGenerating(true); setGenErr('')
    const usePreset = preset < SEAT_PRESETS.length
    const rows = usePreset
      ? SEAT_PRESETS[preset].rows
      : customRows.split(',').map((r) => r.trim().toUpperCase()).filter(Boolean)
    const spRow = usePreset ? SEAT_PRESETS[preset].seats_per_row : Number(seatsPerRow)

    if (!rows.length || !spRow) { setGenErr('Invalid configuration'); setGenerating(false); return }

    try {
      const res = await adminAPI.generateSeats(genModal.id, { rows, seats_per_row: spRow, seat_type: seatType })
      setGenSuccess(res.data.message)
      load()
    } catch (e) { setGenErr(e.response?.data?.message || 'Failed to generate seats') }
    finally { setGenerating(false) }
  }

  const openEditModal = (screen) => {
    setEditModal(screen)
    setEditForm({ name: screen.name, total_seats: screen.total_seats })
    setEditErr('')
  }

  const handleEditScreen = async () => {
    if (!editForm.name.trim()) { setEditErr('Screen name is required'); return }
    if (!editForm.total_seats) { setEditErr('Total seats required'); return }
    setEditSaving(true); setEditErr('')
    try {
      await adminAPI.updateScreen(editModal.id, { name: editForm.name.trim(), total_seats: Number(editForm.total_seats) })
      setEditModal(null)
      load()
    } catch (e) { setEditErr(e.response?.data?.message || 'Failed to update screen') }
    finally { setEditSaving(false) }
  }

  const openGenModal = (screen) => {
    setGenModal(screen)
    setGenSuccess('')
    setPreset(0)
    setCustomRows('A,B,C,D,E')
    setSeatsPerRow(10)
    setSeatType('standard')
    setGenErr('')
    setGenSuccess('')
  }

  const selectedRows = preset < SEAT_PRESETS.length ? SEAT_PRESETS[preset].rows : customRows.split(',').map(r => r.trim()).filter(Boolean)
  const selectedSpRow = preset < SEAT_PRESETS.length ? SEAT_PRESETS[preset].seats_per_row : Number(seatsPerRow)
  const totalSeats = selectedRows.length * selectedSpRow

  return (
    <>
      <Header />
      <main className="container">
        <div className="admin-topbar">
          <div>
            <Link to="/admin" className="text-sm text-gray-400 hover:text-cinema-gold transition-colors">← Back to Dashboard</Link>
            <h1 className="page-title" style={{ marginBottom: 0, marginTop: '0.4rem' }}>Manage Screens</h1>
          </div>
          <button className="btn-primary" onClick={() => { setShowAddModal(true); setScreenErr('') }}>+ Add Screen</button>
        </div>

        <p className="text-gray-400 text-sm mb-6">
          Screens are cinema halls. After creating a screen, generate its seat layout — then you can create showtimes.
        </p>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-cinema-gold border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr><th>Screen</th><th>Total Seats</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {screens.length === 0 ? (
                  <tr><td colSpan="3" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>No screens yet. Add one above.</td></tr>
                ) : screens.map((s) => (
                  <tr key={s.id}>
                    <td className="table-title">{s.name}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{s.total_seats} seats</td>
                    <td>
                      <div className="table-actions">
                        <button className="action-btn edit" onClick={() => openEditModal(s)}>Edit</button>
                        <button className="action-btn" onClick={() => openGenModal(s)}>Generate Seats</button>
                        <button className="action-btn delete" onClick={() => handleDeleteScreen(s.id)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Add Screen Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Add Screen</h2>
            <div className="modal-form">
              <input placeholder="Screen name (e.g. Screen 1)" value={screenForm.name}
                onChange={(e) => { setScreenForm((p) => ({ ...p, name: e.target.value })); setScreenErr('') }} />
              <input type="number" placeholder="Total seats capacity" value={screenForm.total_seats}
                onChange={(e) => { setScreenForm((p) => ({ ...p, total_seats: e.target.value })); setScreenErr('') }} min="1" />
            </div>
            {screenErr && <p className="modal-error">{screenErr}</p>}
            <div className="modal-actions">
              <button className="btn-primary" onClick={handleAddScreen} disabled={screenSaving}>
                {screenSaving ? 'Adding…' : 'Add Screen'}
              </button>
              <button className="action-btn" onClick={() => setShowAddModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Screen Modal */}
      {editModal && (
        <div className="modal-overlay" onClick={() => setEditModal(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Edit Screen — {editModal.name}</h2>
            <div className="modal-form">
              <input placeholder="Screen name (e.g. Screen 1)" value={editForm.name}
                onChange={(e) => { setEditForm((p) => ({ ...p, name: e.target.value })); setEditErr('') }} />
              <input type="number" placeholder="Total seats capacity" value={editForm.total_seats}
                onChange={(e) => { setEditForm((p) => ({ ...p, total_seats: e.target.value })); setEditErr('') }} min="1" />
            </div>
            {editErr && <p className="modal-error">{editErr}</p>}
            <div className="modal-actions">
              <button className="btn-primary" onClick={handleEditScreen} disabled={editSaving}>
                {editSaving ? 'Saving…' : 'Save Changes'}
              </button>
              <button className="action-btn" onClick={() => setEditModal(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Generate Seats Modal */}
      {genModal && (
        <div className="modal-overlay" onClick={() => setGenModal(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '460px' }}>
            <h2 className="modal-title">Generate Seats — {genModal.name}</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>
              This auto-generates the seating layout. Safe to run again — duplicate seats are skipped.
            </p>

            <div className="modal-form">
              {/* Preset selector */}
              <select value={preset} onChange={(e) => setPreset(Number(e.target.value))}>
                {SEAT_PRESETS.map((p, i) => <option key={i} value={i}>{p.label}</option>)}
                <option value={SEAT_PRESETS.length}>Custom…</option>
              </select>

              {/* Custom inputs */}
              {preset === SEAT_PRESETS.length && (
                <>
                  <input placeholder="Row labels (comma-separated, e.g. A,B,C,D,E,F)" value={customRows}
                    onChange={(e) => setCustomRows(e.target.value)} />
                  <input type="number" placeholder="Seats per row" value={seatsPerRow}
                    onChange={(e) => setSeatsPerRow(e.target.value)} min="1" max="30" />
                </>
              )}

              <select value={seatType} onChange={(e) => setSeatType(e.target.value)}>
                <option value="standard">Standard</option>
                <option value="premium">Premium</option>
                <option value="vip">VIP</option>
              </select>
            </div>

            <div style={{ background: 'var(--cinema-800)', borderRadius: '8px', padding: '12px', margin: '12px 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Will generate <strong style={{ color: 'var(--cinema-gold)' }}>{totalSeats} seats</strong>
              {' '}({selectedRows.length} rows × {selectedSpRow} seats) as <strong style={{ color: 'var(--cinema-gold)' }}>{seatType}</strong>
            </div>

            {genErr && <p className="modal-error">{genErr}</p>}
            {genSuccess && (
              <p style={{ color: '#22c55e', fontSize: '0.85rem', background: '#22c55e11', border: '1px solid #22c55e33', borderRadius: '8px', padding: '10px 14px', margin: '8px 0' }}>
                ✓ {genSuccess}
              </p>
            )}
            <div className="modal-actions">
              {!genSuccess && (
                <button className="btn-primary" onClick={handleGenerateSeats} disabled={generating}>
                  {generating ? 'Generating…' : 'Generate Seats'}
                </button>
              )}
              <button className="action-btn" onClick={() => setGenModal(null)}>{genSuccess ? 'Close' : 'Cancel'}</button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  )
}
