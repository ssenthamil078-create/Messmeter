import { Link } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import { useAuth } from '../context/useAuth'

export default function HomePage() {
  const { user } = useAuth()

  return (
    <div className="space-y-8">
      <PageHeader
        title="Hostel Mess Turnout & Waste Management"
        subtitle="Students check in advance, the kitchen cooks the exact amount, and food waste is eliminated."
      />

      {/* Feature Navigation Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="flex flex-col justify-between rounded-xl border border-gray-100 bg-white p-6 shadow-sm hover:shadow-md transition">
          <div>
            <div className="mb-3 inline-block rounded-lg bg-emerald-100 p-3 text-emerald-800 text-xl font-bold">
              ✓
            </div>
            <h3 className="text-lg font-bold text-gray-900">Student Check-In</h3>
            <p className="mt-2 text-sm text-gray-600">
              Check today's breakfast, lunch, and dinner menus. Mark <strong>Eating</strong> or <strong>Skipping</strong> in one tap before the deadline.
            </p>
          </div>
          <Link
            to="/student"
            className="mt-6 inline-block rounded-lg bg-emerald-800 py-2.5 text-center text-sm font-semibold text-white hover:bg-emerald-900 transition"
          >
            {user?.role === 'student' ? 'Open Check-in Portal' : 'View Check-in Portal'}
          </Link>
        </div>

        <div className="flex flex-col justify-between rounded-xl border border-gray-100 bg-white p-6 shadow-sm hover:shadow-md transition">
          <div>
            <div className="mb-3 inline-block rounded-lg bg-blue-100 p-3 text-blue-800 text-xl font-bold">
              👨‍🍳
            </div>
            <h3 className="text-lg font-bold text-gray-900">Kitchen Operations</h3>
            <p className="mt-2 text-sm text-gray-600">
              Real-time headcount tracking for kitchen staff. View confirmed eaters and automated bulk ingredient portion targets.
            </p>
          </div>
          <Link
            to="/kitchen"
            className="mt-6 inline-block rounded-lg bg-blue-800 py-2.5 text-center text-sm font-semibold text-white hover:bg-blue-900 transition"
          >
            Open Kitchen Dashboard
          </Link>
        </div>

        <div className="flex flex-col justify-between rounded-xl border border-gray-100 bg-white p-6 shadow-sm hover:shadow-md transition">
          <div>
            <div className="mb-3 inline-block rounded-lg bg-purple-100 p-3 text-purple-800 text-xl font-bold">
              ⚙️
            </div>
            <h3 className="text-lg font-bold text-gray-900">Admin Control</h3>
            <p className="mt-2 text-sm text-gray-600">
              Schedule daily meals, configure dishes and per-student portion sizes, set cut-off deadlines, and manage user accounts.
            </p>
          </div>
          <Link
            to="/admin"
            className="mt-6 inline-block rounded-lg bg-purple-800 py-2.5 text-center text-sm font-semibold text-white hover:bg-purple-900 transition"
          >
            Open Admin Panel
          </Link>
        </div>
      </div>

      {/* Info / Value Prop Banner */}
      <div className="rounded-xl bg-emerald-900 p-6 text-white shadow-md">
        <div className="max-w-2xl">
          <h3 className="text-lg font-bold">Why MessMeter?</h3>
          <p className="mt-2 text-sm text-emerald-100 leading-relaxed">
            Standard messes discard 20–40% of prepared food on low-turnout days. By collecting real-time student intent before the cooking cut-off, MessMeter gives cooks precise batch preparation targets—saving costs, cutting waste, and ensuring fresher food for everyone.
          </p>
        </div>
      </div>
    </div>
  )
}
