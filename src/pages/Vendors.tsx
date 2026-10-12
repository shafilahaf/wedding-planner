import { useState } from 'react'
import { AtSign, MessageCircle, Phone, Plus, Star, Store, Trash2, Wallet } from 'lucide-react'
import { useStore, type Vendor, type VendorStatus } from '../store'
import { Badge, Button, Card, Chips, confirmDelete, Empty, Field, IconButton, Input, Modal, MoneyInput, PageHeader, Select } from '../components/ui'
import { VENDOR_CATEGORIES } from '../lib/templates'
import { cn, rupiah, waNumber } from '../lib/utils'

const STATUS: { value: VendorStatus; label: string; tone: 'neutral' | 'gold' | 'green' | 'red' }[] = [
  { value: 'survey', label: 'Survey', tone: 'neutral' },
  { value: 'nego', label: 'Negosiasi', tone: 'gold' },
  { value: 'booked', label: 'Booked', tone: 'green' },
  { value: 'batal', label: 'Tidak jadi', tone: 'red' },
]

export default function Vendors() {
  const vendors = useStore((s) => s.vendors)
  const { add, update, remove } = useStore()
  const [filter, setFilter] = useState<'semua' | VendorStatus>('semua')
  const [cat, setCat] = useState('semua')
  const [editing, setEditing] = useState<Vendor | 'new' | null>(null)

  const list = vendors.filter((v) => (filter === 'semua' || v.status === filter) && (cat === 'semua' || v.category === cat))
  const grouped = Array.from(new Set(list.map((v) => v.category))).sort()

  const booked = vendors.filter((v) => v.status === 'booked')

  return (
    <div>
      <PageHeader
        eyebrow="Mitra"
        title="Vendor"
        icon={<Store size={38} strokeWidth={1.6} />}
        actions={
          <Button onClick={() => setEditing('new')}>
            <Plus size={18} /> Tambah vendor
          </Button>
        }
      />

      <Card className="mb-6 p-5">
        <p className="eyebrow mb-3">Status vendor utama</p>
        <div className="flex flex-wrap gap-2">
          {VENDOR_CATEGORIES.filter((c) => c !== 'Lainnya').map((c) => {
            const ok = booked.some((v) => v.category === c)
            return (
              <button key={c} onClick={() => setCat(cat === c ? 'semua' : c)} className={cn('rounded-full border px-3 py-1.5 text-sm transition', ok ? 'border-sage/30 bg-sage-soft text-sage' : 'border-line bg-white text-muted', cat === c && 'ring-2 ring-brand')}>
                {ok ? '✓ ' : ''}
                {c}
              </button>
            )
          })}
        </div>
        <p className="mt-3 text-sm text-muted">
          {booked.length} vendor sudah booked · total kontrak {rupiah(booked.reduce((a, v) => a + v.price, 0))}
        </p>
      </Card>

      <div className="mb-4">
        <Chips value={filter} onChange={setFilter} options={[{ value: 'semua', label: `Semua (${vendors.length})` }, ...STATUS.map((s) => ({ value: s.value, label: s.label }))]} />
      </div>

      {vendors.length === 0 ? (
        <Empty icon={<Store />} title="Belum ada vendor" desc="Simpan kandidat vendor, bandingkan harga, dan tandai yang sudah dibooking." action={<Button onClick={() => setEditing('new')}>Tambah vendor</Button>} />
      ) : list.length === 0 ? (
        <p className="py-10 text-center text-muted">Tidak ada vendor yang cocok.</p>
      ) : (
        <div className="space-y-8">
          {grouped.map((g) => (
            <section key={g}>
              <h2 className="mb-3 font-serif text-2xl">{g}</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {list
                  .filter((v) => v.category === g)
                  .sort((a, b) => a.price - b.price)
                  .map((v) => {
                    const st = STATUS.find((s) => s.value === v.status)!
                    return (
                      <Card key={v.id} className={cn('flex flex-col p-5', v.status === 'batal' && 'opacity-60')}>
                        <button className="flex-1 text-left" onClick={() => setEditing(v)}>
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-serif text-xl">{v.name}</p>
                            <Badge tone={st.tone}>{st.label}</Badge>
                          </div>
                          {v.rating > 0 && (
                            <div className="mt-1 flex gap-0.5 text-gold">
                              {Array.from({ length: 5 }, (_, i) => (
                                <Star key={i} size={14} fill={i < v.rating ? 'currentColor' : 'none'} />
                              ))}
                            </div>
                          )}
                          <p className="mt-3 text-lg font-semibold">{v.price ? rupiah(v.price) : <span className="text-sm font-normal text-muted">Harga belum ada</span>}</p>
                          {v.contact && <p className="mt-1 text-sm text-muted">CP: {v.contact}</p>}
                          {v.notes && <p className="mt-2 line-clamp-3 text-sm text-muted">{v.notes}</p>}
                        </button>
                        <div className="mt-4 flex items-center gap-1 border-t border-line pt-3">
                          {v.phone && (
                            <>
                              <a href={`https://wa.me/${waNumber(v.phone)}`} target="_blank" rel="noreferrer" className="inline-flex h-9 w-9 items-center justify-center rounded-full text-sage hover:bg-sage-soft" title="WhatsApp">
                                <MessageCircle size={18} />
                              </a>
                              <a href={`tel:${v.phone}`} className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-sand" title="Telepon">
                                <Phone size={17} />
                              </a>
                            </>
                          )}
                          {v.instagram && (
                            <a href={`https://instagram.com/${v.instagram.replace(/^@/, '')}`} target="_blank" rel="noreferrer" className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-sand" title="Instagram">
                              <AtSign size={17} />
                            </a>
                          )}
                          <span className="flex-1" />
                          <IconButton onClick={() => confirmDelete(v.name) && remove('vendors', v.id)} aria-label="Hapus">
                            <Trash2 size={16} />
                          </IconButton>
                        </div>
                      </Card>
                    )
                  })}
              </div>
            </section>
          ))}
        </div>
      )}

      {editing && (
        <VendorEditor
          key={editing === 'new' ? 'new' : editing.id}
          vendor={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSave={(v) => (editing === 'new' ? add('vendors', v) : update('vendors', editing.id, v))}
        />
      )}
    </div>
  )
}

function VendorEditor({ vendor, onClose, onSave }: { vendor: Vendor | null; onClose: () => void; onSave: (v: Omit<Vendor, 'id'>) => void }) {
  const expenses = useStore((s) => s.expenses)
  const categories = useStore((s) => s.budgetCategories)
  const addExpense = useStore((s) => s.add)
  const [f, setF] = useState<Omit<Vendor, 'id'>>(vendor ?? { name: '', category: 'Venue', contact: '', phone: '', instagram: '', price: 0, status: 'survey', rating: 0, notes: '' })
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((x) => ({ ...x, [k]: v }))
  const linked = vendor && expenses.some((e) => e.vendorId === vendor.id)

  const budgetCatFor = (c: string) => {
    const map: Record<string, string> = { Katering: 'Katering', Venue: 'Venue', Dekorasi: 'Dekorasi', MUA: 'Busana & MUA', Busana: 'Busana & MUA', Fotografer: 'Dokumentasi', Videografer: 'Dokumentasi', Entertainment: 'Entertainment', MC: 'Entertainment', Undangan: 'Undangan & Souvenir', Souvenir: 'Undangan & Souvenir', Cincin: 'Cincin' }
    const name = map[c]
    return categories.find((x) => x.name === name)?.name ?? categories[categories.length - 1]?.name ?? 'Lain-lain'
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={vendor ? 'Ubah vendor' : 'Tambah vendor'}
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
        <Field label="Nama vendor" className="sm:col-span-2">
          <Input value={f.name} onChange={(e) => set('name', e.target.value)} autoFocus />
        </Field>
        <Field label="Kategori">
          <Select value={f.category} onChange={(v) => set('category', v)} options={VENDOR_CATEGORIES} />
        </Field>
        <Field label="Status">
          <Select value={f.status} onChange={(v) => set('status', v as VendorStatus)} options={STATUS.map((s) => ({ value: s.value, label: s.label }))} />
        </Field>
        <Field label="Harga / penawaran">
          <MoneyInput value={f.price} onChange={(v) => set('price', v)} />
        </Field>
        <Field label="Rating">
          <div className="flex h-[46px] items-center gap-1">
            {Array.from({ length: 5 }, (_, i) => (
              <button key={i} type="button" className="text-gold" onClick={() => set('rating', f.rating === i + 1 ? 0 : i + 1)}>
                <Star size={24} fill={i < f.rating ? 'currentColor' : 'none'} />
              </button>
            ))}
          </div>
        </Field>
        <Field label="Contact person">
          <Input value={f.contact} onChange={(e) => set('contact', e.target.value)} />
        </Field>
        <Field label="No. HP / WhatsApp">
          <Input value={f.phone} onChange={(e) => set('phone', e.target.value)} inputMode="tel" />
        </Field>
        <Field label="Instagram" className="sm:col-span-2">
          <Input value={f.instagram} onChange={(e) => set('instagram', e.target.value)} placeholder="@namavendor" />
        </Field>
        <Field label="Catatan (paket, kelebihan, kekurangan)" className="sm:col-span-2">
          <textarea className="input min-h-24" value={f.notes} onChange={(e) => set('notes', e.target.value)} />
        </Field>
        {vendor && f.status === 'booked' && !linked && f.price > 0 && (
          <div className="sm:col-span-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                addExpense('expenses', { name: f.name, category: budgetCatFor(f.category), planned: f.price, actual: f.price, paid: 0, dueDate: '', vendorId: vendor.id, notes: '' })
              }}
            >
              <Wallet size={15} /> Masukkan ke anggaran
            </Button>
          </div>
        )}
      </div>
    </Modal>
  )
}
