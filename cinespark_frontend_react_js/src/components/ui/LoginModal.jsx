import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

export default function LoginModal() {
  const { login, setShowLoginModal } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    if (!email.trim() || !password) { setError('Email and password are required'); return }
    setLoading(true)
    setError('')
    try {
      await login(email.trim(), password)
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={() => setShowLoginModal(false)}
    >
      <div
        className="glass-panel rounded-2xl p-8 max-w-md w-full animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-display font-bold text-white">Welcome Back</h2>
          <button onClick={() => setShowLoginModal(false)} className="text-gray-400 hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError('') }}
              className="w-full bg-cinema-800 border border-cinema-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cinema-gold transition-colors"
              placeholder="you@example.com"
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError('') }}
              className="w-full bg-cinema-800 border border-cinema-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cinema-gold transition-colors"
              placeholder="Enter password"
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            />
          </div>

          {error && <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">{error}</p>}

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-cinema-gold text-cinema-900 font-semibold py-3 rounded-lg hover:bg-yellow-500 transition-all active:scale-95 disabled:opacity-60"
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>

          <button
            onClick={() => setShowLoginModal(false)}
            className="w-full border border-cinema-600 text-gray-300 font-medium py-3 rounded-lg hover:bg-cinema-700 transition-all"
          >
            Continue as Guest
          </button>
        </div>

        <p className="mt-5 text-center text-sm text-gray-400">
          Don't have an account?{' '}
          <Link
            to="/auth/register"
            onClick={() => setShowLoginModal(false)}
            className="text-cinema-gold hover:text-yellow-400 font-semibold transition-colors"
          >
            Sign Up
          </Link>
        </p>
        <p className="mt-3 text-center text-xs text-gray-500">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  )
}
