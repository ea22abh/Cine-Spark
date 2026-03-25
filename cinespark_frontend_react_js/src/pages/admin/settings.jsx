import { useState } from 'react'
import { Link } from 'react-router-dom'
import Header from '../../components/layout/Header'
import Footer from '../../components/layout/Footer'
import { adminAPI } from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'

export default function AdminSettings() {
  const { user, updateUser } = useAuth()

  // Profile form
  const [profileForm, setProfileForm] = useState({ name: user?.name || '', email: user?.email || '' })
  const [profileMsg, setProfileMsg] = useState('')
  const [profileErr, setProfileErr] = useState('')
  const [profileSaving, setProfileSaving] = useState(false)

  // Password form
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [pwMsg, setPwMsg] = useState('')
  const [pwErr, setPwErr] = useState('')
  const [pwSaving, setPwSaving] = useState(false)

  const handleProfileSave = async () => {
    setProfileErr(''); setProfileMsg('')
    if (!profileForm.name.trim()) { setProfileErr('Name is required'); return }
    if (!profileForm.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileForm.email)) {
      setProfileErr('Valid email is required'); return
    }
    setProfileSaving(true)
    try {
      const res = await adminAPI.updateProfile({ name: profileForm.name.trim(), email: profileForm.email.trim() })
      updateUser(res.data.user)
      setProfileMsg('Profile updated successfully!')
    } catch (e) {
      setProfileErr(e.response?.data?.message || 'Failed to update profile')
    } finally { setProfileSaving(false) }
  }

  const handlePasswordSave = async () => {
    setPwErr(''); setPwMsg('')
    if (!pwForm.currentPassword) { setPwErr('Current password is required'); return }
    if (!pwForm.newPassword || pwForm.newPassword.length < 6) { setPwErr('New password must be at least 6 characters'); return }
    if (pwForm.newPassword !== pwForm.confirmPassword) { setPwErr('Passwords do not match'); return }
    setPwSaving(true)
    try {
      await adminAPI.updatePassword({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword })
      setPwMsg('Password changed successfully!')
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (e) {
      setPwErr(e.response?.data?.message || 'Failed to change password')
    } finally { setPwSaving(false) }
  }

  return (
    <>
      <Header />
      <main className="container">
        <div className="admin-topbar">
          <div>
            <Link to="/admin" className="text-sm text-gray-400 hover:text-cinema-gold transition-colors">← Back to Dashboard</Link>
            <h1 className="page-title" style={{ marginBottom: 0, marginTop: '0.5rem' }}>Admin Settings</h1>
          </div>
        </div>

        <div style={{ maxWidth: '560px', display: 'flex', flexDirection: 'column', gap: '2rem' }}>

          {/* ── Profile Card ── */}
          <div className="glass-panel" style={{ borderRadius: '16px', padding: '1.75rem' }}>
            <h2 className="admin-section-title" style={{ marginTop: 0, marginBottom: '1.25rem' }}>Profile Details</h2>

            <div className="modal-form">
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Full Name</label>
                <input
                  value={profileForm.name}
                  onChange={(e) => { setProfileForm((p) => ({ ...p, name: e.target.value })); setProfileErr(''); setProfileMsg('') }}
                  placeholder="Your name"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Email Address</label>
                <input
                  type="email"
                  value={profileForm.email}
                  onChange={(e) => { setProfileForm((p) => ({ ...p, email: e.target.value })); setProfileErr(''); setProfileMsg('') }}
                  placeholder="admin@example.com"
                />
              </div>
            </div>

            {profileErr && <p className="modal-error">{profileErr}</p>}
            {profileMsg && (
              <p style={{ color: '#4ade80', fontSize: '0.875rem', marginTop: '0.75rem', background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.25)', borderRadius: '8px', padding: '8px 12px' }}>
                ✓ {profileMsg}
              </p>
            )}

            <div style={{ marginTop: '1.25rem' }}>
              <button className="btn-primary" onClick={handleProfileSave} disabled={profileSaving}>
                {profileSaving ? 'Saving…' : 'Save Profile'}
              </button>
            </div>
          </div>

          {/* ── Password Card ── */}
          <div className="glass-panel" style={{ borderRadius: '16px', padding: '1.75rem' }}>
            <h2 className="admin-section-title" style={{ marginTop: 0, marginBottom: '1.25rem' }}>Change Password</h2>

            <div className="modal-form">
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Current Password</label>
                <input
                  type="password"
                  value={pwForm.currentPassword}
                  onChange={(e) => { setPwForm((p) => ({ ...p, currentPassword: e.target.value })); setPwErr(''); setPwMsg('') }}
                  placeholder="Enter current password"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>New Password</label>
                <input
                  type="password"
                  value={pwForm.newPassword}
                  onChange={(e) => { setPwForm((p) => ({ ...p, newPassword: e.target.value })); setPwErr(''); setPwMsg('') }}
                  placeholder="At least 6 characters"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Confirm New Password</label>
                <input
                  type="password"
                  value={pwForm.confirmPassword}
                  onChange={(e) => { setPwForm((p) => ({ ...p, confirmPassword: e.target.value })); setPwErr(''); setPwMsg('') }}
                  placeholder="Repeat new password"
                />
              </div>
            </div>

            {pwErr && <p className="modal-error">{pwErr}</p>}
            {pwMsg && (
              <p style={{ color: '#4ade80', fontSize: '0.875rem', marginTop: '0.75rem', background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.25)', borderRadius: '8px', padding: '8px 12px' }}>
                ✓ {pwMsg}
              </p>
            )}

            <div style={{ marginTop: '1.25rem' }}>
              <button className="btn-primary" onClick={handlePasswordSave} disabled={pwSaving}>
                {pwSaving ? 'Updating…' : 'Change Password'}
              </button>
            </div>
          </div>

        </div>
      </main>
      <Footer />
    </>
  )
}
