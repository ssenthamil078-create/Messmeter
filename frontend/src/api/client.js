// Small wrapper around fetch for talking to the FastAPI backend.
// All paths start with /api; the Vite dev server proxies them to http://localhost:8000.

const TOKEN_KEY = 'messmeter_token'

// localStorage can throw (private windows, blocked storage), so every access is guarded.
export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  } catch {
    /* storage unavailable: the user just has to log in again next visit */
  }
}

// AuthProvider registers a callback here so an expired token logs the user out everywhere.
let onUnauthorized = null
export function setUnauthorizedHandler(fn) {
  onUnauthorized = fn
}

export class ApiError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

// FastAPI sends {detail: "text"} for our own errors and {detail: [{msg, loc}, ...]} for validation errors.
function messageFrom(body, status) {
  const detail = body?.detail
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail) && detail.length) {
    return detail.map((d) => `${d.loc?.slice(-1)[0] ?? 'field'}: ${d.msg}`).join('; ')
  }
  return `Request failed (HTTP ${status})`
}

async function request(path, options = {}) {
  const token = getToken()
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) }
  if (token) headers.Authorization = `Bearer ${token}`

  let res
  try {
    res = await fetch(path, { ...options, headers })
  } catch {
    throw new ApiError(0, 'Cannot reach the server. Is the backend running?')
  }

  const body = await res.json().catch(() => null)
  if (!res.ok) {
    // A 401 on a request that carried a token means the token is expired or revoked.
    if (res.status === 401 && token && onUnauthorized) onUnauthorized()
    throw new ApiError(res.status, messageFrom(body, res.status))
  }
  return body
}

export const apiGet = (path) => request(path)
export const apiPost = (path, body) =>
  request(path, { method: 'POST', body: JSON.stringify(body) })
export const apiPatch = (path, body) =>
  request(path, { method: 'PATCH', body: JSON.stringify(body) })
export const apiDelete = (path) =>
  request(path, { method: 'DELETE' })
