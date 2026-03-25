import axios from 'axios'

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api' })

// Attach JWT token to every request automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('cs_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Auto-logout on 401 (expired/invalid token)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('cs_token')
      localStorage.removeItem('cs_user')
      window.location.href = '/'
    }
    return Promise.reject(error)
  }
)

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
}

// ── Movies ────────────────────────────────────────────────────────────────────
export const moviesAPI = {
  getAll: () => api.get('/movies'),
  getBySection: (section) => api.get(`/movies?section=${section}`),
  getById: (id) => api.get(`/movies/${id}`),
  getShowtimes: (id) => api.get(`/movies/${id}/showtimes`),
  create: (data) => api.post('/movies', data),
  update: (id, data) => api.put(`/movies/${id}`, data),
  delete: (id) => api.delete(`/movies/${id}`),
}

// ── Showtimes ─────────────────────────────────────────────────────────────────
export const showtimesAPI = {
  getAll: () => api.get('/showtimes'),
  getById: (id) => api.get(`/showtimes/${id}`),
  create: (data) => api.post('/showtimes', data),
  update: (id, data) => api.put(`/showtimes/${id}`, data),
  delete: (id) => api.delete(`/showtimes/${id}`),
}

// ── Seats ─────────────────────────────────────────────────────────────────────
export const seatsAPI = {
  getByShowtime: (showtimeId) => api.get(`/seats/showtime/${showtimeId}`),
}

// ── Bookings ──────────────────────────────────────────────────────────────────
export const bookingsAPI = {
  create: (data) => api.post('/bookings', data),
  getMy: () => api.get('/bookings/my'),
  getById: (id) => api.get(`/bookings/${id}`),
  cancel: (id) => api.patch(`/bookings/${id}/cancel`),
}

// ── Admin ─────────────────────────────────────────────────────────────────────
export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getUsers: () => api.get('/admin/users'),
  updateUserRole: (id, role) => api.patch(`/admin/users/${id}/role`, { role }),
  getBookings: () => api.get('/admin/bookings'),
  updateBookingStatus: (id, status) => api.patch(`/admin/bookings/${id}/status`, { status }),
  getAllMovies: () => api.get('/admin/movies'),
  getScreens: () => api.get('/admin/screens'),
  createScreen: (data) => api.post('/admin/screens', data),
  updateScreen: (id, data) => api.put(`/admin/screens/${id}`, data),
  deleteScreen: (id) => api.delete(`/admin/screens/${id}`),
  generateSeats: (screenId, data) => api.post(`/admin/screens/${screenId}/generate-seats`, data),
  updateProfile: (data) => api.put('/admin/profile', data),
  updatePassword: (data) => api.put('/admin/password', data),
}

export default api
