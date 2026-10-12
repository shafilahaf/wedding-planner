import { useMemo, useState } from 'react'
import { Check, Download, ListPlus, MailCheck, MessageCircle, Plus, Search, Trash2, Users } from 'lucide-react'
import { coupleName, useStore, type Guest, type Rsvp, type Side } from '../store'
import { Badge, Button, Card, Chips, confirmDelete, Empty, Field, IconButton, Input, Modal, MoneyInput, PageHeader, Select, StatCard } from '../components/ui'
import { cn, downloadFile, fmtLongDate, rupiah, toCSV, waNumber } from '../lib/utils'

const RSVP: { value: Rsvp; label: string; tone: 'neutral' | 'green' | 'red' | 'gold' }[] = [
  { value: 'belum', label: 'Belum konfirmasi', tone: 'neutral' },
  { value: 'hadir', label: 'Hadir', tone: 'green' },
  { value: 'ragu', label: 'Ragu-ragu', tone: 'gold' },
  { value: 'tidak', label: 'Tidak hadir', tone: 'red' },
]
const SIDES: { value: Side; label: string }[] = [
  { value: 'wanita', label: 'Pihak wanita' },
  { value: 'pria', label: 'Pihak pria' },
  { value: 'bersama', label: 'Bersama' },
]
const EVENTS = [
  { value: 'keduanya', label: 'Akad & Resepsi' },
  { value: 'akad', label: 'Akad saja' },
  { value: 'resepsi', label: 'Resepsi saja' },
]

export default function Guests() {
  const guests = useStore((s) => s.guests)
  const groups = useStore((s) => s.guestGroups)
  const profile = useStore((s) => s.profile)
  const { add, update, remove, addMany } = useStore()

  const [q, setQ] = useState('')
  const [side, setSide] = useState('semua')
  const [rsvp, setRsvp] = useState<'semua' | Rsvp>('semua')
  const [group, setGroup] = useState('semua')
  const [editing, setEditing] = useState<Guest | 'new' | null>(null)
  const [bulkOpen, setBulkOpen] = useState(false)

  const totalPax = guests.reduce((a, g) => a + g.pax, 0)
  const sum = (r: Rsvp) => guests.filter((g) => g.rsvp === r).reduce((a, g) => a + g.pax, 0)
  const sent = guests.filter((g) => g.sent).length
  const gifts = guests.reduce((a, g) => a + (g.gift || 0), 0)

  const list = useMemo(
    () =>
      guests
        .filter(
          (g) =>
            (side === 'semua' || g.side === side) &&
            (rsvp === 'semua' || g.rsvp === rsvp) &&
            (group === 'semua' || g.group === group) &&
            (!q || g.name.toLowerCase().includes(q.toLowerCase()) || g.phone.includes(q)),
        )
        .sort((a, b) => a.name.localeCompare(b.name)),
    [guests, side, rsvp, group, q],
  )

  const message = (g: Guest) => {
    const tanggal = [profile.akadDate && `Akad: ${fmtLongDate(profile.akadDate)} ${profile.akadTime}`, profile.resepsiDate && `Resepsi: ${fmtLongDate(profile.resepsiDate)} ${profile.resepsiTime}`]
      .filter(Boolean)
      .join('\n')
    const lokasi = [profile.akadVenue, profile.resepsiVenue].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).join(' / ')
    const link = profile.invitationLink ? profile.invitationLink + (profile.invitationLink.includes('?') ? '&' : '?') + 'to=' + encodeURIComponent(g.name) : '-'
    return profile.inviteMessage
      .replaceAll('{nama}', g.name)
      .replaceAll('{pengantin}', coupleName(profile))
      .replaceAll('{tanggal}', tanggal || '-')
      .replaceAll('{lokasi}', lokasi || '-')
      .replaceAll('{link}', link)
  }

  const sendWA = (g: Guest) => {
    const url = `https://wa.me/${g.phone ? waNumber(g.phone) : ''}?text=${encodeURIComponent(message(g))}`
    window.open(url, '_blank')
    if (!g.sent) update('guests', g.id, { sent: true })
  }

  const exportCSV = () => {
    const rows = [
      ['Nama', 'No. HP', 'Pihak', 'Grup', 'Jumlah orang', 'Acara', 'RSVP', 'Undangan terkirim', 'Amplop/hadiah', 'Catatan'],
      ...guests.map((g) => [g.name, g.phone, g.side, g.group, g.pax, g.event, g.rsvp, g.sent ? 'Ya' : 'Belum', g.gift || 0, g.notes]),
    ]
    downloadFile('daftar-tamu.csv', toCSV(rows), 'text/csv')
  }

  return (
    <div>
      <PageHeader
        eyebrow="Tamu"
        title="Undangan"
        icon={<MailCheck size={38} strokeWidth={1.6} />}
        actions={
          <>
            <Button onClick={() => setEditing('new')}>
              <Plus size={18} /> Tambah tamu
            </Button>
            <Button variant="soft" onClick={() => setBulkOpen(true)}>
              <ListPlus size={17} /> Tambah banyak
            </Button>
            {guests.length > 0 && (
              <Button variant="soft" onClick={exportCSV}>
                <Download size={17} /> CSV
              </Button>
            )}
          </>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total undangan" value={guests.length} sub={`${totalPax} orang · ${sent} terkirim`} />
        <StatCard label="Hadir" value={<span className="text-sage">{sum('hadir')}</span>} sub="orang" />
        <StatCard label="Belum konfirmasi" value={sum('belum') + sum('ragu')} sub={`${sum('tidak')} tidak hadir`} />
        <StatCard label="Amplop & hadiah" value={<span className="text-2xl">{rupiah(gifts)}</span>} sub="tercatat" />
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card className="p-4">
          <p className="text-sm text-muted">Pihak wanita</p>
          <p className="font-serif text-2xl">{guests.filter((g) => g.side === 'wanita').reduce((a, g) => a + g.pax, 0)} org</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted">Pihak pria</p>
          <p className="font-serif text-2xl">{guests.filter((g) => g.side === 'pria').reduce((a, g) => a + g.pax, 0)} org</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted">Bersama</p>
          <p className="font-serif text-2xl">{guests.filter((g) => g.side === 'bersama').reduce((a, g) => a + g.pax, 0)} org</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted">Belum dikirim</p>
          <p className="font-serif text-2xl">{guests.length - sent} undangan</p>
        </Card>
      </div>

      <div className="mt-8 mb-4 space-y-3">
        <Chips value={rsvp} onChange={setRsvp} options={[{ value: 'semua', label: 'Semua' }, ...RSVP.map((r) => ({ value: r.value, label: r.label }))]} />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="relative col-span-2 sm:col-span-1">
            <Search size={17} className="absolute top-1/2 left-3.5 -translate-y-1/2 text-muted" />
            <Input className="pl-10" placeholder="Cari nama / nomor" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <Select value={side} onChange={setSide} options={[{ value: 'semua', label: 'Semua pihak' }, ...SIDES]} />
          <Select value={group} onChange={setGroup} options={[{ value: 'semua', label: 'Semua grup' }, ...groups]} />
        </div>
      </div>

      {guests.length === 0 ? (
        <Empty icon={<Users />} title="Belum ada tamu" desc="Tambahkan tamu satu per satu atau tempel daftar nama sekaligus. Kirim undangan langsung lewat WhatsApp." action={<Button onClick={() => setBulkOpen(true)}>Tambah banyak sekaligus</Button>} />
      ) : (
        <Card className="divide-y divide-line">
          {list.map((g) => {
            const r = RSVP.find((x) => x.value === g.rsvp)!
            return (
              <div key={g.id} className="group flex items-center gap-3 px-4 py-3.5 sm:px-5">
                <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-semibold', g.side === 'pria' ? 'bg-sky-50 text-sky-700' : g.side === 'wanita' ? 'bg-brand-soft text-brand' : 'bg-gold-soft text-[#9a6b12]')}>
                  {g.name.charAt(0).toUpperCase()}
                </span>
                <button className="min-w-0 flex-1 text-left" onClick={() => setEditing(g)}>
                  <p className="truncate font-medium">
                    {g.name} {g.pax > 1 && <span className="text-sm font-normal text-muted">· {g.pax} org</span>}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    <Badge tone={r.tone}>{r.label}</Badge>
                    <Badge>{g.group}</Badge>
                    {g.sent && (
                      <Badge tone="blue">
                        <Check size={12} /> Terkirim
                      </Badge>
                    )}
                  </div>
                </button>
                <Select
                  className="hidden w-48 py-2 text-sm sm:block"
                  value={g.rsvp}
                  onChange={(v) => update('guests', g.id, { rsvp: v as Rsvp })}
                  options={RSVP.map((x) => ({ value: x.value, label: x.label }))}
                />
                <IconButton onClick={() => sendWA(g)} title="Kirim via WhatsApp" className="text-sage hover:bg-sage-soft hover:text-sage">
                  <MessageCircle size={18} />
                </IconButton>
                <IconButton className="sm:opacity-0 sm:group-hover:opacity-100" onClick={() => confirmDelete(g.name) && remove('guests', g.id)} aria-label="Hapus">
                  <Trash2 size={16} />
                </IconButton>
              </div>
            )
          })}
          {list.length === 0 && <p className="py-8 text-center text-muted">Tidak ada tamu yang cocok.</p>}
        </Card>
      )}

      {editing && (
        <GuestEditor
          key={editing === 'new' ? 'new' : editing.id}
          guest={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSave={(g) => (editing === 'new' ? add('guests', g) : update('guests', editing.id, g))}
          preview={editing === 'new' ? undefined : message(editing)}
        />
      )}
      {bulkOpen && (
        <BulkAdd
          groups={groups}
          onClose={() => setBulkOpen(false)}
          onAdd={(items) => {
            addMany('guests', items)
            setBulkOpen(false)
          }}
        />
      )}
    </div>
  )
}

const blankGuest = (): Omit<Guest, 'id'> => ({ name: '', phone: '', side: 'bersama', group: 'Keluarga', pax: 2, rsvp: 'belum', sent: false, event: 'keduanya', gift: 0, notes: '' })

function GuestEditor({ guest, onClose, onSave, preview }: { guest: Guest | null; onClose: () => void; onSave: (g: Omit<Guest, 'id'>) => void; preview?: string }) {
  const groups = useStore((s) => s.guestGroups)
  const setGroups = useStore((s) => s.setGuestGroups)
  const [f, setF] = useState<Omit<Guest, 'id'>>(guest ?? blankGuest())
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((x) => ({ ...x, [k]: v }))

  const save = () => {
    const grp = f.group.trim() || 'Lainnya'
    if (!groups.includes(grp)) setGroups([...groups, grp])
    onSave({ ...f, name: f.name.trim(), group: grp })
    onClose()
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={guest ? 'Ubah tamu' : 'Tambah tamu'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Batal
          </Button>
          <Button disabled={!f.name.trim()} onClick={save}>
            Simpan
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nama" className="sm:col-span-2">
          <Input value={f.name} onChange={(e) => set('name', e.target.value)} placeholder="Bpk. Ahmad & keluarga" autoFocus />
        </Field>
        <Field label="No. WhatsApp">
          <Input value={f.phone} onChange={(e) => set('phone', e.target.value)} placeholder="08xxxxxxxxxx" inputMode="tel" />
        </Field>
        <Field label="Jumlah orang">
          <Input type="number" min={1} value={f.pax} onChange={(e) => set('pax', Math.max(1, Number(e.target.value) || 1))} />
        </Field>
        <Field label="Pihak">
          <Select value={f.side} onChange={(v) => set('side', v as Side)} options={SIDES} />
        </Field>
        <Field label="Grup">
          <Input list="guest-groups" value={f.group} onChange={(e) => set('group', e.target.value)} />
          <datalist id="guest-groups">
            {groups.map((g) => (
              <option key={g} value={g} />
            ))}
          </datalist>
        </Field>
        <Field label="Diundang ke">
          <Select value={f.event} onChange={(v) => set('event', v as Guest['event'])} options={EVENTS} />
        </Field>
        <Field label="RSVP">
          <Select value={f.rsvp} onChange={(v) => set('rsvp', v as Rsvp)} options={RSVP.map((r) => ({ value: r.value, label: r.label }))} />
        </Field>
        <Field label="Amplop / hadiah (setelah acara)">
          <MoneyInput value={f.gift} onChange={(v) => set('gift', v)} />
        </Field>
        <label className="flex items-center gap-2 self-end pb-3">
          <input type="checkbox" className="h-5 w-5 accent-brand" checked={f.sent} onChange={(e) => set('sent', e.target.checked)} />
          Undangan sudah dikirim
        </label>
        <Field label="Catatan" className="sm:col-span-2">
          <textarea className="input min-h-20" value={f.notes} onChange={(e) => set('notes', e.target.value)} />
        </Field>
        {preview && (
          <div className="sm:col-span-2">
            <p className="label">Pratinjau pesan WhatsApp</p>
            <pre className="max-h-48 overflow-y-auto rounded-xl bg-sand p-3 font-sans text-sm whitespace-pre-wrap text-ink">{preview}</pre>
            <p className="mt-1 text-xs text-muted">Ubah template pesan & link undangan digital di Pengaturan.</p>
          </div>
        )}
      </div>
    </Modal>
  )
}

function BulkAdd({ groups, onClose, onAdd }: { groups: string[]; onClose: () => void; onAdd: (g: Omit<Guest, 'id'>[]) => void }) {
  const [text, setText] = useState('')
  const [side, setSide] = useState<Side>('bersama')
  const [group, setGroup] = useState(groups[0] ?? 'Lainnya')
  const [pax, setPax] = useState(2)

  const parsed = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const [name, phone = ''] = l.split(/[,;\t]/).map((x) => x.trim())
      return { ...blankGuest(), name, phone, side, group, pax }
    })

  return (
    <Modal
      open
      onClose={onClose}
      title="Tambah banyak tamu"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Batal
          </Button>
          <Button disabled={!parsed.length} onClick={() => onAdd(parsed)}>
            Tambahkan {parsed.length} tamu
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Satu tamu per baris (format: Nama, No. HP)">
          <textarea className="input min-h-44" value={text} onChange={(e) => setText(e.target.value)} placeholder={'Budi Santoso, 081234567890\nSiti Aminah, 085712345678\nKeluarga Pak RT'} autoFocus />
        </Field>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Pihak">
            <Select value={side} onChange={(v) => setSide(v as Side)} options={SIDES} />
          </Field>
          <Field label="Grup">
            <Select value={group} onChange={setGroup} options={groups} />
          </Field>
          <Field label="Orang / undangan">
            <Input type="number" min={1} value={pax} onChange={(e) => setPax(Math.max(1, Number(e.target.value) || 1))} />
          </Field>
        </div>
      </div>
    </Modal>
  )
}
