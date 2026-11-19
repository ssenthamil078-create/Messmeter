import { useEffect, useState } from 'react'
import { apiGet } from '../api/client'

// Shows whether the frontend can reach the backend (/api/health).
export default function StatusCard() {
  const [health, setHealth] = useState({ state: 'loading' })

  useEffect(() => {
    apiGet('/api/health')
      .then((data) => setHealth({ state: 'ok', data }))
      .catch((err) => setHealth({ state: 'error', message: err.message }))
  }, [])

  return (
    <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm">
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
  )
}
