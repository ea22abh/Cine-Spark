import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import Header from '../../components/layout/Header'
import Footer from '../../components/layout/Footer'
import { bookingsAPI } from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'

const BOOKING_FEE = 30

export default function Payment() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, setShowLoginModal } = useAuth()

  const {
    selectedSeats = [],
    movieTitle = 'Movie',
    movieId = '',
    showtimeId,
    showtime = '',
    showDate = '',
    screenName = '',
    subtotal = 0,
  } = location.state || {}

  // Scroll to top on mount
  useEffect(() => { window.scrollTo(0, 0) }, [])

  const fees = selectedSeats.length * BOOKING_FEE
  const total = subtotal + fees

  const [form, setForm] = useState({ cardName: '', cardNumber: '', expiry: '', cvv: '' })
  const [errors, setErrors] = useState({})
  const [apiError, setApiError] = useState('')
  const [processing, setProcessing] = useState(false)

  const handleChange = (e) => {
    let { name, value } = e.target
    if (name === 'cardNumber') {
      value = value.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim()
    }
    if (name === 'expiry') {
      value = value.replace(/\D/g, '').slice(0, 4)
      if (value.length >= 3) value = value.slice(0, 2) + '/' + value.slice(2)
    }
    if (name === 'cvv') value = value.replace(/\D/g, '').slice(0, 3)
    setForm((prev) => ({ ...prev, [name]: value }))
    setErrors((prev) => ({ ...prev, [name]: '' }))
    setApiError('')
  }

  const validate = () => {
    const e = {}
    if (!form.cardName.trim()) e.cardName = 'Cardholder name is required'
    if (form.cardNumber.replace(/\s/g, '').length !== 16) e.cardNumber = 'Enter a valid 16-digit card number'
    if (!/^\d{2}\/\d{2}$/.test(form.expiry)) {
      e.expiry = 'Enter expiry as MM/YY'
    } else {
      const [mm, yy] = form.expiry.split('/').map(Number)
      const now = new Date()
      const expYear = 2000 + yy
      if (mm < 1 || mm > 12 || expYear < now.getFullYear() || (expYear === now.getFullYear() && mm < now.getMonth() + 1)) {
        e.expiry = 'Card has expired'
      }
    }
    if (form.cvv.length !== 3) e.cvv = 'CVV must be 3 digits'
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!user) { setShowLoginModal(true); return }
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }

    setProcessing(true)
    setApiError('')
    try {
      const res = await bookingsAPI.create({
        showtime_id: showtimeId,
        seat_ids: selectedSeats.map((s) => s.id),
      })
      navigate('/booking/confirmation', {
        state: {
          bookingRef: res.data.booking_ref,
          bookingId: res.data.booking_id,
          selectedSeats,
          movieTitle,
          showtime,
          showDate,
          screenName,
          total: res.data.total_price,
          cardName: form.cardName,
        },
      })
    } catch (err) {
      setApiError(err.response?.data?.message || 'Booking failed. Please try again.')
    } finally {
      setProcessing(false)
    }
  }

  if (selectedSeats.length === 0) {
    return (
      <div className="min-h-screen bg-cinema-900">
        <Header />
        <main className="pt-16 flex items-center justify-center min-h-screen px-4">
          <p className="text-gray-400">No seats selected. Please go back and select seats first.</p>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cinema-900 animate-fade-in pb-12">
      <Header />
      <main className="pt-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-cinema-gold transition-colors mb-6 group"
          >
            <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to seat selection
          </button>
          <h1 className="text-3xl font-display font-bold text-white mb-8">Payment</h1>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

            {/* Order Summary */}
            <aside className="lg:col-span-2 glass-panel rounded-2xl p-6 h-fit">
              <h2 className="text-lg font-bold text-white mb-4 pb-4 border-b border-white/10">Order Summary</h2>
              <p className="font-semibold text-white mb-1">{movieTitle}</p>
              <p className="text-gray-400 text-sm mb-1">{showtime?.slice(0, 5)}{showDate ? ` · ${new Date(showDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}` : ''}</p>
              {screenName && <p className="text-gray-500 text-xs mb-4">{screenName}</p>}

              <div className="flex flex-wrap gap-2 mb-5">
                {selectedSeats.map((s) => (
                  <span key={s.id} className="px-2 py-1 bg-cinema-800 border border-cinema-600 rounded text-xs text-gray-300">
                    {s.label} · £{s.price}
                  </span>
                ))}
              </div>

              <div className="space-y-2 border-t border-white/10 pt-4">
                <div className="flex justify-between text-sm text-gray-400">
                  <span>{selectedSeats.length} × ticket{selectedSeats.length !== 1 ? 's' : ''}</span>
                  <span>£{subtotal}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-400">
                  <span>Booking fee</span>
                  <span>£{fees}</span>
                </div>
                <div className="flex justify-between font-bold text-white text-lg border-t border-white/10 pt-3 mt-3">
                  <span>Total</span>
                  <span className="text-cinema-gold">£{total}</span>
                </div>
              </div>

              {!user && (
                <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <p className="text-yellow-400 text-xs">You must be signed in to complete your booking.</p>
                </div>
              )}
              <p className="mt-4 text-xs text-gray-500 flex items-center gap-1">
                <span>🔒</span> Payments are simulated — no real charges
              </p>
            </aside>

            {/* Payment Form */}
            <section className="lg:col-span-3">
              <div className="glass-panel rounded-2xl p-6">
                <h2 className="text-lg font-bold text-white mb-6">Card Details</h2>

                <div className="rounded-xl p-5 mb-6 relative overflow-hidden"
                  style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)' }}>
                  <div className="text-cinema-gold font-mono text-lg tracking-widest mb-4">
                    {form.cardNumber || '•••• •••• •••• ••••'}
                  </div>
                  <div className="flex justify-between text-sm text-gray-300">
                    <span className="uppercase tracking-wider">{form.cardName || 'FULL NAME'}</span>
                    <span className="font-mono">{form.expiry || 'MM/YY'}</span>
                  </div>
                </div>

                <form onSubmit={handleSubmit} noValidate className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Cardholder Name</label>
                    <input type="text" name="cardName" placeholder="Name on card" value={form.cardName} onChange={handleChange}
                      className={`w-full bg-cinema-800 border rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none transition-colors ${errors.cardName ? 'border-red-500' : 'border-cinema-600 focus:border-cinema-gold'}`} />
                    {errors.cardName && <p className="text-red-400 text-xs mt-1">{errors.cardName}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Card Number</label>
                    <input type="text" name="cardNumber" placeholder="1234 5678 9012 3456" value={form.cardNumber} onChange={handleChange} inputMode="numeric"
                      className={`w-full bg-cinema-800 border rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none transition-colors font-mono tracking-wider ${errors.cardNumber ? 'border-red-500' : 'border-cinema-600 focus:border-cinema-gold'}`} />
                    {errors.cardNumber && <p className="text-red-400 text-xs mt-1">{errors.cardNumber}</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Expiry Date</label>
                      <input type="text" name="expiry" placeholder="MM/YY" value={form.expiry} onChange={handleChange} inputMode="numeric"
                        className={`w-full bg-cinema-800 border rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none transition-colors ${errors.expiry ? 'border-red-500' : 'border-cinema-600 focus:border-cinema-gold'}`} />
                      {errors.expiry && <p className="text-red-400 text-xs mt-1">{errors.expiry}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">CVV</label>
                      <input type="text" name="cvv" placeholder="123" value={form.cvv} onChange={handleChange} inputMode="numeric"
                        className={`w-full bg-cinema-800 border rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none transition-colors ${errors.cvv ? 'border-red-500' : 'border-cinema-600 focus:border-cinema-gold'}`} />
                      {errors.cvv && <p className="text-red-400 text-xs mt-1">{errors.cvv}</p>}
                    </div>
                  </div>

                  {apiError && (
                    <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-2">{apiError}</p>
                  )}

                  <button type="submit" disabled={processing}
                    className="w-full bg-cinema-gold text-cinema-900 font-bold py-4 rounded-full text-lg hover:bg-yellow-500 transition-all hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-3 mt-2">
                    {processing ? (
                      <><svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>Processing…</>
                    ) : `Pay £${total}`}
                  </button>
                </form>
              </div>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
