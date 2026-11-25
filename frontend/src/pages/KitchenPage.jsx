import { useCallback, useEffect, useState } from 'react'
import { apiGet, apiPost } from '../api/client'
import PageHeader from '../components/PageHeader'
import StatusCard from '../components/StatusCard'

export default function KitchenPage() {
  const [meals, setMeals] = useState([])
  const [summaries, setSummaries] = useState({})
  const [forecasts, setForecasts] = useState({})
  const [recalculatingId, setRecalculatingId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const todayMeals = await apiGet('/api/meals/today')
      setMeals(todayMeals)

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

  const handleRecalculate = async (mealId) => {
    try {
      setRecalculatingId(mealId)
      const updated = await apiPost(`/api/forecast/${mealId}/recalculate`, {})
      setForecasts((prev) => ({ ...prev, [mealId]: updated }))
      setError('')
    } catch (err) {
      setError(err.message)
    } finally {
      setRecalculatingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <PageHeader
          title="Kitchen Operations Dashboard"
          subtitle="Real-time headcounts, predictive forecasts, and automated portion targets to reduce food waste."
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
            const fc = forecasts[meal.id]
            const isRecalculating = recalculatingId === meal.id

            return (
              <div key={meal.id} className="rounded-xl bg-white p-6 shadow-md border border-gray-100 space-y-5">
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

                {/* Headcount Forecast & Smart Portion Plan */}
                {fc ? (
                  <div className="rounded-xl bg-emerald-50/60 p-4 border border-emerald-200 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-emerald-950">
                          Headcount Forecast &amp; Smart Portion Plan
                        </h4>
                        <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                          {Math.round(fc.confidence_score * 100)}% Confidence
                        </span>
                        <span className="rounded bg-white px-2 py-0.5 text-[11px] font-mono text-gray-500 border border-emerald-100">
                          {fc.model_version}
                        </span>
                      </div>
                      <button
                        onClick={() => handleRecalculate(meal.id)}
                        disabled={isRecalculating}
                        className="rounded-lg bg-emerald-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-900 disabled:opacity-50 transition"
                      >
                        {isRecalculating ? 'Recalculating...' : 'Recalculate Forecast'}
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      <div className="rounded-lg bg-white p-3 border border-emerald-100">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Predicted Headcount</p>
                        <p className="mt-1 text-2xl font-extrabold text-emerald-900">{fc.predicted}</p>
                        <p className="text-[11px] text-gray-500">Range: {fc.low} – {fc.high}</p>
                      </div>
                      <div className="rounded-lg bg-white p-3 border border-emerald-100">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Confirmed Eaters</p>
                        <p className="mt-1 text-2xl font-extrabold text-gray-900">{fc.confirmed_eating}</p>
                        <p className="text-[11px] text-gray-500">Skipping: {fc.confirmed_skipping}</p>
                      </div>
                      <div className="rounded-lg bg-white p-3 border border-emerald-100">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Est. Non-Responders</p>
                        <p className="mt-1 text-2xl font-extrabold text-amber-700">+{fc.estimated_non_responder_eaters}</p>
                        <p className="text-[11px] text-gray-500">Out of {fc.non_responders} pending</p>
                      </div>
                      <div className="rounded-lg bg-white p-3 border border-emerald-100">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Expected Range</p>
                        <p className="mt-1 text-2xl font-extrabold text-gray-900">{fc.low}–{fc.high}</p>
                        <p className="text-[11px] text-gray-500">Min / Max bounds</p>
                      </div>
                    </div>

                    {fc.portion_targets && fc.portion_targets.length > 0 && (
                      <div className="overflow-x-auto rounded-lg border border-emerald-200 bg-white">
                        <table className="min-w-full divide-y divide-gray-200 text-xs">
                          <thead className="bg-emerald-900/5 text-left font-bold uppercase tracking-wider text-emerald-950">
                            <tr>
                              <th className="px-3 py-2">Dish</th>
                              <th className="px-3 py-2">Per Person</th>
                              <th className="px-3 py-2">Recommended Batch</th>
                              <th className="px-3 py-2">Min – Max Bounds</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 text-gray-700">
                            {fc.portion_targets.map((pt) => (
                              <tr key={pt.dish} className="hover:bg-emerald-50/40">
                                <td className="px-3 py-2 font-semibold text-gray-900">{pt.dish}</td>
                                <td className="px-3 py-2">{pt.per_person}</td>
                                <td className="px-3 py-2 font-bold text-emerald-800">{pt.recommended_total}</td>
                                <td className="px-3 py-2 text-gray-500">
                                  {pt.min_total} – {pt.max_total}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ) : (
                  meal.portion_sizes &&
                  Object.keys(meal.portion_sizes).length > 0 && (
                    <div className="rounded-lg bg-gray-50 p-4 border border-gray-200">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
                        Portion Sizes &amp; Cooking Targets (Based on {sum.eating} confirmed eaters)
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
                  )
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
