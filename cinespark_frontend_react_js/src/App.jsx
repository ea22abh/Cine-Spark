import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'

import Home from './pages/index.jsx'
import Login from './pages/auth/login.jsx'
import Register from './pages/auth/register.jsx'
import MoviePage from './pages/movies/MoviePage.jsx'
import SeatSelection from './pages/booking/seat-selection.jsx'
import Payment from './pages/booking/payment.jsx'
import Confirmation from './pages/booking/confirmation.jsx'
import AdminDashboard from './pages/admin/index.jsx'
import AdminMovies from './pages/admin/movies.jsx'
import AdminBookings from './pages/admin/bookings.jsx'
import AdminShowtimes from './pages/admin/showtimes.jsx'
import AdminScreens from './pages/admin/screens.jsx'
import AdminSettings from './pages/admin/settings.jsx'
import MyBookings from './pages/user/my-bookings.jsx'
import NotFound from './pages/404.jsx'
import ComingSoon from './pages/coming-soon.jsx'
import LoginModal from './components/ui/LoginModal.jsx'
import AdminLoginModal from './components/ui/AdminLoginModal.jsx'

// Wait for auth to restore from localStorage before deciding to redirect
function AdminRoute({ children }) {
  const { isAdmin, loading } = useAuth()
  if (loading) return <div className="min-h-screen bg-cinema-900 flex items-center justify-center"><div className="w-8 h-8 border-4 border-cinema-gold border-t-transparent rounded-full animate-spin" /></div>
  if (!isAdmin) return <Navigate to="/" replace />
  return children
}

export default function App() {
  const { showLoginModal, showAdminModal } = useAuth()

  return (
    <>
      {showLoginModal && <LoginModal />}
      {showAdminModal && <AdminLoginModal />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/auth/login" element={<Login />} />
        <Route path="/auth/register" element={<Register />} />
        <Route path="/movies/:id" element={<MoviePage />} />
        <Route path="/booking/seat-selection" element={<SeatSelection />} />
        <Route path="/booking/payment" element={<Payment />} />
        <Route path="/booking/confirmation" element={<Confirmation />} />
        <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="/admin/movies" element={<AdminRoute><AdminMovies /></AdminRoute>} />
        <Route path="/admin/bookings" element={<AdminRoute><AdminBookings /></AdminRoute>} />
        <Route path="/admin/showtimes" element={<AdminRoute><AdminShowtimes /></AdminRoute>} />
        <Route path="/admin/screens" element={<AdminRoute><AdminScreens /></AdminRoute>} />
        <Route path="/admin/settings" element={<AdminRoute><AdminSettings /></AdminRoute>} />
        <Route path="/user/my-bookings" element={<MyBookings />} />
        <Route path="/coming-soon" element={<ComingSoon />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  )
}
