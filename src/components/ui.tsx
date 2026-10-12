import { useEffect, useState, type ReactNode, type ButtonHTMLAttributes, type InputHTMLAttributes } from 'react'
import { X } from 'lucide-react'
import { cn } from '../lib/utils'

type BtnVariant = 'primary' | 'soft' | 'outline' | 'ghost' | 'danger'

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant; size?: 'sm' | 'md' | 'lg' }) {
  return (
    <button
      {...props}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-full font-medium whitespace-nowrap transition active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50',
        size === 'sm' && 'px-3.5 py-1.5 text-sm',
        size === 'md' && 'px-5 py-2.5 text-[15px]',
        size === 'lg' && 'px-6 py-3 text-base',
        variant === 'primary' && 'bg-brand text-white shadow-sm hover:bg-brand-dark',
        variant === 'soft' && 'bg-sand text-ink hover:bg-line',
        variant === 'outline' && 'border border-brand/60 bg-brand-soft/40 text-brand hover:bg-brand-soft',
        variant === 'ghost' && 'text-muted hover:bg-sand hover:text-ink',
        variant === 'danger' && 'bg-red-50 text-red-700 hover:bg-red-100',
        className,
      )}
    />
  )
}

export function IconButton({ className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={cn(
        'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted transition hover:bg-sand hover:text-ink',
        className,
      )}
    />
  )
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('card', className)}>{children}</div>
}

export function PageHeader({
  eyebrow,
  title,
  icon,
  actions,
}: {
  eyebrow?: string
  title: string
  icon?: ReactNode
  actions?: ReactNode
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 md:mb-8 md:flex-row md:items-end md:justify-between">
      <div>
        {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
        <h1 className="flex items-center gap-3 font-serif text-4xl font-medium md:text-5xl">
          {icon && <span className="text-brand">{icon}</span>}
          {title}
        </h1>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

export function Field({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <label className={cn('block', className)}>
      <span className="label">{label}</span>
      {children}
    </label>
  )
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn('input', props.className)} />
}

/** Number input that shows thousand separators (Rupiah). */
export function MoneyInput({
  value,
  onChange,
  placeholder = '0',
  className,
}: {
  value: number
  onChange: (n: number) => void
  placeholder?: string
  className?: string
}) {
  return (
    <div className={cn('relative', className)}>
      <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-sm text-muted">Rp</span>
      <input
        inputMode="numeric"
        className="input pl-10"
        placeholder={placeholder}
        value={value ? value.toLocaleString('id-ID') : ''}
        onChange={(e) => onChange(Number(e.target.value.replace(/[^\d]/g, '')) || 0)}
      />
    </div>
  )
}

export function Select({
  value,
  onChange,
  options,
  className,
}: {
  value: string
  onChange: (v: string) => void
  options: (string | { value: string; label: string })[]
  className?: string
}) {
  return (
    <select className={cn('input appearance-none bg-[url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2716%27 height=%2716%27 fill=%27none%27 stroke=%27%237c6f64%27 stroke-width=%272%27 viewBox=%270 0 24 24%27%3E%3Cpath d=%27m6 9 6 6 6-6%27/%3E%3C/svg%3E")] bg-[right_0.9rem_center] bg-no-repeat pr-10', className)} value={value} onChange={(e) => onChange(e.target.value)}>
      {options.map((o) =>
        typeof o === 'string' ? (
          <option key={o} value={o}>
            {o}
          </option>
        ) : (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ),
      )}
    </select>
  )
}

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  wide,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  footer?: ReactNode
  wide?: boolean
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 backdrop-blur-[2px] sm:items-center sm:p-4" onMouseDown={onClose}>
      <div
        className={cn(
          'flex max-h-[92vh] w-full flex-col rounded-t-3xl bg-cream shadow-2xl sm:rounded-3xl',
          wide ? 'sm:max-w-2xl' : 'sm:max-w-lg',
        )}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <h2 className="font-serif text-2xl">{title}</h2>
          <IconButton onClick={onClose} aria-label="Tutup">
            <X size={20} />
          </IconButton>
        </div>
        <div className="overflow-y-auto px-6 py-5">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-line px-6 py-4">{footer}</div>}
      </div>
    </div>
  )
}

export function Empty({ icon, title, desc, action }: { icon: ReactNode; title: string; desc?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-line px-6 py-12 text-center">
      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-brand-soft text-brand">{icon}</div>
      <p className="font-serif text-xl">{title}</p>
      {desc && <p className="mt-1 max-w-sm text-sm text-muted">{desc}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function Badge({ children, tone = 'neutral', className }: { children: ReactNode; tone?: 'neutral' | 'brand' | 'green' | 'red' | 'gold' | 'blue'; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap',
        tone === 'neutral' && 'bg-sand text-muted',
        tone === 'brand' && 'bg-brand-soft text-brand',
        tone === 'green' && 'bg-sage-soft text-sage',
        tone === 'red' && 'bg-red-50 text-red-700',
        tone === 'gold' && 'bg-gold-soft text-[#9a6b12]',
        tone === 'blue' && 'bg-sky-50 text-sky-700',
        className,
      )}
    >
      {children}
    </span>
  )
}

export function Progress({ value, className, tone = 'brand' }: { value: number; className?: string; tone?: 'brand' | 'red' | 'green' }) {
  return (
    <div className={cn('h-2 overflow-hidden rounded-full bg-sand', className)}>
      <div
        className={cn('h-full rounded-full transition-all', tone === 'brand' && 'bg-brand', tone === 'red' && 'bg-red-500', tone === 'green' && 'bg-sage')}
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  )
}

export function StatCard({ label, value, sub, accent }: { label: string; value: ReactNode; sub?: ReactNode; accent?: boolean }) {
  return (
    <Card className="h-full p-5 md:p-6">
      <p className="eyebrow">{label}</p>
      <p className={cn('mt-3 font-serif text-[1.7rem] leading-tight', accent && 'text-brand')}>{value}</p>
      {sub && <div className="mt-1.5 text-sm text-muted">{sub}</div>}
    </Card>
  )
}

export function Chips<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T
  onChange: (v: T) => void
  options: { value: T; label: string }[]
}) {
  return (
    <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            'rounded-full px-4 py-2 text-sm font-medium tracking-wide whitespace-nowrap transition',
            value === o.value ? 'bg-brand text-white' : 'bg-sand text-muted hover:bg-line',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

/** Small hook for "edit or create" modal forms. */
export function useForm<T>(initial: T) {
  const [form, setForm] = useState<T>(initial)
  const set = <K extends keyof T>(k: K, v: T[K]) => setForm((f) => ({ ...f, [k]: v }))
  return { form, setForm, set }
}

export function confirmDelete(what = 'item ini') {
  return window.confirm(`Hapus ${what}? Tindakan ini tidak bisa dibatalkan.`)
}
