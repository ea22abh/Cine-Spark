import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

export default function Header() {
  const { user, logout, setShowLoginModal, isAdmin, adminLogout, setShowAdminModal } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [theme, setTheme] = useState(() => localStorage.getItem('cs-theme-pref') || 'dark')

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('cs-theme-pref', theme)
  }, [theme])

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))

  const scrollToSection = (sectionId) => (e) => {
    e.preventDefault()
    setMenuOpen(false)
    if (location.pathname === '/') {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' })
    } else {
      navigate(`/#${sectionId}`)
    }
  }

  return (
    <nav className="fixed w-full z-50 glass-panel border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">

          {/* Left: Logo + Nav links */}
          <div className="flex items-center space-x-8">
            <Link to="/" className="text-2xl font-display font-bold text-cinema-gold tracking-wide">
              CineSpark
            </Link>
            <div className="hidden md:flex space-x-6">
              <a
                href="/#now-showing"
                onClick={scrollToSection('now-showing')}
                className="text-gray-300 hover:text-white transition-colors text-sm font-medium cursor-pointer"
              >
                Now Showing
              </a>
              <a
                href="/#coming-soon"
                onClick={scrollToSection('coming-soon')}
                className="text-gray-300 hover:text-white transition-colors text-sm font-medium cursor-pointer"
              >
                Coming Soon
              </a>
            </div>
          </div>

          {/* Right: Admin + Auth + My Tickets + Hamburger */}
          <div className="flex items-center space-x-3">

            {/* Desktop: Admin access */}
            <div className="hidden md:flex items-center space-x-3">
              {!isAdmin ? (
                <button
                  onClick={() => setShowAdminModal(true)}
                  className="text-xs text-gray-400 hover:text-cinema-gold border border-white/10 hover:border-cinema-gold px-3 py-1.5 rounded-lg transition-all"
                >
                  Admin
                </button>
              ) : (
                <div className="flex items-center space-x-2">
                  <Link
                    to="/admin"
                    className="text-xs text-cinema-gold font-semibold border border-cinema-gold/40 px-3 py-1.5 rounded-lg hover:bg-cinema-gold/10 transition-all"
                  >
                    Admin Panel
                  </Link>
                  <button
                    onClick={adminLogout}
                    className="text-xs text-gray-400 hover:text-white transition-colors"
                  >
                    Exit
                  </button>
                </div>
              )}

              {/* User auth */}
              {!user ? (
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setShowLoginModal(true)}
                    className="text-gray-300 hover:text-white transition-colors"
                  >
                    <span className="text-sm font-medium">Sign In</span>
                  </button>
                  <Link
                    to="/auth/register"
                    className="bg-cinema-gold/10 border border-cinema-gold/40 text-cinema-gold px-4 py-1.5 rounded-full text-sm font-semibold hover:bg-cinema-gold/20 transition-all"
                  >
                    Sign Up
                  </Link>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-300">{user.name}</span>
                  <button
                    onClick={logout}
                    className="text-xs text-cinema-gold hover:text-white transition-colors"
                  >
                    Logout
                  </button>
                </div>
              )}

              {user && (
                <Link
                  to="/user/my-bookings"
                  className="bg-cinema-gold text-cinema-900 px-4 py-2 rounded-full text-sm font-semibold hover:bg-yellow-500 transition-all hover:scale-105"
                >
                  My Tickets
                </Link>
              )}
            </div>

            {/* Theme toggle (always visible) */}
            <button
              onClick={toggleTheme}
              className="p-2 text-gray-400 hover:text-cinema-gold transition-colors rounded-lg"
              aria-label="Toggle theme"
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? (
                /* Sun icon */
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m8.66-9H21m-18 0H2.34m14.95 6.36-.7-.7M6.7 6.7l-.7-.7m12.72 0-.7.7M6.7 17.3l-.7.7M17 12a5 5 0 11-10 0 5 5 0 0110 0z" />
                </svg>
              ) : (
                /* Moon icon */
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z" />
                </svg>
              )}
            </button>

            {/* Mobile: hamburger */}
            <button
              className="md:hidden p-2 text-gray-300 hover:text-white transition-colors"
              onClick={() => setMenuOpen((o) => !o)}
              aria-label="Toggle menu"
            >
              {menuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>

          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-white/10 bg-cinema-900/95 backdrop-blur-md px-4 py-4 space-y-3">
          <a
            href="/#now-showing"
            onClick={scrollToSection('now-showing')}
            className="block text-gray-300 hover:text-white text-sm font-medium py-2"
          >
            Now Showing
          </a>
          <a
            href="/#coming-soon"
            onClick={scrollToSection('coming-soon')}
            className="block text-gray-300 hover:text-white text-sm font-medium py-2"
          >
            Coming Soon
          </a>
          {user && (
            <Link
              to="/user/my-bookings"
              onClick={() => setMenuOpen(false)}
              className="block text-gray-300 hover:text-white text-sm font-medium py-2"
            >
              My Tickets
            </Link>
          )}
          <div className="border-t border-white/10 pt-3 space-y-3">
            {!user ? (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => { setShowLoginModal(true); setMenuOpen(false) }}
                  className="text-sm text-gray-300 hover:text-white py-2"
                >
                  Sign In
                </button>
                <Link
                  to="/auth/register"
                  onClick={() => setMenuOpen(false)}
                  className="bg-cinema-gold/10 border border-cinema-gold/40 text-cinema-gold px-4 py-1.5 rounded-full text-sm font-semibold hover:bg-cinema-gold/20 transition-all"
                >
                  Sign Up
                </Link>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">{user.name}</span>
                <button onClick={() => { logout(); setMenuOpen(false) }} className="text-xs text-cinema-gold">Logout</button>
              </div>
            )}
            {!isAdmin ? (
              <button
                onClick={() => { setShowAdminModal(true); setMenuOpen(false) }}
                className="text-xs text-gray-400 hover:text-cinema-gold border border-white/10 px-3 py-1.5 rounded-lg transition-all"
              >
                Admin
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <Link to="/admin" onClick={() => setMenuOpen(false)} className="text-xs text-cinema-gold font-semibold border border-cinema-gold/40 px-3 py-1.5 rounded-lg">
                  Admin Panel
                </Link>
                <button onClick={() => { adminLogout(); setMenuOpen(false) }} className="text-xs text-gray-400">Exit</button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
