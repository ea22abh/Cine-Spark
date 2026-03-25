import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Header from '../../components/layout/Header'
import Footer from '../../components/layout/Footer'
import { moviesAPI } from '../../services/api'

export default function MoviePage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [movie, setMovie] = useState(null)
  const [showtimes, setShowtimes] = useState([])
  const [selectedShowtime, setSelectedShowtime] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => { window.scrollTo(0, 0) }, [])

  useEffect(() => {
    const load = async () => {
      try {
        const [movieRes, showRes] = await Promise.all([
          moviesAPI.getById(id),
          moviesAPI.getShowtimes(id),
        ])
        setMovie(movieRes.data)
        const now = new Date()
        const futureShowtimes = showRes.data.filter((st) => {
          if (!st.show_date || !st.show_time) return false
          const dt = new Date(`${st.show_date.slice(0, 10)}T${st.show_time}`)
          return !isNaN(dt.getTime()) && dt > now
        })
        setShowtimes(futureShowtimes)
      } catch {
        setError('Movie not found.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

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

  if (error || !movie) {
    return (
      <div className="min-h-screen bg-cinema-900">
        <Header />
        <div className="pt-16 flex flex-col items-center justify-center min-h-screen gap-4">
          <p className="text-gray-400 text-lg">{error || 'Movie not found.'}</p>
          <button onClick={() => navigate('/')} className="text-cinema-gold hover:text-yellow-400 flex items-center gap-2 text-sm">
            ← Back to Home
          </button>
        </div>
        <Footer />
      </div>
    )
  }

  // Group showtimes by date
  const byDate = showtimes.reduce((acc, st) => {
    const d = st.show_date?.slice(0, 10) || 'TBD'
    if (!acc[d]) acc[d] = []
    acc[d].push(st)
    return acc
  }, {})

  const handleSelectSeats = () => {
    if (!selectedShowtime) return
    navigate('/booking/seat-selection', {
      state: {
        movieTitle: movie.title,
        movieId: movie.id,
        poster: movie.poster_url,
        showtimeId: selectedShowtime.id,
        showtime: selectedShowtime.show_time,
        showDate: selectedShowtime.show_date,
        screenName: selectedShowtime.screen_name,
        price: selectedShowtime.price,
      },
    })
  }

  return (
    <div className="min-h-screen bg-cinema-900 animate-fade-in pb-28">
      <Header />
      <main className="pt-16">

        {/* ── Movie Hero ── */}
        <div className="relative bg-cinema-900">
          {/* Backdrop image — in its own overflow-hidden layer so it never clips content */}
          <div className="absolute inset-0 overflow-hidden" style={{ height: '340px' }}>
            <img
              src={movie.backdrop_url || movie.poster_url || ''}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 w-full h-full object-cover object-top opacity-20 blur-sm scale-105"
              onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/1280x720/1a1a2e/d4af37?text=' }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-cinema-900/30 via-cinema-900/60 to-cinema-900" />
          </div>

          {/* Content — not overflow-hidden, poster can fully display */}
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-10">

            {/* Back button */}
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-sm text-gray-400 hover:text-cinema-gold transition-colors mb-8 group"
            >
              <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Films
            </button>

            {/* Poster + info */}
            <div className="flex flex-col sm:flex-row gap-6 sm:gap-8 items-start">
              {/* Poster */}
              <img
                src={movie.poster_url || 'https://placehold.co/300x450/1a1a2e/d4af37?text=No+Poster'}
                alt={movie.title}
                className="w-36 sm:w-48 rounded-xl shadow-2xl border-2 border-cinema-gold/20 flex-shrink-0"
                style={{ boxShadow: '0 20px 50px rgba(0,0,0,0.7)' }}
                onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/300x450/1a1a2e/d4af37?text=No+Poster' }}
              />

              {/* Details */}
              <div className="flex-1 pt-2">
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-white mb-3 leading-tight">
                  {movie.title}
                </h1>
                <div className="flex flex-wrap items-center gap-3 text-sm text-gray-300 mb-4">
                  {movie.genre && (
                    <span className="px-3 py-1 bg-cinema-800 rounded-full border border-cinema-600 text-xs font-medium">
                      {movie.genre}
                    </span>
                  )}
                  {movie.language && <span className="text-gray-400">{movie.language}</span>}
                  {movie.duration && <span className="text-gray-400">{movie.duration} min</span>}
                  {movie.rating > 0 && (
                    <span className="text-cinema-gold font-semibold flex items-center gap-1">
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      {movie.rating}
                    </span>
                  )}
                </div>
                {movie.description && (
                  <p className="text-gray-400 text-sm leading-relaxed max-w-2xl">
                    {movie.description}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Showtime Selection ── */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <h2 className="text-2xl font-display font-bold text-white mb-6">Select Showtime</h2>

          {showtimes.length === 0 ? (
            <p className="text-gray-500 italic">No upcoming showtimes available for this movie.</p>
          ) : (
            Object.entries(byDate).map(([date, times]) => (
              <div key={date} className="mb-8">
                <p className="text-gray-400 text-sm font-medium mb-3 uppercase tracking-wide">
                  {new Date(date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
                </p>
                <div className="flex flex-wrap gap-3">
                  {times.map((st) => (
                    <button
                      key={st.id}
                      onClick={() => setSelectedShowtime(selectedShowtime?.id === st.id ? null : st)}
                      className={`px-5 py-3 rounded-xl border font-semibold whitespace-nowrap transition-all ${
                        selectedShowtime?.id === st.id
                          ? 'bg-cinema-gold text-cinema-900 border-cinema-gold shadow-lg shadow-cinema-gold/20'
                          : 'bg-cinema-800 text-gray-300 border-cinema-600 hover:border-cinema-gold hover:text-white'
                      }`}
                    >
                      <span className="block text-base">{st.show_time?.slice(0, 5)}</span>
                      <span className="text-xs opacity-70">{st.screen_name} · £{st.price} · {st.available_seats} left</span>
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </main>
      <Footer />

      {/* Fixed bottom bar when showtime selected */}
      {selectedShowtime && (
        <div className="fixed bottom-0 left-0 right-0 z-50 seat-bottom-bar animate-slide-up">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="text-gray-400 text-xs uppercase tracking-wider mb-0.5">Selected showtime</p>
              <p className="text-white font-bold text-lg leading-tight">
                {selectedShowtime.show_time?.slice(0, 5)}
                <span className="text-gray-400 font-normal text-sm ml-2">
                  {selectedShowtime.show_date ? new Date(selectedShowtime.show_date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }) : ''}
                </span>
              </p>
              <p className="text-cinema-gold text-sm">
                {selectedShowtime.screen_name ?? '—'} · £{selectedShowtime.price ?? 0} · {selectedShowtime.available_seats ?? 0} seats available
              </p>
            </div>
            <button
              onClick={handleSelectSeats}
              className="bg-cinema-gold text-cinema-900 px-10 py-3.5 rounded-full font-bold text-base hover:bg-yellow-500 transition-all hover:scale-105 flex items-center gap-2 whitespace-nowrap"
            >
              Select Seats
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
