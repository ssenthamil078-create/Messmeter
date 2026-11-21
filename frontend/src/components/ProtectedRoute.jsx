import { Link, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import PageHeader from './PageHeader'

// Wrap a page in <ProtectedRoute roles={['admin']}> to require login and (optionally) a role.
// This only hides the page in the browser; the real enforcement is in the API (require_roles).
export default function ProtectedRoute({ roles, children }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <p className="text-gray-500">Checking your session...</p>
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  if (roles && !roles.includes(user.role)) {
    return (
      <div>
        <PageHeader
          title="Not allowed"
          subtitle={`Your account (${user.role}) cannot open this page.`}
        />
        <Link to="/" className="text-emerald-800 underline">
          Back to home
        </Link>
      </div>
    )
  }
  return children
}
