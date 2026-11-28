import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Activity,
  ArrowDownRight,
  Bell,
  CalendarDays,
  CheckCircle2,
  Clock3,
  LogOut,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Users,
  X,
} from 'lucide-react'
import { apiGet, apiPost } from '../api/client'
import { useAuth } from '../context/useAuth'

const PERIOD_BY_TYPE = {
  breakfast: '7:00 – 9:00 AM',
  lunch: '12:00 – 2:00 PM',
  dinner: '7:00 – 9:00 PM',
}

const IMAGE_BY_TYPE = {
  breakfast: '/images/food-idli.png',
  lunch: '/images/food-vada.png',
  dinner: '/images/food-coffee.png',
}

function MetricCard({ label, value, helper, icon: Icon, accent }) {
  return (
    <article className="rounded-2xl border border-[#30473b] bg-[#1a3026] p-5 shadow-[0_16px_40px_rgba(0,0,0,0.12)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.13em] text-[#a7b3a9]">{label}</p>
          <p className="mt-3 text-3xl font-bold tracking-tight text-[#f5f0e6]">{value}</p>
        </div>
        <span className={`grid size-10 place-items-center rounded-xl ${accent}`}>
          <Icon size={18} aria-hidden="true" />
        </span>
      </div>
      <p className="mt-3 text-xs text-[#a7b3a9]">{helper}</p>
    </article>
  )
}

export default function KitchenPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [meals, setMeals] = useState([])
  const [selectedMealId, setSelectedMealId] = useState(null)
  const [summaries, setSummaries] = useState({})
  const [forecasts, setForecasts] = useState({})
  const [recalculatingId, setRecalculatingId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [lastRefresh, setLastRefresh] = useState('Just now')

  const loadData = useCallback(async (showNotice = false) => {
    try {
      setLoading(true)
      const todayMeals = await apiGet('/api/meals/today')
      setMeals(todayMeals)
      setSelectedMealId((prev) => {
        if (prev && todayMeals.some((m) => m.id === prev)) return prev
        return todayMeals[0]?.id ?? null
      })

      const summaryMap = {}
      const forecastMap = {}
      await Promise.all(
        todayMeals.map(async (m) => {
          try {
            const [sum, fc] = await Promise.all([
              apiGet(`/api/checkins/summary/${m.id}`),
              apiGet(`/api/forecast/${m.id}`).catch(() => null),
            ])
            summaryMap[m.id] = sum
            if (fc) forecastMap[m.id] = fc
          } catch {
            summaryMap[m.id] = { eating: 0, skipping: 0, not_responded: 0, total_responded: 0 }
          }
        })
      )
      setSummaries(summaryMap)
      setForecasts(forecastMap)
      setLastRefresh(new Intl.DateTimeFormat('en', { hour: 'numeric', minute: '2-digit' }).format(new Date()))
      setError('')
      if (showNotice) setNotice('Live counts and forecasts refreshed from the backend.')
    } catch (err) {
      setError(err.message || 'Failed to load kitchen operations data.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData(false)
    const interval = setInterval(() => loadData(false), 30000)
    return () => clearInterval(interval)
  }, [loadData])

  const handleRecalculate = async (mealId) => {
    if (recalculatingId === mealId) return
    try {
      setRecalculatingId(mealId)
      const updated = await apiPost(`/api/forecast/${mealId}/recalculate`, {})
      setForecasts((prev) => ({ ...prev, [mealId]: updated }))
      setNotice('Forecast recalculated using the latest student check-ins.')
      setError('')
    } catch (err) {
      setError(err.message || 'Could not recalculate forecast.')
    } finally {
      setRecalculatingId(null)
    }
  }

  const selectedMeal = meals.find((m) => m.id === selectedMealId) ?? meals[0] ?? null
  const sum = selectedMeal
    ? summaries[selectedMeal.id] || { eating: 0, skipping: 0, not_responded: 0, total_responded: 0 }
    : null
  const fc = selectedMeal ? forecasts[selectedMeal.id] : null
  const totalPool = sum ? sum.total_responded + sum.not_responded : 0
  const coveragePct = totalPool > 0 ? Math.round((sum.total_responded / totalPool) * 100) : 0
  const confidencePct = fc ? Math.round((fc.confidence_score || 0) * 100) : 0
  const todayLabel = new Intl.DateTimeFormat('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date())

  return (
    <main className="min-h-screen overflow-hidden bg-[#10251d] px-4 py-6 text-[#f5f0e6] sm:px-6 sm:py-8 lg:px-10">
      <div className="dashboard-ambient pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        <div className="dashboard-ambient__glow absolute -right-40 -top-48 size-[32rem] rounded-full bg-[#d9a45f]/[0.07] blur-[100px]" />
        <div className="dashboard-ambient__glow dashboard-ambient__glow--green absolute -bottom-64 -left-40 size-[34rem] rounded-full bg-[#527b57]/[0.1] blur-[120px]" />
      </div>

      <div className="relative mx-auto flex w-full max-w-[1440px] flex-col gap-7">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[#30473b] pb-5">
          <div className="flex items-center gap-3">
            <img
              src="/images/messmeter-logo.png"
              alt="MessMeter logo"
              className="size-11 rounded-full border-2 border-[#d9a45f] bg-white object-contain p-0.5"
            />
            <div>
              <p className="text-lg font-bold tracking-tight">MessMeter</p>
              <p className="text-xs text-[#a7b3a9]">Kitchen operations · Live API</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/"
              className="rounded-full px-4 py-2 text-sm font-semibold text-[#c6d0c7] transition-colors hover:bg-white/5"
            >
              Home
            </Link>
            <span className="rounded-full bg-[#f2ead9] px-4 py-2 text-sm font-semibold text-[#183126]">Kitchen</span>
            {user?.role === 'admin' && (
              <>
                <Link
                  to="/student"
                  className="rounded-full px-4 py-2 text-sm font-semibold text-[#c6d0c7] transition-colors hover:bg-white/5"
                >
                  Student Check-in
                </Link>
                <Link
                  to="/admin"
                  className="rounded-full px-4 py-2 text-sm font-semibold text-[#c6d0c7] transition-colors hover:bg-white/5"
                >
                  Admin
                </Link>
                <Link
                  to="/analytics"
                  className="rounded-full px-4 py-2 text-sm font-semibold text-[#c6d0c7] transition-colors hover:bg-white/5"
                >
                  Analytics
                </Link>
              </>
            )}
            <div className="ml-2 flex items-center gap-3 border-l border-[#30473b] pl-3">
              <span className="hidden text-xs text-[#a7b3a9] sm:inline">
                {user?.name} ({user?.role})
              </span>
              <button
                type="button"
                onClick={() => {
                  logout()
                  navigate('/login')
                }}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#496553] px-3.5 py-2 text-xs font-semibold text-[#e6d5b7] transition-colors hover:bg-white/10"
              >
                <LogOut size={14} aria-hidden="true" /> Log out
              </button>
            </div>
          </div>
        </header>

        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Kitchen operations</h1>
            <p className="mt-2 max-w-2xl text-sm text-[#b7c0b8]">
              Live attendance, AI headcount forecasts, and automated portion targets to reduce food waste.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex items-center gap-2 rounded-xl border border-[#30473b] bg-[#1a3026] px-3 py-2 text-sm text-[#d8ded8]">
              <CalendarDays size={16} className="text-[#d9a45f]" aria-hidden="true" /> {todayLabel}
            </span>
            <button
              type="button"
              onClick={() => loadData(true)}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-[#d9a45f] px-4 py-2.5 text-sm font-bold text-[#1d2b20] transition hover:bg-[#e7b873] disabled:opacity-60"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} aria-hidden="true" />
              {loading ? 'Refreshing...' : 'Refresh counts'}
            </button>
          </div>
        </div>

        {error && (
          <div role="alert" className="flex items-center justify-between gap-3 rounded-xl border border-red-400/40 bg-red-950/50 px-4 py-3 text-sm text-red-200">
            <span>{error}</span>
            <button type="button" onClick={() => setError('')} aria-label="Dismiss error" className="rounded p-1 hover:bg-white/10">
              <X size={16} />
            </button>
          </div>
        )}

        {notice && (
          <div role="status" className="flex items-center justify-between gap-3 rounded-xl border border-[#527b57]/40 bg-[#527b57]/20 px-4 py-3 text-sm text-[#d6e8d6]">
            <span>{notice}</span>
            <button type="button" onClick={() => setNotice('')} aria-label="Dismiss message" className="rounded p-1 hover:bg-white/10">
              <X size={16} />
            </button>
          </div>
        )}

        {loading && meals.length === 0 ? (
          <div className="rounded-3xl border border-[#30473b] bg-[#1a3026] p-12 text-center text-sm text-[#b7c0b8]">
            Loading today&apos;s meal operations from the backend...
          </div>
        ) : meals.length === 0 ? (
          <div className="rounded-3xl border border-[#30473b] bg-[#1a3026] p-12 text-center">
            <p className="text-lg font-semibold text-[#f5f0e6]">No meals scheduled for preparation today.</p>
            <p className="mt-2 text-sm text-[#a7b3a9]">
              Meals scheduled by the admin in the Control Center will appear here with live turnout figures.
            </p>
          </div>
        ) : (
          <>
            <section aria-labelledby="today-meals-heading">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 id="today-meals-heading" className="text-lg font-bold">
                  Today&apos;s meal services
                </h2>
                <span className="text-xs text-[#9aa99d]">Select a service to view its live snapshot</span>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                {meals.map((meal, idx) => {
                  const isSelected = selectedMeal?.id === meal.id
                  const mForecast = forecasts[meal.id]
                  const mType = meal.meal_type
                  const label = mType.charAt(0).toUpperCase() + mType.slice(1)
                  const cutoffFmt = new Date(meal.cutoff_time).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })

                  return (
                    <button
                      key={meal.id}
                      type="button"
                      onClick={() => setSelectedMealId(meal.id)}
                      aria-pressed={isSelected}
                      className={`group rounded-2xl border p-4 text-left transition-all ${
                        isSelected
                          ? 'border-[#d9a45f]/70 bg-[#263c2e] shadow-[0_0_0_1px_rgba(217,164,95,0.12)]'
                          : 'border-[#30473b] bg-[#1a3026] hover:border-[#496553]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <img
                          src={IMAGE_BY_TYPE[mType] || '/images/food-idli.png'}
                          alt=""
                          className="food-float size-14 shrink-0 rounded-2xl border-2 border-[#d9a45f]/30 object-cover shadow-lg"
                          style={{ animationDelay: `${idx * -2}s` }}
                        />
                        <span
                          className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                            meal.is_open ? 'bg-[#6aa579]/15 text-[#a8d5ad]' : 'bg-white/[0.07] text-[#b3bdb5]'
                          }`}
                        >
                          <span className={`size-1.5 rounded-full ${meal.is_open ? 'bg-[#84c28f]' : 'bg-[#88948a]'}`} />
                          {meal.is_open ? 'Check-in Open' : 'Cut-off Closed'}
                        </span>
                      </div>
                      <div className="mt-4 flex items-end justify-between gap-3">
                        <div>
                          <h3 className="text-xl font-bold">{label}</h3>
                          <p className="mt-1 text-sm text-[#a8b3aa]">
                            {meal.date} · {PERIOD_BY_TYPE[mType] || 'Scheduled'}
                          </p>
                        </div>
                        <p className="flex items-center gap-1 text-xs text-[#a8b3aa]">
                          <Clock3 size={13} aria-hidden="true" /> {cutoffFmt}
                        </p>
                      </div>
                      <div className="mt-4 flex items-center justify-between border-t border-white/[0.07] pt-3 text-sm">
                        <span className="text-[#a8b3aa]">Expected headcount</span>
                        <span className="font-bold text-[#f2ead9]">
                          {mForecast ? mForecast.predicted : 'Awaiting forecast'}
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </section>

            {selectedMeal && sum && (
              <>
                <section aria-label="Meal attendance summary" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <MetricCard
                    label="Confirmed eating"
                    value={sum.eating.toLocaleString()}
                    helper="Students checked in to eat"
                    icon={CheckCircle2}
                    accent="bg-[#527b57]/20 text-[#a8d5ad]"
                  />
                  <MetricCard
                    label="Skipping meal"
                    value={sum.skipping.toLocaleString()}
                    helper="Students confirmed not eating"
                    icon={ArrowDownRight}
                    accent="bg-[#bd775b]/15 text-[#e1a38d]"
                  />
                  <MetricCard
                    label="Pending responses"
                    value={sum.not_responded.toLocaleString()}
                    helper="Waiting for a meal response"
                    icon={Clock3}
                    accent="bg-[#d9a45f]/15 text-[#e5bb78]"
                  />
                  <MetricCard
                    label="Total responded"
                    value={sum.total_responded.toLocaleString()}
                    helper="Eating and skipping responses"
                    icon={Users}
                    accent="bg-[#668c97]/15 text-[#a8d0da]"
                  />
                </section>

                <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]" aria-label="Forecast and meal portions">
                  <article className="rounded-3xl border border-[#527b57]/35 bg-gradient-to-br from-[#213b2b] via-[#1b3325] to-[#172a21] p-5 sm:p-7">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[#a9c6a8]">
                          <Sparkles size={15} aria-hidden="true" /> AI headcount forecast
                        </p>
                        <p className="mt-3 text-sm text-[#b7c6b8]">
                          Predicted attendance for {selectedMeal.meal_type} ({selectedMeal.date})
                        </p>
                      </div>
                      <span className="rounded-full border border-[#8dc091]/25 bg-[#8dc091]/10 px-3 py-1.5 text-xs font-bold text-[#b5dfb7]">
                        {fc ? `${confidencePct}% confidence` : 'Forecast unavailable'}
                      </span>
                    </div>

                    <div className="mt-6 flex flex-wrap items-end justify-between gap-5">
                      <div>
                        <p className="text-5xl font-bold tracking-tight">
                          {fc ? fc.predicted : '—'}
                          <span className="ml-2 text-base font-medium text-[#a9b9aa]">people</span>
                        </p>
                        <p className="mt-2 text-sm text-[#b7c6b8]">
                          Expected range{' '}
                          <strong className="text-[#f2ead9]">{fc ? `${fc.low} – ${fc.high}` : '—'}</strong>
                        </p>
                      </div>
                      <div className="min-w-[220px] flex-1 sm:flex-none">
                        <div className="mb-2 flex justify-between text-xs text-[#b7c6b8]">
                          <span>Model confidence</span>
                          <span>{confidencePct}%</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-black/20">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-[#84b88b] to-[#d9a45f] transition-all"
                            style={{ width: `${confidencePct}%` }}
                          />
                        </div>
                        <p className="mt-2 text-[11px] text-[#93a698]">
                          Model {fc ? fc.model_version : 'Not computed yet'}
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl border border-white/[0.08] bg-black/10 p-4">
                        <p className="text-xs text-[#a9b9aa]">Estimated non-responder eaters</p>
                        <p className="mt-2 text-2xl font-bold">{fc ? `+${fc.estimated_non_responder_eaters}` : '—'}</p>
                        <p className="mt-1 text-xs text-[#8fa292]">
                          Out of {fc ? fc.non_responders : sum.not_responded} pending
                        </p>
                      </div>
                      <div className="rounded-2xl border border-white/[0.08] bg-black/10 p-4">
                        <p className="text-xs text-[#a9b9aa]">Check-in window</p>
                        <p className="mt-2 text-2xl font-bold">{selectedMeal.is_open ? 'Open' : 'Closed'}</p>
                        <p className="mt-1 text-xs text-[#8fa292]">
                          Cut-off{' '}
                          {new Date(selectedMeal.cutoff_time).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRecalculate(selectedMeal.id)}
                      disabled={recalculatingId === selectedMeal.id}
                      className="mt-5 inline-flex items-center gap-2 rounded-xl border border-[#94ba95]/25 px-4 py-2.5 text-sm font-semibold text-[#c5dfc4] transition hover:bg-white/[0.06] disabled:opacity-50"
                    >
                      <RefreshCw
                        size={15}
                        className={recalculatingId === selectedMeal.id ? 'animate-spin' : ''}
                        aria-hidden="true"
                      />
                      {recalculatingId === selectedMeal.id ? 'Recalculating...' : 'Recalculate forecast'}
                    </button>
                  </article>

                  <article className="overflow-hidden rounded-3xl border border-[#30473b] bg-[#1a3026]">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#30473b] px-5 py-5 sm:px-6">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#d9a45f]">Smart portion plan</p>
                        <h2 className="mt-1 text-xl font-bold capitalize">{selectedMeal.meal_type} menu</h2>
                      </div>
                      <span className="rounded-full bg-[#2a4032] px-3 py-1.5 text-xs font-semibold text-[#c3d0c4]">
                        {selectedMeal.dishes.length} dishes
                      </span>
                    </div>

                    <div className="divide-y divide-[#30473b]/75">
                      {fc?.portion_targets?.length > 0 ? (
                        fc.portion_targets.map((pt) => (
                          <div key={pt.dish} className="grid grid-cols-[1fr_auto] gap-3 px-5 py-4 sm:px-6">
                            <div>
                              <p className="text-sm font-semibold text-[#f3eee3]">{pt.dish}</p>
                              <p className="mt-1 text-xs text-[#9eaea1]">{pt.per_person} per person</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold text-[#e7bd7a]">{pt.recommended_total}</p>
                              <p className="mt-1 text-[11px] text-[#9eaea1]">
                                Range {pt.min_total} – {pt.max_total}
                              </p>
                            </div>
                          </div>
                        ))
                      ) : selectedMeal.portion_sizes && Object.keys(selectedMeal.portion_sizes).length > 0 ? (
                        Object.entries(selectedMeal.portion_sizes).map(([dish, port]) => (
                          <div key={dish} className="grid grid-cols-[1fr_auto] gap-3 px-5 py-4 sm:px-6">
                            <div>
                              <p className="text-sm font-semibold text-[#f3eee3]">{dish}</p>
                              <p className="mt-1 text-xs text-[#9eaea1]">{port} per person</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold text-[#e7bd7a]">{sum.eating} confirmed</p>
                              <p className="mt-1 text-[11px] text-[#9eaea1]">Static portion</p>
                            </div>
                          </div>
                        ))
                      ) : (
                        selectedMeal.dishes.map((dish) => (
                          <div key={dish} className="px-5 py-4 sm:px-6">
                            <p className="text-sm font-semibold text-[#f3eee3]">{dish}</p>
                            <p className="mt-1 text-xs text-[#9eaea1]">No portion size configured</p>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="flex items-start gap-2 border-t border-[#30473b] bg-[#14271f]/60 px-5 py-4 text-xs text-[#9eaea1] sm:px-6">
                      <ShieldCheck size={15} className="mt-0.5 shrink-0 text-[#9ac29b]" aria-hidden="true" />
                      {fc
                        ? 'Batch targets use the live forecast headcount and configured portion sizes.'
                        : 'Click "Recalculate forecast" to compute batch targets from student check-ins.'}
                    </div>
                  </article>
                </section>

                <section className="grid gap-4 lg:grid-cols-[1fr_0.75fr]" aria-label="Operations summary">
                  <article className="rounded-3xl border border-[#30473b] bg-[#1a3026] p-5 sm:p-6">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#d9a45f]">Service pulse</p>
                        <h2 className="mt-1 text-xl font-bold">Response coverage</h2>
                      </div>
                      <Activity size={19} className="text-[#a7cba5]" aria-hidden="true" />
                    </div>
                    <div className="mt-5 flex items-center gap-4">
                      <div className="h-3 flex-1 overflow-hidden rounded-full bg-[#34483a]">
                        <div className="h-full rounded-full bg-[#d9a45f]" style={{ width: `${coveragePct}%` }} />
                      </div>
                      <strong className="text-sm">{coveragePct}%</strong>
                    </div>
                    <div className="mt-3 flex justify-between text-xs text-[#9eaea1]">
                      <span>{sum.total_responded} responses</span>
                      <span>{sum.not_responded} pending</span>
                    </div>
                  </article>

                  <article className="rounded-3xl border border-[#30473b] bg-[#1a3026] p-5 sm:p-6">
                    <div className="flex items-center gap-3">
                      <span className="grid size-10 place-items-center rounded-xl bg-[#d9a45f]/10 text-[#e7bd7a]">
                        <Bell size={17} aria-hidden="true" />
                      </span>
                      <div>
                        <p className="font-semibold">Kitchen status</p>
                        <p className="mt-1 text-xs text-[#9eaea1]">
                          Cut-off:{' '}
                          {new Date(selectedMeal.cutoff_time).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                    <p className="mt-4 text-sm leading-6 text-[#c2cbc3]">
                      {selectedMeal.is_open
                        ? `${sum.not_responded} students have not responded yet. Forecast includes an estimate for non-responders.`
                        : 'This service check-in window is closed. Portion targets remain ready for kitchen staff.'}
                    </p>
                  </article>
                </section>
              </>
            )}
          </>
        )}
      </div>
    </main>
  )
}
