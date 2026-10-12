import { create } from 'zustand'
import { emptyData, exportData, useStore, type Data } from '../store'
import { supabase } from './supabase'

export type SyncStatus = 'loading' | 'saving' | 'saved' | 'offline'

export const useSync = create<{ status: SyncStatus; error: string; plannerId: string }>(() => ({ status: 'loading', error: '', plannerId: '' }))

/** Which planner the local cache holds. */
const OWNER_KEY = 'wedding-planner-owner'
/** Last known planner per account, so a partner still opens the shared planner offline. */
const plannerKey = (uid: string) => `wedding-planner-planner-of-${uid}`
const SAVE_DELAY = 1200

// Planner row we read and write: our own, or the owner's when we are their partner.
let plannerId: string | null = null
let lastRemoteAt = ''
let dirty = false
let saving = false
let applyingRemote = false
let timer: ReturnType<typeof setTimeout> | undefined
let cleanup: (() => void) | undefined
// Bumped on every start/stop so a superseded startSync() stops after its await.
let generation = 0

const setStatus = (status: SyncStatus, error = '') => useSync.setState({ status, error })

const getItem = (key: string) => {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}
const setItem = (key: string, value: string | null) => {
  try {
    if (value) localStorage.setItem(key, value)
    else localStorage.removeItem(key)
  } catch {
    /* storage blocked */
  }
}
const getOwner = () => getItem(OWNER_KEY)
const setOwner = (id: string | null) => setItem(OWNER_KEY, id)

/** Works before the partner migration is applied too: then every account uses its own planner. */
async function resolvePlanner(uid: string) {
  const { data, error } = await supabase.rpc('my_planner_id')
  if (!error && typeof data === 'string') {
    setItem(plannerKey(uid), data)
    return data
  }
  return getItem(plannerKey(uid)) ?? uid
}

function applyRemote(data: Partial<Data>) {
  applyingRemote = true
  useStore.getState().importData({ ...emptyData(), ...data } as Data)
  applyingRemote = false
}

async function push() {
  if (!plannerId || saving) return
  clearTimeout(timer)
  saving = true
  dirty = false
  setStatus('saving')
  const { data, error } = await supabase.from('planner').upsert({ user_id: plannerId, data: exportData() }).select('updated_at').single()
  saving = false
  if (error) {
    dirty = true
    setStatus('offline', error.message)
    timer = setTimeout(push, 8000)
    return
  }
  lastRemoteAt = data.updated_at
  if (dirty) schedule()
  else setStatus('saved')
}

function schedule() {
  clearTimeout(timer)
  timer = setTimeout(push, SAVE_DELAY)
}

/** Pick up changes made on another device. */
async function pull() {
  if (!plannerId || dirty || saving) return
  const { data, error } = await supabase.from('planner').select('data, updated_at').eq('user_id', plannerId).maybeSingle()
  if (error || !data || dirty || saving) return
  if (data.updated_at > lastRemoteAt) {
    lastRemoteAt = data.updated_at
    applyRemote(data.data as Partial<Data>)
  }
}

/**
 * Load the signed-in user's planner from Supabase (or seed it from the local
 * data on first login) and keep saving changes back.
 */
export async function startSync(uid: string) {
  stopSync()
  const gen = generation
  setStatus('loading')

  const pid = await resolvePlanner(uid)
  if (gen !== generation) return
  plannerId = pid
  useSync.setState({ plannerId: pid })

  const owner = getOwner()
  // Local cache holds another planner: never show or upload it here.
  if (owner && owner !== pid) applyRemote(emptyData())

  const { data, error } = await supabase.from('planner').select('data, updated_at').eq('user_id', pid).maybeSingle()
  if (gen !== generation) return
  if (error) {
    // Offline: keep working on the local copy of this planner and retry saving later.
    if (owner !== pid) throw error
    setStatus('offline', error.message)
    dirty = true
    schedule()
  } else if (data) {
    lastRemoteAt = data.updated_at
    applyRemote(data.data as Partial<Data>)
    setStatus('saved')
  } else {
    // First login: whatever is on this device (e.g. data entered before accounts existed) becomes the cloud copy.
    await push()
    if (gen !== generation) return
  }
  setOwner(pid)

  const unsub = useStore.subscribe(() => {
    if (applyingRemote) return
    dirty = true
    setStatus('saving')
    schedule()
  })
  const onVisible = () => {
    if (document.visibilityState === 'hidden') {
      if (dirty) push()
    } else pull()
  }
  const onOnline = () => (dirty ? push() : pull())
  // The partner's saves show up without waiting for a focus/visibility change.
  const channel = supabase
    .channel(`planner:${pid}`)
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'planner', filter: `user_id=eq.${pid}` }, () => pull())
    .subscribe()
  document.addEventListener('visibilitychange', onVisible)
  window.addEventListener('focus', pull)
  window.addEventListener('online', onOnline)
  cleanup = () => {
    unsub()
    supabase.removeChannel(channel)
    document.removeEventListener('visibilitychange', onVisible)
    window.removeEventListener('focus', pull)
    window.removeEventListener('online', onOnline)
  }
}

export function stopSync() {
  generation++
  cleanup?.()
  cleanup = undefined
  clearTimeout(timer)
  plannerId = null
  lastRemoteAt = ''
  dirty = false
}

/** Save pending changes, then sign out and wipe this device's copy. */
export async function signOut() {
  if (dirty) await push()
  stopSync()
  applyRemote(emptyData())
  setOwner(null)
  await supabase.auth.signOut()
}
