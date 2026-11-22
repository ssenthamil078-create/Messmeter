import { useCallback, useEffect, useState } from 'react'
import { apiGet } from '../api/client'
import PageHeader from '../components/PageHeader'
import StatusCard from '../components/StatusCard'

export default function KitchenPage() {
  const [meals, setMeals] = useState([])
  const [summaries, setSummaries] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const todayMeals = await apiGet('/api/meals/today')
      setMeals(todayMeals)

      const summaryMap = {}
      await Promise.all(
        todayMeals.map(async (m) => {
          try {
            const sum = await apiGet(`/api/checkins/summary/${m.id}`)
            summaryMap[m.id] = sum
          } catch {
            summaryMap[m.id] = { eating: 0, skipping: 0, not_responded: 0, total_responded: 0 }
          }
        })
      )
      setSummaries(summaryMap)
      setError('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
    // Auto refresh every 30 seconds as specified in NFR
    const interval = setInterval(loadData, 30000)
    return () => clearInterval(interval)
  }, [loadData])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <PageHeader
          title="Kitchen Operations Dashboard"
          subtitle="Real-time headcounts and check-in responses to guide meal preparation and reduce food waste."
        />
        <button
          onClick={loadData}
          className="self-start sm:self-auto rounded-lg border border-emerald-800 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-50 transition"
        >
          ↻ Refresh Counts
        </button>
      </div>

      {error && (
        <div role="alert" className="rounded-lg bg-red-50 p-4 border border-red-200 text-sm text-red-800">
          <span className="font-semibold">Error:</span> {error}
        </div>
      )}

      {loading && meals.length === 0 ? (
        <div className="text-center py-12 text-gray-500">Loading today's meal operations...</div>
      ) : meals.length === 0 ? (
        <div className="rounded-lg bg-white p-8 text-center shadow">
          <p className="text-gray-600 font-medium">No meals scheduled for preparation today.</p>
          <p className="text-xs text-gray-400 mt-1">Meals scheduled by the admin will appear here with live turnout figures.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {meals.map((meal) => {
            const sum = summaries[meal.id] || { eating: 0, skipping: 0, not_responded: 0, total_responded: 0 }

            return (
              <div key={meal.id} className="rounded-xl bg-white p-6 shadow-md border border-gray-100 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-3">
                  <div>
                    <span
                      className={`inline-block rounded px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${
                        meal.meal_type === 'breakfast'
                          ? 'bg-amber-100 text-amber-800'
                          : meal.meal_type === 'lunch'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-indigo-100 text-indigo-800'
                      }`}
                    >
                      {meal.meal_type}
                    </span>
                    <h3 className="text-lg font-bold text-gray-900 mt-1">
                      {meal.date} — {meal.dishes.join(', ')}
                    </h3>
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-bold ${
                        meal.is_open ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {meal.is_open ? 'Check-in Active' : 'Cut-off Reached'}
                    </span>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Cut-off: {new Date(meal.cutoff_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>

                {/* Turnout metrics */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <StatusCard title="Confirmed Eating" value={sum.eating} />
                  <StatusCard title="Skipping Meal" value={sum.skipping} />
                  <StatusCard title="Pending Responses" value={sum.not_responded} />
                  <StatusCard title="Total Responded" value={sum.total_responded} />
                </div>

                {/* Portion Guide */}
                {meal.portion_sizes && Object.keys(meal.portion_sizes).length > 0 && (
                  <div className="rounded-lg bg-gray-50 p-4 border border-gray-200">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
                      Portion Sizes & Cooking Targets (Based on {sum.eating} confirmed eaters)
                    </h4>
                    <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3 text-xs text-gray-700">
                      {Object.entries(meal.portion_sizes).map(([dish, port]) => (
                        <div key={dish} className="flex justify-between bg-white p-2 rounded border border-gray-100">
                          <span className="font-medium">{dish}:</span>
                          <span className="text-emerald-800 font-semibold">{port} per person</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
