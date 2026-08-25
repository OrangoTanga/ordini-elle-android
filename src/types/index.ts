export type PaymentType = 'immediato' | 'anticipato' | 'dilazionato' | 'acconto_saldo'
export type DocumentType = 'scontrino' | 'fattura'
export type PaymentStatus = 'pending' | 'paid' | 'overdue' | 'partial'
export type OrderStatus = 'pending' | 'approved' | 'rejected'
export type ProductCategory = string

export const CATEGORIES: string[] = ['vino bianco', 'vino rosso', 'prosecco', 'birre', 'distillati', 'extra']

export interface User {
  id: number
  username: string
  name: string
  phone: string
  active: boolean
  created_at: string
}

export interface ListinoPrice {
  id: number
  product_id: number
  listino_id: number
  price: number
  listino_name: string
  sort_order: number
}

export interface Product {
  id: number
  name: string
  description: string
  price: number
  category: ProductCategory
  image_path: string
  active: boolean
  listino_prices?: ListinoPrice[]
  pieces_per_case?: number
}

export interface CartItem {
  product: Product
  quantity: number
  customPrice?: number
  pieces_per_case?: number
}

export interface OrderItemCommission {
  commission_percent: number
  commission: number
}

export interface CommissionDetail {
  commission_percent: number
  commission: number
}

export interface OrderItem {
  product_id: number
  product_name: string
  price: number
  quantity: number
  subtotal: number
  commission_percent?: number
  commission?: number
  pieces_per_case?: number
}

export interface Order {
  id?: number
  user_id: number
  user_name?: string
  business_name: string
  vat: string
  iban: string
  invoice_date: string
  payment_terms: string
  document_type?: DocumentType
  payment_type?: PaymentType
  payment_days?: number
  deposit_percent?: number
  balance_days?: number
  payment_status?: PaymentStatus
  total: number
  status: OrderStatus
  notes: string
  created_at: string
  updated_at?: string
  items: OrderItem[]
  listino_id?: number
  commission_total?: number
  commission_per_rep?: number
  payments?: Payment[]
  shared_reps?: OrderSharedRep[]
}

export interface Payment {
  id: number
  order_id: number
  amount: number
  due_date: string
  paid_date?: string
  paid_amount: number
  type: string
  status: PaymentStatus
  notes: string
  order_business_name?: string
  order_total?: number
  order_user_id?: number
}

export interface OrderSharedRep {
  id: number
  order_id: number
  user_id: number
  user_name: string
}

export interface PaymentSummary {
  pending_total: number
  overdue_total: number
  paid_total: number
  upcoming_count: number
}

export interface PendingOrder {
  id: string
  order: Omit<Order, 'id' | 'created_at' | 'updated_at' | 'user_id' | 'status'> & { user_id?: number; status?: OrderStatus }
  retry_count: number
  last_attempt: string | null
  created_at: string
}

export interface LoginResponseData {
  token: string
  user: User
  crypto_salt?: string
}

export interface Customer {
  id: number
  business_name: string
  vat: string
  iban: string
  address: string
  phone: string
  email: string
  user_id: number
  user_name?: string
  order_count?: number
  order_total?: number
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}
