export default function PageHeader({ title, subtitle }) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold text-emerald-900">{title}</h1>
      {subtitle && <p className="mt-1 text-gray-600">{subtitle}</p>}
    </div>
  )
}
