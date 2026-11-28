import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowDown, Check, LogOut, Menu, X } from 'lucide-react'
import { apiGet, apiPost } from '../api/client'
import { useAuth } from '../context/useAuth'

function formatTime(isoString) {
  try {
    return new Date(isoString).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
  } catch {
    return isoString
  }
}

export default function StudentPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [meals, setMeals] = useState([])
  const [loading, setLoading] = useState(true)
  const [busyMealId, setBusyMealId] = useState(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [nowMs, setNowMs] = useState(() => Date.now())

  const loadTodayMeals = useCallback(() => {
    setLoading(true)
    apiGet('/api/meals/today')
      .then((data) => {
        setMeals(data)
        setNowMs(Date.now())
        setError('')
      })
      .catch((err) => setError(err.message || 'Failed to load today’s meals.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    loadTodayMeals()
    const timer = setInterval(() => setNowMs(Date.now()), 30000)
    return () => clearInterval(timer)
  }, [loadTodayMeals])

  const activeMeals = meals.filter((meal) => {
    const cutoffMs = new Date(meal.cutoff_time).getTime()
    return meal.is_open && cutoffMs > nowMs
  })

  async function handleCheckin(mealId, status) {
    if (busyMealId === mealId) return
    setError('')
    setNotice('')
    setBusyMealId(mealId)
    try {
      await apiPost('/api/checkins', { meal_id: mealId, status })
      setNotice(`Your response (${status.toUpperCase()}) has been saved!`)
      setMeals((prev) =>
        prev.map((m) => (m.id === mealId ? { ...m, user_status: status } : m))
      )
    } catch (err) {
      setError(err.message || 'Could not save check-in.')
    } finally {
      setBusyMealId(null)
    }
  }

  function handleLogout() {
    logout()
    navigate('/login')
  }

  const todayFormatted = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(new Date())

  return (
    <div className="min-h-screen bg-[#111318] text-[#f5f3ee]">
      {/* Foodie Wagon-inspired Fixed Header */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-[#2c303a] bg-[#111318]/95 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 md:h-20 lg:px-8">
          <Link to="/" className="flex items-center gap-3">
            <span className="size-11 overflow-hidden rounded-full border-2 border-[#f3bf3b] bg-white p-0.5 shadow-md md:size-12">
              <img
                src="/images/messmeter-logo.png"
                alt="MessMeter chef logo"
                className="size-full object-contain"
              />
            </span>
            <div className="hidden sm:block">
              <p className="text-xl font-bold tracking-wider text-[#f3bf3b]">MessMeter</p>
              <p className="text-[11px] tracking-widest text-[#9ea3b0]">STUDENT MEAL CHECK-IN</p>
            </div>
          </Link>

          <nav aria-label="Student navigation" className="hidden items-center gap-7 md:flex">
            <Link to="/" className="text-sm font-medium text-[#e5e3dc] transition-colors hover:text-[#f3bf3b]">
              Home
            </Link>
            <a href="#menu" className="text-sm font-semibold text-[#f3bf3b]">
              Student Check-in
            </a>
            {(user?.role === 'staff' || user?.role === 'admin') && (
              <Link to="/kitchen" className="text-sm font-medium text-[#e5e3dc] transition-colors hover:text-[#f3bf3b]">
                Kitchen
              </Link>
            )}
            {user?.role === 'admin' && (
              <>
                <Link to="/admin" className="text-sm font-medium text-[#e5e3dc] transition-colors hover:text-[#f3bf3b]">
                  Admin
                </Link>
                <Link to="/analytics" className="text-sm font-medium text-[#e5e3dc] transition-colors hover:text-[#f3bf3b]">
                  Analytics
                </Link>
              </>
            )}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <div className="text-right">
              <p className="text-xs font-semibold text-[#f5f3ee]">{user?.name || 'Student'}</p>
              <p className="text-[11px] capitalize text-[#9ea3b0]">{user?.role || 'student'}</p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-lg border border-[#f3bf3b]/40 bg-[#f3bf3b]/10 px-3.5 py-2 text-xs font-semibold text-[#f3bf3b] transition hover:bg-[#f3bf3b]/20"
            >
              <LogOut size={14} aria-hidden="true" />
              Log out
            </button>
          </div>

          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            className="rounded-lg p-2 text-[#e5e3dc] transition hover:text-[#f3bf3b] md:hidden"
            aria-label="Toggle menu"
          >
            {menuOpen ? <X className="size-6" /> : <Menu className="size-6" />}
          </button>
        </div>

        {menuOpen && (
          <div className="border-t border-[#2c303a] bg-[#111318] px-4 py-4 md:hidden">
            <div className="flex flex-col gap-3 text-sm">
              <Link to="/" onClick={() => setMenuOpen(false)} className="py-1.5 text-[#e5e3dc] hover:text-[#f3bf3b]">
                Home
              </Link>
              <a href="#menu" onClick={() => setMenuOpen(false)} className="py-1.5 font-semibold text-[#f3bf3b]">
                Student Check-in
              </a>
              {(user?.role === 'staff' || user?.role === 'admin') && (
                <Link to="/kitchen" onClick={() => setMenuOpen(false)} className="py-1.5 text-[#e5e3dc]">
                  Kitchen
                </Link>
              )}
              {user?.role === 'admin' && (
                <Link to="/admin" onClick={() => setMenuOpen(false)} className="py-1.5 text-[#e5e3dc]">
                  Admin
                </Link>
              )}
              <div className="flex items-center justify-between border-t border-[#2c303a] pt-3">
                <span className="text-xs text-[#9ea3b0]">
                  {user?.name} ({user?.role})
                </span>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#f3bf3b]/40 px-3 py-1.5 text-xs font-semibold text-[#f3bf3b]"
                >
                  <LogOut size={13} /> Log out
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative min-h-[580px] overflow-hidden bg-black pt-24 md:min-h-[660px] md:pt-28">
        <div aria-hidden="true" className="absolute left-[8%] top-1/4 size-72 rounded-full bg-[#f3bf3b]/10 blur-3xl" />
        <div aria-hidden="true" className="absolute bottom-10 right-[10%] size-80 rounded-full bg-amber-600/10 blur-3xl" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-8 px-4 pb-16 sm:px-6 md:grid-cols-2 lg:px-8">
          <div className="relative z-10 order-2 text-center md:order-1 md:text-left">
            <p className="mb-5 inline-flex rounded-full border border-[#f3bf3b]/40 bg-[#f3bf3b]/10 px-4 py-2 text-xs font-bold tracking-[0.2em] text-[#f3bf3b] sm:text-sm">
              THE MESSMETER · REDUCE WASTE
            </p>
            <h1 className="text-5xl font-black leading-[0.98] tracking-tight sm:text-6xl lg:text-7xl">
              <span className="text-[#f3bf3b]">TODAY&apos;S MEAL</span>
              <br />
              <span className="text-[#f5f3ee]">CHECK-IN</span>
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-[#a1a6b3] md:mx-0 md:text-xl">
              Welcome, <span className="font-semibold text-[#f5f3ee]">{user?.name || 'Student'}</span>. Tap Eating or Skipping for each meal before its cut-off time.
            </p>
            <a
              href="#menu"
              onClick={(e) => {
                e.preventDefault()
                document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }}
              className="mt-8 inline-flex items-center gap-3 rounded-lg bg-[#f3bf3b] px-7 py-4 text-sm font-bold tracking-wide text-[#111318] shadow-xl shadow-[#f3bf3b]/20 transition-transform hover:-translate-y-0.5 hover:bg-[#f7ca57]"
            >
              VIEW TODAY&apos;S MENU <ArrowDown aria-hidden="true" size={19} />
            </a>
          </div>

          <div className="order-1 flex items-center justify-center md:order-2">
            <div className="relative aspect-square w-full max-w-[480px]">
              <div aria-hidden="true" className="absolute inset-8 rounded-full bg-[#f3bf3b]/15 blur-3xl" />
              <img
                src="/indian-food-feature.png"
                alt="Freshly prepared hostel meal thali"
                className="food-float relative z-10 h-full w-full object-contain drop-shadow-[0_0_55px_rgba(251,191,36,0.24)]"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Today's Menu & Check-in Cards */}
      <section id="menu" className="scroll-mt-24 bg-[#111318] py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 flex flex-col gap-3 md:mb-12 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="mb-2 text-sm font-bold tracking-[0.2em] text-[#f3bf3b]">FRESH FROM OUR KITCHEN</p>
              <h2 className="text-4xl font-black uppercase tracking-tight text-[#f3bf3b] sm:text-5xl">
                Today&apos;s Menu
              </h2>
            </div>
            <p className="max-w-xl text-base leading-relaxed text-[#a1a6b3]">
              Your meal plan for {todayFormatted}. Choose your response for each scheduled meal before cut-off.
            </p>
          </div>

          {error && (
            <div role="alert" className="mb-6 rounded-xl border border-red-500/40 bg-red-950/50 px-5 py-4 text-sm text-red-200">
              <span className="font-semibold">Error:</span> {error}
            </div>
          )}

          {notice && (
            <div role="status" className="mb-6 rounded-xl border border-emerald-500/40 bg-emerald-950/40 px-5 py-4 text-sm text-emerald-200">
              <span className="font-semibold">Confirmed:</span> {notice}
            </div>
          )}

          {loading ? (
            <div className="rounded-2xl border border-[#2c303a] bg-[#171a21] p-12 text-center text-sm text-[#a1a6b3]">
              Loading today&apos;s menu and meal schedule...
            </div>
          ) : activeMeals.length === 0 ? (
            <div className="rounded-2xl border border-[#2c303a] bg-[#171a21] p-12 text-center">
              <p className="text-lg font-semibold text-[#f5f3ee]">No open check-in menus right now.</p>
              <p className="mt-2 text-sm text-[#a1a6b3]">
                All cut-off deadlines for today have passed or no meals are currently open for check-in.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-3">
              {activeMeals.map((meal) => {
                const isEating = meal.user_status === 'eating'
                const isSkipping = meal.user_status === 'skipping'
                const isBusy = busyMealId === meal.id
                const statusLabel = isEating ? 'Eating' : isSkipping ? 'Skipping' : 'No response yet'

                return (
                  <article
                    key={meal.id}
                    className={`flex flex-col rounded-2xl border bg-[#171a21] p-6 shadow-xl shadow-black/25 transition-transform hover:-translate-y-1 ${
                      isEating
                        ? 'border-emerald-500/70 ring-1 ring-emerald-500/30'
                        : isSkipping
                        ? 'border-amber-500/70 ring-1 ring-amber-500/30'
                        : 'border-[#2c303a]'
                    }`}
                  >
                    <div className="mb-5 flex items-center justify-between gap-3">
                      <span className="rounded-full bg-[#f3bf3b]/15 px-4 py-2 text-xs font-black uppercase tracking-wider text-[#f3bf3b]">
                        {meal.meal_type}
                      </span>
                      <span
                        className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${
                          meal.is_open
                            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                            : 'border-white/15 bg-white/5 text-[#9ea3b0]'
                        }`}
                      >
                        <span
                          aria-hidden="true"
                          className={`size-2 rounded-full ${meal.is_open ? 'bg-emerald-400' : 'bg-[#7d828f]'}`}
                        />
                        {meal.is_open ? 'Check-in Open' : 'Closed'}
                      </span>
                    </div>

                    <h3 className="text-2xl font-bold capitalize leading-snug text-[#f5f3ee]">
                      {meal.meal_type} - {meal.date}
                    </h3>
                    <p className="mt-2 text-sm text-[#a1a6b3]">
                      Cut-off deadline: <span className="font-semibold text-[#f5f3ee]">{formatTime(meal.cutoff_time)}</span>
                    </p>

                    <div className="my-5 border-t border-[#2c303a]" />
                    <h4 className="mb-3 text-sm font-bold uppercase tracking-widest text-[#f3bf3b]">Today&apos;s Menu</h4>
                    <ul className="flex-1 space-y-3 text-base text-[#e5e3dc]">
                      {meal.dishes.map((dish, i) => (
                        <li key={i} className="flex items-start justify-between gap-3">
                          <span className="flex gap-2">
                            <span aria-hidden="true" className="text-[#f3bf3b]">•</span>
                            {dish}
                          </span>
                          {meal.portion_sizes && meal.portion_sizes[dish] && (
                            <span className="shrink-0 rounded-md bg-[#232732] px-2 py-1 text-xs text-[#a1a6b3]">
                              {meal.portion_sizes[dish]}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>

                    <div className="my-5 border-t border-[#2c303a]" />
                    <p className="mb-4 flex flex-wrap items-center justify-center gap-2 text-sm text-[#a1a6b3]">
                      Your Current Status:
                      <span
                        className={`rounded-full px-3 py-1 font-semibold ${
                          isEating
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : isSkipping
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-[#232732] text-[#e5e3dc]'
                        }`}
                      >
                        {statusLabel}
                      </span>
                    </p>

                    {meal.is_open ? (
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => handleCheckin(meal.id, 'eating')}
                          disabled={isBusy}
                          aria-pressed={isEating}
                          className={`inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-3 text-sm font-bold transition-colors disabled:opacity-50 ${
                            isEating
                              ? 'border-emerald-400 bg-emerald-500/25 text-emerald-200'
                              : 'border-emerald-500/60 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20'
                          }`}
                        >
                          <Check aria-hidden="true" size={18} />
                          {isBusy ? 'Saving...' : 'Eating'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCheckin(meal.id, 'skipping')}
                          disabled={isBusy}
                          aria-pressed={isSkipping}
                          className={`inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-3 text-sm font-bold transition-colors disabled:opacity-50 ${
                            isSkipping
                              ? 'border-amber-400 bg-amber-500/25 text-amber-200'
                              : 'border-amber-500/60 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20'
                          }`}
                        >
                          <X aria-hidden="true" size={18} />
                          {isBusy ? 'Saving...' : 'Skipping'}
                        </button>
                      </div>
                    ) : (
                      <div className="rounded-lg border border-[#2c303a] bg-[#232732]/60 p-3 text-center text-xs text-[#9ea3b0]">
                        Check-in is closed for this meal. Changes are no longer accepted.
                      </div>
                    )}
                  </article>
                )
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
