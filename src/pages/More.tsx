import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { NAV } from '../components/Layout'
import { PageHeader } from '../components/ui'

export default function More() {
  return (
    <div>
      <PageHeader eyebrow="Menu" title="Lainnya" />
      <div className="grid gap-3 sm:grid-cols-2">
        {NAV.slice(4).map((n) => (
          <Link key={n.to} to={n.to} className="card flex items-center gap-4 p-4 transition hover:bg-sand/50">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-soft text-brand">
              <n.icon size={21} />
            </span>
            <span className="flex-1 font-medium">{n.label}</span>
            <ChevronRight size={18} className="text-muted" />
          </Link>
        ))}
      </div>
    </div>
  )
}
