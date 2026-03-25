/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from 'react'
import { authAPI } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showAdminModal, setShowAdminModal] = useState(false)

  // Restore session from localStorage on app load (validates JWT expiry)
  useEffect(() => {
    const token = localStorage.getItem('cs_token')
    const stored = localStorage.getItem('cs_user')
    if (token && stored) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        const nowSeconds = Math.floor(Date.now() / 1000)
        if (payload.exp && payload.exp > nowSeconds) {
          setUser(JSON.parse(stored))
        } else {
          localStorage.removeItem('cs_token')
          localStorage.removeItem('cs_user')
        }
      } catch {
        localStorage.removeItem('cs_token')
        localStorage.removeItem('cs_user')
      }
    }
    setLoading(false)
  }, [])

  const login = async (email, password) => {
    const res = await authAPI.login({ email, password })
    localStorage.setItem('cs_token', res.data.token)
    localStorage.setItem('cs_user', JSON.stringify(res.data.user))
    setUser(res.data.user)
    setShowLoginModal(false)
    return res.data.user
  }

  const register = async (name, email, password) => {
    const res = await authAPI.register({ name, email, password })
    localStorage.setItem('cs_token', res.data.token)
    localStorage.setItem('cs_user', JSON.stringify(res.data.user))
    setUser(res.data.user)
    return res.data.user
  }

  const logout = () => {
    localStorage.removeItem('cs_token')
    localStorage.removeItem('cs_user')
    setUser(null)
  }

  // Admin login — calls real backend, checks role === 'admin'
  const adminLogin = async (email, password) => {
    const res = await authAPI.login({ email, password })
    if (res.data.user.role !== 'admin') throw new Error('Not an admin account')
    localStorage.setItem('cs_token', res.data.token)
    localStorage.setItem('cs_user', JSON.stringify(res.data.user))
    setUser(res.data.user)
    setShowAdminModal(false)
    return res.data.user
  }

  const adminLogout = () => logout()

  // Update stored user data (used after profile edit)
  const updateUser = (updatedUser) => {
    const merged = { ...user, ...updatedUser }
    localStorage.setItem('cs_user', JSON.stringify(merged))
    setUser(merged)
  }

  const isAdmin = user?.role === 'admin'

  return (
    <AuthContext.Provider value={{
      user, loading, isAdmin,
      login, register, logout, updateUser,
      adminLogin, adminLogout,
      showLoginModal, setShowLoginModal,
      showAdminModal, setShowAdminModal,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
