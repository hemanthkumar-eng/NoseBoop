'use client'

import { FormEvent, useEffect, useState } from 'react'
import { authService } from '@/lib/auth'

export default function LoginModal() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const modal = document.getElementById('login-modal')
    const closeBtn = document.getElementById('login-modal-close')

    const handleClose = () => {
      if (modal) {
        modal.style.display = 'none'
      }
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', handleClose)
    }

    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          handleClose()
        }
      })
    }

    return () => {
      if (closeBtn) {
        closeBtn.removeEventListener('click', handleClose)
      }
    }
  }, [])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      if (mode === 'register') {
        await authService.register(email, password, name)
      } else {
        await authService.login(email, password)
      }
      setPassword('')
      const modal = document.getElementById('login-modal')
      if (modal) {
        modal.style.display = 'none'
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div id="login-modal" className="login-modal-overlay" style={{ display: 'none' }}>
      <div className="login-modal-content">
        <button className="login-modal-close" id="login-modal-close">
          &times;
        </button>
        <div className="login-modal-logo">
          <img
            src="https://img.icons8.com/fluency/48/000000/fire-element.png"
            alt="App Logo"
            style={{ width: '48px', height: '48px' }}
          />
        </div>
        <h2 className="login-modal-title">
          {mode === 'register' ? 'Create Account' : 'Get Started'}
        </h2>
        <p className="login-modal-desc">
          By tapping Log In or Continue, you agree to our
          <a href="#" className="login-modal-link"> Terms</a>. Learn how we process your
          data in our <a href="#" className="login-modal-link">Privacy Policy</a>, and
          <a href="#" className="login-modal-link"> Cookie Policy</a>.
        </p>
        <form onSubmit={handleSubmit}>
          {mode === 'register' && (
            <input
              type="text"
              className="form-control mb-2"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          )}
          <input
            type="email"
            className="form-control mb-2"
            placeholder="Email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            className="form-control mb-3"
            placeholder="Password"
            autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            required
          />
          {error && (
            <p className="text-danger small mb-2" role="alert">
              {error}
            </p>
          )}
          <button type="submit" className="login-modal-google" disabled={submitting}>
            {submitting ? 'Please wait...' : mode === 'register' ? 'Create Account' : 'Log In'}
          </button>
        </form>
        <div className="login-modal-more-options">
          <button
            type="button"
            className="btn btn-link p-0 login-modal-link"
            onClick={() => {
              setError(null)
              setMode(mode === 'register' ? 'login' : 'register')
            }}
          >
            {mode === 'register' ? 'Already have an account? Log in' : 'New here? Create an account'}
          </button>
        </div>
        <div className="login-modal-get-app">
          <div className="login-modal-get-app-title">Get the app!</div>
          <div className="login-modal-app-buttons">
            <a href="#" className="login-modal-app-btn">
              <img
                src="https://developer.apple.com/assets/elements/badges/download-on-the-app-store.svg"
                alt="App Store"
                height={40}
              />
            </a>
            <a href="#" className="login-modal-app-btn">
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg"
                alt="Google Play"
                height={40}
              />
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

