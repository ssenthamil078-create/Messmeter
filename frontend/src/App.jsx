import { useEffect, useState } from 'react'

function App() {
  const [health, setHealth] = useState({ state: 'loading' })

  useEffect(() => {
    fetch('/api/health')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then((data) => setHealth({ state: 'ok', data }))
      .catch((err) => setHealth({ state: 'error', message: err.message }))
  }, [])

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full rounded-2xl bg-white shadow p-8 text-center">
        <h1 className="text-3xl font-bold text-emerald-800">MessMeter</h1>
        <p className="mt-2 text-gray-600">
          Predicting how many students will eat each meal.
        </p>
        <div className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm">
          <p className="font-semibold text-emerald-900">Backend status</p>
          {health.state === 'loading' && <p>Checking...</p>}
          {health.state === 'ok' && (
            <p>
              Connected: {health.data.service} ({health.data.environment})
            </p>
          )}
          {health.state === 'error' && (
            <p className="text-red-700">Cannot reach backend: {health.message}</p>
          )}
        </div>
      </div>
    </main>
  )
}

export default App
