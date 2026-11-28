import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CalendarDays, LogOut, Search, ShieldCheck, SlidersHorizontal, Users, Utensils, X } from 'lucide-react'
import { apiDelete, apiGet, apiPatch, apiPost } from '../api/client'
import { useAuth } from '../context/useAuth'

const EMPTY_USER_FORM = { name: '', email: '', password: '', role: 'student' }

function getInitialCutoff(hoursAhead = 3) {
  const d = new Date()
  d.setHours(d.getHours() + hoursAhead)
  d.setMinutes(0, 0, 0)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const roleStyles = {
  admin: 'border-violet-400/20 bg-violet-400/10 text-violet-200',
  staff: 'border-sky-400/20 bg-sky-400/10 text-sky-200',
  student: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200',
}

export default function AdminPage() {
  const { user: me, logout } = useAuth()
  const navigate = useNavigate()
  const [adminTab, setAdminTab] = useState('users')
  const [users, setUsers] = useState([])
  const [userSearch, setUserSearch] = useState('')
  const [showUserForm, setShowUserForm] = useState(false)
  const [userForm, setUserForm] = useState(EMPTY_USER_FORM)
  const [userBusy, setUserBusy] = useState(false)

  const [meals, setMeals] = useState([])
  const [showMealForm, setShowMealForm] = useState(false)
  const [mealForm, setMealForm] = useState({
    date: new Date().toISOString().split('T')[0],
    meal_type: 'lunch',
    dishes: 'Rice, Sambar, Poriyal, Curd',
    portions: 'Rice: 0.25 kg, Sambar: 0.15 L, Poriyal: 0.10 kg',
    cutoff_time: getInitialCutoff(3),
  })
  const [mealBusy, setMealBusy] = useState(false)

  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const loadUsers = useCallback(() => {
    apiGet('/api/users')
      .then(setUsers)
      .catch((err) => setError(err.message))
  }, [])

  const loadMeals = useCallback(() => {
    apiGet('/api/meals')
      .then(setMeals)
      .catch((err) => setError(err.message))
  }, [])

  useEffect(() => {
    loadUsers()
    loadMeals()
  }, [loadUsers, loadMeals])

  const filteredUsers = useMemo(() => {
    const q = userSearch.trim().toLowerCase()
    if (!q) return users
    return users.filter((u) => `${u.name} ${u.email} ${u.role}`.toLowerCase().includes(q))
  }, [userSearch, users])

  async function handleAddUser(e) {
    e.preventDefault()
    if (userBusy) return
    setError('')
    setNotice('')
    setUserBusy(true)
    try {
      const created = await apiPost('/api/users', userForm)
      setNotice(`Successfully created user: ${created.email} (${created.role}).`)
      setUserForm(EMPTY_USER_FORM)
      setShowUserForm(false)
      loadUsers()
    } catch (err) {
      setError(err.message || 'Could not create user.')
    } finally {
      setUserBusy(false)
    }
  }

  async function toggleActive(u) {
    setError('')
    setNotice('')
    try {
      await apiPatch(`/api/users/${u.id}`, { is_active: !u.is_active })
      setNotice(`User ${u.email} is now ${!u.is_active ? 'Active' : 'Deactivated'}.`)
      loadUsers()
    } catch (err) {
      setError(err.message || 'Could not update user status.')
    }
  }

  async function handleAddMeal(e) {
    e.preventDefault()
    if (mealBusy) return
    setError('')
    setNotice('')
    setMealBusy(true)
    try {
      const dishesList = mealForm.dishes
        .split(',')
        .map((d) => d.trim())
        .filter(Boolean)
      if (dishesList.length === 0) {
        throw new Error('Please enter at least one dish.')
      }

      const portionMap = {}
      if (mealForm.portions) {
        mealForm.portions.split(',').forEach((p) => {
          const parts = p.split(':')
          if (parts.length === 2 && parts[0].trim() && parts[1].trim()) {
            portionMap[parts[0].trim()] = parts[1].trim()
          }
        })
      }

      await apiPost('/api/meals', {
        date: mealForm.date,
        meal_type: mealForm.meal_type,
        dishes: dishesList,
        portion_sizes: portionMap,
        cutoff_time: new Date(mealForm.cutoff_time).toISOString(),
      })
      setNotice(`Scheduled ${mealForm.meal_type} meal for ${mealForm.date}!`)
      setShowMealForm(false)
      loadMeals()
    } catch (err) {
      setError(err.message || 'Could not schedule meal.')
    } finally {
      setMealBusy(false)
    }
  }

  async function handleDeleteMeal(id, type, date) {
    if (!window.confirm(`Delete the ${type} meal for ${date}?`)) return
    setError('')
    setNotice('')
    try {
      await apiDelete(`/api/meals/${id}`)
      setNotice(`Deleted meal #${id}.`)
      loadMeals()
    } catch (err) {
      setError(err.message || 'Could not delete meal.')
    }
  }

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
              <p className="text-xs text-[#a7b3a9]">Admin control center · Live API</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/"
              className="rounded-full px-4 py-2 text-sm font-semibold text-[#c6d0c7] transition-colors hover:bg-white/5"
            >
              Home
            </Link>
            <Link
              to="/student"
              className="rounded-full px-4 py-2 text-sm font-semibold text-[#c6d0c7] transition-colors hover:bg-white/5"
            >
              Student Check-in
            </Link>
            <Link
              to="/kitchen"
              className="rounded-full px-4 py-2 text-sm font-semibold text-[#c6d0c7] transition-colors hover:bg-white/5"
            >
              Kitchen
            </Link>
            <span className="rounded-full bg-[#f2ead9] px-4 py-2 text-sm font-semibold text-[#183126]">Admin</span>
            <Link
              to="/analytics"
              className="rounded-full px-4 py-2 text-sm font-semibold text-[#c6d0c7] transition-colors hover:bg-white/5"
            >
              Analytics
            </Link>
            <div className="ml-2 flex items-center gap-3 border-l border-[#30473b] pl-3">
              <span className="hidden text-xs text-[#a7b3a9] sm:inline">
                {me?.name} ({me?.role})
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

        <div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Admin control center</h1>
          <p className="mt-2 max-w-2xl text-sm text-[#b7c0b8]">
            Manage user accounts, assign roles, and schedule hostel mess meals and cut-off times.
          </p>
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

        <section className="rounded-3xl border border-[#30473b] bg-[#1a3026] p-4 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#30473b] pb-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#d9a45f]">Administration</p>
              <h2 className="mt-1 text-2xl font-bold">Control center</h2>
            </div>
            <div className="flex rounded-xl bg-[#12251d] p-1">
              <button
                type="button"
                onClick={() => setAdminTab('users')}
                className={`rounded-lg px-4 py-2 text-sm font-semibold ${
                  adminTab === 'users' ? 'bg-[#e9dfcb] text-[#1c3329]' : 'text-[#bdc9bf]'
                }`}
              >
                User accounts ({users.length})
              </button>
              <button
                type="button"
                onClick={() => setAdminTab('meals')}
                className={`rounded-lg px-4 py-2 text-sm font-semibold ${
                  adminTab === 'meals' ? 'bg-[#e9dfcb] text-[#1c3329]' : 'text-[#bdc9bf]'
                }`}
              >
                Meal &amp; menu ({meals.length})
              </button>
            </div>
          </div>

          {adminTab === 'users' ? (
            <div className="pt-5">
              <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                  <h3 className="font-semibold">User accounts</h3>
                  <p className="mt-1 text-xs text-[#9eaea1]">Create accounts and manage active access in PostgreSQL.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowUserForm((open) => !open)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#d9a45f] px-4 py-2.5 text-sm font-bold text-[#1d2b20] hover:bg-[#e7b873]"
                >
                  <Users size={15} aria-hidden="true" /> {showUserForm ? 'Close form' : 'Add user'}
                </button>
              </div>

              {showUserForm && (
                <form
                  onSubmit={handleAddUser}
                  className="mb-5 grid gap-3 rounded-2xl border border-[#3a5543] bg-[#14271f] p-4 sm:grid-cols-2 lg:grid-cols-5"
                >
                  <label className="text-xs font-medium text-[#bdc9bf]">
                    Name
                    <input
                      required
                      value={userForm.name}
                      onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                      placeholder="e.g. Anand Sharma"
                      className="mt-1.5 w-full rounded-lg border border-[#3a5543] bg-[#1a3026] px-3 py-2.5 text-sm text-white outline-none focus:border-[#d9a45f]"
                    />
                  </label>
                  <label className="text-xs font-medium text-[#bdc9bf]">
                    Email
                    <input
                      required
                      type="email"
                      value={userForm.email}
                      onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                      placeholder="anand@hostel.edu"
                      className="mt-1.5 w-full rounded-lg border border-[#3a5543] bg-[#1a3026] px-3 py-2.5 text-sm text-white outline-none focus:border-[#d9a45f]"
                    />
                  </label>
                  <label className="text-xs font-medium text-[#bdc9bf]">
                    Password (min 8 chars)
                    <input
                      required
                      minLength={8}
                      type="password"
                      autoComplete="new-password"
                      value={userForm.password}
                      onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                      className="mt-1.5 w-full rounded-lg border border-[#3a5543] bg-[#1a3026] px-3 py-2.5 text-sm text-white outline-none focus:border-[#d9a45f]"
                    />
                  </label>
                  <label className="text-xs font-medium text-[#bdc9bf]">
                    Role
                    <select
                      value={userForm.role}
                      onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                      className="mt-1.5 w-full rounded-lg border border-[#3a5543] bg-[#1a3026] px-3 py-2.5 text-sm text-white outline-none focus:border-[#d9a45f]"
                    >
                      <option value="student">Student</option>
                      <option value="staff">Staff</option>
                      <option value="admin">Admin</option>
                    </select>
                  </label>
                  <button
                    type="submit"
                    disabled={userBusy}
                    className="self-end rounded-lg bg-[#527b57] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#638e68] disabled:opacity-50"
                  >
                    {userBusy ? 'Creating...' : 'Create user'}
                  </button>
                </form>
              )}

              <div className="mb-4 flex items-center gap-2 rounded-xl border border-[#30473b] bg-[#14271f] px-3">
                <Search size={16} className="text-[#91a293]" aria-hidden="true" />
                <input
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Search by name, email, or role"
                  aria-label="Search users"
                  className="w-full bg-transparent py-3 text-sm text-white outline-none placeholder:text-[#768579]"
                />
                <SlidersHorizontal size={15} className="text-[#91a293]" aria-hidden="true" />
              </div>

              <div className="overflow-x-auto rounded-2xl border border-[#30473b]">
                <table className="w-full min-w-[640px] border-collapse text-left text-sm">
                  <thead className="bg-[#14271f] text-xs uppercase tracking-wider text-[#9eaea1]">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Name</th>
                      <th className="px-4 py-3 font-semibold">Role</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 text-right font-semibold">Access</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#30473b]">
                    {filteredUsers.map((u) => (
                      <tr key={u.id} className="bg-[#1a3026]">
                        <td className="px-4 py-3.5">
                          <p className="font-semibold">{u.name}</p>
                          <p className="mt-0.5 text-xs text-[#9eaea1]">{u.email}</p>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`rounded-full border px-2.5 py-1 text-[11px] font-bold capitalize ${roleStyles[u.role] || roleStyles.student}`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="flex items-center gap-2 text-xs text-[#c4cec5]">
                            <span className={`size-1.5 rounded-full ${u.is_active ? 'bg-[#8cc796]' : 'bg-[#879188]'}`} />
                            {u.is_active ? 'Active' : 'Deactivated'}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          {me && u.id !== me.id ? (
                            <button
                              type="button"
                              onClick={() => toggleActive(u)}
                              className="rounded-lg border border-[#496553] px-3 py-1.5 text-xs font-semibold text-[#d0d9d1] hover:bg-white/5"
                            >
                              {u.is_active ? 'Deactivate' : 'Activate'}
                            </button>
                          ) : (
                            <span className="text-xs italic text-[#8fa292]">Current user</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {filteredUsers.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-4 py-10 text-center text-sm text-[#9eaea1]">
                          No users match that search.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="mt-3 flex items-center gap-2 text-xs text-[#91a293]">
                <ShieldCheck size={14} aria-hidden="true" /> Admin has full access; staff can view the kitchen dashboard; students use the check-in portal.
              </div>
            </div>
          ) : (
            <div className="pt-5">
              <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                  <h3 className="font-semibold">Meal &amp; menu scheduling</h3>
                  <p className="mt-1 text-xs text-[#9eaea1]">Schedule a service and configure dishes, portions, and cut-off time.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowMealForm((open) => !open)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#d9a45f] px-4 py-2.5 text-sm font-bold text-[#1d2b20] hover:bg-[#e7b873]"
                >
                  <CalendarDays size={15} aria-hidden="true" /> {showMealForm ? 'Close form' : 'Schedule meal'}
                </button>
              </div>

              {showMealForm && (
                <form
                  onSubmit={handleAddMeal}
                  className="mb-5 grid gap-3 rounded-2xl border border-[#3a5543] bg-[#14271f] p-4 sm:grid-cols-2 lg:grid-cols-3"
                >
                  <label className="text-xs font-medium text-[#bdc9bf]">
                    Meal type
                    <select
                      value={mealForm.meal_type}
                      onChange={(e) => setMealForm({ ...mealForm, meal_type: e.target.value })}
                      className="mt-1.5 w-full rounded-lg border border-[#3a5543] bg-[#1a3026] px-3 py-2.5 text-sm text-white"
                    >
                      <option value="breakfast">Breakfast</option>
                      <option value="lunch">Lunch</option>
                      <option value="dinner">Dinner</option>
                    </select>
                  </label>
                  <label className="text-xs font-medium text-[#bdc9bf]">
                    Date
                    <input
                      required
                      type="date"
                      value={mealForm.date}
                      onChange={(e) => setMealForm({ ...mealForm, date: e.target.value })}
                      className="mt-1.5 w-full rounded-lg border border-[#3a5543] bg-[#1a3026] px-3 py-2.5 text-sm text-white"
                    />
                  </label>
                  <label className="text-xs font-medium text-[#bdc9bf]">
                    Cut-off time
                    <input
                      required
                      type="datetime-local"
                      value={mealForm.cutoff_time}
                      onChange={(e) => setMealForm({ ...mealForm, cutoff_time: e.target.value })}
                      className="mt-1.5 w-full rounded-lg border border-[#3a5543] bg-[#1a3026] px-3 py-2.5 text-sm text-white"
                    />
                  </label>
                  <label className="text-xs font-medium text-[#bdc9bf] sm:col-span-2 lg:col-span-3">
                    Dishes (comma-separated)
                    <input
                      required
                      value={mealForm.dishes}
                      onChange={(e) => setMealForm({ ...mealForm, dishes: e.target.value })}
                      placeholder="Rice, Sambar, Poriyal, Curd"
                      className="mt-1.5 w-full rounded-lg border border-[#3a5543] bg-[#1a3026] px-3 py-2.5 text-sm text-white placeholder:text-[#768579]"
                    />
                  </label>
                  <label className="text-xs font-medium text-[#bdc9bf] sm:col-span-2 lg:col-span-3">
                    Portion sizes per student (comma-separated dish: portion)
                    <input
                      value={mealForm.portions}
                      onChange={(e) => setMealForm({ ...mealForm, portions: e.target.value })}
                      placeholder="Rice: 0.25 kg, Sambar: 0.15 L"
                      className="mt-1.5 w-full rounded-lg border border-[#3a5543] bg-[#1a3026] px-3 py-2.5 text-sm text-white placeholder:text-[#768579]"
                    />
                  </label>
                  <button
                    type="submit"
                    disabled={mealBusy}
                    className="rounded-lg bg-[#527b57] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#638e68] disabled:opacity-50 sm:col-span-2 lg:col-span-3"
                  >
                    {mealBusy ? 'Scheduling...' : 'Save meal schedule'}
                  </button>
                </form>
              )}

              <div className="space-y-3">
                {meals.map((meal) => (
                  <article
                    key={meal.id}
                    className="flex flex-col justify-between gap-4 rounded-2xl border border-[#30473b] bg-[#14271f] p-4 sm:flex-row sm:items-center"
                  >
                    <div className="flex items-start gap-3">
                      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#d9a45f]/10 text-[#e7bd7a]">
                        <Utensils size={17} aria-hidden="true" />
                      </span>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-semibold capitalize">{meal.meal_type}</h4>
                          <span
                            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                              meal.is_open ? 'bg-[#527b57]/20 text-[#abd0ad]' : 'bg-white/[0.07] text-[#b3bdb5]'
                            }`}
                          >
                            {meal.is_open ? 'Open' : 'Closed'}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-[#9eaea1]">
                          {meal.date} · Cut-off {new Date(meal.cutoff_time).toLocaleString()}
                        </p>
                        <p className="mt-1 text-xs text-[#c2cbc3]">{meal.dishes.join(', ')}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteMeal(meal.id, meal.meal_type, meal.date)}
                      className="inline-flex items-center justify-center gap-2 self-start rounded-lg border border-[#b86b54]/30 px-3 py-2 text-xs font-semibold text-[#e1a38d] hover:bg-[#b86b54]/10 sm:self-center"
                    >
                      <X size={14} aria-hidden="true" /> Delete meal
                    </button>
                  </article>
                ))}
                {meals.length === 0 && (
                  <p className="py-8 text-center text-sm text-[#9eaea1]">No meals scheduled yet.</p>
                )}
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
