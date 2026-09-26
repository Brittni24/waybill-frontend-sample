import { create } from 'zustand'
import { ACCOUNTS, type Account } from '@/domain/accounts'
import { refreshCaches, reportDevice, setOnline } from '@/domain/engine'
import { freshDevice, makeWorld, type PresetId } from '@/domain/presets'
import type { ServerData, World } from '@/domain/types'

const SERVER_KEY = 'waybill:server:v1'
const DEVICE_KEY = 'waybill:device:v1'
const SESSION_KEY = 'waybill:session:v1'
const REMEMBER_KEY = 'waybill:remember:v1'

const readJSON = <T,>(storage: Storage, key: string): T | null => {
  try {
    const raw = storage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

const writeJSON = (storage: Storage, key: string, value: unknown) => {
  try {
    const next = JSON.stringify(value)
    if (storage.getItem(key) !== next) storage.setItem(key, next)
  } catch {
    // storage full or blocked: the app keeps working from memory
  }
}

function loadWorld(): World {
  const s = readJSON<ServerData>(localStorage, SERVER_KEY)
  const d = readJSON<World['d']>(sessionStorage, DEVICE_KEY)
  if (s && s.epoch) {
    const w: World = { s, d: d ?? freshDevice() }
    if (!w.d.cache || Object.keys(w.d.cache).length === 0) refreshCaches(w)
    return w
  }
  const w = makeWorld('ordering')
  return w
}

// A driver's phone only ever holds that driver's own trips. Other roles hold none.
const scopeFor = (acc: Account | null) => (acc?.role === 'driver' ? acc.vehicleId : acc ? '-' : undefined)

function loadSession(): Account | null {
  const name = readJSON<string>(sessionStorage, SESSION_KEY) ?? readJSON<string>(localStorage, REMEMBER_KEY)
  return ACCOUNTS.find((a) => a.username === name) ?? null
}

interface Store {
  world: World
  session: Account | null
  act: <T>(fn: (w: World) => T) => T
  login: (username: string, pin: string, remember?: boolean) => { ok: boolean; reason?: string }
  logout: () => void
  reset: (preset: PresetId) => void
  setOnline: (online: boolean) => void
}

const initialSession = loadSession()
const initialWorld = loadWorld()
initialWorld.d.scopeVehicle = scopeFor(initialSession)
refreshCaches(initialWorld)

export const useStore = create<Store>((set, get) => ({
  world: initialWorld,
  session: initialSession,

  act: (fn) => {
    const stored = readJSON<ServerData>(localStorage, SERVER_KEY)
    const base = get().world
    const w: World = structuredClone({ s: stored && stored.epoch === base.s.epoch ? stored : base.s, d: base.d })
    const result = fn(w)
    if (w.d.online) refreshCaches(w)
    set({ world: w })
    writeJSON(localStorage, SERVER_KEY, w.s)
    writeJSON(sessionStorage, DEVICE_KEY, w.d)
    return result
  },

  login: (username, pin, remember) => {
    const acc = ACCOUNTS.find((a) => a.username === username.trim().toLowerCase())
    if (!acc) return { ok: false, reason: 'We could not find that staff ID.' }
    if (acc.pin !== pin) return { ok: false, reason: 'That PIN is not right.' }
    writeJSON(sessionStorage, SESSION_KEY, acc.username)
    if (remember) writeJSON(localStorage, REMEMBER_KEY, acc.username)
    set({ session: acc })
    get().act((w) => {
      w.d.scopeVehicle = scopeFor(acc)
    })
    return { ok: true }
  },

  logout: () => {
    try {
      sessionStorage.removeItem(SESSION_KEY)
      localStorage.removeItem(REMEMBER_KEY)
    } catch {
      // ignore
    }
    set({ session: null })
  },

  reset: (preset) => {
    const w = makeWorld(preset)
    w.d.scopeVehicle = scopeFor(get().session)
    refreshCaches(w)
    set({ world: w })
    writeJSON(localStorage, SERVER_KEY, w.s)
    writeJSON(sessionStorage, DEVICE_KEY, w.d)
  },

  setOnline: (online) => {
    const vid = get().session?.role === 'driver' ? get().session?.vehicleId : undefined
    get().act((w) => {
      setOnline(w, online)
      if (vid) reportDevice(w, vid, online)
    })
  },
}))

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key !== SERVER_KEY || !e.newValue) return
    try {
      const s = JSON.parse(e.newValue) as ServerData
      const cur = useStore.getState().world
      const d = s.epoch !== cur.s.epoch ? { ...freshDevice(), scopeVehicle: cur.d.scopeVehicle } : cur.d
      const w: World = structuredClone({ s, d })
      if (w.d.online) refreshCaches(w)
      useStore.setState({ world: w })
      writeJSON(sessionStorage, DEVICE_KEY, w.d)
    } catch {
      // ignore malformed data from another tab
    }
  })
  window.addEventListener('offline', () => useStore.getState().setOnline(false))
  writeJSON(localStorage, SERVER_KEY, useStore.getState().world.s)
}

export const useWorld = () => useStore((s) => s.world)
export const useServer = () => useStore((s) => s.world.s)
export const useDevice = () => useStore((s) => s.world.d)
export const useAct = () => useStore((s) => s.act)
