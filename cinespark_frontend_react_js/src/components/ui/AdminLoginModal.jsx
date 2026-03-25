import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

export default function AdminLoginModal() {
  const { adminLogin, setShowAdminModal } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email.trim() || !password) { setError('Email and password are required'); return }
    setLoading(true)
    setError('')
    try {
      await adminLogin(email.trim(), password)
      navigate('/admin')
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Invalid admin credentials')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={() => setShowAdminModal(false)}
    >
      <div
        className="glass-panel rounded-2xl p-8 w-full max-w-sm relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="absolute top-4 right-4 text-gray-400 hover:text-white text-xl leading-none"
          onClick={() => setShowAdminModal(false)}
        >✕</button>

        <div className="text-3xl mb-4">🔐</div>
        <h2 className="text-xl font-bold text-white mb-1">Admin Access</h2>
        <p className="text-gray-400 text-sm mb-6">Sign in with your admin credentials.</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="Admin Email"
            value={email}
            autoFocus
            onChange={(e) => { setEmail(e.target.value); setError('') }}
            className="bg-cinema-700 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-cinema-gold transition-colors"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError('') }}
            className="bg-cinema-700 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-cinema-gold transition-colors"
          />
          {error && <p className="text-red-400 text-sm -mt-2">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary full-width disabled:opacity-60">
            {loading ? 'Signing in…' : 'Access Admin Panel'}
          </button>
        </form>
      </div>
    </div>
  )
}
