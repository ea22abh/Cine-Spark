import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import Header from '../components/layout/Header'
import Footer from '../components/layout/Footer'
import SkeletonCard from '../components/ui/SkeletonCard'
import { moviesAPI } from '../services/api'

const cities = ['London', 'Manchester', 'Birmingham', 'Leeds', 'Edinburgh']
const dates = ['Today', 'Tomorrow', 'Wed, Feb 19', 'Thu, Feb 20']

export default function Home() {
  const navigate = useNavigate()
  const location = useLocation()

  const [featuredMovies, setFeaturedMovies] = useState([])
  const [nowShowingMovies, setNowShowingMovies] = useState([])
  const [comingSoonMovies, setComingSoonMovies] = useState([])
  const [loading, setLoading] = useState(true)

  const [currentFeaturedIndex, setCurrentFeaturedIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [isHovering, setIsHovering] = useState(false)
  const [quickBook, setQuickBook] = useState({ city: '', date: '' })
  const [notifiedIds, setNotifiedIds] = useState(new Set())
  const [showTrailerMovie, setShowTrailerMovie] = useState(null)

  const moviesContainerRef = useRef(null)
  const autoScrollRef = useRef(null)
  const featuredIntervalRef = useRef(null)
  const transitionTimeoutRef = useRef(null)

  const featuredMovie = featuredMovies[currentFeaturedIndex]

  // Fetch all sections from DB
  useEffect(() => {
    Promise.allSettled([
      moviesAPI.getBySection('featured'),
      moviesAPI.getBySection('now_showing'),
      moviesAPI.getBySection('coming_soon'),
    ]).then(([featRes, nowRes, soonRes]) => {
      if (featRes.status === 'fulfilled') setFeaturedMovies(featRes.value.data)
      if (nowRes.status === 'fulfilled') setNowShowingMovies(nowRes.value.data)
      if (soonRes.status === 'fulfilled') setComingSoonMovies(soonRes.value.data)
    }).finally(() => setLoading(false))
  }, [])

  const triggerTransition = (indexFn) => {
    setIsTransitioning(true)
    transitionTimeoutRef.current = setTimeout(() => {
      setCurrentFeaturedIndex((prev) => {
        const next = typeof indexFn === 'function' ? indexFn(prev) : indexFn
        return next
      })
      setIsTransitioning(false)
    }, 600)
  }

  // Scroll to section when navigated via hash (e.g. /#now-showing)
  useEffect(() => {
    if (location.hash) {
      const id = location.hash.slice(1)
      const timer = setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
      }, 150)
      return () => clearTimeout(timer)
    }
  }, [location.hash])

  // Auto-scroll Now Showing carousel
  useEffect(() => {
    autoScrollRef.current = setInterval(() => {
      if (!isHovering && moviesContainerRef.current) {
        const c = moviesContainerRef.current
        if (c.scrollLeft >= c.scrollWidth - c.clientWidth - 10) {
          c.scrollTo({ left: 0, behavior: 'smooth' })
        } else {
          c.scrollBy({ left: 300, behavior: 'smooth' })
        }
      }
    }, 3000)
    return () => clearInterval(autoScrollRef.current)
  }, [isHovering])

  // Auto-rotate featured hero every 5s
  useEffect(() => {
    if (featuredMovies.length < 2) return
    featuredIntervalRef.current = setInterval(() => {
      if (!isTransitioning) {
        triggerTransition((prev) => (prev + 1) % featuredMovies.length)
      }
    }, 5000)
    return () => clearInterval(featuredIntervalRef.current)
  }, [isTransitioning, featuredMovies.length])

  useEffect(() => {
    return () => clearTimeout(transitionTimeoutRef.current)
  }, [])

  const goToFeatured = (index) => {
    if (!isTransitioning && index !== currentFeaturedIndex) {
      clearInterval(featuredIntervalRef.current)
      setIsTransitioning(true)
      transitionTimeoutRef.current = setTimeout(() => {
        setCurrentFeaturedIndex(index)
        setIsTransitioning(false)
      }, 600)
    }
  }

  const scrollLeft = () => moviesContainerRef.current?.scrollBy({ left: -300, behavior: 'smooth' })
  const scrollRight = () => moviesContainerRef.current?.scrollBy({ left: 300, behavior: 'smooth' })

  return (
    <div className="min-h-screen bg-cinema-900 animate-fade-in">
      <Header />

      <main className="pt-16">

        {/* ── Hero / Featured Section ── */}
        <div className="relative h-[75vh] min-h-[560px] bg-cinema-900">
          <div className="absolute inset-0 overflow-hidden">
            {featuredMovies.length === 0 ? (
              <div className="absolute inset-0 bg-cinema-800" />
            ) : featuredMovies.map((movie, index) => (
              <div key={movie.id} className="hero-bg" style={{ opacity: currentFeaturedIndex === index ? 1 : 0 }}>
                <img
                  src={movie.backdrop_url || movie.poster_url || 'https://placehold.co/1280x720/1a1a2e/d4af37?text=No+Image'}
                  alt={movie.title}
                  className="absolute inset-0 w-full h-full object-cover opacity-60"
                  onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/1280x720/1a1a2e/d4af37?text=No+Image' }}
                />
              </div>
            ))}
            <div className="absolute inset-0 bg-gradient-to-t from-cinema-900 via-cinema-900/50 to-transparent z-10" />
          </div>

          <div className="relative z-20 h-full flex items-end pb-12 sm:pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            {loading ? (
              <div className="max-w-2xl w-full">
                <div className="h-4 w-32 bg-cinema-700 rounded mb-4 animate-pulse" />
                <div className="h-14 w-3/4 bg-cinema-700 rounded mb-4 animate-pulse" />
                <div className="h-4 w-full bg-cinema-700 rounded mb-2 animate-pulse" />
                <div className="h-4 w-2/3 bg-cinema-700 rounded mb-8 animate-pulse" />
                <div className="flex gap-4">
                  <div className="h-14 w-40 bg-cinema-700 rounded-full animate-pulse" />
                  <div className="h-14 w-40 bg-cinema-700 rounded-full animate-pulse" />
                </div>
              </div>
            ) : featuredMovie ? (
              <div className="max-w-2xl transition-all duration-500" style={{ opacity: isTransitioning ? 0 : 1, transform: isTransitioning ? 'translateY(16px)' : 'translateY(0)' }}>
                <span className="inline-block px-3 py-1 bg-yellow-500/20 text-cinema-gold text-xs font-semibold rounded-full mb-4 border border-cinema-gold/30">
                  Featured Premiere
                </span>
                <h1 className="text-5xl md:text-7xl font-display font-bold text-white mb-4 leading-tight">
                  {featuredMovie.title}
                </h1>
                <p className="text-lg text-gray-300 mb-6 line-clamp-2">{featuredMovie.description}</p>
                <div className="flex items-center gap-4 mb-8">
                  {featuredMovie.rating > 0 && <span className="text-cinema-gold font-semibold">★ {featuredMovie.rating}</span>}
                  {featuredMovie.duration && <><span className="text-gray-400">•</span><span className="text-gray-300">{featuredMovie.duration} mins</span></>}
                  {featuredMovie.genre && <><span className="text-gray-400">•</span><span className="text-gray-300">{featuredMovie.genre}</span></>}
                </div>
                <div className="flex gap-4">
                  <button
                    onClick={() => navigate(`/movies/${featuredMovie.id}`)}
                    className="bg-cinema-gold text-cinema-900 px-8 py-4 rounded-full font-bold text-lg hover:bg-yellow-500 transition-all hover:scale-105 flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 6a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 100 4v2a2 2 0 01-2 2H4a2 2 0 01-2-2v-2a2 2 0 100-4V6z" />
                    </svg>
                    Book Tickets
                  </button>
                  <button
                    onClick={() => setShowTrailerMovie(featuredMovie)}
                    className="border border-white/30 text-white px-8 py-4 rounded-full font-semibold hover:bg-white/10 transition-all flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Watch Trailer
                  </button>
                </div>
              </div>
            ) : (
              <div className="max-w-2xl">
                <p className="text-gray-400 text-lg">No featured movies yet. Add some from the admin panel.</p>
              </div>
            )}
          </div>

          {/* Dot indicators */}
          {featuredMovies.length > 1 && (
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex gap-2 bg-black/40 backdrop-blur-sm px-3 py-2 rounded-full">
              {featuredMovies.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToFeatured(index)}
                  disabled={isTransitioning}
                  className={`h-2 rounded-full transition-all duration-300 disabled:cursor-not-allowed ${
                    currentFeaturedIndex === index ? 'bg-cinema-gold w-8' : 'bg-white/60 w-2 hover:bg-white/80'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── Now Showing ── */}
        <section
          id="now-showing"
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16"
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
        >
          <div className="flex justify-between items-end mb-8">
            <div>
              <h2 className="text-3xl font-display font-bold text-white mb-2">Now Showing</h2>
              <p className="text-gray-400">Book your tickets for today's screenings</p>
            </div>
            <div className="flex gap-2">
              <button onClick={scrollLeft} className="p-2 rounded-full border border-cinema-600 hover:bg-cinema-800 transition-colors text-white">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </button>
              <button onClick={scrollRight} className="p-2 rounded-full border border-cinema-600 hover:bg-cinema-800 transition-colors text-white">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((n) => <SkeletonCard key={n} />)}
            </div>
          ) : nowShowingMovies.length === 0 ? (
            <p className="text-gray-400 text-center py-12">No movies in Now Showing. Assign movies from the admin panel.</p>
          ) : (
            <div
              ref={moviesContainerRef}
              className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide"
              style={{ scrollBehavior: 'smooth' }}
            >
              {nowShowingMovies.map((movie) => (
                <div
                  key={movie.id}
                  className="flex-none w-72 snap-start movie-card group cursor-pointer"
                  onClick={() => navigate(`/movies/${movie.id}`)}
                >
                  <div className="relative aspect-[2/3] rounded-xl overflow-hidden mb-4 bg-cinema-800 flex items-center justify-center">
                    <span className="text-4xl text-cinema-600 select-none">🎬</span>
                    <img
                      src={movie.poster_url || 'https://placehold.co/300x450/1a1a2e/d4af37?text=No+Poster'}
                      alt={movie.title}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/300x450/1a1a2e/d4af37?text=No+Poster' }}
                    />
                    <div className="movie-overlay absolute inset-0 bg-gradient-to-t from-cinema-900/90 via-transparent to-transparent opacity-0 transition-opacity duration-300 flex flex-col justify-end p-4">
                      <button className="bg-cinema-gold text-cinema-900 w-full py-3 rounded-lg font-bold translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                        Book Now
                      </button>
                    </div>
                    {movie.rating > 0 && (
                      <div className="absolute top-2 right-2 bg-cinema-900/80 backdrop-blur px-2 py-1 rounded text-xs font-bold text-cinema-gold border border-cinema-gold/30">
                        ★ {movie.rating}
                      </div>
                    )}
                  </div>
                  <h3 className="font-semibold text-lg text-white mb-1 group-hover:text-cinema-gold transition-colors">{movie.title}</h3>
                  <p className="text-sm text-gray-400 mb-2">{movie.genre}{movie.language ? ` • ${movie.language}` : ''}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── Quick Booking ── */}
        <section className="bg-cinema-800 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="glass-panel rounded-2xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8">
              <div>
                <h2 className="text-3xl font-display font-bold text-white mb-2">Quick Booking</h2>
                <p className="text-gray-400">Select your preferences to find the best showtimes</p>
              </div>
              <div className="flex flex-wrap gap-4 w-full md:w-auto">
                <select
                  value={quickBook.city}
                  onChange={(e) => setQuickBook((prev) => ({ ...prev, city: e.target.value }))}
                  className="bg-cinema-900 border border-cinema-600 text-white px-6 py-3 rounded-lg focus:outline-none focus:border-cinema-gold min-w-[150px]"
                >
                  <option value="">Select City</option>
                  {cities.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <select
                  value={quickBook.date}
                  onChange={(e) => setQuickBook((prev) => ({ ...prev, date: e.target.value }))}
                  className="bg-cinema-900 border border-cinema-600 text-white px-6 py-3 rounded-lg focus:outline-none focus:border-cinema-gold min-w-[150px]"
                >
                  <option value="">Select Date</option>
                  {dates.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
                <button
                  onClick={() => {
                    if (location.pathname === '/') {
                      document.getElementById('now-showing')?.scrollIntoView({ behavior: 'smooth' })
                    } else {
                      navigate('/#now-showing')
                    }
                  }}
                  className="bg-cinema-gold text-cinema-900 px-8 py-3 rounded-lg font-bold hover:bg-yellow-500 transition-all"
                >
                  Find Shows
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ── Coming Soon ── */}
        <section id="coming-soon" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h2 className="text-3xl font-display font-bold text-white mb-2">Coming Soon</h2>
              <p className="text-gray-400">Mark your calendar for these releases</p>
            </div>
            <Link to="/coming-soon" className="text-cinema-gold hover:text-yellow-500 text-sm font-medium flex items-center gap-1 transition-colors">
              View All
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((n) => <SkeletonCard key={n} />)}
            </div>
          ) : comingSoonMovies.length === 0 ? (
            <p className="text-gray-400 text-center py-12">No upcoming movies yet. Assign movies from the admin panel.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {comingSoonMovies.map((movie) => (
                <div key={movie.id} className="glass-panel rounded-2xl overflow-hidden group hover:scale-105 transition-all duration-300 cursor-pointer">
                  <div className="aspect-video relative overflow-hidden bg-cinema-800 flex items-center justify-center">
                    <span className="text-4xl text-cinema-600 select-none">🎬</span>
                    <img
                      src={movie.backdrop_url || movie.poster_url || 'https://placehold.co/1280x720/1a1a2e/d4af37?text=No+Image'}
                      alt={movie.title}
                      className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500 group-hover:scale-110"
                      onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/1280x720/1a1a2e/d4af37?text=No+Image' }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-cinema-900 to-transparent" />
                    {movie.release_date && (
                      <div className="absolute bottom-4 left-4">
                        <span className="bg-cinema-gold/20 text-cinema-gold px-3 py-1 rounded-full text-xs font-bold border border-cinema-gold/30 backdrop-blur-sm">
                          {new Date(movie.release_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-cinema-gold transition-colors">{movie.title}</h3>
                    <p className="text-gray-400 text-sm mb-4">{movie.genre}</p>
                    <button
                      onClick={() => setNotifiedIds((prev) => { const n = new Set(prev); n.add(movie.id); return n })}
                      className={`w-full py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                        notifiedIds.has(movie.id)
                          ? 'bg-green-500/20 border border-green-500/40 text-green-400'
                          : 'border border-cinema-600 text-gray-300 hover:bg-cinema-700 hover:text-white'
                      }`}
                    >
                      {notifiedIds.has(movie.id) ? <>✓ Notified</> : (
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
        </section>

      </main>

      <Footer />

      {/* Trailer Modal */}
      {showTrailerMovie && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4" onClick={() => setShowTrailerMovie(null)}>
          <div className="glass-panel rounded-2xl p-8 max-w-md w-full text-center animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="w-16 h-16 bg-cinema-gold/20 border border-cinema-gold/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-cinema-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-1">{showTrailerMovie.title}</h3>
            <p className="text-gray-400 text-sm mb-6">Trailer not available in demo mode.</p>
            <button onClick={() => setShowTrailerMovie(null)} className="bg-cinema-gold text-cinema-900 font-bold px-8 py-3 rounded-full hover:bg-yellow-500 transition-all">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
