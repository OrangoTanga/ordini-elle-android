import AsyncStorage from '@react-native-async-storage/async-storage'
import Constants from 'expo-constants'
import { Linking } from 'react-native'
import { getWorkerUrl } from '../config'

export interface AppVersionInfo {
  version: string | null
  url: string | null
  mandatory: boolean
  notes: string
}

interface UpdateState {
  info: AppVersionInfo | null
  currentVersion: string
  dismissed: boolean
  downloading: boolean
  error: string
}

const CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000
const LAST_CHECK_KEY = 'last_update_check'

let state: UpdateState = {
  info: null,
  currentVersion: '',
  dismissed: false,
  downloading: false,
  error: '',
}

const listeners: Set<() => void> = new Set()
let timer: ReturnType<typeof setInterval> | null = null
let initialized = false

function notify(): void {
  listeners.forEach(l => l())
}

function compareVersions(a: string, b: string): -1 | 0 | 1 {
  const pa = parseVersion(a)
  const pb = parseVersion(b)
  if (!pa || !pb) return 0
  if (pa.major !== pb.major) return pa.major > pb.major ? 1 : -1
  if (pa.minor !== pb.minor) return pa.minor > pb.minor ? 1 : -1
  if (pa.patch !== pb.patch) return pa.patch > pb.patch ? 1 : -1
  return comparePre(pa.pre, pb.pre)
}

function parseVersion(value: string): { major: number; minor: number; patch: number; pre: string[] } | null {
  if (!value) return null
  const m = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z-.]+))?$/.exec(value.trim())
  if (!m) return null
  return { major: parseInt(m[1], 10), minor: parseInt(m[2], 10), patch: parseInt(m[3], 10), pre: m[4] ? m[4].split('.') : [] }
}

function comparePre(a: string[], b: string[]): -1 | 0 | 1 {
  if (a.length === 0 && b.length === 0) return 0
  if (a.length === 0) return 1
  if (b.length === 0) return -1
  const len = Math.min(a.length, b.length)
  for (let i = 0; i < len; i++) {
    const x = a[i]
    const y = b[i]
    const xn = /^\d+$/.test(x)
    const yn = /^\d+$/.test(y)
    if (xn && yn) {
      const dx = parseInt(x, 10)
      const dy = parseInt(y, 10)
      if (dx !== dy) return dx > dy ? 1 : -1
    } else if (xn !== yn) {
      return xn ? -1 : 1
    } else if (x !== y) {
      return x > y ? 1 : -1
    }
  }
  if (a.length !== b.length) return a.length > b.length ? 1 : -1
  return 0
}

async function runCheck(): Promise<void> {
  try {
    const workerUrl = await getWorkerUrl()
    const res = await fetch(`${workerUrl}/api/app-versions?platform=android`)
    if (!res.ok) return
    const payload = await res.json()
    const data: AppVersionInfo | undefined = payload?.data
    if (!data?.version) return

    const current = Constants.expoConfig?.version || Constants.nativeAppVersion || ''
    state.currentVersion = current
    const available = current ? compareVersions(current, data.version) < 0 : true
    if (available) {
      state.info = data
      await AsyncStorage.setItem(LAST_CHECK_KEY, String(Date.now()))
      notify()
    }
  } catch {
    // errore di rete: silenzioso
  }
}

export const updateStore = {
  getState: () => state,

  subscribe: (listener: () => void) => {
    listeners.add(listener)
    return () => { listeners.delete(listener) }
  },

  init: async () => {
    // Sempre controlla all'avvio, non solo la prima volta
    await runCheck()
    if (!initialized) {
      initialized = true
      timer = setInterval(runCheck, CHECK_INTERVAL_MS)
    }
  },

  checkNow: async () => {
    await runCheck()
  },

  dismiss: () => {
    state = { ...state, dismissed: true }
    notify()
  },

  updateNow: async () => {
    const url = state.info?.url
    if (!url || state.downloading) return
    state = { ...state, downloading: true, error: '' }
    notify()
    try {
      const supported = await Linking.canOpenURL(url)
      if (!supported) throw new Error('Impossibile aprire il link di download')
      await Linking.openURL(url)
    } catch (e: any) {
      state = { ...state, error: e?.message || 'Impossibile avviare il download' }
    } finally {
      state = { ...state, downloading: false }
      notify()
    }
  },
}