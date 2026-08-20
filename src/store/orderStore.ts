import { Order } from '../types'
import { api } from '../services/api'

export interface OrderFilters {
  status?: string
  search?: string
  from?: string
  to?: string
  minTotal?: number
  maxTotal?: number
}

interface OrderState {
  orders: Order[]
  isLoading: boolean
}

let state: OrderState = {
  orders: [],
  isLoading: false,
}

const listeners: Set<() => void> = new Set()

function notify(): void {
  listeners.forEach(l => l())
}

export const orderStore = {
  getState: () => state,

  subscribe: (listener: () => void) => {
    listeners.add(listener)
    return () => { listeners.delete(listener) }
  },

  fetchOrders: async (filters?: OrderFilters) => {
    state = { ...state, isLoading: true }
    notify()

    const result = await api.orders.list(filters)
    if (result.success) {
      state = { orders: result.data || [], isLoading: false }
    } else {
      state = { ...state, isLoading: false }
    }
    notify()
  },

  addOrder: (order: Order) => {
    state = { ...state, orders: [order, ...state.orders] }
    notify()
  },

  updateOrderStatus: (orderId: number, status: string) => {
    state = {
      ...state,
      orders: state.orders.map(o =>
        o.id === orderId ? { ...o, status: status as Order['status'] } : o
      ),
    }
    notify()
  },
}
