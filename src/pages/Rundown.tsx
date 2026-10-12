import { useState } from 'react'
import { Clock, Plus, Printer, Sparkles, Trash2 } from 'lucide-react'
import { useStore, type RundownItem } from '../store'
import { Button, Card, Chips, confirmDelete, Empty, Field, IconButton, Input, Modal, PageHeader } from '../components/ui'
import { RUNDOWN_TEMPLATE } from '../lib/templates'
import { fmtLongDate } from '../lib/utils'

export default function Rundown() {
  const rundown = useStore((s) => s.rundown)
  const profile = useStore((s) => s.profile)
  const { add, addMany, update, remove } = useStore()
  const sessions = Array.from(new Set(['Hari H', ...rundown.map((r) => r.session)]))
  const [session, setSession] = useState(sessions[0])
  const [editing, setEditing] = useState<RundownItem | 'new' | null>(null)

  const items = rundown.filter((r) => r.session === session).sort((a, b) => a.time.localeCompare(b.time))

  const addSession = () => {
    const name = window.prompt('Nama sesi (misal: Lamaran, Siraman, Ngunduh mantu)')
    if (name?.trim()) setSession(name.trim())
  }

  return (
    <div>
      <PageHeader
        eyebrow="Hari H"
        title="Rundown acara"
        icon={<Clock size={38} strokeWidth={1.6} />}
        actions={
          <>
            <Button onClick={() => setEditing('new')}>
              <Plus size={18} /> Tambah agenda
            </Button>
            {items.length === 0 && (
              <Button variant="outline" onClick={() => addMany('rundown', RUNDOWN_TEMPLATE.map((t) => ({ ...t, session, notes: '' })))}>
                <Sparkles size={17} /> Pakai template
              </Button>
            )}
            <Button variant="soft" onClick={() => window.print()}>
              <Printer size={17} /> Cetak
            </Button>
          </>
        }
      />

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <Chips value={session} onChange={setSession} options={sessions.map((s) => ({ value: s, label: s }))} />
        <Button size="sm" variant="ghost" onClick={addSession}>
          <Plus size={15} /> Sesi
        </Button>
      </div>

      {session === 'Hari H' && (profile.akadDate || profile.resepsiDate) && (
        <p className="mb-4 text-muted">
          {fmtLongDate(profile.akadDate || profile.resepsiDate)} · {[profile.akadVenue, profile.resepsiVenue].filter(Boolean).join(' / ')}
        </p>
      )}

      {items.length === 0 ? (
        <Empty
          icon={<Clock />}
          title="Belum ada agenda"
          desc="Susun jadwal detail dari persiapan rias sampai acara selesai, lengkap dengan penanggung jawabnya."
          action={
            <Button variant="outline" onClick={() => addMany('rundown', RUNDOWN_TEMPLATE.map((t) => ({ ...t, session, notes: '' })))}>
              <Sparkles size={17} /> Pakai template
            </Button>
          }
        />
      ) : (
        <Card className="p-4 sm:p-6">
          <ol className="relative">
            {items.map((r, i) => (
              <li key={r.id} className="group relative flex gap-4 pb-6 last:pb-0">
                {i < items.length - 1 && <span className="absolute top-8 bottom-0 left-[2.15rem] w-px bg-line" />}
                <span className="w-[4.3rem] shrink-0 rounded-full bg-brand-soft py-1.5 text-center text-sm font-semibold text-brand tabular-nums">{r.time}</span>
                <button className="min-w-0 flex-1 pt-1 text-left" onClick={() => setEditing(r)}>
                  <p className="font-medium">{r.title}</p>
                  {r.pic && <p className="text-sm text-muted">PJ: {r.pic}</p>}
                  {r.notes && <p className="mt-1 text-sm whitespace-pre-wrap text-muted">{r.notes}</p>}
                </button>
                <IconButton className="print:hidden sm:opacity-0 sm:group-hover:opacity-100" onClick={() => confirmDelete(r.title) && remove('rundown', r.id)}>
                  <Trash2 size={16} />
                </IconButton>
              </li>
            ))}
          </ol>
        </Card>
      )}

      {editing && (
        <RundownEditor
          key={editing === 'new' ? 'new' : editing.id}
          item={editing === 'new' ? { session, time: items.at(-1)?.time ?? '08:00', title: '', pic: '', notes: '' } : editing}
          onClose={() => setEditing(null)}
          onSave={(r) => (editing === 'new' ? add('rundown', r) : update('rundown', editing.id, r))}
        />
      )}
    </div>
  )
}

function RundownEditor({ item, onClose, onSave }: { item: Omit<RundownItem, 'id'>; onClose: () => void; onSave: (r: Omit<RundownItem, 'id'>) => void }) {
  const [f, setF] = useState(item)
  return (
    <Modal
      open
      onClose={onClose}
      title="Agenda"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Batal
          </Button>
          <Button
            disabled={!f.title.trim()}
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
      <div className="grid grid-cols-[8rem_1fr] gap-4">
        <Field label="Jam">
          <Input type="time" value={f.time} onChange={(e) => setF({ ...f, time: e.target.value })} />
        </Field>
        <Field label="Agenda">
          <Input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} autoFocus />
        </Field>
        <Field label="Penanggung jawab" className="col-span-2">
          <Input value={f.pic} onChange={(e) => setF({ ...f, pic: e.target.value })} placeholder="MC, WO, keluarga, dll" />
        </Field>
        <Field label="Catatan" className="col-span-2">
          <textarea className="input min-h-20" value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} />
        </Field>
      </div>
    </Modal>
  )
}
