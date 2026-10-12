import { useMemo, useState } from 'react'
import { Download, Pencil, Plus, Trash2, Wallet, Wand2 } from 'lucide-react'
import { useStore, type Expense } from '../store'
import { Badge, Button, Card, Chips, confirmDelete, Empty, Field, IconButton, Input, Modal, MoneyInput, PageHeader, Progress, Select, StatCard } from '../components/ui'
import { BUDGET_CATEGORIES } from '../lib/templates'
import { cn, daysUntil, downloadFile, fmtDate, pct, relDay, rupiah, toCSV } from '../lib/utils'

const cost = (e: Expense) => e.actual || e.planned
const status = (e: Expense) => (cost(e) > 0 && e.paid >= cost(e) ? 'lunas' : e.paid > 0 ? 'dp' : 'belum')
const STATUS_LABEL = { lunas: 'Lunas', dp: 'DP', belum: 'Belum bayar' } as const
const STATUS_TONE = { lunas: 'green', dp: 'gold', belum: 'neutral' } as const

export default function Budget() {
  const expenses = useStore((s) => s.expenses)
  const categories = useStore((s) => s.budgetCategories)
  const vendors = useStore((s) => s.vendors)
  const profile = useStore((s) => s.profile)
  const { setProfile, update, remove, add } = useStore()

  const [editing, setEditing] = useState<Expense | 'new' | null>(null)
  const [filter, setFilter] = useState<'semua' | 'belum' | 'dp' | 'lunas'>('semua')
  const [catOpen, setCatOpen] = useState(false)
  const [budgetOpen, setBudgetOpen] = useState(false)

  const planned = expenses.reduce((a, e) => a + e.planned, 0)
  const committed = expenses.reduce((a, e) => a + cost(e), 0)
  const paid = expenses.reduce((a, e) => a + e.paid, 0)
  const total = profile.totalBudget

  const byCategory = useMemo(
    () =>
      categories.map((c) => {
        const items = expenses.filter((e) => e.category === c.name)
        return {
          ...c,
          planned: items.reduce((a, e) => a + cost(e), 0),
          paid: items.reduce((a, e) => a + e.paid, 0),
          count: items.length,
        }
      }),
    [categories, expenses],
  )

  const filtered = expenses.filter((e) => filter === 'semua' || status(e) === filter)

  const exportCSV = () => {
    const rows = [
      ['Item', 'Kategori', 'Rencana', 'Aktual', 'Dibayar', 'Sisa bayar', 'Jatuh tempo', 'Status', 'Catatan'],
      ...expenses.map((e) => [e.name, e.category, e.planned, e.actual, e.paid, cost(e) - e.paid, e.dueDate, STATUS_LABEL[status(e)], e.notes]),
    ]
    downloadFile('anggaran-pernikahan.csv', toCSV(rows), 'text/csv')
  }

  return (
    <div>
      <PageHeader
        eyebrow="Keuangan · IDR"
        title="Perencanaan anggaran"
        actions={
          <>
            <Button onClick={() => setEditing('new')}>
              <Plus size={18} /> Tambah pengeluaran
            </Button>
            {expenses.length > 0 && (
              <Button variant="soft" onClick={exportCSV}>
                <Download size={17} /> CSV
              </Button>
            )}
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <button className="h-full text-left" onClick={() => setBudgetOpen(true)}>
          <StatCard label="Total anggaran" value={rupiah(total)} sub={<span className="text-brand">Ubah target ›</span>} />
        </button>
        <StatCard label="Rencana" value={rupiah(committed)} sub={planned !== committed ? `Estimasi awal ${rupiah(planned)}` : total ? `${pct(committed, total)}% dari anggaran` : undefined} />
        <StatCard label="Terpakai" value={rupiah(paid)} accent sub={`Belum dibayar ${rupiah(committed - paid)}`} />
        <StatCard
          label="Sisa"
          value={<span className={cn(total - committed < 0 && 'text-red-600')}>{rupiah(total - paid)}</span>}
          sub={total ? (total - committed < 0 ? `Over budget ${rupiah(committed - total)}` : `Belum dialokasikan ${rupiah(total - committed)}`) : 'Atur total anggaran'}
        />
      </div>

      {total > 0 && (
        <Card className="mt-4 p-5">
          <div className="mb-2 flex justify-between text-sm">
            <span className="font-medium">Pemakaian anggaran</span>
            <span className="text-muted">{pct(paid, total)}% terbayar · {pct(committed, total)}% direncanakan</span>
          </div>
          <div className="relative h-3 overflow-hidden rounded-full bg-sand">
            <div className="absolute inset-y-0 left-0 rounded-full bg-brand/30" style={{ width: `${pct(committed, total)}%` }} />
            <div className="absolute inset-y-0 left-0 rounded-full bg-brand" style={{ width: `${pct(paid, total)}%` }} />
          </div>
        </Card>
      )}

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">
        <div className="min-w-0">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="font-serif text-2xl">Pengeluaran</h2>
          </div>
          <div className="mb-4">
            <Chips
              value={filter}
              onChange={setFilter}
              options={[
                { value: 'semua', label: `Semua (${expenses.length})` },
                { value: 'belum', label: 'Belum bayar' },
                { value: 'dp', label: 'DP' },
                { value: 'lunas', label: 'Lunas' },
              ]}
            />
          </div>
          {expenses.length === 0 ? (
            <Empty icon={<Wallet />} title="Belum ada pengeluaran" desc="Catat setiap item biaya: estimasi, harga deal, DP dan pelunasan." action={<Button onClick={() => setEditing('new')}>Tambah pengeluaran</Button>} />
          ) : (
            <Card className="divide-y divide-line">
              {filtered.map((e) => {
                const st = status(e)
                const remaining = cost(e) - e.paid
                const late = e.dueDate && remaining > 0 && daysUntil(e.dueDate) < 0
                return (
                  <div key={e.id} className="group flex items-start gap-3 px-4 py-4 sm:px-5">
                    <button className="min-w-0 flex-1 text-left" onClick={() => setEditing(e)}>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium">{e.name}</p>
                        <Badge tone={STATUS_TONE[st]}>{STATUS_LABEL[st]}</Badge>
                      </div>
                      <p className="mt-0.5 text-sm text-muted">
                        {e.category}
                        {e.vendorId && vendors.find((v) => v.id === e.vendorId) && ` · ${vendors.find((v) => v.id === e.vendorId)!.name}`}
                      </p>
                      {e.dueDate && remaining > 0 && (
                        <p className={cn('mt-0.5 text-xs', late ? 'font-medium text-red-600' : 'text-muted')}>
                          Jatuh tempo {fmtDate(e.dueDate)} · {relDay(e.dueDate)}
                        </p>
                      )}
                      {cost(e) > 0 && <Progress className="mt-2 h-1.5 max-w-xs" value={pct(e.paid, cost(e))} tone={st === 'lunas' ? 'green' : 'brand'} />}
                    </button>
                    <div className="text-right">
                      <p className="font-semibold whitespace-nowrap">{rupiah(cost(e))}</p>
                      {remaining > 0 && e.paid > 0 && <p className="text-xs whitespace-nowrap text-muted">sisa {rupiah(remaining)}</p>}
                      {e.actual > 0 && e.planned > 0 && e.actual !== e.planned && (
                        <p className={cn('text-xs whitespace-nowrap', e.actual > e.planned ? 'text-red-600' : 'text-sage')}>
                          {e.actual > e.planned ? '+' : '-'}
                          {rupiah(Math.abs(e.actual - e.planned))} vs estimasi
                        </p>
                      )}
                    </div>
                    <IconButton className="sm:opacity-0 sm:group-hover:opacity-100" onClick={() => confirmDelete(e.name) && remove('expenses', e.id)} aria-label="Hapus">
                      <Trash2 size={16} />
                    </IconButton>
                  </div>
                )
              })}
              {filtered.length === 0 && <p className="py-8 text-center text-muted">Tidak ada item.</p>}
            </Card>
          )}
        </div>

        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-serif text-2xl">Per kategori</h2>
            <Button variant="ghost" size="sm" onClick={() => setCatOpen(true)}>
              <Pencil size={15} /> Atur
            </Button>
          </div>
          <Card className="space-y-5 p-5">
            {byCategory.map((c) => {
              const ref = c.allocation || c.planned
              const over = c.allocation > 0 && c.planned > c.allocation
              return (
                <div key={c.id}>
                  <div className="mb-1.5 flex items-baseline justify-between gap-2">
                    <span className="font-medium">{c.name}</span>
                    <span className={cn('text-xs', over ? 'text-red-600' : 'text-muted')}>
                      {rupiah(c.planned)}
                      {c.allocation > 0 && ` / ${rupiah(c.allocation)}`}
                    </span>
                  </div>
                  <div className="relative h-2 overflow-hidden rounded-full bg-sand">
                    <div className={cn('absolute inset-y-0 left-0 rounded-full', over ? 'bg-red-300' : 'bg-brand/30')} style={{ width: `${pct(c.planned, ref)}%` }} />
                    <div className={cn('absolute inset-y-0 left-0 rounded-full', over ? 'bg-red-500' : 'bg-brand')} style={{ width: `${pct(c.paid, ref)}%` }} />
                  </div>
                </div>
              )
            })}
            <p className="text-xs text-muted">Batang gelap = sudah dibayar, terang = direncanakan. Atur alokasi per kategori agar ketahuan kalau over budget.</p>
          </Card>
        </div>
      </div>

      {editing && (
        <ExpenseEditor
          key={editing === 'new' ? 'new' : editing.id}
          expense={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSave={(e) => (editing === 'new' ? add('expenses', e) : update('expenses', editing.id, e))}
        />
      )}
      {catOpen && <CategoryEditor onClose={() => setCatOpen(false)} />}
      {budgetOpen && <BudgetTarget value={total} onClose={() => setBudgetOpen(false)} onSave={(v) => setProfile({ totalBudget: v })} />}
    </div>
  )
}

function BudgetTarget({ value, onClose, onSave }: { value: number; onClose: () => void; onSave: (v: number) => void }) {
  const [v, setV] = useState(value)
  return (
    <Modal
      open
      onClose={onClose}
      title="Total anggaran"
      footer={
        <Button
          onClick={() => {
            onSave(v)
            onClose()
          }}
        >
          Simpan
        </Button>
      }
    >
      <Field label="Target keseluruhan biaya pernikahan">
        <MoneyInput value={v} onChange={setV} />
      </Field>
    </Modal>
  )
}

function ExpenseEditor({ expense, onClose, onSave }: { expense: Expense | null; onClose: () => void; onSave: (e: Omit<Expense, 'id'>) => void }) {
  const categories = useStore((s) => s.budgetCategories)
  const vendors = useStore((s) => s.vendors)
  const [f, setF] = useState<Omit<Expense, 'id'>>(
    expense ?? { name: '', category: categories[0]?.name ?? 'Lain-lain', planned: 0, actual: 0, paid: 0, dueDate: '', vendorId: '', notes: '' },
  )
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((x) => ({ ...x, [k]: v }))
  const total = f.actual || f.planned

  return (
    <Modal
      open
      onClose={onClose}
      title={expense ? 'Ubah pengeluaran' : 'Tambah pengeluaran'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Batal
          </Button>
          <Button
            disabled={!f.name.trim()}
            onClick={() => {
              onSave({ ...f, name: f.name.trim() })
              onClose()
            }}
          >
            Simpan
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nama item" className="sm:col-span-2">
          <Input value={f.name} onChange={(e) => set('name', e.target.value)} placeholder="Misal: Katering 500 pax" autoFocus />
        </Field>
        <Field label="Kategori">
          <Select value={f.category} onChange={(v) => set('category', v)} options={categories.map((c) => c.name)} />
        </Field>
        <Field label="Vendor (opsional)">
          <Select value={f.vendorId} onChange={(v) => set('vendorId', v)} options={[{ value: '', label: '-' }, ...vendors.map((v) => ({ value: v.id, label: v.name }))]} />
        </Field>
        <Field label="Estimasi biaya">
          <MoneyInput value={f.planned} onChange={(v) => set('planned', v)} />
        </Field>
        <Field label="Harga deal / aktual">
          <MoneyInput value={f.actual} onChange={(v) => set('actual', v)} />
        </Field>
        <Field label="Sudah dibayar">
          <MoneyInput value={f.paid} onChange={(v) => set('paid', v)} />
        </Field>
        <Field label="Jatuh tempo pembayaran">
          <Input type="date" value={f.dueDate} onChange={(e) => set('dueDate', e.target.value)} />
        </Field>
        {total > 0 && (
          <div className="flex flex-wrap gap-2 sm:col-span-2">
            <Button size="sm" variant="soft" onClick={() => set('paid', Math.round(total * 0.3))}>
              DP 30%
            </Button>
            <Button size="sm" variant="soft" onClick={() => set('paid', Math.round(total * 0.5))}>
              DP 50%
            </Button>
            <Button size="sm" variant="soft" onClick={() => set('paid', total)}>
              Lunas
            </Button>
            <span className="self-center text-sm text-muted">Sisa: {rupiah(Math.max(0, total - f.paid))}</span>
          </div>
        )}
        <Field label="Catatan" className="sm:col-span-2">
          <textarea className="input min-h-20" value={f.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Rincian paket, no. rekening, dll" />
        </Field>
      </div>
    </Modal>
  )
}

function CategoryEditor({ onClose }: { onClose: () => void }) {
  const categories = useStore((s) => s.budgetCategories)
  const total = useStore((s) => s.profile.totalBudget)
  const { add, update, remove } = useStore()
  const expenses = useStore((s) => s.expenses)
  const [newName, setNewName] = useState('')

  const autoSplit = () => {
    for (const c of categories) {
      const preset = BUDGET_CATEGORIES.find((b) => b.name === c.name)
      if (preset) update('budgetCategories', c.id, { allocation: Math.round((total * preset.share) / 100 / 100000) * 100000 })
    }
  }
  const allocated = categories.reduce((a, c) => a + c.allocation, 0)

  return (
    <Modal open onClose={onClose} title="Kategori & alokasi" wide footer={<Button onClick={onClose}>Selesai</Button>}>
      {total > 0 && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-sand p-3 text-sm">
          <span>
            Teralokasi {rupiah(allocated)} dari {rupiah(total)}
          </span>
          <Button size="sm" variant="outline" onClick={autoSplit}>
            <Wand2 size={15} /> Bagi otomatis
          </Button>
        </div>
      )}
      <div className="space-y-2">
        {categories.map((c) => {
          const used = expenses.some((e) => e.category === c.name)
          return (
            <div key={c.id} className="flex items-center gap-2">
              <Input
                className="flex-1"
                value={c.name}
                onChange={(e) => {
                  const old = c.name
                  update('budgetCategories', c.id, { name: e.target.value })
                  expenses.filter((x) => x.category === old).forEach((x) => update('expenses', x.id, { category: e.target.value }))
                }}
              />
              <MoneyInput className="w-44" value={c.allocation} onChange={(v) => update('budgetCategories', c.id, { allocation: v })} />
              <IconButton disabled={used} title={used ? 'Masih dipakai oleh pengeluaran' : 'Hapus'} onClick={() => remove('budgetCategories', c.id)}>
                <Trash2 size={16} />
              </IconButton>
            </div>
          )
        })}
      </div>
      <form
        className="mt-4 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          if (!newName.trim()) return
          add('budgetCategories', { name: newName.trim(), allocation: 0 })
          setNewName('')
        }}
      >
        <Input placeholder="Kategori baru" value={newName} onChange={(e) => setNewName(e.target.value)} />
        <Button type="submit" variant="soft">
          <Plus size={16} /> Tambah
        </Button>
      </form>
    </Modal>
  )
}
