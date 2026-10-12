import { useState } from 'react'
import { Gift, Plus, Sparkles, Trash2 } from 'lucide-react'
import { useStore, type SeserahanItem } from '../store'
import { Button, Card, confirmDelete, Empty, Field, IconButton, Input, Modal, MoneyInput, PageHeader, Progress, StatCard } from '../components/ui'
import { SESERAHAN_TEMPLATE } from '../lib/templates'
import { cn, pct, rupiah } from '../lib/utils'

export default function Seserahan() {
  const items = useStore((s) => s.seserahan)
  const { add, addMany, update, remove } = useStore()
  const [editing, setEditing] = useState<SeserahanItem | 'new' | null>(null)

  const bought = items.filter((i) => i.bought).length
  const budget = items.reduce((a, i) => a + i.budget, 0)
  const spent = items.reduce((a, i) => a + i.price, 0)

  const useTemplate = () => {
    const existing = new Set(items.map((i) => i.name.toLowerCase()))
    addMany(
      'seserahan',
      SESERAHAN_TEMPLATE.filter((n) => !existing.has(n.toLowerCase())).map((name) => ({ name, budget: 0, price: 0, bought: false, notes: '' })),
    )
  }

  return (
    <div>
      <PageHeader
        eyebrow="Hantaran"
        title="Seserahan & Mahar"
        icon={<Gift size={38} strokeWidth={1.6} />}
        actions={
          <>
            <Button onClick={() => setEditing('new')}>
              <Plus size={18} /> Tambah item
            </Button>
            <Button variant="outline" onClick={useTemplate}>
              <Sparkles size={17} /> Pakai template
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Terbeli" value={`${bought} / ${items.length}`} sub={<Progress className="mt-2" value={pct(bought, items.length)} />} />
        <StatCard label="Budget" value={rupiah(budget)} />
        <StatCard label="Sudah dibelanjakan" value={rupiah(spent)} accent sub={budget ? (spent > budget ? `Lebih ${rupiah(spent - budget)}` : `Sisa ${rupiah(budget - spent)}`) : undefined} />
      </div>

      <div className="mt-6">
        {items.length === 0 ? (
          <Empty icon={<Gift />} title="Belum ada daftar seserahan" desc="Catat mahar dan isi seserahan, budget tiap item, dan tandai yang sudah dibeli." action={<Button variant="outline" onClick={useTemplate}>Pakai template</Button>} />
        ) : (
          <Card className="divide-y divide-line">
            {[...items.filter((i) => !i.bought), ...items.filter((i) => i.bought)].map((i) => (
              <div key={i.id} className="group flex items-center gap-3 px-4 py-3.5 sm:px-5">
                <input type="checkbox" className="h-5 w-5 shrink-0 accent-brand" checked={i.bought} onChange={() => update('seserahan', i.id, { bought: !i.bought })} />
                <button className="min-w-0 flex-1 text-left" onClick={() => setEditing(i)}>
                  <p className={cn('font-medium', i.bought && 'text-muted line-through')}>{i.name}</p>
                  {i.notes && <p className="truncate text-sm text-muted">{i.notes}</p>}
                </button>
                <div className="text-right text-sm">
                  {i.price > 0 && <p className="font-semibold">{rupiah(i.price)}</p>}
                  {i.budget > 0 && <p className="text-xs text-muted">budget {rupiah(i.budget)}</p>}
                </div>
                <IconButton className="sm:opacity-0 sm:group-hover:opacity-100" onClick={() => confirmDelete(i.name) && remove('seserahan', i.id)}>
                  <Trash2 size={16} />
                </IconButton>
              </div>
            ))}
          </Card>
        )}
      </div>

      {editing && (
        <Editor
          key={editing === 'new' ? 'new' : editing.id}
          item={editing === 'new' ? { name: '', budget: 0, price: 0, bought: false, notes: '' } : editing}
          onClose={() => setEditing(null)}
          onSave={(x) => (editing === 'new' ? add('seserahan', x) : update('seserahan', editing.id, x))}
        />
      )}
    </div>
  )
}

function Editor({ item, onClose, onSave }: { item: Omit<SeserahanItem, 'id'>; onClose: () => void; onSave: (x: Omit<SeserahanItem, 'id'>) => void }) {
  const [f, setF] = useState(item)
  return (
    <Modal
      open
      onClose={onClose}
      title="Item seserahan"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Batal
          </Button>
          <Button
            disabled={!f.name.trim()}
            onClick={() => {
              onSave(f)
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
          <Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} autoFocus />
        </Field>
        <Field label="Budget">
          <MoneyInput value={f.budget} onChange={(v) => setF({ ...f, budget: v })} />
        </Field>
        <Field label="Harga beli">
          <MoneyInput value={f.price} onChange={(v) => setF({ ...f, price: v })} />
        </Field>
        <Field label="Catatan (merk, ukuran, link toko)" className="sm:col-span-2">
          <textarea className="input min-h-20" value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} />
        </Field>
        <label className="flex items-center gap-2">
          <input type="checkbox" className="h-5 w-5 accent-brand" checked={f.bought} onChange={(e) => setF({ ...f, bought: e.target.checked })} />
          Sudah dibeli
        </label>
      </div>
    </Modal>
  )
}
