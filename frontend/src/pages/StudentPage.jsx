import { useCallback, useEffect, useState } from 'react'
import { apiGet, apiPost } from '../api/client'
import PageHeader from '../components/PageHeader'
import { useAuth } from '../context/useAuth'

export default function StudentPage() {
  const { user } = useAuth()
  const [meals, setMeals] = useState([])
  const [loading, setLoading] = useState(true)
  const [busyMealId, setBusyMealId] = useState(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const loadTodayMeals = useCallback(() => {
    setLoading(true)
    apiGet('/api/meals/today')
      .then((data) => {
        setMeals(data)
        setError('')
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    loadTodayMeals()
  }, [loadTodayMeals])

  async function handleCheckin(mealId, status) {
    setError('')
    setNotice('')
    setBusyMealId(mealId)
    try {
      await apiPost('/api/checkins', { meal_id: mealId, status })
      setNotice(`Your response (${status.toUpperCase()}) has been saved!`)
      // Optimistically update local meal status
      setMeals((prev) =>
        prev.map((m) => (m.id === mealId ? { ...m, user_status: status } : m))
      )
    } catch (err) {
      setError(err.message)
    } finally {
      setBusyMealId(null)
    }
  }

  function formatTime(isoString) {
    try {
      const d = new Date(isoString)
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
    } catch {
      return isoString
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Today's Meal Check-in"
        subtitle={`Welcome, ${user?.name || 'Student'}. Tap Eating or Skipping for each meal before its cut-off time.`}
      />

      {error && (
        <div role="alert" className="rounded-lg bg-red-50 p-4 border border-red-200 text-sm text-red-800">
          <span className="font-semibold">Notice:</span> {error}
        </div>
      )}
      {notice && (
        <div role="status" className="rounded-lg bg-emerald-50 p-4 border border-emerald-200 text-sm text-emerald-800">
          <span className="font-semibold">Confirmed:</span> {notice}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading today's menu and meal schedule...</div>
      ) : meals.length === 0 ? (
        <div className="rounded-lg bg-white p-8 text-center shadow">
          <p className="text-gray-600 font-medium text-lg">No meals scheduled for today yet.</p>
          <p className="text-sm text-gray-400 mt-1">Please check back later or check with mess management.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {meals.map((meal) => {
            const isEating = meal.user_status === 'eating'
            const isSkipping = meal.user_status === 'skipping'
            const isBusy = busyMealId === meal.id

            return (
              <div
                key={meal.id}
                className={`flex flex-col justify-between rounded-xl bg-white p-6 shadow-md transition-all border-2 ${
                  isEating
                    ? 'border-emerald-500 ring-2 ring-emerald-100'
                    : isSkipping
                    ? 'border-amber-400 ring-2 ring-amber-50'
                    : 'border-transparent hover:border-gray-200'
                }`}
              >
                <div>
                  {/* Top Header */}
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${
                        meal.meal_type === 'breakfast'
                          ? 'bg-amber-100 text-amber-800'
                          : meal.meal_type === 'lunch'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-indigo-100 text-indigo-800'
                      }`}
                    >
                      {meal.meal_type}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                        meal.is_open ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${meal.is_open ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                      {meal.is_open ? 'Check-in Open' : 'Closed'}
                    </span>
                  </div>

                  {/* Date & Deadline */}
                  <h3 className="text-lg font-bold text-gray-900 capitalize">
                    {meal.meal_type} - {meal.date}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Cut-off deadline: <span className="font-semibold text-gray-700">{formatTime(meal.cutoff_time)}</span>
                  </p>

                  {/* Menu Dishes */}
                  <div className="mt-4 pt-3 border-t border-gray-100">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Today's Menu</h4>
                    <ul className="space-y-1.5 text-sm text-gray-700">
                      {meal.dishes.map((dish, i) => (
                        <li key={i} className="flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            <span className="text-emerald-700 font-bold">•</span> {dish}
                          </span>
                          {meal.portion_sizes && meal.portion_sizes[dish] && (
                            <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded">
                              {meal.portion_sizes[dish]}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Bottom Status & Action Buttons */}
                <div className="mt-6 pt-4 border-t border-gray-100">
                  <div className="mb-3 text-center">
                    <span className="text-xs font-medium text-gray-500">Your Current Status: </span>
                    {isEating ? (
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                        Eating (Registered)
                      </span>
                    ) : isSkipping ? (
                      <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full">
                        Skipping Meal
                      </span>
                    ) : (
                      <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
                        No response yet
                      </span>
                    )}
                  </div>

                  {meal.is_open ? (
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => handleCheckin(meal.id, 'eating')}
                        disabled={isBusy}
                        className={`rounded-lg py-2.5 px-3 text-sm font-bold shadow-sm transition flex items-center justify-center gap-1.5 ${
                          isEating
                            ? 'bg-emerald-700 text-white ring-2 ring-emerald-800'
                            : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-300'
                        }`}
                      >
                        {isBusy ? 'Saving...' : '✓ Eating'}
                      </button>
                      <button
                        onClick={() => handleCheckin(meal.id, 'skipping')}
                        disabled={isBusy}
                        className={`rounded-lg py-2.5 px-3 text-sm font-bold shadow-sm transition flex items-center justify-center gap-1.5 ${
                          isSkipping
                            ? 'bg-amber-600 text-white ring-2 ring-amber-700'
                            : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-300'
                        }`}
                      >
                        {isBusy ? 'Saving...' : '✕ Skipping'}
                      </button>
                    </div>
                  ) : (
                    <div className="rounded-lg bg-gray-50 p-2 text-center text-xs text-gray-500 border border-gray-200">
                      Check-in is closed for this meal. Changes are no longer accepted.
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
