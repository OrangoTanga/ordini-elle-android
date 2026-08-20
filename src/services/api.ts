import AsyncStorage from '@react-native-async-storage/async-storage'
import { Product, Order, Customer, ApiResponse, LoginResponseData, ListinoPrice, User } from '../types'
import { getWorkerUrl } from '../config'
import { encryptData, decryptData } from './crypto'

let cryptoPassword = ''
let cryptoSalt = ''

export function setCryptoKey(password: string, salt: string): void {
  cryptoPassword = password
  cryptoSalt = salt
}

const SENSITIVE_FIELDS = ['business_name', 'vat', 'iban', 'notes']

async function encryptOrderFields(body: any): Promise<any> {
  const cloned = { ...body }
  for (const field of SENSITIVE_FIELDS) {
    if (cloned[field] && cryptoPassword && cryptoSalt) {
      cloned[field] = await encryptData(cloned[field], cryptoPassword, cryptoSalt)
    }
  }
  return cloned
}

async function decryptOrderFields(data: any): Promise<any> {
  if (Array.isArray(data)) {
    return Promise.all(data.map(d => decryptOrderFields(d)))
  }
  if (data && typeof data === 'object') {
    const cloned = { ...data }
    for (const field of SENSITIVE_FIELDS) {
      if (cloned[field] && cryptoPassword && cryptoSalt && !cloned[field].startsWith('{') && !cloned[field].startsWith('[')) {
        try {
          cloned[field] = await decryptData(cloned[field], cryptoPassword, cryptoSalt)
        } catch { }
      }
    }
    return cloned
  }
  return data
}

async function getToken(): Promise<string | null> {
  return AsyncStorage.getItem('auth_token')
}

async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const token = await getToken()
  const baseUrl = await getWorkerUrl()

  try {
    const res = await fetch(`${baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    })
    const json = await res.json()

    if (json.data && cryptoPassword && cryptoSalt) {
      json.data = await decryptOrderFields(json.data)
    }

    return json
  } catch (err: any) {
    return { success: false, error: err.message || 'Errore di connessione' }
  }
}

export const api = {
  auth: {
    login: async (username: string, password: string) =>
      fetchApi<LoginResponseData>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      }),

    verify: async (token: string) =>
      fetchApi<{ valid: boolean }>('/api/auth/verify', {
        method: 'POST',
        body: JSON.stringify({ token }),
      }),
  },

  users: {
    list: async () => fetchApi<User[]>('/api/users'),
  },

  products: {
    list: async () =>
      fetchApi<Product[]>('/api/products'),

    get: async (id: number) =>
      fetchApi<Product>(`/api/products/${id}`),
  },

  customers: {
    list: async () =>
      fetchApi<Customer[]>('/api/customers'),

    create: async (data: { business_name: string; vat?: string; iban?: string; address?: string; phone?: string; email?: string }) =>
      fetchApi<Customer>('/api/customers', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    delete: async (id: number) =>
      fetchApi<Customer>(`/api/customers/${id}`, { method: 'DELETE' }),
  },

  orders: {
    create: async (order: Omit<Order, 'id' | 'created_at' | 'updated_at' | 'user_id' | 'status'> & { listino_id?: number }) => {
      const body: any = await encryptOrderFields(order)
      body.payment_type = order.payment_type
      body.payment_days = order.payment_days
      body.deposit_percent = order.deposit_percent
      body.balance_days = order.balance_days
      body.shared_user_ids = (order as any).shared_user_ids
      return fetchApi<Order>('/api/orders', {
        method: 'POST',
        body: JSON.stringify(body),
      })
    },

    list: async (filters?: { status?: string; search?: string; from?: string; to?: string; minTotal?: number; maxTotal?: number }) => {
      const params = new URLSearchParams()
      if (filters?.status) params.set('status', filters.status)
      if (filters?.search) params.set('search', filters.search)
      if (filters?.from) params.set('from', filters.from)
      if (filters?.to) params.set('to', filters.to)
      if (filters?.minTotal != null) params.set('min_total', String(filters.minTotal))
      if (filters?.maxTotal != null) params.set('max_total', String(filters.maxTotal))
      const qs = params.toString()
      return fetchApi<Order[]>(`/api/orders${qs ? `?${qs}` : ''}`)
    },

    get: async (id: number) =>
      fetchApi<Order>(`/api/orders/${id}`),
  },

  payments: {
    list: async (filters?: Record<string, string>) => {
      const params = new URLSearchParams(filters || {})
      const qs = params.toString()
      return fetchApi<any[]>(`/api/payments${qs ? `?${qs}` : ''}`)
    },
    update: async (id: number, data: any) =>
      fetchApi<any>(`/api/payments/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    summary: async (filters?: Record<string, string>) => {
      const params = new URLSearchParams(filters || {})
      const qs = params.toString()
      return fetchApi<any>(`/api/payments/summary${qs ? `?${qs}` : ''}`)
    },
  },

  listini: {
    list: async () => fetchApi<any[]>('/api/listini'),

    get: async (id: number) => fetchApi<any>(`/api/listini/${id}`),
  },

  listinoPrices: {
    get: async (productId: number) => fetchApi<ListinoPrice[]>(`/api/listino-prices/${productId}`),

    update: async (productId: number, prices: { listino_id: number; price: number }[]) =>
      fetchApi<ListinoPrice[]>(`/api/listino-prices/${productId}`, {
        method: 'PUT',
        body: JSON.stringify({ prices }),
      }),
  },

  settings: {
    get: async () => fetchApi<Record<string, string>>('/api/settings'),

    update: async (settings: Record<string, string>) =>
      fetchApi<Record<string, string>>('/api/settings', {
        method: 'PUT',
        body: JSON.stringify(settings),
      }),
  },

  commissionExceptions: {
    list: async () => fetchApi<any[]>('/api/commission-exceptions'),

    create: async (data: { listino_id: number; category: string; commission_percent: number }) =>
      fetchApi<any>('/api/commission-exceptions', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    update: async (id: number, data: { listino_id?: number; category?: string; commission_percent?: number }) =>
      fetchApi<any>(`/api/commission-exceptions/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    delete: async (id: number) =>
      fetchApi<any>(`/api/commission-exceptions/${id}`, { method: 'DELETE' }),
  },

  categories: {
    list: async () =>
      fetchApi<{ id: number; name: string; sort_order: number }[]>('/api/categories'),
  },

  productCommissionOverrides: {
    list: (productId: number) => fetchApi<any[]>(`/api/product-commission-overrides/${productId}`),
    update: (productId: number, overrides: { listino_id: number; commission_percent: number }[]) =>
      fetchApi<any[]>(`/api/product-commission-overrides/${productId}`, { method: 'PUT', body: JSON.stringify({ overrides }) }),
    delete: (productId: number) => fetchApi<any>(`/api/product-commission-overrides/${productId}`, { method: 'DELETE' }),
    autoCalculate: (productId: number) =>
      fetchApi<any>('/api/product-commission-overrides/auto-calculate', { method: 'POST', body: JSON.stringify({ product_id: productId }) }),
  },

  health: async () => {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 5000)
      const res = await fetch(`${await getWorkerUrl()}/health`, { method: 'GET', signal: controller.signal })
      clearTimeout(timeout)
      return res.ok
    } catch {
      return false
    }
  },
}
