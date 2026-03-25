import { useState, useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import Header from '../../components/layout/Header'
import Footer from '../../components/layout/Footer'
import { seatsAPI } from '../../services/api'

const TYPE_STYLES = {
  vip:      { bg: '#d4af37', border: '#c9a227', label: 'VIP',      labelColor: 'text-cinema-gold', priceMultiplier: 1.4 },
  premium:  { bg: '#818cf8', border: '#6366f1', label: 'Premium',  labelColor: 'text-indigo-400',  priceMultiplier: 1.2 },
  standard: { bg: '#34d399', border: '#10b981', label: 'Standard', labelColor: 'text-emerald-400', priceMultiplier: 1.0 },
}

export default function SeatSelection() {
  const navigate = useNavigate()
  const location = useLocation()
  const { movieTitle = 'Movie', movieId = '', showtimeId, showtime = '', showDate = '', screenName = '', price = 0, poster } = location.state || {}

  const [seats, setSeats] = useState([])
  const [selectedSeats, setSelectedSeats] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [limitMsg, setLimitMsg] = useState('')

  // Scroll to top on mount
  useEffect(() => { window.scrollTo(0, 0) }, [])

  useEffect(() => {
    if (!showtimeId) return
    seatsAPI.getByShowtime(showtimeId)
      .then((res) => setSeats(res.data))
      .catch(() => setError('Failed to load seats. Please try again.'))
      .finally(() => setLoading(false))
  }, [showtimeId])

  if (!location.state || !showtimeId) {
    return (
      <div className="min-h-screen bg-cinema-900">
        <Header />
        <main className="pt-16 flex flex-col items-center justify-center min-h-screen gap-6 px-4 text-center">
          <p className="text-gray-400">No showtime selected. Please go back and choose a movie first.</p>
          <Link to="/" className="bg-cinema-gold text-cinema-900 font-bold px-8 py-3 rounded-full hover:bg-yellow-500 transition-all">
            Browse Movies
          </Link>
        </main>
        <Footer />
      </div>
    )
  }

  const toggleSeat = (seat) => {
    if (seat.status === 'booked') return
    setSelectedSeats((prev) => {
      const exists = prev.find((s) => s.id === seat.id)
      if (exists) {
        setLimitMsg('')
        return prev.filter((s) => s.id !== seat.id)
      }
      if (prev.length >= 10) {
        setLimitMsg('Maximum 10 seats per booking')
        return prev
      }
      setLimitMsg('')
      return [...prev, seat]
    })
  }

  const getSeatPrice = (seat) => {
    const multiplier = TYPE_STYLES[seat.seat_type]?.priceMultiplier || 1
    return Math.round(price * multiplier)
  }

  const totalAmount = selectedSeats.reduce((sum, s) => sum + getSeatPrice(s), 0)

  // Only show legend entries for seat types that actually exist in this screen
  const presentTypes = [...new Set(seats.map((s) => s.seat_type))]

  // Group seats by row
  const rows = seats.reduce((acc, seat) => {
    if (!acc[seat.row_label]) acc[seat.row_label] = []
    acc[seat.row_label].push(seat)
    return acc
  }, {})

  const handleProceed = () => {
    navigate('/booking/payment', {
      state: {
        selectedSeats: selectedSeats.map((s) => ({
          id: s.id,
          label: `${s.row_label}${s.seat_number}`,
          price: getSeatPrice(s),
          category: TYPE_STYLES[s.seat_type]?.label || 'Standard',
        })),
        movieTitle, movieId, showtimeId, showtime, showDate, screenName, poster,
        subtotal: totalAmount,
      },
    })
  }

  const rowKeys = Object.keys(rows).sort((a, b) => {
    const aNum = parseInt(a, 10)
    const bNum = parseInt(b, 10)
    if (!isNaN(aNum) && !isNaN(bNum)) return aNum - bNum
    return a.localeCompare(b)
  })
  const totalRows = rowKeys.length

  return (
    <div className="min-h-screen bg-cinema-900 animate-fade-in pb-32">
      <Header />
      <main className="pt-16">

        {/* Page Header */}
        <div className="bg-cinema-800 border-b border-white/5">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h1 className="text-xl font-display font-bold text-white">{movieTitle}</h1>
              <p className="text-gray-400 text-sm mt-0.5">
                <span className="text-cinema-gold font-medium">{showtime?.slice(0, 5)}</span>
                &nbsp;·&nbsp;{screenName}
                &nbsp;·&nbsp;{showDate ? new Date(showDate).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }) : ''}
              </p>
            </div>
            <Link to={`/movies/${movieId}`} className="text-sm text-gray-400 hover:text-cinema-gold transition-colors flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Change showtime
            </Link>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">

          {/* ── CINEMA SCREEN ── */}
          <div className="mb-10 text-center select-none">
            <div className="relative mx-auto" style={{ width: '88%', maxWidth: '520px' }}>
              {/* Screen glow */}
              <div style={{
                height: '10px',
                borderRadius: '50% 50% 0 0 / 100% 100% 0 0',
                background: 'linear-gradient(180deg, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.05) 100%)',
                boxShadow: '0 -4px 40px 8px rgba(255,255,255,0.12)',
                marginBottom: '1px',
              }} />
              {/* Screen bar */}
              <div style={{
                height: '3px',
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.75)',
                boxShadow: '0 0 18px 6px rgba(255,255,255,0.35)',
              }} />
            </div>
            <p className="text-[11px] text-gray-500 uppercase tracking-[0.45em] mt-3 font-medium">S C R E E N</p>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-4 border-cinema-gold border-t-transparent rounded-full animate-spin" />
            </div>
          ) : error ? (
            <p className="text-center text-red-400">{error}</p>
          ) : seats.length === 0 ? (
            <p className="text-center text-gray-500 italic">No seats have been set up for this screen yet.</p>
          ) : (
            <>
              {/* Legend — only shows types present in this screen */}
              <div className="flex justify-center gap-5 mb-8 flex-wrap">
                {Object.entries(TYPE_STYLES).filter(([type]) => presentTypes.includes(type)).map(([type, col]) => (
                  <div key={type} className="flex items-center gap-2 text-xs text-gray-400">
                    <div style={{
                      width: '20px', height: '22px',
                      borderRadius: '5px 5px 2px 2px',
                      background: col.bg + '55',
                      border: `2px solid ${col.border}`,
                    }} />
                    <span className={col.labelColor + ' font-medium'}>{col.label}</span>
                    <span className="text-gray-600">£{Math.round(price * col.priceMultiplier)}</span>
                  </div>
                ))}
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <div style={{
                    width: '20px', height: '22px',
                    borderRadius: '5px 5px 2px 2px',
                    background: '#1a1a2a',
                    border: '2px solid #2d2d44',
                    opacity: 0.6,
                  }} />
                  <span>Taken</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <div style={{
                    width: '20px', height: '22px',
                    borderRadius: '5px 5px 2px 2px',
                    background: '#e50914',
                    border: '2px solid #ff1f2c',
                    boxShadow: '0 0 8px rgba(229,9,20,0.5)',
                  }} />
                  <span>Yours</span>
                </div>
              </div>

              {/* ── SEAT ROWS ── */}
              <div className="flex flex-col items-center gap-2.5">
                {rowKeys.map((rowLabel, rowIdx) => {
                  const rowSeats = rows[rowLabel].sort((a, b) => a.seat_number - b.seat_number)
                  const type = rowSeats[0]?.seat_type || 'standard'
                  const col = TYPE_STYLES[type] || TYPE_STYLES.standard

                  // Split seats into left and right halves (aisle in middle)
                  const mid = Math.ceil(rowSeats.length / 2)
                  const leftSeats = rowSeats.slice(0, mid)
                  const rightSeats = rowSeats.slice(mid)

                  // Rows closer to back slightly dimmer label; front rows brighter
                  const rowProgress = rowIdx / Math.max(totalRows - 1, 1)

                  return (
                    <div key={rowLabel} className="flex items-center gap-1.5">
                      {/* Row label left */}
                      <span className="w-6 text-right text-[11px] font-bold select-none"
                        style={{ color: col.bg, opacity: 0.7 + rowProgress * 0.3 }}>
                        {rowLabel}
                      </span>

                      {/* Left block */}
                      <div className="flex gap-1">
                        {leftSeats.map((seat) => {
                          const isSelected = !!selectedSeats.find((s) => s.id === seat.id)
                          const isBooked = seat.status === 'booked'
                          return (
                            <button
                              key={seat.id}
                              onClick={() => toggleSeat(seat)}
                              disabled={isBooked}
                              title={isBooked ? 'Already taken' : `${rowLabel}${seat.seat_number} — £${getSeatPrice(seat)}`}
                              style={getSeatStyle(isBooked, isSelected, col)}
                            >
                              <span style={{ fontSize: '9px', lineHeight: 1, display: 'block', paddingTop: '10px' }}>
                                {seat.seat_number}
                              </span>
                            </button>
                          )
                        })}
                      </div>

                      {/* Centre aisle gap */}
                      <div style={{ width: '18px' }} />

                      {/* Right block */}
                      <div className="flex gap-1">
                        {rightSeats.map((seat) => {
                          const isSelected = !!selectedSeats.find((s) => s.id === seat.id)
                          const isBooked = seat.status === 'booked'
                          return (
                            <button
                              key={seat.id}
                              onClick={() => toggleSeat(seat)}
                              disabled={isBooked}
                              title={isBooked ? 'Already taken' : `${rowLabel}${seat.seat_number} — £${getSeatPrice(seat)}`}
                              style={getSeatStyle(isBooked, isSelected, col)}
                            >
                              <span style={{ fontSize: '9px', lineHeight: 1, display: 'block', paddingTop: '10px' }}>
                                {seat.seat_number}
                              </span>
                            </button>
                          )
                        })}
                      </div>

                      {/* Row label right */}
                      <span className="w-6 text-left text-[11px] font-bold select-none"
                        style={{ color: col.bg, opacity: 0.7 + rowProgress * 0.3 }}>
                        {rowLabel}
                      </span>
                    </div>
                  )
                })}
              </div>

              {/* Aisle label */}
              <div className="text-center mt-4 mb-2">
                <span className="text-[10px] text-gray-600 uppercase tracking-widest">← Aisle →</span>
              </div>
            </>
          )}
        </div>
      </main>

      <Footer />

      {/* ── Fixed Bottom Bar ── */}
      <div className="fixed bottom-0 left-0 right-0 z-50 seat-bottom-bar">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          {limitMsg && (
            <div className="absolute top-0 left-0 right-0 transform -translate-y-full bg-red-500/90 text-white text-xs font-semibold text-center py-2">
              {limitMsg}
            </div>
          )}
          {selectedSeats.length === 0 ? (
            <p className="text-gray-500 text-sm">Click on a seat to select it.</p>
          ) : (
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex flex-wrap gap-1.5">
                {selectedSeats.map((s) => {
                  const col = TYPE_STYLES[s.seat_type] || TYPE_STYLES.standard
                  return (
                    <span key={s.id} className="px-2 py-0.5 rounded text-xs font-bold"
                      style={{ background: col.bg + '25', border: `1px solid ${col.bg}60`, color: col.bg }}>
                      {s.row_label}{s.seat_number}
                    </span>
                  )
                })}
              </div>
              <div className="hidden sm:block h-6 w-px" style={{ background: 'rgba(128,128,128,0.3)' }} />
              <div>
                <p className="text-gray-400 text-xs">{selectedSeats.length} seat{selectedSeats.length > 1 ? 's' : ''} · Total</p>
                <p className="text-2xl font-bold text-cinema-gold leading-tight">£{totalAmount.toLocaleString('en-GB')}</p>
              </div>
            </div>
          )}
          <button
            onClick={handleProceed}
            disabled={selectedSeats.length === 0}
            className="bg-cinema-gold text-cinema-900 px-8 py-3 rounded-full font-bold text-base hover:bg-yellow-500 transition-all hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-2 whitespace-nowrap"
          >
            Proceed to Payment
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

function getSeatStyle(isBooked, isSelected, col) {
  const base = {
    width: '34px',
    height: '36px',
    borderRadius: '7px 7px 3px 3px',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    fontSize: '10px',
    fontWeight: 600,
    transition: 'transform 0.1s, box-shadow 0.1s',
    position: 'relative',
    outline: 'none',
  }
  if (isBooked) return {
    ...base,
    background: '#141420',
    border: '2px solid #252535',
    color: '#3a3a50',
    cursor: 'not-allowed',
    opacity: 0.55,
  }
  if (isSelected) return {
    ...base,
    background: 'linear-gradient(180deg, #ff3040 0%, #c0070f 100%)',
    border: '2px solid #ff1f2c',
    color: '#fff',
    cursor: 'pointer',
    boxShadow: '0 0 14px rgba(229,9,20,0.55), 0 2px 6px rgba(0,0,0,0.4)',
    transform: 'scale(1.08) translateY(-2px)',
  }
  return {
    ...base,
    background: `linear-gradient(180deg, ${col.bg}45 0%, ${col.bg}22 100%)`,
    border: `2px solid ${col.border}88`,
    color: col.bg,
    cursor: 'pointer',
  }
}
