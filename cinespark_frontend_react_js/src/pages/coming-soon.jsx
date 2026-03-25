import { useState, useEffect } from 'react'
import Header from '../components/layout/Header'
import Footer from '../components/layout/Footer'
import { moviesAPI } from '../services/api'

export default function ComingSoon() {
  const [movies, setMovies] = useState([])
  const [loading, setLoading] = useState(true)
  const [notifiedIds, setNotifiedIds] = useState(new Set())

  useEffect(() => {
    moviesAPI.getBySection('coming_soon')
      .then((res) => setMovies(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const toggleNotify = (id) => {
    setNotifiedIds((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  return (
    <div className="min-h-screen bg-cinema-900 animate-fade-in">
      <Header />

      <main className="pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

          {/* Page header */}
          <div className="mb-12">
            <span className="inline-block px-3 py-1 bg-cinema-gold/20 text-cinema-gold text-xs font-semibold rounded-full mb-4 border border-cinema-gold/30">
              Coming Soon
            </span>
            <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-3">Upcoming Releases</h1>
            <p className="text-gray-400 text-lg">Mark your calendar and be the first to book.</p>
          </div>

          {/* Movies grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="glass-panel rounded-2xl overflow-hidden">
                  <div className="aspect-[2/3] bg-cinema-800 animate-pulse" />
                  <div className="p-5">
                    <div className="h-5 bg-cinema-700 rounded mb-2 animate-pulse" />
                    <div className="h-3 bg-cinema-700 rounded w-1/2 mb-3 animate-pulse" />
                    <div className="h-9 bg-cinema-700 rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : movies.length === 0 ? (
            <p className="text-gray-400 text-center py-20 text-lg">No upcoming movies yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {movies.map((movie) => (
                <div
                  key={movie.id}
                  className="glass-panel rounded-2xl overflow-hidden group hover:ring-1 hover:ring-cinema-gold/30 transition-all duration-300"
                >
                  {/* Poster */}
                  <div className="aspect-[2/3] relative overflow-hidden bg-cinema-800 flex items-center justify-center">
                    <span className="text-4xl text-cinema-600 select-none">🎬</span>
                    <img
                      src={movie.poster_url || 'https://placehold.co/300x450/1a1a2e/d4af37?text=No+Poster'}
                      alt={movie.title}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/300x450/1a1a2e/d4af37?text=No+Poster' }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-cinema-900 via-cinema-900/20 to-transparent" />
                    {movie.release_date && (
                      <div className="absolute bottom-4 left-4">
                        <span className="bg-cinema-gold/20 text-cinema-gold px-3 py-1 rounded-full text-xs font-bold border border-cinema-gold/30 backdrop-blur-sm">
                          {formatDate(movie.release_date)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-5">
                    <h3 className="text-lg font-bold text-white mb-1 group-hover:text-cinema-gold transition-colors line-clamp-2">
                      {movie.title}
                    </h3>
                    <p className="text-gray-400 text-sm mb-3">{movie.genre}</p>
                    {movie.description && (
                      <p className="text-gray-500 text-xs mb-4 line-clamp-2">{movie.description}</p>
                    )}

                    <button
                      onClick={() => toggleNotify(movie.id)}
                      className={`w-full py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                        notifiedIds.has(movie.id)
                          ? 'bg-green-500/20 border border-green-500/40 text-green-400'
                          : 'border border-cinema-600 text-gray-300 hover:bg-cinema-700 hover:text-white hover:border-cinema-gold'
                      }`}
                    >
                      {notifiedIds.has(movie.id) ? (
                        <>&#10003; You&apos;ll be notified</>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                          </svg>
                          Notify Me
                        </>
                      )}
                    </button>
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
