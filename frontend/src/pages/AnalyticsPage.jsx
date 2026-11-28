import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  ClipboardList,
  Download,
  LayoutDashboard,
  LogOut,
  Package,
  Plus,
  Search,
  Soup,
  Users,
  Utensils,
  Warehouse,
} from 'lucide-react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { apiDelete, apiGet, apiPatch, apiPost } from '../api/client'
import { useAuth } from '../context/useAuth'

function MetricCard({ label, value, detail, icon: Icon, positive = true }) {
  const parts = detail.split(' ')
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{value}</p>
        </div>
        <span className="rounded-lg bg-emerald-50 p-2.5 text-emerald-800">
          <Icon aria-hidden="true" className="size-5" />
        </span>
      </div>
      <p className="mt-3 flex items-center gap-1 text-xs text-slate-500">
        {positive ? (
          <ArrowUpRight aria-hidden="true" className="size-3.5 text-emerald-700" />
        ) : (
          <ArrowDownRight aria-hidden="true" className="size-3.5 text-amber-700" />
        )}
        <span className={positive ? 'font-semibold text-emerald-700' : 'font-semibold text-amber-700'}>
          {parts.slice(0, 2).join(' ')}
        </span>
        <span>{parts.slice(2).join(' ')}</span>
      </p>
    </article>
  )
}

export default function AnalyticsPage() {
  const { user, logout } = useAuth()
  const [activeTab, setActiveTab] = useState('weekly')
  const [days, setDays] = useState(7)
  const [weekly, setWeekly] = useState(null)
  const [inventory, setInventory] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Add inventory form state
  const [name, setName] = useState('')
  const [category, setCategory] = useState('Grains')
  const [quantity, setQuantity] = useState('')
  const [unit, setUnit] = useState('kg')
  const [reorderLevel, setReorderLevel] = useState('10')
  const [searchQuery, setSearchQuery] = useState('')
  const [saving, setSaving] = useState(false)

  const loadData = useCallback(
    async (selectedDays = days) => {
      setLoading(true)
      setError('')
      try {
        const [wData, iData] = await Promise.all([
          apiGet(`/api/reports/weekly?days=${selectedDays}`),
          apiGet('/api/reports/inventory'),
        ])
        setWeekly(wData)
        setInventory(iData)
      } catch (err) {
        setError(err.message || 'Failed to load analytics')
      } finally {
        setLoading(false)
      }
    },
    [days]
  )

  useEffect(() => {
    loadData(days)
  }, [days, loadData])

  async function handleAddStock(e) {
    e.preventDefault()
    if (!name.trim() || quantity === '' || saving) return
    setSaving(true)
    setError('')
    try {
      await apiPost('/api/reports/inventory', {
        name: name.trim(),
        category,
        quantity: Number(quantity),
        unit: unit.trim() || 'kg',
        reorder_level: Number(reorderLevel) || 10,
      })
      setName('')
      setQuantity('')
      await loadData(days)
    } catch (err) {
      setError(err.message || 'Could not add inventory item')
    } finally {
      setSaving(false)
    }
  }

  async function handleAdjustStock(item, delta) {
    const nextQty = Math.max(0, Number((item.quantity + delta).toFixed(2)))
    setError('')
    try {
      await apiPatch(`/api/reports/inventory/${item.id}`, { quantity: nextQty })
      await loadData(days)
    } catch (err) {
      setError(err.message || 'Could not update stock')
    }
  }

  async function handleDeleteStock(itemId) {
    setError('')
    try {
      await apiDelete(`/api/reports/inventory/${itemId}`)
      await loadData(days)
    } catch (err) {
      setError(err.message || 'Could not delete stock item')
    }
  }

  // Aggregate daily attendance & leftover trend for Recharts AreaChart
  const trendData = useMemo(() => {
    if (!weekly?.meals?.length) return []
    const byDate = {}
    for (const m of weekly.meals) {
      if (!byDate[m.date]) byDate[m.date] = { day: m.date.slice(5), attendance: 0, waste: 0 }
      byDate[m.date].attendance += m.eating_count
      byDate[m.date].waste = Number((byDate[m.date].waste + m.qty_left).toFixed(2))
    }
    return Object.values(byDate).reverse()
  }, [weekly])

  // Aggregate servings breakdown by meal_type
  const mealBreakdown = useMemo(() => {
    if (!weekly?.meals?.length) return []
    const totals = { lunch: 0, dinner: 0, breakfast: 0 }
    for (const m of weekly.meals) {
      totals[m.meal_type] = (totals[m.meal_type] || 0) + m.eating_count
    }
    const grand = Object.values(totals).reduce((a, b) => a + b, 0) || 1
    return [
      { name: 'Lunch', count: totals.lunch, pct: Math.round((totals.lunch / grand) * 100) },
      { name: 'Dinner', count: totals.dinner, pct: Math.round((totals.dinner / grand) * 100) },
      { name: 'Breakfast', count: totals.breakfast, pct: Math.round((totals.breakfast / grand) * 100) },
    ]
  }, [weekly])

  const items = inventory?.items || []
  const lowStockCount = inventory?.low_stock_count || 0
  const healthyStockCount = items.length - lowStockCount
  const categoryCount = inventory ? Object.keys(inventory.categories).length : 0

  const stockLevels = items.map((item) => ({
    name: item.name,
    current: item.reorder_level > 0 ? Math.round((item.quantity / item.reorder_level) * 100) : 100,
    reorder: 100,
  }))
  const stockHealth = [
    { name: 'Healthy stock', value: healthyStockCount, color: '#047857' },
    { name: 'Needs reorder', value: lowStockCount, color: '#f59e0b' },
  ].filter((s) => s.value > 0)

  const visibleItems = items.filter((item) =>
    `${item.name} ${item.category}`.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <main className="min-h-screen bg-[#f6f8f7] text-slate-900">
      <header className="bg-emerald-950 text-white">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-4 px-5 py-3.5 lg:px-8">
          <Link className="flex shrink-0 items-center gap-3" to="/" aria-label="MessMeter home">
            <span className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-full bg-white p-0.5">
              <img src="/images/messmeter-logo.png" alt="MessMeter logo" className="h-full w-full object-contain" />
            </span>
            <span className="text-lg font-bold tracking-tight">MessMeter</span>
          </Link>

          <nav aria-label="Main navigation" className="hidden items-center gap-6 text-sm text-emerald-100/80 lg:flex">
            <Link to="/" className="transition hover:text-white">Home</Link>
            <Link to="/student" className="transition hover:text-white">Student Check-in</Link>
            <Link to="/kitchen" className="transition hover:text-white">Kitchen</Link>
            <Link to="/admin" className="transition hover:text-white">Admin</Link>
            <span aria-current="page" className="border-b border-white pb-1 font-semibold text-white">Analytics</span>
          </nav>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium">{user?.name || 'Mess Admin'}</p>
              <p className="text-xs capitalize text-emerald-100/70">{user?.role || 'admin'}</p>
            </div>
            <button
              type="button"
              onClick={logout}
              className="inline-flex items-center gap-2 rounded-lg border border-white/25 px-3 py-2 text-xs font-medium text-white transition hover:bg-white/10"
            >
              <LogOut aria-hidden="true" className="size-3.5" />
              <span className="hidden sm:inline">Log out</span>
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1200px] px-5 pb-12 pt-8 lg:px-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.13em] text-emerald-800">
              <LayoutDashboard aria-hidden="true" className="size-3.5" /> Admin workspace
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-[30px]">Analytics overview</h1>
            <p className="mt-1.5 text-sm text-slate-500 sm:text-base">
              Weekly attendance, food waste and kitchen inventory performance from live database records.
            </p>
          </div>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <Download aria-hidden="true" className="size-4" /> Export report
          </button>
        </div>

        {error && (
          <div role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
          <div className="flex gap-2" role="tablist" aria-label="Analytics report type">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'weekly'}
              onClick={() => setActiveTab('weekly')}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
                activeTab === 'weekly'
                  ? 'bg-emerald-800 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-emerald-50 hover:text-emerald-900'
              }`}
            >
              <BarChart3 aria-hidden="true" className="size-4" /> Weekly Report
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'inventory'}
              onClick={() => setActiveTab('inventory')}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
                activeTab === 'inventory'
                  ? 'bg-emerald-800 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-emerald-50 hover:text-emerald-900'
              }`}
            >
              <Package aria-hidden="true" className="size-4" /> Inventory &amp; Stocks
              {lowStockCount > 0 && (
                <span className="ml-1 rounded-full bg-amber-400 px-2 py-0.5 text-xs font-bold text-slate-900">
                  {lowStockCount} low
                </span>
              )}
            </button>
          </div>
          <div className="hidden items-center gap-2 text-xs text-slate-500 sm:flex">
            <span className="size-2 rounded-full bg-emerald-600" /> Live backend reporting
          </div>
        </div>

        {loading && !weekly && !inventory ? (
          <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500">
            Loading live analytics from PostgreSQL...
          </div>
        ) : activeTab === 'weekly' && weekly ? (
          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                label="Meals tracked"
                value={String(weekly.total_meals)}
                detail={`Last ${weekly.days} days`}
                icon={Utensils}
              />
              <MetricCard
                label="Attendance rate"
                value={`${weekly.turnout_rate_pct}%`}
                detail={`${weekly.total_eating} eating · ${weekly.total_skipping} skipping`}
                icon={Users}
              />
              <MetricCard
                label="Food waste"
                value={`${weekly.waste_pct}%`}
                detail={`${weekly.total_leftover} left / ${weekly.total_cooked} cooked`}
                icon={Activity}
                positive={weekly.waste_pct <= 10}
              />
              <MetricCard
                label="Forecast confidence"
                value={
                  weekly.avg_forecast_confidence !== null
                    ? `${Math.round(weekly.avg_forecast_confidence * 100)}%`
                    : 'N/A'
                }
                detail="Across forecasted meals"
                icon={BarChart3}
              />
            </div>

            <div className="grid gap-5 xl:grid-cols-[1.65fr_1fr]">
              <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="font-semibold text-slate-900">Attendance &amp; waste trends</h2>
                    <p className="mt-1 text-sm text-slate-500">Daily meal attendance compared with leftover quantities</p>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-2">
                      <i className="size-2 rounded-full bg-emerald-700" /> Attendance
                    </span>
                    <span className="flex items-center gap-2">
                      <i className="size-2 rounded-full bg-amber-500" /> Leftovers
                    </span>
                  </div>
                </div>
                {trendData.length > 0 ? (
                  <div className="h-[230px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={trendData} margin={{ top: 8, right: 6, left: -24, bottom: 0 }}>
                        <defs>
                          <linearGradient id="attendanceFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#047857" stopOpacity={0.18} />
                            <stop offset="95%" stopColor="#047857" stopOpacity={0.01} />
                          </linearGradient>
                          <linearGradient id="wasteFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.16} />
                            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.01} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid stroke="#eef2f0" vertical={false} />
                        <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                        <YAxis yAxisId="attendance" tickLine={false} axisLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                        <YAxis yAxisId="waste" orientation="right" hide />
                        <Tooltip contentStyle={{ borderRadius: 10, borderColor: '#e2e8f0', fontSize: 12 }} />
                        <Area yAxisId="attendance" type="monotone" dataKey="attendance" name="Attendance" stroke="#047857" strokeWidth={2.5} fill="url(#attendanceFill)" />
                        <Area yAxisId="waste" type="monotone" dataKey="waste" name="Leftovers" stroke="#f59e0b" strokeWidth={2} fill="url(#wasteFill)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="grid h-[230px] place-items-center text-sm text-slate-400">
                    No meal trend data in this window yet.
                  </p>
                )}
              </section>

              <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-semibold text-slate-900">Meal breakdown</h2>
                    <p className="mt-1 text-sm text-slate-500">Eating check-ins across window</p>
                  </div>
                  <span className="rounded-lg bg-emerald-50 p-2 text-emerald-800">
                    <Soup aria-hidden="true" className="size-4" />
                  </span>
                </div>
                <div className="mt-5 space-y-5">
                  {mealBreakdown.map((m) => (
                    <div key={m.name}>
                      <div className="mb-2 flex justify-between text-sm">
                        <span className="font-medium text-slate-700">{m.name}</span>
                        <span className="text-slate-500">
                          {m.count} <span className="text-slate-400">· {m.pct}%</span>
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full bg-emerald-700" style={{ width: `${m.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 rounded-lg bg-emerald-50/80 p-3.5">
                  <p className="text-sm font-semibold text-emerald-950">Reporting summary</p>
                  <p className="mt-1 text-xs leading-5 text-emerald-900/75">
                    {weekly.total_eating} confirmed meals served with {weekly.waste_pct}% waste across {weekly.total_meals} scheduled services.
                  </p>
                </div>
              </section>
            </div>

            <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
                <div>
                  <h2 className="font-semibold text-slate-900">Weekly meal report</h2>
                  <p className="mt-1 text-sm text-slate-500">Attendance, forecast and kitchen output by meal</p>
                </div>
                <label className="flex items-center gap-2 text-sm text-slate-600">
                  <CalendarDays aria-hidden="true" className="size-4 text-slate-400" />
                  <select
                    value={days}
                    onChange={(e) => setDays(Number(e.target.value))}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-emerald-700/30"
                  >
                    <option value={7}>Last 7 days</option>
                    <option value={14}>Last 14 days</option>
                    <option value={30}>Last 30 days</option>
                  </select>
                </label>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[740px] text-left text-sm">
                  <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
                    <tr>
                      {['Date', 'Meal', 'Eating', 'Skipping', 'Predicted', 'Cooked', 'Leftover'].map((h) => (
                        <th key={h} className="px-5 py-3 font-semibold">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {weekly.meals.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-5 py-8 text-center text-slate-500">
                          No meals recorded in the selected {weekly.days}-day window.
                        </td>
                      </tr>
                    ) : (
                      weekly.meals.map((row) => (
                        <tr key={row.meal_id} className="text-slate-700 hover:bg-slate-50/70">
                          <td className="whitespace-nowrap px-5 py-3.5 font-medium text-slate-800">{row.date}</td>
                          <td className="px-5 py-3.5 capitalize">{row.meal_type}</td>
                          <td className="px-5 py-3.5 font-medium text-emerald-700">{row.eating_count}</td>
                          <td className="px-5 py-3.5">{row.skipping_count}</td>
                          <td className="px-5 py-3.5">{row.predicted_headcount ?? '—'}</td>
                          <td className="px-5 py-3.5">{row.qty_cooked}</td>
                          <td className="px-5 py-3.5 font-medium text-amber-700">{row.qty_left}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-3">
              <MetricCard
                label="Inventory items"
                value={String(items.length).padStart(2, '0')}
                detail={`Across ${categoryCount} categories`}
                icon={Package}
              />
              <MetricCard
                label="Needs reordering"
                value={String(lowStockCount).padStart(2, '0')}
                detail={lowStockCount ? 'Review stock levels' : 'All stock healthy'}
                icon={Warehouse}
                positive={!lowStockCount}
              />
              <MetricCard
                label="Stock categories"
                value={String(categoryCount).padStart(2, '0')}
                detail="Grains, produce & more"
                icon={ClipboardList}
              />
            </div>

            <div className="grid gap-5 xl:grid-cols-[1.65fr_1fr]">
              <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="font-semibold text-slate-900">Stock level vs reorder point</h2>
                    <p className="mt-1 text-sm text-slate-500">Each ingredient normalized to its reorder threshold</p>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-2"><i className="size-2 rounded-full bg-emerald-700" /> Current stock</span>
                    <span className="flex items-center gap-2"><i className="size-2 rounded-full bg-amber-500" /> Reorder point</span>
                  </div>
                </div>
                {stockLevels.length > 0 ? (
                  <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stockLevels} margin={{ top: 8, right: 8, left: -20, bottom: 4 }}>
                        <CartesianGrid vertical={false} stroke="#eef2f0" />
                        <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 11 }} interval={0} />
                        <YAxis tickLine={false} axisLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
                        <Tooltip formatter={(value) => `${value}% of reorder point`} />
                        <Bar dataKey="current" name="Current stock" fill="#047857" radius={[5, 5, 0, 0]} maxBarSize={34} />
                        <Bar dataKey="reorder" name="Reorder point" fill="#f59e0b" radius={[5, 5, 0, 0]} maxBarSize={34} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="grid h-[250px] place-items-center text-sm text-slate-500">Add items to see stock levels.</p>
                )}
              </section>

              <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div>
                  <h2 className="font-semibold text-slate-900">Stock health</h2>
                  <p className="mt-1 text-sm text-slate-500">Items compared with their reorder level</p>
                </div>
                {items.length > 0 ? (
                  <div className="mt-2 grid items-center gap-2">
                    <div className="relative h-[190px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Tooltip />
                          <Pie data={stockHealth} dataKey="value" nameKey="name" innerRadius={56} outerRadius={80} paddingAngle={4} strokeWidth={0}>
                            {stockHealth.map((entry) => (
                              <Cell key={entry.name} fill={entry.color} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-3xl font-bold text-slate-900">{items.length}</span>
                        <span className="text-xs text-slate-500">items tracked</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-lg bg-emerald-50 p-3">
                        <p className="flex items-center gap-2 text-xs font-medium text-emerald-800">
                          <i className="size-2 rounded-full bg-emerald-700" /> Healthy
                        </p>
                        <p className="mt-1 text-2xl font-bold text-slate-900">{healthyStockCount}</p>
                      </div>
                      <div className="rounded-lg bg-amber-50 p-3">
                        <p className="flex items-center gap-2 text-xs font-medium text-amber-800">
                          <i className="size-2 rounded-full bg-amber-500" /> Reorder
                        </p>
                        <p className="mt-1 text-2xl font-bold text-slate-900">{lowStockCount}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="grid h-[210px] place-items-center text-sm text-slate-500">Stock health appears when you add inventory.</p>
                )}
              </section>
            </div>

            <form
              onSubmit={handleAddStock}
              className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_0.7fr_0.6fr_0.7fr_auto]"
            >
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Item name (e.g. Basmati rice)"
                required
                className="min-w-0 rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-emerald-700"
              />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-700 outline-none focus:border-emerald-700"
              >
                <option>Grains</option>
                <option>Produce</option>
                <option>Pulses</option>
                <option>Oils</option>
                <option>Dairy</option>
                <option>Spices</option>
              </select>
              <input
                type="number"
                min="0"
                step="0.1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="Qty"
                required
                className="min-w-0 rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-emerald-700"
              />
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none"
              >
                <option>kg</option>
                <option>L</option>
                <option>pcs</option>
                <option>box</option>
              </select>
              <input
                type="number"
                min="0"
                step="0.1"
                value={reorderLevel}
                onChange={(e) => setReorderLevel(e.target.value)}
                placeholder="Min"
                title="Reorder level"
                className="min-w-0 rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-emerald-700"
              />
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-800 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-900 disabled:opacity-50"
              >
                <Plus aria-hidden="true" className="size-4" />
                {saving ? 'Adding...' : 'Add stock'}
              </button>
            </form>

            <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
                <div>
                  <h2 className="font-semibold text-slate-900">Kitchen inventory</h2>
                  <p className="mt-1 text-sm text-slate-500">Current quantities and reorder status</p>
                </div>
                <div className="relative">
                  <Search aria-hidden="true" className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                  <input
                    aria-label="Search inventory items"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search inventory"
                    className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-emerald-700 sm:w-52"
                  />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[650px] text-left text-sm">
                  <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
                    <tr>
                      {['Item', 'Category', 'Current stock', 'Reorder level', 'Status', 'Actions'].map((h) => (
                        <th key={h} className="px-5 py-3 font-semibold">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {visibleItems.map((item) => (
                      <tr key={item.id} className="text-slate-700">
                        <td className="px-5 py-4 font-medium text-slate-900">{item.name}</td>
                        <td className="px-5 py-4">{item.category}</td>
                        <td className="px-5 py-4 font-medium">{item.quantity} {item.unit}</td>
                        <td className="px-5 py-4">{item.reorder_level} {item.unit}</td>
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                              item.is_low_stock ? 'bg-amber-50 text-amber-800' : 'bg-emerald-50 text-emerald-800'
                            }`}
                          >
                            {item.is_low_stock ? 'Low stock' : 'In stock'}
                          </span>
                        </td>
                        <td className="space-x-2 px-5 py-4">
                          <button
                            type="button"
                            onClick={() => handleAdjustStock(item, 5)}
                            className="rounded border border-slate-200 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
                          >
                            +5
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAdjustStock(item, -5)}
                            className="rounded border border-slate-200 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
                          >
                            -5
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteStock(item.id)}
                            className="text-xs font-medium text-slate-500 underline-offset-4 hover:text-rose-700 hover:underline"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {visibleItems.length === 0 && (
                <p className="px-5 py-10 text-center text-sm text-slate-500">No matching inventory items found.</p>
              )}
            </section>
          </div>
        )}
      </div>
    </main>
  )
}
