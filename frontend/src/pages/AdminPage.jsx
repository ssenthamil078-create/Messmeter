import { useCallback, useEffect, useState } from 'react'
import { apiGet, apiPatch, apiPost } from '../api/client'
import PageHeader from '../components/PageHeader'
import { useAuth } from '../context/useAuth'

const EMPTY_FORM = { name: '', email: '', password: '', role: 'student' }

export default function AdminPage() {
  const { user: me } = useAuth()
  const [users, setUsers] = useState([])
  const [form, setForm] = useState(EMPTY_FORM)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)

  const load = useCallback(() => {
    apiGet('/api/users')
      .then(setUsers)
      .catch((err) => setError(err.message))
  }, [])

  useEffect(load, [load])

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value })

  async function addUser(e) {
    e.preventDefault()
    setError('')
    setNotice('')
    setBusy(true)
    try {
      const created = await apiPost('/api/users', form)
      setNotice(`Created ${created.email} (${created.role}).`)
      setForm(EMPTY_FORM)
      load()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function toggleActive(u) {
    setError('')
    setNotice('')
    try {
      await apiPatch(`/api/users/${u.id}`, { is_active: !u.is_active })
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  const field =
    'mt-1 w-full rounded border border-gray-300 px-2 py-1.5 focus:border-emerald-700 focus:outline-none'

  return (
    <div>
      <PageHeader title="Admin panel" subtitle="Create accounts and switch them on or off." />

      {error && (
        <p role="alert" className="mb-4 rounded bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="mb-4 rounded bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {notice}
        </p>
      )}

      <form onSubmit={addUser} className="mb-8 grid gap-3 rounded-lg bg-white p-4 shadow sm:grid-cols-2">
        <h2 className="font-semibold sm:col-span-2">Add a user</h2>
        <label className="text-sm font-medium">
          Name
          <input className={field} value={form.name} onChange={set('name')} required />
        </label>
        <label className="text-sm font-medium">
          Email
          <input type="email" className={field} value={form.email} onChange={set('email')} required />
        </label>
        <label className="text-sm font-medium">
          Temporary password (min 8 characters)
          <input
            type="password"
            autoComplete="new-password"
            className={field}
            value={form.password}
            onChange={set('password')}
            minLength={8}
            required
          />
        </label>
        <label className="text-sm font-medium">
          Role
          <select className={field} value={form.role} onChange={set('role')}>
            <option value="student">student</option>
            <option value="staff">staff</option>
            <option value="admin">admin</option>
          </select>
        </label>
        <button
          type="submit"
          disabled={busy}
          className="rounded bg-emerald-800 py-2 font-semibold text-white hover:bg-emerald-900 disabled:opacity-60 sm:col-span-2"
        >
          {busy ? 'Creating...' : 'Create user'}
        </button>
      </form>

      <div className="overflow-x-auto rounded-lg bg-white shadow">
        <table className="w-full text-left text-sm">
          <thead className="bg-emerald-50 text-emerald-900">
            <tr>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Email</th>
              <th className="px-3 py-2">Role</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-gray-100">
                <td className="px-3 py-2">{u.name}</td>
                <td className="px-3 py-2">{u.email}</td>
                <td className="px-3 py-2">{u.role}</td>
                <td className="px-3 py-2">{u.is_active ? 'Active' : 'Deactivated'}</td>
                <td className="px-3 py-2 text-right">
                  {u.id !== me.id && (
                    <button onClick={() => toggleActive(u)} className="text-emerald-800 underline">
                      {u.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
