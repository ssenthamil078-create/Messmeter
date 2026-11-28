import { NavLink, useNavigate } from 'react-router-dom'
import logo from '../assets/logo.svg'
import { useAuth } from '../context/useAuth'

// `roles` omitted = visible to everyone, including signed-out visitors.
const links = [
  { to: '/', label: 'Home' },
  { to: '/student', label: 'Student Check-in', roles: ['student', 'admin'] },
  { to: '/kitchen', label: 'Kitchen', roles: ['staff', 'admin'] },
  { to: '/admin', label: 'Admin', roles: ['admin'] },
  { to: '/analytics', label: 'Analytics', roles: ['admin'] },
  { to: '/reports', label: 'Reports' },
]

export default function NavBar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const visible = links.filter((l) => !l.roles || (user && l.roles.includes(user.role)))

  const linkClass = ({ isActive }) =>
    `text-sm ${isActive ? 'font-semibold underline' : 'opacity-80 hover:opacity-100'}`

  return (
    <header className="bg-emerald-900 text-white">
      <nav className="mx-auto flex max-w-4xl flex-wrap items-center gap-4 px-4 py-3">
        <img src={logo} alt="MessMeter" className="h-8 w-8" />
        <span className="mr-4 text-lg font-semibold">MessMeter</span>
        {visible.map(({ to, label }) => (
          <NavLink key={to} to={to} end={to === '/'} className={linkClass}>
            {label}
          </NavLink>
        ))}
        <div className="ml-auto flex items-center gap-3 text-sm">
          {user ? (
            <>
              <span data-testid="whoami">
                {user.name} <span className="opacity-70">({user.role})</span>
              </span>
              <button
                onClick={() => {
                  logout()
                  navigate('/login')
                }}
                className="rounded border border-white/40 px-2 py-0.5 hover:bg-white/10"
              >
                Log out
              </button>
            </>
          ) : (
            <NavLink to="/login" className={linkClass}>
              Login
            </NavLink>
          )}
        </div>
      </nav>
    </header>
  )
}
