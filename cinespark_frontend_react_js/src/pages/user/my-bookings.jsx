import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Header from '../../components/layout/Header'
import Footer from '../../components/layout/Footer'
import { useAuth } from '../../contexts/AuthContext'
import { bookingsAPI } from '../../services/api'

export default function MyBookings() {
  const { user, setShowLoginModal } = useAuth()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [cancelling, setCancelling] = useState(null)

  useEffect(() => {
    if (!user) { setLoading(false); return }
    bookingsAPI.getMy()
      .then((res) => setBookings(res.data))
      .catch(() => setError('Failed to load bookings.'))
      .finally(() => setLoading(false))
  }, [user])

  const handleCancel = async (bookingId) => {
    if (!window.confirm('Cancel this booking?')) return
    setCancelling(bookingId)
    try {
      await bookingsAPI.cancel(bookingId)
      setBookings((prev) => prev.map((b) => b.id === bookingId ? { ...b, status: 'cancelled' } : b))
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel booking.')
    } finally {
      setCancelling(null)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-cinema-900">
        <Header />
        <main className="pt-16 flex flex-col items-center justify-center min-h-screen gap-4 px-4 text-center">
          <p className="text-gray-400 text-lg">Please sign in to view your tickets.</p>
          <button onClick={() => setShowLoginModal(true)} className="bg-cinema-gold text-cinema-900 font-bold px-8 py-3 rounded-full hover:bg-yellow-500 transition-all">
            Sign In
          </button>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cinema-900 animate-fade-in">
      <Header />
      <main className="pt-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
          <Link to="/" className="flex items-center gap-2 text-sm text-gray-400 hover:text-cinema-gold transition-colors mb-6 w-fit group">
            <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Home
          </Link>
          <h1 className="text-3xl font-display font-bold text-white mb-2">My Tickets</h1>
          <p className="text-gray-400 mb-8">Booking history for {user.name}</p>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-4 border-cinema-gold border-t-transparent rounded-full animate-spin" />
            </div>
          ) : error ? (
            <p className="text-red-400 text-center">{error}</p>
          ) : bookings.length === 0 ? (
            <div className="glass-panel rounded-2xl p-12 text-center">
              <p className="text-gray-400 mb-4">You have no bookings yet.</p>
              <Link to="/"><button className="bg-cinema-gold text-cinema-900 font-bold px-8 py-3 rounded-full hover:bg-yellow-500 transition-all">Browse Movies</button></Link>
            </div>
          ) : (
            <div className="space-y-4">
              {bookings.map((booking) => (
                <div key={booking.id} className="glass-panel rounded-2xl overflow-hidden flex gap-0 hover:ring-1 hover:ring-white/10 transition-all">
                  <img
                    src={booking.poster_url || 'https://placehold.co/96x144/1a1a2e/d4af37?text=🎬'}
                    alt={booking.movie_title}
                    className="w-24 object-cover flex-shrink-0"
                    onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/96x144/1a1a2e/d4af37?text=🎬' }}
                  />
                  <div className="flex-1 p-5 flex flex-col justify-between">
                    <div className="flex justify-between items-start gap-3 mb-3">
                      <h3 className="text-white font-bold text-lg leading-tight">{booking.movie_title}</h3>
                      <span className={`text-xs font-semibold px-3 py-1 rounded-full flex-shrink-0 ${
                        booking.status === 'confirmed'
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                          : 'bg-red-500/20 text-red-400 border border-red-500/30'
                      }`}>
                        {booking.status === 'confirmed' ? '✓ Confirmed' : '✕ Cancelled'}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-gray-400 mb-3">
                      {booking.show_date && <span>📅 {new Date(booking.show_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>}
                      {booking.show_time && <span>🕐 {booking.show_time?.slice(0, 5)}</span>}
                      {booking.screen_name && <span>🎬 {booking.screen_name}</span>}
                      {booking.seats && <span>💺 {booking.seats}</span>}
                    </div>

                    <div className="flex justify-between items-center pt-3 border-t border-white/10">
                      <div className="flex items-center gap-4">
                        <span className="text-xs text-gray-500 font-mono">{booking.booking_ref}</span>
                        {booking.status === 'confirmed' && (
                          <button
                            onClick={() => handleCancel(booking.id)}
                            disabled={cancelling === booking.id}
                            className="text-xs text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
                          >
                            {cancelling === booking.id ? 'Cancelling…' : 'Cancel'}
                          </button>
                        )}
                      </div>
                      <span className="text-cinema-gold font-bold text-lg">
                        £{Number(booking.total_price).toLocaleString('en-GB')}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
