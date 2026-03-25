import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Header from '../../components/layout/Header'
import Footer from '../../components/layout/Footer'
import { useAuth } from '../../contexts/AuthContext'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email.trim()) { setError('Please enter your email'); return }
    if (!password) { setError('Please enter your password'); return }
    setLoading(true)
    setError('')
    try {
      await login(email.trim(), password)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-cinema-900 animate-fade-in">
      <Header />
      <main className="pt-16 flex items-center justify-center min-h-screen px-4">
        <div className="w-full max-w-md">
          <div className="glass-panel rounded-2xl p-8 animate-slide-up">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-display font-bold text-cinema-gold mb-1">CineSpark</h1>
              <p className="text-gray-400 text-sm">Sign in to your account</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Email address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError('') }}
                  placeholder="you@example.com"
                  className="w-full bg-cinema-800 border border-cinema-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-cinema-gold transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError('') }}
                  placeholder="Enter your password"
                  className="w-full bg-cinema-800 border border-cinema-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-cinema-gold transition-colors"
                />
              </div>

              {error && (
                <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-2">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-cinema-gold text-cinema-900 font-bold py-3 rounded-lg hover:bg-yellow-500 transition-all hover:scale-105 active:scale-100 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {loading ? 'Signing in…' : 'Sign In'}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-400">
              Don&apos;t have an account?{' '}
              <Link to="/auth/register" className="text-cinema-gold hover:text-yellow-400 font-semibold transition-colors">
                Create one
              </Link>
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
