import { Product, CartItem, PaymentType, DocumentType } from '../types'

interface CartState {
  items: CartItem[]
  businessName: string
  vat: string
  iban: string
  invoiceDate: string
  paymentTerms: string
  document_type?: DocumentType
  payment_type?: PaymentType
  payment_days?: number
  deposit_percent?: number
  balance_days?: number
  shared_user_ids?: number[]
  selectedListinoId: number | null
  showCommissions: boolean
}

let state: CartState = {
  items: [],
  businessName: '',
  vat: '',
  iban: '',
  invoiceDate: '',
  paymentTerms: '30',
  selectedListinoId: null,
  showCommissions: false,
}
const listeners: Set<() => void> = new Set()

function notify(): void {
  listeners.forEach(l => l())
}

export const cartStore = {
  getState: () => state,

  subscribe: (listener: () => void) => {
    listeners.add(listener)
    return () => { listeners.delete(listener) }
  },

  addItem: (product: Product, cartoni?: number) => {
    const piecesPerCase = product.pieces_per_case || 1
    const quantity = cartoni ? cartoni * piecesPerCase : 1
    const existing = state.items.find(i => i.product.id === product.id)
    if (existing) {
      existing.quantity += quantity
    } else {
      state.items.push({ product, quantity, pieces_per_case: piecesPerCase })
    }
    state = { ...state }
    notify()
  },

  updateQuantity: (productId: number, quantity: number) => {
    if (quantity <= 0) {
      state.items = state.items.filter(i => i.product.id !== productId)
    } else {
      const item = state.items.find(i => i.product.id === productId)
      if (item) item.quantity = quantity
    }
    state = { ...state }
    notify()
  },

  updateItemPrice: (productId: number, customPrice: number) => {
    const item = state.items.find(i => i.product.id === productId)
    if (item) {
      item.customPrice = customPrice
    }
    state = { ...state }
    notify()
  },

  removeItem: (productId: number) => {
    state.items = state.items.filter(i => i.product.id !== productId)
    state = { ...state }
    notify()
  },

  clearCart: () => {
    state.items = []
    state.showCommissions = false
    state = { ...state }
    notify()
  },

  setBusinessInfo: (info: Partial<Pick<CartState, 'businessName' | 'vat' | 'iban' | 'invoiceDate' | 'paymentTerms' | 'document_type' | 'payment_type' | 'payment_days' | 'deposit_percent' | 'balance_days' | 'shared_user_ids'>>) => {
    state = { ...state, ...info }
    notify()
  },

  setSelectedListino: (listinoId: number | null) => {
    state.selectedListinoId = listinoId
    notify()
  },

  setShowCommissions: (show: boolean) => {
    state.showCommissions = show
    notify()
  },

  getItemEffectivePrice: (item: CartItem): number => {
    return item.customPrice ?? item.product.price
  },

  getItemEffectiveTotal: (item: CartItem): number => {
    return cartStore.getItemEffectivePrice(item) * item.quantity
  },

  getTotal: (): number => {
    return state.items.reduce((sum, item) => {
      return sum + cartStore.getItemEffectivePrice(item) * item.quantity
    }, 0)
  },

  getItemCount: (): number => {
    return state.items.reduce((sum, item) => sum + item.quantity, 0)
  },

  reset: () => {
    state = { items: [], businessName: '', vat: '', iban: '', invoiceDate: '', paymentTerms: '30', selectedListinoId: null, showCommissions: false }
    notify()
  },}
