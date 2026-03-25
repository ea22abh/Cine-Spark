import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Header from '../../components/layout/Header'
import Footer from '../../components/layout/Footer'
import { useAuth } from '../../contexts/AuthContext'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' })
  const [errors, setErrors] = useState({})
  const [apiError, setApiError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    setErrors((prev) => ({ ...prev, [e.target.name]: '' }))
    setApiError('')
  }

  const validate = () => {
    const e = {}
    if (!formData.name.trim()) e.name = 'Full name is required'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) e.email = 'Enter a valid email address'
    if (formData.password.length < 8) e.password = 'Password must be at least 8 characters'
    if (formData.password !== formData.confirmPassword) e.confirmPassword = 'Passwords do not match'
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setLoading(true)
    setApiError('')
    try {
      await register(formData.name.trim(), formData.email.trim(), formData.password)
      setSuccess(true)
      setTimeout(() => navigate('/'), 1500)
    } catch (err) {
      setApiError(err.response?.data?.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-cinema-900 animate-fade-in">
        <Header />
        <main className="pt-16 flex items-center justify-center min-h-screen px-4">
          <div className="glass-panel rounded-2xl p-10 text-center animate-slide-up max-w-sm w-full">
            <div className="w-16 h-16 bg-green-500/20 border border-green-500/40 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-display font-bold text-white mb-2">Account Created!</h2>
            <p className="text-gray-400 text-sm">Redirecting you to the home page…</p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cinema-900 animate-fade-in">
      <Header />
      <main className="pt-16 flex items-center justify-center min-h-screen px-4 py-12">
        <div className="w-full max-w-md">
          <div className="glass-panel rounded-2xl p-8 animate-slide-up">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-display font-bold text-cinema-gold mb-1">CineSpark</h1>
              <p className="text-gray-400 text-sm">Create your account</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              {[
                { name: 'name', label: 'Full Name', type: 'text', placeholder: 'John Smith' },
                { name: 'email', label: 'Email Address', type: 'email', placeholder: 'you@example.com' },
                { name: 'password', label: 'Password', type: 'password', placeholder: 'Min. 8 characters' },
                { name: 'confirmPassword', label: 'Confirm Password', type: 'password', placeholder: 'Repeat password' },
              ].map(({ name, label, type, placeholder }) => (
                <div key={name}>
                  <label className="block text-sm font-medium text-gray-300 mb-2">{label}</label>
                  <input
                    type={type} name={name} value={formData[name]}
                    onChange={handleChange} placeholder={placeholder}
                    className={`w-full bg-cinema-800 border rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none transition-colors ${
                      errors[name] ? 'border-red-500' : 'border-cinema-600 focus:border-cinema-gold'
                    }`}
                  />
                  {errors[name] && <p className="text-red-400 text-xs mt-1">{errors[name]}</p>}
                </div>
              ))}

              {apiError && (
                <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-2">{apiError}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-cinema-gold text-cinema-900 font-bold py-3 rounded-lg hover:bg-yellow-500 transition-all hover:scale-105 active:scale-100 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {loading ? 'Creating account…' : 'Create Account'}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-400">
              Already have an account?{' '}
              <Link to="/auth/login" className="text-cinema-gold hover:text-yellow-400 font-semibold transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
