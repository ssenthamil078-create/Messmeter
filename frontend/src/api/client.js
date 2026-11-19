// Small wrapper around fetch for talking to the FastAPI backend.
// All paths start with /api; the Vite dev server proxies them to http://localhost:8000.

async function request(path, options = {}) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export const apiGet = (path) => request(path)
export const apiPost = (path, body) =>
  request(path, { method: 'POST', body: JSON.stringify(body) })
