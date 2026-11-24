/**
 * Reusable Metric Status Card component.
 * Displays a metric title, value, and optional subtitle.
 */
export default function StatusCard({ title, value, subtitle, badge }) {
  if (!title && value === undefined) return null

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-wider text-gray-500">{title}</p>
        {badge && (
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
            {badge}
          </span>
        )}
      </div>
      <p className="mt-2 text-2xl font-extrabold text-gray-900">{value ?? 0}</p>
      {subtitle && <p className="mt-1 text-xs text-gray-400">{subtitle}</p>}
    </div>
  )
}
