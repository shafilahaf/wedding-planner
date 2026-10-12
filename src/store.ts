import { create } from 'zustand'
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware'
import { get as idbGet, set as idbSet, del as idbDel } from 'idb-keyval'
import { uid } from './lib/utils'
import { BUDGET_CATEGORIES } from './lib/templates'

export type Priority = 'tinggi' | 'sedang' | 'rendah'

export interface Profile {
  brideName: string
  groomName: string
  akadDate: string
  akadTime: string
  akadVenue: string
  akadAddress: string
  resepsiDate: string
  resepsiTime: string
  resepsiVenue: string
  resepsiAddress: string
  coverPhoto: string
  totalBudget: number
  savingsTarget: number
  invitationLink: string
  inviteMessage: string
}

export interface Task {
  id: string
  title: string
  category: string
  deadline: string
  priority: Priority
  done: boolean
  notes: string
  createdAt: number
}

export type Rsvp = 'belum' | 'hadir' | 'tidak' | 'ragu'
export type Side = 'pria' | 'wanita' | 'bersama'

export interface Guest {
  id: string
  name: string
  phone: string
  side: Side
  group: string
  pax: number
  rsvp: Rsvp
  sent: boolean
  event: 'akad' | 'resepsi' | 'keduanya'
  gift: number
  notes: string
}

export interface Expense {
  id: string
  name: string
  category: string
  planned: number
  actual: number
  paid: number
  dueDate: string
  vendorId: string
  notes: string
}

export interface BudgetCategory {
  id: string
  name: string
  allocation: number
}

export type VendorStatus = 'survey' | 'nego' | 'booked' | 'batal'

export interface Vendor {
  id: string
  name: string
  category: string
  contact: string
  phone: string
  instagram: string
  price: number
  status: VendorStatus
  rating: number
  notes: string
}

export interface RundownItem {
  id: string
  session: string
  time: string
  title: string
  pic: string
  notes: string
}

export interface SeserahanItem {
  id: string
  name: string
  budget: number
  price: number
  bought: boolean
  notes: string
}

export interface SavingTx {
  id: string
  date: string
  amount: number
  who: string
  note: string
}

export type MoodTag = 'Dekorasi' | 'Gaun' | 'Groom' | 'Venue' | 'Makanan' | 'Lainnya'

export interface MoodItem {
  id: string
  type: 'image' | 'note' | 'palette'
  tag: MoodTag
  src?: string
  title?: string
  text?: string
  colors?: { name: string; hex: string }[]
  createdAt: number
}

export interface Board {
  id: string
  name: string
  items: MoodItem[]
}

export interface Note {
  id: string
  title: string
  body: string
  updatedAt: number
}

export interface Data {
  profile: Profile
  tasks: Task[]
  guests: Guest[]
  expenses: Expense[]
  budgetCategories: BudgetCategory[]
  vendors: Vendor[]
  rundown: RundownItem[]
  seserahan: SeserahanItem[]
  savings: SavingTx[]
  boards: Board[]
  notes: Note[]
  guestGroups: string[]
}

type Collections = Omit<Data, 'profile' | 'guestGroups'>
type CollectionKey = keyof Collections
type ItemOf<K extends CollectionKey> = Collections[K][number]

interface Actions {
  setProfile: (p: Partial<Profile>) => void
  add: <K extends CollectionKey>(key: K, item: Omit<ItemOf<K>, 'id'> & { id?: string }) => string
  addMany: <K extends CollectionKey>(key: K, items: Omit<ItemOf<K>, 'id'>[]) => void
  update: <K extends CollectionKey>(key: K, id: string, patch: Partial<ItemOf<K>>) => void
  remove: <K extends CollectionKey>(key: K, id: string) => void
  setGuestGroups: (groups: string[]) => void
  importData: (d: Data) => void
  reset: () => void
}

export const emptyData = (): Data => ({
  profile: {
    brideName: '',
    groomName: '',
    akadDate: '',
    akadTime: '08:00',
    akadVenue: '',
    akadAddress: '',
    resepsiDate: '',
    resepsiTime: '11:00',
    resepsiVenue: '',
    resepsiAddress: '',
    coverPhoto: '',
    totalBudget: 0,
    savingsTarget: 0,
    invitationLink: '',
    inviteMessage:
      'Assalamu’alaikum Wr. Wb.\n\nKepada Yth. {nama}\n\nTanpa mengurangi rasa hormat, kami mengundang Bapak/Ibu/Saudara/i untuk hadir di acara pernikahan kami:\n\n{pengantin}\n\n{tanggal}\n{lokasi}\n\nInfo lengkap & RSVP: {link}\n\nMerupakan suatu kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu.\n\nTerima kasih 🙏',
  },
  tasks: [],
  guests: [],
  expenses: [],
  budgetCategories: BUDGET_CATEGORIES.map((c) => ({ id: uid(), name: c.name, allocation: 0 })),
  vendors: [],
  rundown: [],
  seserahan: [],
  savings: [],
  boards: [{ id: uid(), name: 'Inspirasi', items: [] }],
  notes: [],
  guestGroups: ['Keluarga', 'Teman', 'Kantor', 'Tetangga', 'Lainnya'],
})

function pickData(s: Data): Data {
  return {
    profile: s.profile,
    tasks: s.tasks,
    guests: s.guests,
    expenses: s.expenses,
    budgetCategories: s.budgetCategories,
    vendors: s.vendors,
    rundown: s.rundown,
    seserahan: s.seserahan,
    savings: s.savings,
    boards: s.boards,
    notes: s.notes,
    guestGroups: s.guestGroups,
  }
}

/**
 * IndexedDB holds the data (no 5MB limit, so photos fit). localStorage gets a
 * synchronous copy when it fits, so an edit made right before a refresh or tab
 * close is never lost while the async IndexedDB write is still in flight.
 * Each copy is prefixed with a timestamp and the newest one wins on load.
 */
const stamp = (v: string) => `${Date.now()}|${v}`
const unstamp = (s: string | null | undefined): [number, string | null] => {
  if (!s) return [0, null]
  const i = s.indexOf('|')
  return [Number(s.slice(0, i)) || 0, s.slice(i + 1)]
}

const hybridStorage: StateStorage = {
  getItem: async (name) => {
    const [ti, vi] = unstamp(await idbGet<string>(name).catch(() => undefined))
    let local: string | null = null
    try {
      local = localStorage.getItem(name)
    } catch {
      /* storage blocked */
    }
    const [tl, vl] = unstamp(local)
    return tl > ti ? vl : vi
  },
  setItem: async (name, value) => {
    const v = stamp(value)
    try {
      localStorage.setItem(name, v)
    } catch {
      // Too big for localStorage (e.g. many photos): drop the stale copy.
      try {
        localStorage.removeItem(name)
      } catch {
        /* storage blocked */
      }
    }
    await idbSet(name, v)
  },
  removeItem: async (name) => {
    try {
      localStorage.removeItem(name)
    } catch {
      /* storage blocked */
    }
    await idbDel(name)
  },
}

export const useStore = create<Data & Actions>()(
  persist(
    (set) => ({
      ...emptyData(),
      setProfile: (p) => set((s) => ({ profile: { ...s.profile, ...p } })),
      add: (key, item) => {
        const id = item.id ?? uid()
        set((s) => ({ [key]: [...s[key], { ...item, id }] }) as Partial<Data>)
        return id
      },
      addMany: (key, items) =>
        set((s) => ({ [key]: [...s[key], ...items.map((i) => ({ ...i, id: uid() }))] }) as Partial<Data>),
      update: (key, id, patch) =>
        set(
          (s) =>
            ({
              [key]: (s[key] as { id: string }[]).map((x) => (x.id === id ? { ...x, ...patch } : x)),
            }) as Partial<Data>,
        ),
      remove: (key, id) =>
        set((s) => ({ [key]: (s[key] as { id: string }[]).filter((x) => x.id !== id) }) as Partial<Data>),
      setGuestGroups: (guestGroups) => set({ guestGroups }),
      importData: (d) => set({ ...emptyData(), ...d, profile: { ...emptyData().profile, ...d.profile } }),
      reset: () => set(emptyData()),
    }),
    {
      name: 'wedding-planner',
      storage: createJSONStorage(() => hybridStorage),
      partialize: (s) => pickData(s),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<Data>
        return { ...current, ...p, profile: { ...current.profile, ...p.profile } }
      },
    },
  ),
)

export const exportData = (): Data => pickData(useStore.getState())

/** The main wedding date: akad if set, otherwise resepsi. */
export const weddingDate = (p: Profile) => p.akadDate || p.resepsiDate

export const savingsBalance = (txs: SavingTx[]) => txs.reduce((a, t) => a + t.amount, 0)

export const coupleName = (p: Profile) =>
  [p.brideName, p.groomName].filter(Boolean).join(' & ') || 'Calon Pengantin'
