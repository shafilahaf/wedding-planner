import { useMemo, useState } from 'react'
import { CalendarDays, Pencil, Plus, Search, Sparkles, SquareCheckBig, Trash2 } from 'lucide-react'
import { useStore, weddingDate, type Priority, type Task } from '../store'
import { Badge, Button, Card, Chips, confirmDelete, Empty, Field, IconButton, Input, Modal, PageHeader, Progress, Select } from '../components/ui'
import { CHECKLIST_CATEGORIES, CHECKLIST_TEMPLATE } from '../lib/templates'
import { addDays, cn, daysUntil, fmtDate, pct, relDay, todayISO } from '../lib/utils'

const PRIORITIES: { value: Priority; label: string }[] = [
  { value: 'tinggi', label: 'Tinggi' },
  { value: 'sedang', label: 'Sedang' },
  { value: 'rendah', label: 'Rendah' },
]
const PRIO_RANK: Record<Priority, number> = { tinggi: 0, sedang: 1, rendah: 2 }
const PRIO_TONE = { tinggi: 'red', sedang: 'gold', rendah: 'blue' } as const

type Status = 'semua' | 'belum' | 'selesai' | 'terlambat'
type Sort = 'deadline' | 'prioritas' | 'terbaru' | 'abjad'

const blank = (): Omit<Task, 'id'> => ({ title: '', category: 'Planning', deadline: '', priority: 'sedang', done: false, notes: '', createdAt: Date.now() })

export default function Checklist() {
  const tasks = useStore((s) => s.tasks)
  const profile = useStore((s) => s.profile)
  const { add, addMany, update, remove } = useStore()

  const [form, setForm] = useState(blank())
  const [status, setStatus] = useState<Status>('semua')
  const [prio, setPrio] = useState('semua')
  const [cat, setCat] = useState('semua')
  const [sort, setSort] = useState<Sort>('deadline')
  const [q, setQ] = useState('')
  const [editing, setEditing] = useState<Task | null>(null)
  const [tplOpen, setTplOpen] = useState(false)

  const done = tasks.filter((t) => t.done).length

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) return
    add('tasks', { ...form, title: form.title.trim(), createdAt: Date.now() })
    setForm({ ...blank(), category: form.category })
  }

  const list = useMemo(() => {
    let l = tasks.filter((t) => {
      if (status === 'belum' && t.done) return false
      if (status === 'selesai' && !t.done) return false
      if (status === 'terlambat' && (t.done || !t.deadline || daysUntil(t.deadline) >= 0)) return false
      if (prio !== 'semua' && t.priority !== prio) return false
      if (cat !== 'semua' && t.category !== cat) return false
      if (q && !t.title.toLowerCase().includes(q.toLowerCase())) return false
      return true
    })
    l = [...l].sort((a, b) => {
      if (sort === 'deadline') return (a.deadline || '9999').localeCompare(b.deadline || '9999') || PRIO_RANK[a.priority] - PRIO_RANK[b.priority]
      if (sort === 'prioritas') return PRIO_RANK[a.priority] - PRIO_RANK[b.priority] || (a.deadline || '9999').localeCompare(b.deadline || '9999')
      if (sort === 'terbaru') return b.createdAt - a.createdAt
      return a.title.localeCompare(b.title)
    })
    // Keep finished tasks at the bottom
    return [...l.filter((t) => !t.done), ...l.filter((t) => t.done)]
  }, [tasks, status, prio, cat, sort, q])

  const applyTemplate = () => {
    const wd = weddingDate(profile)
    const existing = new Set(tasks.map((t) => t.title.toLowerCase()))
    // The template spans 12 months. With less time left, compress everything
    // earlier than H-30 into the remaining window so nothing starts overdue.
    const left = wd ? daysUntil(wd) : 365
    const scale = Math.max(0, Math.min(1, (left - 30) / (365 - 30)))
    const deadlineFor = (offset: number) => {
      if (!wd) return ''
      const o = offset >= -30 ? offset : Math.round(-30 + (offset + 30) * scale)
      const d = addDays(wd, o)
      return d < todayISO() ? todayISO() : d
    }
    const items = CHECKLIST_TEMPLATE.filter((t) => !existing.has(t.title.toLowerCase())).map((t, i) => ({
      title: t.title,
      category: t.category,
      priority: t.priority,
      deadline: deadlineFor(t.offset),
      done: false,
      notes: '',
      createdAt: Date.now() + i,
    }))
    addMany('tasks', items)
    setTplOpen(false)
  }

  const categories = Array.from(new Set([...CHECKLIST_CATEGORIES, ...tasks.map((t) => t.category)]))

  return (
    <div>
      <PageHeader
        eyebrow="Persiapan"
        title="Checklist"
        icon={<SquareCheckBig size={38} strokeWidth={1.6} />}
        actions={
          <>
            <Button variant="outline" onClick={() => setTplOpen(true)}>
              <Sparkles size={17} /> Pakai Template
            </Button>
            <Badge className="px-4 py-2 text-sm text-ink">
              {done} / {tasks.length} selesai
            </Badge>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[360px_1fr]">
        <div className="space-y-6">
          <Card className="border-brand/20 bg-brand-soft/20 p-6 lg:sticky lg:top-24">
            <form onSubmit={submit} className="space-y-4">
              <Field label="Judul">
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Misal: Pesan katering" />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Kategori">
                  <Select value={form.category} onChange={(v) => setForm({ ...form, category: v })} options={categories} />
                </Field>
                <Field label="Prioritas">
                  <Select value={form.priority} onChange={(v) => setForm({ ...form, priority: v as Priority })} options={PRIORITIES} />
                </Field>
              </div>
              <Field label="Deadline">
                <Input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
              </Field>
              <Button type="submit" className="w-full rounded-xl" size="lg">
                <Plus size={20} /> Tambah
              </Button>
              <p className="text-sm text-muted">Tip: Tentukan deadline agar tugas muncul di dashboard "This week" & pengingat.</p>
            </form>
            <div className="mt-6 border-t border-line pt-5">
              <div className="mb-2 flex justify-between text-sm">
                <span className="font-medium">Progress</span>
                <span className="text-muted">{pct(done, tasks.length)}%</span>
              </div>
              <Progress value={pct(done, tasks.length)} />
            </div>
          </Card>
        </div>

        <div className="min-w-0">
          <div className="mb-4 space-y-3">
            <Chips
              value={status}
              onChange={setStatus}
              options={[
                { value: 'semua', label: 'Semua' },
                { value: 'belum', label: 'Belum' },
                { value: 'terlambat', label: 'Terlambat' },
                { value: 'selesai', label: 'Selesai' },
              ]}
            />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="relative col-span-2 sm:col-span-1">
                <Search size={17} className="absolute top-1/2 left-3.5 -translate-y-1/2 text-muted" />
                <Input className="pl-10" placeholder="Cari tugas" value={q} onChange={(e) => setQ(e.target.value)} />
              </div>
              <Select value={prio} onChange={setPrio} options={[{ value: 'semua', label: 'Semua prioritas' }, ...PRIORITIES]} />
              <Select value={cat} onChange={setCat} options={[{ value: 'semua', label: 'Semua kategori' }, ...categories]} />
              <Select
                value={sort}
                onChange={(v) => setSort(v as Sort)}
                options={[
                  { value: 'deadline', label: 'Tanggal terdekat' },
                  { value: 'prioritas', label: 'Prioritas' },
                  { value: 'terbaru', label: 'Terbaru' },
                  { value: 'abjad', label: 'Abjad' },
                ]}
              />
            </div>
          </div>

          {tasks.length === 0 ? (
            <Empty
              icon={<SquareCheckBig />}
              title="Belum ada tugas"
              desc="Tambahkan tugas sendiri atau pakai template checklist pernikahan lengkap (39 tugas) yang deadline-nya otomatis menyesuaikan tanggal pernikahan."
              action={
                <Button variant="outline" onClick={() => setTplOpen(true)}>
                  <Sparkles size={17} /> Pakai Template
                </Button>
              }
            />
          ) : list.length === 0 ? (
            <p className="py-10 text-center text-muted">Tidak ada tugas yang cocok dengan filter.</p>
          ) : (
            <Card className="divide-y divide-line">
              {list.map((t) => {
                const d = t.deadline ? daysUntil(t.deadline) : null
                const late = !t.done && d !== null && d < 0
                return (
                  <div key={t.id} className="group flex items-start gap-3 px-4 py-3.5 sm:px-5">
                    <input type="checkbox" className="mt-1 h-5 w-5 shrink-0 cursor-pointer accent-brand" checked={t.done} onChange={() => update('tasks', t.id, { done: !t.done })} />
                    <button className="min-w-0 flex-1 text-left" onClick={() => setEditing(t)}>
                      <p className={cn('font-medium', t.done && 'text-muted line-through')}>{t.title}</p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        <Badge>{t.category}</Badge>
                        <Badge tone={PRIO_TONE[t.priority]}>{t.priority}</Badge>
                        {t.deadline && (
                          <span className={cn('flex items-center gap-1 text-xs', late ? 'font-medium text-red-600' : 'text-muted')}>
                            <CalendarDays size={13} /> {fmtDate(t.deadline)} {!t.done && `· ${relDay(t.deadline)}`}
                          </span>
                        )}
                      </div>
                      {t.notes && <p className="mt-1.5 line-clamp-2 text-sm text-muted">{t.notes}</p>}
                    </button>
                    <div className="flex opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100">
                      <IconButton onClick={() => setEditing(t)} aria-label="Ubah">
                        <Pencil size={16} />
                      </IconButton>
                      <IconButton onClick={() => confirmDelete('tugas ini') && remove('tasks', t.id)} aria-label="Hapus">
                        <Trash2 size={16} />
                      </IconButton>
                    </div>
                  </div>
                )
              })}
            </Card>
          )}
        </div>
      </div>

      <Modal
        open={tplOpen}
        onClose={() => setTplOpen(false)}
        title="Template checklist"
        footer={
          <>
            <Button variant="ghost" onClick={() => setTplOpen(false)}>
              Batal
            </Button>
            <Button onClick={applyTemplate}>Tambahkan {CHECKLIST_TEMPLATE.length} tugas</Button>
          </>
        }
      >
        <p className="text-muted">
          Template berisi {CHECKLIST_TEMPLATE.length} tugas persiapan pernikahan dari 12 bulan sebelum hari H sampai setelah acara (konsep, venue, vendor, KUA, seserahan, undangan, gladi resik, dll).
        </p>
        <p className="mt-3 text-muted">
          {weddingDate(profile)
            ? `Deadline otomatis dihitung dari tanggal pernikahan (${fmtDate(weddingDate(profile))}), dan dipadatkan kalau waktunya kurang dari setahun.`
            : 'Tanggal pernikahan belum diatur, jadi tugas akan ditambahkan tanpa deadline. Atur tanggal di Beranda agar deadline otomatis terisi.'}
        </p>
        <p className="mt-3 text-sm text-muted">Tugas dengan judul yang sama tidak akan diduplikasi.</p>
      </Modal>

      {editing && <TaskEditor key={editing.id} task={editing} categories={categories} onClose={() => setEditing(null)} />}
    </div>
  )
}

function TaskEditor({ task, categories, onClose }: { task: Task; categories: string[]; onClose: () => void }) {
  const { update, remove } = useStore()
  const [f, setF] = useState<Task>(task)

  const save = () => {
    update('tasks', f.id, f)
    onClose()
  }
  return (
    <Modal
      open
      onClose={onClose}
      title="Ubah tugas"
      footer={
        <>
          <Button variant="danger" className="mr-auto" onClick={() => confirmDelete('tugas ini') && (remove('tasks', f.id), onClose())}>
            <Trash2 size={16} /> Hapus
          </Button>
          <Button onClick={save}>Simpan</Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Judul">
          <Input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Kategori">
            <Select value={f.category} onChange={(v) => setF({ ...f, category: v })} options={categories} />
          </Field>
          <Field label="Prioritas">
            <Select value={f.priority} onChange={(v) => setF({ ...f, priority: v as Priority })} options={PRIORITIES} />
          </Field>
        </div>
        <Field label="Deadline">
          <Input type="date" value={f.deadline} onChange={(e) => setF({ ...f, deadline: e.target.value })} />
        </Field>
        <Field label="Catatan">
          <textarea className="input min-h-24" value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} placeholder="Detail, kontak, link, dll" />
        </Field>
        <label className="flex items-center gap-2">
          <input type="checkbox" className="h-5 w-5 accent-brand" checked={f.done} onChange={(e) => setF({ ...f, done: e.target.checked })} />
          Sudah selesai
        </label>
      </div>
    </Modal>
  )
}
