import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Header from '../../components/layout/Header'
import Footer from '../../components/layout/Footer'
import { bookingsAPI } from '../../services/api'

export default function Confirmation() {
  const location = useLocation()
  const navigate = useNavigate()
  const state = location.state || {}

  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(false)
  const [fetchError, setFetchError] = useState('')
  const [cancelling, setCancelling] = useState(false)
  const [cancelled, setCancelled] = useState(false)

  // If state is missing (e.g. user refreshed), fetch from API using bookingId
  useEffect(() => {
    if (!state.bookingRef && state.bookingId) {
      setLoading(true)
      bookingsAPI.getById(state.bookingId)
        .then((res) => setBooking(res.data))
        .catch(() => setFetchError('Could not load booking details.'))
        .finally(() => setLoading(false))
    }
  }, [])

  // Derive display values — prefer API data over navigation state
  const bookingRef = booking?.booking_ref || state.bookingRef || 'CS-XXXXXX'
  const movieTitle = booking?.movie_title || state.movieTitle || 'Movie'
  const showtime = booking
    ? `${booking.show_time?.slice(0, 5)} · ${new Date(booking.show_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`
    : state.showtime || ''
  const seats = booking?.seats || (state.selectedSeats || []).map((s) => s.label || s.id || s).join(', ')
  const total = booking?.total_price ?? state.total ?? 0
  const cardName = state.cardName || ''
  const bookingId = booking?.id || state.bookingId

  const handleCancel = async () => {
    if (!bookingId) return
    if (!window.confirm('Are you sure you want to cancel this booking? This cannot be undone.')) return
    setCancelling(true)
    try {
      await bookingsAPI.cancel(bookingId)
      setCancelled(true)
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel booking.')
    } finally {
      setCancelling(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-cinema-900">
        <Header />
        <div className="pt-16 flex items-center justify-center min-h-screen">
          <div className="w-8 h-8 border-4 border-cinema-gold border-t-transparent rounded-full animate-spin" />
        </div>
        <Footer />
      </div>
    )
  }

  if (fetchError) {
    return (
      <div className="min-h-screen bg-cinema-900">
        <Header />
        <div className="pt-16 flex flex-col items-center justify-center min-h-screen gap-4 px-4 text-center">
          <p className="text-gray-400">{fetchError}</p>
          <Link to="/" className="text-cinema-gold hover:text-yellow-400 text-sm">← Back to Home</Link>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cinema-900 animate-fade-in">
      <Header />

      <main className="pt-16 flex items-center justify-center min-h-screen px-4 py-12">
        <div className="w-full max-w-lg animate-slide-up">

          {/* Success / Cancelled icon */}
          <div className="flex flex-col items-center mb-8">
            {cancelled ? (
              <div className="w-20 h-20 bg-red-500/20 border-2 border-red-500/40 rounded-full flex items-center justify-center mb-4">
                <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            ) : (
              <div className="w-20 h-20 bg-green-500/20 border-2 border-green-500/40 rounded-full flex items-center justify-center mb-4">
                <svg className="w-10 h-10 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
            <h1 className="text-3xl font-display font-bold text-white mb-1">
              {cancelled ? 'Booking Cancelled' : 'Booking Confirmed!'}
            </h1>
            <p className="text-gray-400">
              {cancelled ? 'Your booking has been cancelled and seats released.' : 'Your tickets have been booked successfully.'}
            </p>
          </div>

          {/* Booking details card */}
          <div className="glass-panel rounded-2xl p-6 mb-6">
            {/* Reference */}
            <div className="text-center pb-5 mb-5 border-b border-white/10">
              <p className="text-gray-400 text-sm mb-1">Booking Reference</p>
              <p className="text-2xl font-bold font-mono text-cinema-gold tracking-wider">{bookingRef}</p>
            </div>

            {/* Details */}
            <div className="space-y-4">
              {[
                { label: 'Movie', value: movieTitle },
                { label: 'Showtime', value: showtime },
                { label: 'Seats', value: seats },
                { label: 'Total Paid', value: `£${Number(total).toLocaleString('en-GB')}` },
                ...(cardName ? [{ label: 'Cardholder', value: cardName }] : []),
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-start gap-4">
                  <span className="text-gray-400 text-sm flex-shrink-0">{label}</span>
                  <span className="text-white font-semibold text-right text-sm">{value}</span>
                </div>
              ))}
            </div>

            <div className="mt-5 pt-5 border-t border-white/10">
              <p className="text-gray-500 text-xs text-center">
                A confirmation email would be sent in the live version. Please save your booking reference.
              </p>
            </div>
          </div>

          <Link to="/" className="block mb-3">
            <button className="w-full bg-cinema-gold text-cinema-900 font-bold py-4 rounded-full hover:bg-yellow-500 transition-all hover:scale-105 text-lg">
              Back to Home
            </button>
          </Link>

          {!cancelled && bookingId && (
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="w-full border border-red-500/40 text-red-400 hover:bg-red-500/10 font-semibold py-3 rounded-full transition-all disabled:opacity-50"
            >
              {cancelling ? 'Cancelling…' : 'Cancel This Booking'}
            </button>
          )}

        </div>
      </main>

      <Footer />
    </div>
  )
}
