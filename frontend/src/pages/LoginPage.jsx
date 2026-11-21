import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import { HOME_BY_ROLE } from '../context/roles'
import { useAuth } from '../context/useAuth'

export default function LoginPage() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Already signed in: no reason to show the form.
  if (user) return <Navigate to={HOME_BY_ROLE[user.role] || '/'} replace />

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email.trim() || !password) {
      setError('Enter both email and password.')
      return
    }
    setError('')
    setSubmitting(true)
    try {
      const u = await login(email.trim(), password)
      // Send people back to the page they originally wanted, if any, else to their role's home.
      navigate(location.state?.from || HOME_BY_ROLE[u.role] || '/', { replace: true })
    } catch (err) {
      setError(err.message)
      setSubmitting(false)
    }
  }

  const input =
    'mt-1 w-full rounded border border-gray-300 px-3 py-2 focus:border-emerald-700 focus:outline-none'

  return (
    <div className="mx-auto max-w-sm">
      <PageHeader title="Login" subtitle="Sign in as student, kitchen staff or admin." />
      <form onSubmit={handleSubmit} className="space-y-4 rounded-lg bg-white p-6 shadow" noValidate>
        <label className="block text-sm font-medium">
          Email
          <input
            type="email"
            autoComplete="username"
            className={input}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label className="block text-sm font-medium">
          Password
          <input
            type="password"
            autoComplete="current-password"
            className={input}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        {error && (
          <p role="alert" className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded bg-emerald-800 py-2 font-semibold text-white hover:bg-emerald-900 disabled:opacity-60"
        >
          {submitting ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
    </div>
  )
}
