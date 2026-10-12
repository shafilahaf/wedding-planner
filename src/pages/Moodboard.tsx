import { useRef, useState } from 'react'
import { Copy, FileText, ImagePlus, Minus, Palette, Pencil, Plus, Sparkles, Trash2 } from 'lucide-react'
import { useStore, type Board, type MoodItem, type MoodTag } from '../store'
import { Badge, Button, Chips, confirmDelete, Empty, Field, IconButton, Input, Modal, Select } from '../components/ui'
import { PALETTE_PRESETS } from '../lib/templates'
import { cn, compressImage, uid } from '../lib/utils'

const TAGS: MoodTag[] = ['Dekorasi', 'Gaun', 'Groom', 'Venue', 'Makanan', 'Lainnya']

export default function Moodboard() {
  const boards = useStore((s) => s.boards)
  const { add, update, remove } = useStore()
  const [boardId, setBoardId] = useState(boards[0]?.id ?? '')
  const board = boards.find((b) => b.id === boardId) ?? boards[0]
  const [tag, setTag] = useState<'semua' | MoodTag>('semua')
  const [zoom, setZoom] = useState(3)
  const [editing, setEditing] = useState<MoodItem | { type: MoodItem['type'] } | null>(null)
  const [museOpen, setMuseOpen] = useState(false)
  const [renaming, setRenaming] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  if (!board) {
    return (
      <Empty
        icon={<Palette />}
        title="Belum ada board"
        action={<Button onClick={() => setBoardId(add('boards', { name: 'Inspirasi', items: [] }))}>Buat board</Button>}
      />
    )
  }

  const setItems = (items: MoodItem[]) => update('boards', board.id, { items })
  const upsert = (item: MoodItem) => {
    const exists = board.items.some((i) => i.id === item.id)
    setItems(exists ? board.items.map((i) => (i.id === item.id ? item : i)) : [item, ...board.items])
  }

  const onFiles = async (files: FileList | null) => {
    if (!files?.length) return
    const imgs: MoodItem[] = []
    for (const f of Array.from(files)) {
      imgs.push({ id: uid(), type: 'image', tag: tag === 'semua' ? 'Dekorasi' : tag, src: await compressImage(f, 1000, 0.78), title: '', createdAt: Date.now() })
    }
    setItems([...imgs, ...board.items])
  }

  const newBoard = () => {
    const name = window.prompt('Nama board baru', 'Board baru')
    if (name?.trim()) setBoardId(add('boards', { name: name.trim(), items: [] }))
  }

  const duplicate = () => setBoardId(add('boards', { name: board.name + ' (salinan)', items: board.items.map((i) => ({ ...i, id: uid() })) }))

  const items = board.items.filter((i) => tag === 'semua' || i.tag === tag)
  const count = (t: MoodTag) => board.items.filter((i) => i.tag === t).length
  const COLS = ['columns-1', 'columns-1 sm:columns-2', 'columns-2 lg:columns-3', 'columns-2 md:columns-3 lg:columns-4', 'columns-3 md:columns-4 lg:columns-5']

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <h1 className="font-serif text-4xl md:text-5xl">{board.name}</h1>
        <IconButton onClick={() => setRenaming(true)} aria-label="Ganti nama">
          <Pencil size={20} />
        </IconButton>
        <Select className="w-auto min-w-44" value={board.id} onChange={setBoardId} options={boards.map((b) => ({ value: b.id, label: b.name }))} />
      </div>
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <Button variant="outline" onClick={newBoard}>
          <Plus size={18} /> Board Baru
        </Button>
        <Badge className="px-4 py-2.5 text-sm text-ink">
          <span className="h-2 w-2 rounded-full bg-sage" /> Tersimpan otomatis
        </Badge>
        <Button variant="soft" className="border border-line bg-white" onClick={() => setMuseOpen(true)}>
          <Sparkles size={18} className="text-brand" /> Inspirasi palet
        </Button>
        <IconButton onClick={duplicate} title="Duplikat board">
          <Copy size={19} />
        </IconButton>
        {boards.length > 1 && (
          <IconButton
            title="Hapus board"
            onClick={() => {
              if (confirmDelete(`board "${board.name}"`)) {
                remove('boards', board.id)
                setBoardId(boards.find((b) => b.id !== board.id)!.id)
              }
            }}
          >
            <Trash2 size={19} />
          </IconButton>
        )}
      </div>

      <div className="mb-5 flex flex-wrap gap-2 border-t border-line pt-5">
        <Button onClick={() => fileRef.current?.click()}>
          <ImagePlus size={18} /> Foto & Media
        </Button>
        <Button variant="soft" onClick={() => setEditing({ type: 'note' })}>
          <FileText size={18} className="text-brand" /> Catatan
        </Button>
        <Button variant="soft" onClick={() => setEditing({ type: 'palette' })}>
          <Palette size={18} className="text-brand" /> Palet Warna
        </Button>
        <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => (onFiles(e.target.files), (e.target.value = ''))} />
        <div className="ml-auto flex items-center gap-1 rounded-full border border-line bg-white px-1.5 py-1 shadow-sm">
          <IconButton onClick={() => setZoom((z) => Math.min(4, z + 1))} disabled={zoom === 4} aria-label="Perkecil">
            <Minus size={16} />
          </IconButton>
          <span className="w-12 text-center text-sm font-medium">{[200, 150, 100, 75, 60][zoom]}%</span>
          <IconButton onClick={() => setZoom((z) => Math.max(0, z - 1))} disabled={zoom === 0} aria-label="Perbesar">
            <Plus size={16} />
          </IconButton>
        </div>
      </div>

      <div className="mb-5">
        <Chips
          value={tag}
          onChange={setTag}
          options={[{ value: 'semua', label: `SEMUA (${board.items.length})` }, ...TAGS.map((t) => ({ value: t, label: `${t.toUpperCase()} (${count(t)})` }))]}
        />
      </div>

      <div className="dot-grid -mx-4 min-h-[50vh] rounded-none border-y border-line px-4 py-5 sm:mx-0 sm:rounded-3xl sm:border sm:p-5">
        {items.length === 0 ? (
          <div className="flex h-[40vh] flex-col items-center justify-center text-center text-muted">
            <Palette size={40} className="mb-3 text-brand/60" />
            <p className="font-serif text-xl text-ink">Board masih kosong</p>
            <p className="mt-1 max-w-sm text-sm">Unggah foto inspirasi, tulis catatan, atau tambahkan palet warna untuk tema pernikahanmu.</p>
          </div>
        ) : (
          <div className={cn('gap-4 [&>*]:mb-4', COLS[zoom])}>
            {items.map((i) => (
              <MoodCard key={i.id} item={i} onEdit={() => setEditing(i)} onDelete={() => confirmDelete() && setItems(board.items.filter((x) => x.id !== i.id))} />
            ))}
          </div>
        )}
      </div>

      {editing && (
        <ItemEditor
          key={'id' in editing ? editing.id : editing.type}
          item={editing}
          defaultTag={tag === 'semua' ? 'Dekorasi' : tag}
          onClose={() => setEditing(null)}
          onSave={(i) => {
            upsert(i)
            setEditing(null)
          }}
        />
      )}
      {museOpen && (
        <Modal open onClose={() => setMuseOpen(false)} title="Inspirasi palet warna" wide>
          <p className="mb-4 text-sm text-muted">Pilih kombinasi warna untuk ditambahkan ke board.</p>
          <div className="grid gap-4 sm:grid-cols-2">
            {PALETTE_PRESETS.map((p) => (
              <button
                key={p.name}
                className="rounded-2xl border border-line bg-white p-4 text-left transition hover:border-brand hover:shadow"
                onClick={() => {
                  upsert({ id: uid(), type: 'palette', tag: 'Dekorasi', title: p.name, text: p.desc, colors: p.colors, createdAt: Date.now() })
                  setMuseOpen(false)
                }}
              >
                <div className="mb-3 flex h-12 overflow-hidden rounded-xl">
                  {p.colors.map((c) => (
                    <span key={c.hex} className="flex-1" style={{ background: c.hex }} />
                  ))}
                </div>
                <p className="font-serif text-lg">{p.name}</p>
                <p className="text-sm text-muted">{p.desc}</p>
              </button>
            ))}
          </div>
        </Modal>
      )}
      {renaming && <RenameBoard board={board} onClose={() => setRenaming(false)} />}
    </div>
  )
}

function RenameBoard({ board, onClose }: { board: Board; onClose: () => void }) {
  const update = useStore((s) => s.update)
  const [name, setName] = useState(board.name)
  return (
    <Modal
      open
      onClose={onClose}
      title="Ganti nama board"
      footer={
        <Button
          onClick={() => {
            if (name.trim()) update('boards', board.id, { name: name.trim() })
            onClose()
          }}
        >
          Simpan
        </Button>
      }
    >
      <Input value={name} onChange={(e) => setName(e.target.value)} autoFocus />
    </Modal>
  )
}

function MoodCard({ item, onEdit, onDelete }: { item: MoodItem; onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="group relative break-inside-avoid overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
      <div className="absolute top-2 right-2 z-10 flex gap-1 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100">
        <button onClick={onEdit} className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-ink shadow hover:bg-white" aria-label="Ubah">
          <Pencil size={14} />
        </button>
        <button onClick={onDelete} className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-ink shadow hover:bg-white" aria-label="Hapus">
          <Trash2 size={14} />
        </button>
      </div>
      {item.type === 'image' && (
        <>
          <img src={item.src} alt={item.title} className="w-full" loading="lazy" />
          {(item.title || item.tag) && (
            <div className="flex items-center gap-2 p-3">
              <Badge tone="brand">{item.tag}</Badge>
              {item.title && <p className="truncate text-sm">{item.title}</p>}
            </div>
          )}
        </>
      )}
      {item.type === 'note' && (
        <div className="bg-gold-soft/50 p-5">
          <Badge tone="gold">{item.tag}</Badge>
          {item.title && <p className="mt-3 font-serif text-xl">{item.title}</p>}
          <p className="mt-2 text-sm whitespace-pre-wrap text-ink/80">{item.text}</p>
        </div>
      )}
      {item.type === 'palette' && (
        <div className="p-5">
          <Badge tone="brand">{item.tag}</Badge>
          {item.title && <p className="mt-3 font-serif text-2xl leading-tight">{item.title}</p>}
          {item.text && <p className="mt-2 text-sm text-muted">{item.text}</p>}
          <div className="mt-4 grid grid-cols-4 gap-2">
            {item.colors?.map((c) => (
              <button key={c.hex + c.name} className="text-center" title="Salin kode warna" onClick={() => navigator.clipboard?.writeText(c.hex)}>
                <span className="block aspect-square rounded-xl border border-black/5" style={{ background: c.hex }} />
                <span className="mt-1.5 block truncate text-xs">{c.name}</span>
                <span className="block text-[10px] text-muted">{c.hex.toUpperCase()}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function ItemEditor({
  item,
  defaultTag,
  onClose,
  onSave,
}: {
  item: MoodItem | { type: MoodItem['type'] }
  defaultTag: MoodTag
  onClose: () => void
  onSave: (i: MoodItem) => void
}) {
  const [f, setF] = useState<MoodItem>(() =>
    'id' in item
      ? item
      : {
          id: uid(),
          type: item.type,
          tag: defaultTag,
          title: '',
          text: '',
          colors:
            item.type === 'palette'
              ? [
                  { name: 'Warna 1', hex: '#BC5B3A' },
                  { name: 'Warna 2', hex: '#F3EDE4' },
                  { name: 'Warna 3', hex: '#D9A441' },
                  { name: 'Warna 4', hex: '#4F7A5A' },
                ]
              : undefined,
          createdAt: Date.now(),
        },
  )
  const setColor = (idx: number, patch: Partial<{ name: string; hex: string }>) =>
    setF((x) => ({ ...x, colors: x.colors!.map((c, i) => (i === idx ? { ...c, ...patch } : c)) }))

  const titles = { image: 'Foto', note: 'Catatan', palette: 'Palet warna' }
  return (
    <Modal
      open
      onClose={onClose}
      title={titles[f.type]}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Batal
          </Button>
          <Button onClick={() => onSave(f)}>Simpan</Button>
        </>
      }
    >
      <div className="space-y-4">
        {f.type === 'image' && <img src={f.src} alt="" className="max-h-60 w-full rounded-xl object-contain" />}
        <Field label="Label">
          <Select value={f.tag} onChange={(v) => setF({ ...f, tag: v as MoodTag })} options={TAGS} />
        </Field>
        <Field label={f.type === 'image' ? 'Keterangan' : 'Judul'}>
          <Input value={f.title ?? ''} onChange={(e) => setF({ ...f, title: e.target.value })} />
        </Field>
        {f.type !== 'image' && (
          <Field label={f.type === 'note' ? 'Isi catatan' : 'Deskripsi'}>
            <textarea className="input min-h-28" value={f.text ?? ''} onChange={(e) => setF({ ...f, text: e.target.value })} />
          </Field>
        )}
        {f.type === 'palette' && (
          <div className="space-y-2">
            <p className="label">Warna</p>
            {f.colors!.map((c, i) => (
              <div key={i} className="flex items-center gap-2">
                <input type="color" value={c.hex} onChange={(e) => setColor(i, { hex: e.target.value })} className="h-11 w-14 shrink-0 cursor-pointer rounded-lg border border-line bg-white p-1" />
                <Input value={c.name} onChange={(e) => setColor(i, { name: e.target.value })} />
                <Input className="w-28 shrink-0" value={c.hex} onChange={(e) => setColor(i, { hex: e.target.value })} />
                <IconButton disabled={f.colors!.length <= 1} onClick={() => setF({ ...f, colors: f.colors!.filter((_, j) => j !== i) })}>
                  <Trash2 size={16} />
                </IconButton>
              </div>
            ))}
            {f.colors!.length < 8 && (
              <Button size="sm" variant="soft" onClick={() => setF({ ...f, colors: [...f.colors!, { name: `Warna ${f.colors!.length + 1}`, hex: '#CCCCCC' }] })}>
                <Plus size={15} /> Tambah warna
              </Button>
            )}
          </div>
        )}
      </div>
    </Modal>
  )
}
