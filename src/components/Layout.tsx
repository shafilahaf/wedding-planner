import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  Bell,
  Clock,
  Coins,
  Gift,
  Heart,
  LayoutGrid,
  MailCheck,
  Menu,
  NotebookPen,
  Palette,
  PiggyBank,
  Settings,
  SquareCheckBig,
  Store,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import { coupleName, savingsBalance, useStore, weddingDate } from '../store'
import { useSync } from '../lib/sync'
import { cn, daysUntil, fmtDate, relDay, rupiah, todayISO } from '../lib/utils'

export const NAV = [
  { to: '/', label: 'Beranda', icon: LayoutGrid },
  { to: '/undangan', label: 'Undangan', icon: MailCheck },
  { to: '/checklist', label: 'Checklist', icon: SquareCheckBig },
  { to: '/anggaran', label: 'Anggaran', icon: Wallet },
  { to: '/vendor', label: 'Vendor', icon: Store },
  { to: '/moodboard', label: 'Moodboard', icon: Palette },
  { to: '/rundown', label: 'Rundown', icon: Clock },
  { to: '/seserahan', label: 'Seserahan & Mahar', icon: Gift },
  { to: '/tabungan', label: 'Tabungan', icon: PiggyBank },
  { to: '/catatan', label: 'Catatan', icon: NotebookPen },
  { to: '/pengaturan', label: 'Pengaturan', icon: Settings },
]

const MOBILE_NAV = [...NAV.slice(0, 4), { to: '/lainnya', label: 'Lainnya', icon: Menu }]

export default function Layout() {
  const profile = useStore((s) => s.profile)
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  const current = NAV.find((n) => (n.to === '/' ? pathname === '/' : pathname.startsWith(n.to)))
  useEffect(() => {
    document.title = `${current?.label ?? 'Lainnya'} · ${coupleName(profile)} Wedding Planner`
  }, [current, profile])

  return (
    <div className="min-h-screen md:flex">
      {/* Sidebar (desktop) */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-line bg-white/60 px-4 py-6 md:flex">
        <Link to="/" className="mb-8 flex items-center gap-3 px-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand text-white">
            <Heart size={20} fill="currentColor" />
          </span>
          <span>
            <span className="block font-serif text-xl leading-tight">{coupleName(profile)}</span>
            <span className="text-xs text-muted">Wedding Planner</span>
          </span>
        </Link>
        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-medium transition',
                  isActive ? 'bg-brand-soft text-brand' : 'text-muted hover:bg-sand hover:text-ink',
                )
              }
            >
              <n.icon size={19} />
              {n.label}
            </NavLink>
          ))}
        </nav>
        <CountdownMini />
      </aside>

      <div className="min-w-0 flex-1">
        <TopBar title={current?.label ?? 'Lainnya'} />
        <main className="mx-auto w-full max-w-6xl px-4 pt-6 pb-28 sm:px-6 md:px-10 md:pt-10 md:pb-16">
          <Outlet />
        </main>
      </div>

      {/* Bottom nav (mobile) */}
      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-line bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
        {MOBILE_NAV.map((n) => {
          const active =
            n.to === '/'
              ? pathname === '/'
              : n.to === '/lainnya'
                ? !MOBILE_NAV.slice(0, 4).some((m) => (m.to === '/' ? pathname === '/' : pathname.startsWith(m.to)))
                : pathname.startsWith(n.to)
          return (
            <Link key={n.to} to={n.to} className={cn('flex flex-col items-center gap-1 py-2.5 text-xs font-medium', active ? 'text-brand' : 'text-muted')}>
              <n.icon size={24} strokeWidth={1.6} />
              {n.label}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}

function CountdownMini() {
  const profile = useStore((s) => s.profile)
  const date = weddingDate(profile)
  if (!date) return null
  const d = daysUntil(date)
  return (
    <div className="mt-4 rounded-2xl bg-brand-soft/60 p-4">
      <p className="eyebrow">Hari H</p>
      <p className="mt-1 font-serif text-3xl text-brand">{d > 0 ? `${d} hari` : d === 0 ? 'Hari ini!' : 'Sudah menikah'}</p>
      <p className="text-sm text-muted">{fmtDate(date, { day: 'numeric', month: 'long', year: 'numeric' })}</p>
    </div>
  )
}

function TopBar({ title }: { title: string }) {
  const savings = useStore((s) => s.savings)
  const balance = savingsBalance(savings)

  // Growth this month relative to the balance at the start of the month.
  const monthKey = todayISO().slice(0, 7)
  const thisMonth = savings.filter((t) => t.date.startsWith(monthKey)).reduce((a, t) => a + t.amount, 0)
  const before = balance - thisMonth
  const growth = before > 0 ? (thisMonth / before) * 100 : 0

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-cream/90 pt-[env(safe-area-inset-top)] backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-6 md:px-10">
        <p className="min-w-0 flex-1 truncate font-serif text-2xl md:text-3xl">{title}</p>
        <Link
          to="/tabungan"
          className="flex items-center gap-2 rounded-full border border-gold/50 bg-gold-soft py-1.5 pr-1.5 pl-2 shadow-sm transition hover:border-gold"
          title="Tabungan nikah"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gold/25 text-[#9a6b12]">
            <Coins size={16} />
          </span>
          <span className="text-sm font-semibold text-[#9a5a12] sm:text-base">{rupiah(balance)}</span>
          {growth !== 0 && (
            <span
              className={cn(
                'hidden items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold sm:flex',
                growth > 0 ? 'bg-sage-soft text-sage' : 'bg-red-50 text-red-700',
              )}
            >
              {growth > 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
              {growth > 0 ? '+' : ''}
              {growth.toLocaleString('id-ID', { maximumFractionDigits: 2 })}%
            </span>
          )}
        </Link>
        <SyncDot />
        <Notifications />
      </div>
    </header>
  )
}

function SyncDot() {
  const { status, error } = useSync()
  const label = status === 'offline' ? `Belum tersinkron: ${error || 'offline'}` : status === 'saving' || status === 'loading' ? 'Menyimpan…' : 'Tersimpan di cloud'
  return (
    <Link to="/pengaturan" title={label} aria-label={label} className="hidden h-11 w-6 items-center justify-center sm:flex">
      <span className={cn('h-2.5 w-2.5 rounded-full', status === 'offline' ? 'bg-red-500' : status === 'saved' ? 'bg-sage' : 'animate-pulse bg-gold')} />
    </Link>
  )
}

interface Notif {
  id: string
  title: string
  sub: string
  to: string
  urgent: boolean
}

function useNotifications(): Notif[] {
  const tasks = useStore((s) => s.tasks)
  const expenses = useStore((s) => s.expenses)
  const guests = useStore((s) => s.guests)
  const profile = useStore((s) => s.profile)

  return useMemo(() => {
    const list: Notif[] = []
    for (const t of tasks) {
      if (t.done || !t.deadline) continue
      const d = daysUntil(t.deadline)
      if (d <= 7)
        list.push({
          id: 't' + t.id,
          title: t.title,
          sub: d < 0 ? `Terlambat · ${relDay(t.deadline)}` : `Deadline ${relDay(t.deadline).toLowerCase()}`,
          to: '/checklist',
          urgent: d < 0,
        })
    }
    for (const e of expenses) {
      const remaining = Math.max(e.actual || e.planned, 0) - e.paid
      if (!e.dueDate || remaining <= 0) continue
      const d = daysUntil(e.dueDate)
      if (d <= 14)
        list.push({
          id: 'e' + e.id,
          title: `Bayar ${e.name}`,
          sub: `${rupiah(remaining)} · ${relDay(e.dueDate)}`,
          to: '/anggaran',
          urgent: d < 0,
        })
    }
    const wd = weddingDate(profile)
    const unsent = guests.filter((g) => !g.sent).length
    if (wd && unsent > 0 && daysUntil(wd) <= 45 && daysUntil(wd) >= 0)
      list.push({ id: 'g', title: `${unsent} undangan belum dikirim`, sub: `Hari H ${relDay(wd).toLowerCase()}`, to: '/undangan', urgent: false })
    return list.sort((a, b) => Number(b.urgent) - Number(a.urgent))
  }, [tasks, expenses, guests, profile])
}

function Notifications() {
  const items = useNotifications()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false)
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative flex h-11 w-11 items-center justify-center rounded-full border border-line bg-white shadow-sm transition hover:bg-sand"
        aria-label="Notifikasi"
      >
        <Bell size={20} />
        {items.length > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose px-1 text-[11px] font-bold text-white">
            {items.length}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-line bg-white shadow-xl">
          <p className="border-b border-line px-4 py-3 font-semibold">Pengingat</p>
          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 && <p className="px-4 py-8 text-center text-sm text-muted">Semua aman. Tidak ada pengingat 🎉</p>}
            {items.map((n) => (
              <Link key={n.id} to={n.to} onClick={() => setOpen(false)} className="flex gap-3 border-b border-line/60 px-4 py-3 last:border-0 hover:bg-cream">
                <span className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', n.urgent ? 'bg-red-500' : 'bg-gold')} />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{n.title}</span>
                  <span className={cn('text-xs', n.urgent ? 'text-red-600' : 'text-muted')}>{n.sub}</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
