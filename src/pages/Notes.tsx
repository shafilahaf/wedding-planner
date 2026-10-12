import { useState } from 'react'
import { NotebookPen, Plus, Trash2 } from 'lucide-react'
import { useStore, type Note } from '../store'
import { Button, Card, confirmDelete, Empty, Input, PageHeader } from '../components/ui'
import { cn } from '../lib/utils'

export default function Notes() {
  const notes = useStore((s) => s.notes)
  const { add, update, remove } = useStore()
  const sorted = [...notes].sort((a, b) => b.updatedAt - a.updatedAt)
  const [activeId, setActiveId] = useState<string | null>(sorted[0]?.id ?? null)
  const active = notes.find((n) => n.id === activeId)

  const create = () => setActiveId(add('notes', { title: 'Catatan baru', body: '', updatedAt: Date.now() }))
  const patch = (n: Note, p: Partial<Note>) => update('notes', n.id, { ...p, updatedAt: Date.now() })

  return (
    <div>
      <PageHeader
        eyebrow="Arsip"
        title="Catatan"
        icon={<NotebookPen size={38} strokeWidth={1.6} />}
        actions={
          <Button onClick={create}>
            <Plus size={18} /> Catatan baru
          </Button>
        }
      />
      {notes.length === 0 ? (
        <Empty icon={<NotebookPen />} title="Belum ada catatan" desc="Simpan hasil meeting vendor, ide acara, daftar kontak penting, nomor rekening, atau apa saja." action={<Button onClick={create}>Tulis catatan</Button>} />
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-[280px_1fr]">
          <div className="space-y-2">
            {sorted.map((n) => (
              <button key={n.id} onClick={() => setActiveId(n.id)} className={cn('w-full rounded-2xl border p-4 text-left transition', n.id === activeId ? 'border-brand/40 bg-brand-soft/40' : 'border-line bg-surface hover:bg-sand/50')}>
                <p className="truncate font-medium">{n.title || 'Tanpa judul'}</p>
                <p className="mt-0.5 line-clamp-2 text-sm text-muted">{n.body || '…'}</p>
                <p className="mt-1 text-xs text-muted">{new Date(n.updatedAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}</p>
              </button>
            ))}
          </div>
          {active && (
            <Card className="flex min-h-[60vh] flex-col p-5">
              <div className="flex gap-2">
                <Input className="border-0 bg-transparent px-0 font-serif text-2xl shadow-none focus:ring-0" value={active.title} onChange={(e) => patch(active, { title: e.target.value })} />
                <Button
                  variant="ghost"
                  onClick={() => {
                    if (!confirmDelete('catatan ini')) return
                    remove('notes', active.id)
                    setActiveId(sorted.find((n) => n.id !== active.id)?.id ?? null)
                  }}
                >
                  <Trash2 size={16} />
                </Button>
              </div>
              <textarea className="mt-2 flex-1 resize-none bg-transparent leading-relaxed outline-none" placeholder="Mulai menulis…" value={active.body} onChange={(e) => patch(active, { body: e.target.value })} />
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
