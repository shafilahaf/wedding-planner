import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, CalendarDays, Camera, Clock3, Heart, MapPin, Sparkles, Trash2 } from 'lucide-react'
import { coupleName, savingsBalance, useStore, weddingDate, type Profile } from '../store'
import { uploadImage, deleteImage } from '../lib/media'
import { Badge, Button, Card, Field, Input, Modal, Progress, MoneyInput } from '../components/ui'
import { cn, daysUntil, fmtDate, fmtLongDate, parseISODate, pct, relDay, rupiah, shortRupiah } from '../lib/utils'

export default function Dashboard() {
  const profile = useStore((s) => s.profile)
  const [editing, setEditing] = useState(false)
  const needsSetup = !profile.brideName && !profile.groomName && !weddingDate(profile)

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.35fr_1fr]">
      <div className="min-w-0 space-y-6">
        <Hero />
        {needsSetup ? <Welcome onStart={() => setEditing(true)} /> : <Details onEdit={() => setEditing(true)} />}
      </div>
      <div className="min-w-0 space-y-6">
        <Overview />
        <ThisWeek />
        <UpcomingPayments />
      </div>
      <EditProfile open={editing} onClose={() => setEditing(false)} />
    </div>
  )
}

function useCountdown(date: string, time: string) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])
  if (!date) return null
  const target = parseISODate(date)
  const [h, m] = (time || '00:00').split(':').map(Number)
  target.setHours(h || 0, m || 0, 0, 0)
  const diff = Math.max(0, target.getTime() - now)
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor(diff / 3600000) % 24,
    minutes: Math.floor(diff / 60000) % 60,
    seconds: Math.floor(diff / 1000) % 60,
    passed: diff === 0,
  }
}

function Hero() {
  const profile = useStore((s) => s.profile)
  const setProfile = useStore((s) => s.setProfile)
  const fileRef = useRef<HTMLInputElement>(null)
  const date = weddingDate(profile)
  const time = profile.akadDate ? profile.akadTime : profile.resepsiTime
  const cd = useCountdown(date, time)
  const [uploading, setUploading] = useState(false)

  const onFile = async (f?: File) => {
    if (!f) return
    setUploading(true)
    try {
      const url = await uploadImage(f, 1800, 0.82)
      deleteImage(profile.coverPhoto).catch(() => {})
      setProfile({ coverPhoto: url })
    } catch (e) {
      alert('Gagal mengunggah foto: ' + (e instanceof Error ? e.message : e))
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="relative aspect-[4/3.4] overflow-hidden rounded-[2rem] shadow-lg sm:aspect-[16/11]">
      {profile.coverPhoto ? (
        <img src={profile.coverPhoto} alt="Foto pasangan" className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-hero-from via-hero-via to-hero-to">
          <Heart className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[70%] text-white/20" size={140} fill="currentColor" />
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/70" />

      <div className="absolute inset-x-5 top-5 flex justify-between">
        <button disabled={uploading} onClick={() => fileRef.current?.click()} className="flex items-center gap-2 rounded-full bg-black/45 px-4 py-2 text-sm text-white backdrop-blur hover:bg-black/60">
          <Camera size={17} /> {uploading ? 'Mengunggah…' : profile.coverPhoto ? 'Ganti foto' : 'Tambah foto'}
        </button>
        {profile.coverPhoto && (
          <button onClick={() => {
              deleteImage(profile.coverPhoto).catch(() => {})
              setProfile({ coverPhoto: '' })
            }} className="flex h-10 w-10 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur hover:bg-black/60" aria-label="Hapus foto">
            <Trash2 size={17} />
          </button>
        )}
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => onFile(e.target.files?.[0])} />
      </div>

      <div className="absolute inset-x-4 bottom-4 sm:inset-x-6 sm:bottom-6">
        <p className="mb-3 text-center text-xs tracking-[0.35em] text-gold uppercase sm:text-sm">Hitung mundur pernikahan</p>
        {cd ? (
          cd.passed ? (
            <div className="rounded-2xl bg-black/55 py-5 text-center font-serif text-3xl text-white backdrop-blur">Selamat menempuh hidup baru ✨</div>
          ) : (
            <div className="grid grid-cols-4 divide-x divide-white/25 rounded-2xl border border-white/10 bg-black/55 py-4 text-white backdrop-blur">
              {[
                [cd.days, 'Hari'],
                [cd.hours, 'Jam'],
                [cd.minutes, 'Menit'],
                [cd.seconds, 'Detik'],
              ].map(([v, l]) => (
                <div key={l} className="text-center">
                  <p className="font-serif text-3xl tabular-nums sm:text-4xl">{v}</p>
                  <p className="mt-1 text-[11px] tracking-[0.15em] text-white/80 uppercase sm:text-xs">{l}</p>
                </div>
              ))}
            </div>
          )
        ) : (
          <div className="rounded-2xl bg-black/55 py-5 text-center text-white backdrop-blur">Atur tanggal pernikahan untuk memulai hitung mundur</div>
        )}
      </div>
    </div>
  )
}

function Welcome({ onStart }: { onStart: () => void }) {
  return (
    <Card className="p-6 md:p-8">
      <p className="eyebrow">Selamat datang</p>
      <h2 className="mt-2 font-serif text-3xl">Mari mulai rencanakan hari bahagia kalian 💍</h2>
      <p className="mt-2 text-muted">Isi nama pasangan, tanggal & lokasi acara. Setelah itu kamu bisa pakai template checklist, atur anggaran, kelola tamu undangan, dan banyak lagi.</p>
      <Button className="mt-5" onClick={onStart}>
        <Sparkles size={18} /> Isi detail pernikahan
      </Button>
    </Card>
  )
}

function Details({ onEdit }: { onEdit: () => void }) {
  const p = useStore((s) => s.profile)
  return (
    <Card className="p-6 md:p-8">
      <div className="flex items-center gap-5">
        <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-gold/40 bg-gold-soft text-gold sm:h-20 sm:w-20">
          <Heart size={30} />
        </span>
        <div className="min-w-0">
          <p className="eyebrow">Calon pengantin</p>
          <h2 className="mt-1 font-serif text-3xl sm:text-4xl">{coupleName(p)}</h2>
        </div>
      </div>
      <hr className="my-6 border-line" />
      <div className="grid gap-4 sm:grid-cols-2">
        <EventBlock title="Akad" date={p.akadDate} time={p.akadTime} venue={p.akadVenue} address={p.akadAddress} />
        <EventBlock title="Resepsi" date={p.resepsiDate} time={p.resepsiTime} venue={p.resepsiVenue} address={p.resepsiAddress} />
      </div>
      <div className="mt-5 flex justify-end">
        <Button variant="ghost" className="text-brand" onClick={onEdit}>
          Ubah detail
        </Button>
      </div>
    </Card>
  )
}

function EventBlock({ title, date, time, venue, address }: { title: string; date: string; time: string; venue: string; address: string }) {
  return (
    <div className="space-y-3 rounded-2xl border border-line bg-cream/60 p-4">
      <p className="font-serif text-xl">{title}</p>
      <p className="flex items-center gap-2.5">
        <CalendarDays size={18} className="shrink-0 text-gold" />
        <span className="font-medium">{date ? fmtLongDate(date) : <span className="text-muted">Belum diatur</span>}</span>
      </p>
      <p className="flex items-center gap-2.5">
        <Clock3 size={18} className="shrink-0 text-gold" />
        <span className="font-medium">{time || '-'}</span>
      </p>
      <div className="flex gap-2.5">
        <MapPin size={18} className="mt-0.5 shrink-0 text-gold" />
        <div className="min-w-0">
          <p className="font-medium">{venue || <span className="text-muted">Lokasi belum diatur</span>}</p>
          {address && <p className="text-sm text-muted">{address}</p>}
          {(venue || address) && (
            <a
              className="text-sm text-brand hover:underline"
              target="_blank"
              rel="noreferrer"
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([venue, address].filter(Boolean).join(', '))}`}
            >
              Buka di Maps
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

function Overview() {
  const tasks = useStore((s) => s.tasks)
  const guests = useStore((s) => s.guests)
  const expenses = useStore((s) => s.expenses)
  const profile = useStore((s) => s.profile)
  const savings = useStore((s) => s.savings)

  const done = tasks.filter((t) => t.done).length
  const spent = expenses.reduce((a, e) => a + e.paid, 0)
  const committed = expenses.reduce((a, e) => a + (e.actual || e.planned), 0)
  const attending = guests.filter((g) => g.rsvp === 'hadir').reduce((a, g) => a + g.pax, 0)
  const totalPax = guests.reduce((a, g) => a + g.pax, 0)
  const balance = savingsBalance(savings)

  const rows = [
    { to: '/checklist', label: 'Checklist', value: `${done}/${tasks.length} selesai`, p: pct(done, tasks.length) },
    { to: '/anggaran', label: 'Anggaran terpakai', value: `${shortRupiah(spent)} / ${shortRupiah(profile.totalBudget || committed)}`, p: pct(spent, profile.totalBudget || committed) },
    { to: '/undangan', label: 'Tamu hadir (RSVP)', value: `${attending}/${totalPax} orang`, p: pct(attending, totalPax) },
    { to: '/tabungan', label: 'Tabungan', value: `${shortRupiah(balance)}${profile.savingsTarget ? ' / ' + shortRupiah(profile.savingsTarget) : ''}`, p: pct(balance, profile.savingsTarget) },
  ]
  return (
    <Card className="p-6">
      <p className="eyebrow mb-4">Ringkasan persiapan</p>
      <div className="space-y-5">
        {rows.map((r) => (
          <Link key={r.to} to={r.to} className="group block">
            <div className="mb-2 flex items-baseline justify-between gap-2">
              <span className="font-medium group-hover:text-brand">{r.label}</span>
              <span className="text-sm text-muted">{r.value}</span>
            </div>
            <Progress value={r.p} />
          </Link>
        ))}
      </div>
    </Card>
  )
}

function ThisWeek() {
  const tasks = useStore((s) => s.tasks)
  const update = useStore((s) => s.update)
  const list = tasks
    .filter((t) => !t.done && t.deadline && daysUntil(t.deadline) <= 7)
    .sort((a, b) => a.deadline.localeCompare(b.deadline))
    .slice(0, 6)
  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <p className="eyebrow">This week</p>
        <Link to="/checklist" className="flex items-center gap-1 text-sm text-brand hover:underline">
          Semua <ArrowRight size={14} />
        </Link>
      </div>
      {list.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted">Tidak ada tugas dengan deadline minggu ini.</p>
      ) : (
        <ul className="space-y-1">
          {list.map((t) => {
            const late = daysUntil(t.deadline) < 0
            return (
              <li key={t.id} className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-cream">
                <input type="checkbox" className="h-5 w-5 accent-brand" checked={t.done} onChange={() => update('tasks', t.id, { done: true })} />
                <span className="min-w-0 flex-1 truncate">{t.title}</span>
                <Badge tone={late ? 'red' : 'gold'}>{relDay(t.deadline)}</Badge>
              </li>
            )
          })}
        </ul>
      )}
    </Card>
  )
}

function UpcomingPayments() {
  const expenses = useStore((s) => s.expenses)
  const list = expenses
    .filter((e) => e.dueDate && (e.actual || e.planned) - e.paid > 0)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 5)
  if (list.length === 0) return null
  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <p className="eyebrow">Pembayaran mendatang</p>
        <Link to="/anggaran" className="flex items-center gap-1 text-sm text-brand hover:underline">
          Anggaran <ArrowRight size={14} />
        </Link>
      </div>
      <ul className="space-y-3">
        {list.map((e) => {
          const late = daysUntil(e.dueDate) < 0
          return (
            <li key={e.id} className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-medium">{e.name}</p>
                <p className={cn('text-xs', late ? 'text-red-600' : 'text-muted')}>
                  {fmtDate(e.dueDate)} · {relDay(e.dueDate)}
                </p>
              </div>
              <span className="text-sm font-semibold whitespace-nowrap">{rupiah((e.actual || e.planned) - e.paid)}</span>
            </li>
          )
        })}
      </ul>
    </Card>
  )
}

export function EditProfile({ open, onClose }: { open: boolean; onClose: () => void }) {
  const profile = useStore((s) => s.profile)
  const setProfile = useStore((s) => s.setProfile)
  const [f, setF] = useState<Profile>(profile)
  useEffect(() => {
    if (open) setF(profile)
  }, [open, profile])
  const set = <K extends keyof Profile>(k: K, v: Profile[K]) => setF((x) => ({ ...x, [k]: v }))

  const save = () => {
    setProfile(f)
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Detail pernikahan"
      wide
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Batal
          </Button>
          <Button onClick={save}>Simpan</Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nama mempelai wanita">
          <Input value={f.brideName} onChange={(e) => set('brideName', e.target.value)} placeholder="Shelma" />
        </Field>
        <Field label="Nama mempelai pria">
          <Input value={f.groomName} onChange={(e) => set('groomName', e.target.value)} placeholder="Rizki" />
        </Field>

        <p className="mt-2 font-serif text-xl sm:col-span-2">Akad</p>
        <Field label="Tanggal akad">
          <Input type="date" value={f.akadDate} onChange={(e) => set('akadDate', e.target.value)} />
        </Field>
        <Field label="Jam mulai">
          <Input type="time" value={f.akadTime} onChange={(e) => set('akadTime', e.target.value)} />
        </Field>
        <Field label="Lokasi akad">
          <Input value={f.akadVenue} onChange={(e) => set('akadVenue', e.target.value)} placeholder="Masjid / gedung" />
        </Field>
        <Field label="Alamat / kota">
          <Input value={f.akadAddress} onChange={(e) => set('akadAddress', e.target.value)} placeholder="Bandung" />
        </Field>

        <p className="mt-2 font-serif text-xl sm:col-span-2">Resepsi</p>
        <Field label="Tanggal resepsi">
          <Input type="date" value={f.resepsiDate} onChange={(e) => set('resepsiDate', e.target.value)} />
        </Field>
        <Field label="Jam mulai">
          <Input type="time" value={f.resepsiTime} onChange={(e) => set('resepsiTime', e.target.value)} />
        </Field>
        <Field label="Lokasi resepsi">
          <Input value={f.resepsiVenue} onChange={(e) => set('resepsiVenue', e.target.value)} placeholder="Gedung / ballroom" />
        </Field>
        <Field label="Alamat / kota">
          <Input value={f.resepsiAddress} onChange={(e) => set('resepsiAddress', e.target.value)} />
        </Field>

        <p className="mt-2 font-serif text-xl sm:col-span-2">Keuangan</p>
        <Field label="Total anggaran">
          <MoneyInput value={f.totalBudget} onChange={(v) => set('totalBudget', v)} />
        </Field>
        <Field label="Target tabungan">
          <MoneyInput value={f.savingsTarget} onChange={(v) => set('savingsTarget', v)} />
        </Field>
      </div>
    </Modal>
  )
}
