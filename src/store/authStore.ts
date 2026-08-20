import AsyncStorage from '@react-native-async-storage/async-storage'
import { User } from '../types'
import { api } from '../services/api'
import { setCryptoKey } from '../services/api'

interface AuthState {
  user: User | null
  token: string | null
  isLoggedIn: boolean
  isLoading: boolean
}

let state: AuthState = {
  user: null,
  token: null,
  isLoggedIn: false,
  isLoading: true,
}

const listeners: Set<() => void> = new Set()

function notify(): void {
  listeners.forEach(l => l())
}

export const authStore = {
  getState: () => state,

  subscribe: (listener: () => void) => {
    listeners.add(listener)
    return () => { listeners.delete(listener) }
  },

  init: async () => {
    const token = await AsyncStorage.getItem('auth_token')
    const userStr = await AsyncStorage.getItem('auth_user')

    if (token && userStr) {
      const result = await api.auth.verify(token)
      if (result.success && result.data?.valid) {
        state = { ...state, token, user: JSON.parse(userStr), isLoggedIn: true, isLoading: false }
      } else {
        await AsyncStorage.multiRemove(['auth_token', 'auth_user'])
        state = { ...state, isLoading: false }
      }
    } else {
      state = { ...state, isLoading: false }
    }
    notify()
  },

  login: async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const result = await api.auth.login(username, password)
    if (result.success && result.data) {
      const { token, user, crypto_salt } = result.data
      await AsyncStorage.setItem('auth_token', token)
      await AsyncStorage.setItem('auth_user', JSON.stringify(user))
      setCryptoKey(password, crypto_salt || '')
      state = { ...state, user, token, isLoggedIn: true }
      notify()
      return { success: true }
    }
    return { success: false, error: result.error || 'Login fallito' }
  },

  logout: async () => {
    await AsyncStorage.multiRemove(['auth_token', 'auth_user'])
    setCryptoKey('', '')
    state = { ...state, user: null, token: null, isLoggedIn: false }
    notify()
  },
}
