import { NavLink } from 'react-router-dom'
import logo from '../assets/logo.svg'

const links = [
  { to: '/', label: 'Home' },
  { to: '/student', label: 'Student' },
  { to: '/kitchen', label: 'Kitchen' },
  { to: '/admin', label: 'Admin' },
  { to: '/reports', label: 'Reports' },
  { to: '/login', label: 'Login' },
]

export default function NavBar() {
  return (
    <header className="bg-emerald-900 text-white">
      <nav className="mx-auto flex max-w-4xl flex-wrap items-center gap-4 px-4 py-3">
        <img src={logo} alt="MessMeter" className="h-8 w-8" />
        <span className="mr-4 text-lg font-semibold">MessMeter</span>
        {links.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `text-sm ${isActive ? 'font-semibold underline' : 'opacity-80 hover:opacity-100'}`
            }
          >
            {label}
          </NavLink>
        ))}
      </nav>
    </header>
  )
}
