import { useCallback, useEffect, useState } from 'react'
import { apiDelete, apiGet, apiPatch, apiPost } from '../api/client'
import PageHeader from '../components/PageHeader'
import { useAuth } from '../context/useAuth'

const EMPTY_USER_FORM = { name: '', email: '', password: '', role: 'student' }

function getInitialCutoff(hoursAhead = 3) {
  const d = new Date()
  d.setHours(d.getHours() + hoursAhead)
  d.setMinutes(0, 0, 0)
  // Format as YYYY-MM-DDTHH:mm for datetime-local input
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function AdminPage() {
  const { user: me } = useAuth()
  const [activeTab, setActiveTab] = useState('users') // 'users' | 'meals'

  // Users state
  const [users, setUsers] = useState([])
  const [userSearch, setUserSearch] = useState('')
  const [userForm, setUserForm] = useState(EMPTY_USER_FORM)
  const [userBusy, setUserBusy] = useState(false)

  // Meals state
  const [meals, setMeals] = useState([])
  const [mealForm, setMealForm] = useState({
    date: new Date().toISOString().split('T')[0],
    meal_type: 'lunch',
    dishes: 'Rice, Sambar, Poriyal, Curd',
    portions: 'Rice: 0.25 kg, Sambar: 0.15 L, Poriyal: 0.10 kg',
    cutoff_time: getInitialCutoff(3),
  })
  const [mealBusy, setMealBusy] = useState(false)

  // Feedback state
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

  // --- User Handlers ---
  const setUserField = (field) => (e) => setUserForm({ ...userForm, [field]: e.target.value })

  async function handleAddUser(e) {
    e.preventDefault()
    setError('')
    setNotice('')
    setUserBusy(true)
    try {
      const created = await apiPost('/api/users', userForm)
      setNotice(`Successfully created user: ${created.email} (${created.role}).`)
      setUserForm(EMPTY_USER_FORM)
      loadUsers()
    } catch (err) {
      setError(err.message)
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
      setError(err.message)
    }
  }

  // --- Meal Handlers ---
  const setMealField = (field) => (e) => setMealForm({ ...mealForm, [field]: e.target.value })

  async function handleAddMeal(e) {
    e.preventDefault()
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

      const payload = {
        date: mealForm.date,
        meal_type: mealForm.meal_type,
        dishes: dishesList,
        portion_sizes: portionMap,
        cutoff_time: new Date(mealForm.cutoff_time).toISOString(),
      }

      await apiPost('/api/meals', payload)
      setNotice(`Added ${mealForm.meal_type} meal for ${mealForm.date}!`)
      loadMeals()
    } catch (err) {
      setError(err.message)
    } finally {
      setMealBusy(false)
    }
  }

  async function handleDeleteMeal(id, type, date) {
    if (!window.confirm(`Are you sure you want to delete the ${type} meal for ${date}?`)) return
    setError('')
    setNotice('')
    try {
      await apiDelete(`/api/meals/${id}`)
      setNotice(`Deleted meal #${id}.`)
      loadMeals()
    } catch (err) {
      setError(err.message)
    }
  }

  const filteredUsers = users.filter((u) => {
    const q = userSearch.toLowerCase()
    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.role.toLowerCase().includes(q)
  })

  const field =
    'mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-emerald-700 focus:outline-none'

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin Control Center"
        subtitle="Manage user accounts, assign roles, and schedule hostel mess meals and cut-off times."
      />

      {error && (
        <div role="alert" className="rounded-lg bg-red-50 p-4 border border-red-200 text-sm text-red-800">
          <span className="font-semibold">Error:</span> {error}
        </div>
      )}
      {notice && (
        <div role="status" className="rounded-lg bg-emerald-50 p-4 border border-emerald-200 text-sm text-emerald-800">
          <span className="font-semibold">Success:</span> {notice}
        </div>
      )}

      {/* Tab navigation */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => {
            setActiveTab('users')
            setError('')
            setNotice('')
          }}
          className={`py-2 px-6 font-medium text-sm transition-colors border-b-2 ${
            activeTab === 'users'
              ? 'border-emerald-800 text-emerald-900 font-semibold'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          User Accounts ({users.length})
        </button>
        <button
          onClick={() => {
            setActiveTab('meals')
            setError('')
            setNotice('')
          }}
          className={`py-2 px-6 font-medium text-sm transition-colors border-b-2 ${
            activeTab === 'meals'
              ? 'border-emerald-800 text-emerald-900 font-semibold'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Meal & Menu Scheduling ({meals.length})
        </button>
      </div>

      {activeTab === 'users' ? (
        <div>
          {/* User Form */}
          <form onSubmit={handleAddUser} className="mb-8 rounded-lg bg-white p-6 shadow space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Add New User Account</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium text-gray-700">
                Full Name
                <input
                  className={field}
                  value={userForm.name}
                  onChange={setUserField('name')}
                  placeholder="e.g. Anand Sharma"
                  required
                />
              </label>
              <label className="text-sm font-medium text-gray-700">
                Email Address
                <input
                  type="email"
                  className={field}
                  value={userForm.email}
                  onChange={setUserField('email')}
                  placeholder="e.g. anand@hostel.edu"
                  required
                />
              </label>
              <label className="text-sm font-medium text-gray-700">
                Temporary Password (min 8 characters)
                <input
                  type="password"
                  autoComplete="new-password"
                  className={field}
                  value={userForm.password}
                  onChange={setUserField('password')}
                  minLength={8}
                  placeholder="••••••••"
                  required
                />
              </label>
              <label className="text-sm font-medium text-gray-700">
                Role
                <select className={field} value={userForm.role} onChange={setUserField('role')}>
                  <option value="student">Student (Check-in portal)</option>
                  <option value="staff">Kitchen Staff (Live dashboard & prep)</option>
                  <option value="admin">Administrator (Full control)</option>
                </select>
              </label>
            </div>
            <button
              type="submit"
              disabled={userBusy}
              className="rounded bg-emerald-800 px-6 py-2.5 font-semibold text-white hover:bg-emerald-900 disabled:opacity-60 transition"
            >
              {userBusy ? 'Creating User...' : 'Create Account'}
            </button>
          </form>

          {/* User Filter and Table */}
          <div className="rounded-lg bg-white shadow overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <h3 className="font-bold text-gray-900">All Registered Accounts</h3>
              <input
                type="text"
                placeholder="Search by name, email or role..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full sm:w-64 rounded border border-gray-300 px-3 py-1.5 text-sm focus:border-emerald-700 focus:outline-none"
              />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-emerald-50 text-emerald-900 font-semibold">
                  <tr>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-center text-gray-500">
                        No accounts match your search.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">{u.name}</td>
                        <td className="px-4 py-3 text-gray-600">{u.email}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                              u.role === 'admin'
                                ? 'bg-purple-100 text-purple-800'
                                : u.role === 'staff'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {u.role}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                              u.is_active ? 'text-emerald-700' : 'text-red-600'
                            }`}
                          >
                            <span
                              className={`h-2 w-2 rounded-full ${u.is_active ? 'bg-emerald-500' : 'bg-red-500'}`}
                            />
                            {u.is_active ? 'Active' : 'Deactivated'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {me && u.id !== me.id ? (
                            <button
                              onClick={() => toggleActive(u)}
                              className={`text-xs font-semibold px-3 py-1 rounded transition ${
                                u.is_active
                                  ? 'border border-red-300 text-red-700 hover:bg-red-50'
                                  : 'border border-emerald-300 text-emerald-700 hover:bg-emerald-50'
                              }`}
                            >
                              {u.is_active ? 'Deactivate' : 'Activate'}
                            </button>
                          ) : (
                            <span className="text-xs text-gray-400 italic">Current User</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div>
          {/* Meal Form */}
          <form onSubmit={handleAddMeal} className="mb-8 rounded-lg bg-white p-6 shadow space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Schedule a Meal & Set Cut-off</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <label className="text-sm font-medium text-gray-700">
                Meal Date
                <input
                  type="date"
                  className={field}
                  value={mealForm.date}
                  onChange={setMealField('date')}
                  required
                />
              </label>
              <label className="text-sm font-medium text-gray-700">
                Meal Type
                <select className={field} value={mealForm.meal_type} onChange={setMealField('meal_type')}>
                  <option value="breakfast">Breakfast</option>
                  <option value="lunch">Lunch</option>
                  <option value="dinner">Dinner</option>
                </select>
              </label>
              <label className="text-sm font-medium text-gray-700">
                Cut-off Time (Check-in deadline)
                <input
                  type="datetime-local"
                  className={field}
                  value={mealForm.cutoff_time}
                  onChange={setMealField('cutoff_time')}
                  required
                />
              </label>
              <label className="text-sm font-medium text-gray-700 sm:col-span-3">
                Dishes / Menu Items (comma-separated)
                <input
                  className={field}
                  value={mealForm.dishes}
                  onChange={setMealField('dishes')}
                  placeholder="e.g. Chapati, Paneer Curry, Jeera Rice, Dal Fry"
                  required
                />
              </label>
              <label className="text-sm font-medium text-gray-700 sm:col-span-3">
                Portion Sizes per Student (optional, comma-separated dish: portion)
                <input
                  className={field}
                  value={mealForm.portions}
                  onChange={setMealField('portions')}
                  placeholder="e.g. Chapati: 3 pcs, Paneer Curry: 0.15 kg, Jeera Rice: 0.20 kg"
                />
              </label>
            </div>
            <button
              type="submit"
              disabled={mealBusy}
              className="rounded bg-emerald-800 px-6 py-2.5 font-semibold text-white hover:bg-emerald-900 disabled:opacity-60 transition"
            >
              {mealBusy ? 'Scheduling Meal...' : 'Schedule Meal'}
            </button>
          </form>

          {/* Meals List */}
          <div className="rounded-lg bg-white shadow overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">Scheduled Meals ({meals.length})</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-emerald-50 text-emerald-900 font-semibold">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Menu Dishes</th>
                    <th className="px-4 py-3">Cut-off Time</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {meals.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                        No meals scheduled yet. Use the form above to add one.
                      </td>
                    </tr>
                  ) : (
                    meals.map((m) => (
                      <tr key={m.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-semibold text-gray-900">{m.date}</td>
                        <td className="px-4 py-3 capitalize">
                          <span
                            className={`inline-block rounded px-2 py-0.5 text-xs font-bold ${
                              m.meal_type === 'breakfast'
                                ? 'bg-amber-100 text-amber-800'
                                : m.meal_type === 'lunch'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-indigo-100 text-indigo-800'
                            }`}
                          >
                            {m.meal_type}
                          </span>
                        </td>
                        <td className="px-4 py-3 max-w-xs">
                          <div className="font-medium text-gray-800">{m.dishes.join(', ')}</div>
                          {m.portion_sizes && Object.keys(m.portion_sizes).length > 0 && (
                            <div className="text-xs text-gray-500 mt-0.5">
                              {Object.entries(m.portion_sizes)
                                .map(([dish, port]) => `${dish}: ${port}`)
                                .join(' | ')}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-600 text-xs">
                          {new Date(m.cutoff_time).toLocaleString()}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                              m.is_open ? 'text-emerald-700' : 'text-gray-500'
                            }`}
                          >
                            <span className={`h-2 w-2 rounded-full ${m.is_open ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                            {m.is_open ? 'Open' : 'Closed'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => handleDeleteMeal(m.id, m.meal_type, m.date)}
                            className="text-xs font-semibold px-2 py-1 text-red-600 hover:text-red-800 hover:underline"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
