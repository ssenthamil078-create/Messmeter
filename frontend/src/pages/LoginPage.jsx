import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
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

  // Already signed in: redirect to role home.
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
      navigate(location.state?.from || HOME_BY_ROLE[u.role] || '/', { replace: true })
    } catch (err) {
      setError(err.message || 'Sign in failed. Please check your credentials.')
      setSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#faf9f5] lg:grid lg:grid-cols-2">
      <section
        aria-label="About MessMeter"
        className="relative hidden min-h-screen flex-col justify-between overflow-hidden bg-[#244a38] p-12 text-white lg:flex xl:p-16"
      >
        <div className="pointer-events-none absolute -right-28 -top-24 size-96 rounded-full border border-white/10" aria-hidden="true" />
        <div className="pointer-events-none absolute -right-12 -top-8 size-64 rounded-full border border-white/10" aria-hidden="true" />

        <Link to="/" className="relative flex items-center gap-3 text-xl font-semibold tracking-tight">
          <span className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-xl bg-[#faf9f5]">
            <img
              src="/images/messmeter-logo.png"
              alt="MessMeter logo"
              className="h-9 w-8 object-contain"
            />
          </span>
          MessMeter
        </Link>

        <div className="relative mx-auto w-full max-w-lg py-12">
          <div className="relative mx-auto aspect-[4/3] w-full max-w-md overflow-hidden rounded-[2rem] border border-white/15 shadow-2xl">
            <img
              src="/messmeter-food.png"
              alt="Freshly prepared vegetarian meal with rice, dal, vegetables, salad, and chapati"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#182e23]/65 via-transparent to-transparent" aria-hidden="true" />
            <p className="absolute bottom-5 left-6 right-6 text-sm font-medium tracking-wide text-white">
              Thoughtful portions. Meals worth sharing.
            </p>
          </div>
          <div className="mx-auto mt-8 max-w-md text-center">
            <h2 className="text-3xl font-semibold leading-tight tracking-tight">
              Cook for the people who&apos;ll be there.
            </h2>
            <p className="mx-auto mt-4 max-w-sm text-sm leading-6 text-white/70">
              Know who&apos;s eating before the meal. Give your kitchen a live headcount and a dish-by-dish plan to serve just the right amount.
            </p>
          </div>
        </div>

        <p className="relative text-xs text-white/55">Less waste in the kitchen. Better meals for everyone.</p>
      </section>

      <section aria-labelledby="login-heading" className="flex min-h-screen flex-col items-center justify-center px-6 py-12 sm:px-10">
        <div className="w-full max-w-sm">
          <Link to="/" className="mx-auto mb-12 flex w-fit items-center gap-2.5 text-lg font-semibold tracking-tight text-[#244a38] lg:hidden">
            <span className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-xl bg-[#faf9f5]">
              <img
                src="/images/messmeter-logo.png"
                alt="MessMeter logo"
                className="h-8 w-7 object-contain"
              />
            </span>
            MessMeter
          </Link>

          <div className="mb-8">
            <p className="mb-3 text-sm font-medium text-[#52715e]">Your hostel, in sync</p>
            <h1 id="login-heading" className="text-3xl font-semibold tracking-tight text-[#202b24]">
              Welcome back
            </h1>
            <p className="mt-2 text-sm leading-6 text-[#707970]">
              Sign in to set your meal plans and help your mess serve smarter.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-[#36443a]" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="username"
                placeholder="you@hostel.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 rounded-xl border border-[#e2e5dc] bg-white px-4 text-sm text-[#202b24] placeholder:text-[#a0a79f] focus:border-[#315d43] focus:outline-none"
              />
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-[#36443a]" htmlFor="password">
                  Password
                </label>
                <span className="text-xs font-medium text-[#52715e]">Contact admin to reset</span>
              </div>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 rounded-xl border border-[#e2e5dc] bg-white px-4 text-sm text-[#202b24] placeholder:text-[#a0a79f] focus:border-[#315d43] focus:outline-none"
              />
            </div>

            {error && (
              <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="mt-1 h-12 rounded-xl bg-[#315d43] text-sm font-semibold text-white transition hover:bg-[#244a38] disabled:opacity-60"
            >
              {submitting ? 'Signing in...' : 'Sign in'}
            </button>

            <p className="pt-2 text-center text-sm text-[#737b73]">
              <Link to="/" className="font-semibold text-[#315d43] hover:text-[#244a38]">
                ← Back to MessMeter home
              </Link>
            </p>
          </form>

          <p className="mt-12 text-center text-xs leading-5 text-[#929991]">
            By signing in, you agree to help make every meal count.
          </p>
        </div>
      </section>
    </main>
  )
}
