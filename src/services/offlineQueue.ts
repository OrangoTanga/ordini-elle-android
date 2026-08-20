import { Order, PendingOrder } from '../types'
import { api } from './api'
import {
  savePendingOrder,
  getPendingOrders,
  updatePendingOrder as updatePendingInDb,
  removePendingOrder,
  getPendingCount,
} from '../database/localDb'

const MAX_RETRIES = 50
const RETRY_INTERVAL = 5 * 60 * 1000

let retryTimer: ReturnType<typeof setInterval> | null = null
let onStatusChange: ((count: number, syncing: boolean) => void) | null = null

export function setOnStatusChange(cb: typeof onStatusChange): void {
  onStatusChange = cb
}

export async function queueOrder(order: Omit<Order, 'id' | 'created_at' | 'updated_at' | 'user_id' | 'status'>): Promise<void> {
  const pendingOrder: PendingOrder = {
    id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    order,
    retry_count: 0,
    last_attempt: null,
    created_at: new Date().toISOString(),
  }

  await savePendingOrder(pendingOrder)
  startRetryLoop()
  notifyStatus()
}

async function trySendOrder(pending: PendingOrder): Promise<boolean> {
  try {
    const result = await api.orders.create(pending.order)
    if (result.success) {
      await removePendingOrder(pending.id)
      return true
    }
    return false
  } catch {
    return false
  }
}

export async function retryAllOrders(): Promise<{ sent: number; failed: number }> {
  const pending = await getPendingOrders()
  let sent = 0
  let failed = 0

  for (const order of pending) {
    if (order.retry_count >= MAX_RETRIES) {
      await removePendingOrder(order.id)
      failed++
      continue
    }

    const success = await trySendOrder(order)
    if (success) {
      sent++
    } else {
      await updatePendingInDb(order.id, order.retry_count + 1)
      failed++
    }
  }

  notifyStatus()
  return { sent, failed }
}

function startRetryLoop(): void {
  if (retryTimer) return

  retryTimer = setInterval(async () => {
    const count = await getPendingCount()
    if (count === 0) {
      stopRetryLoop()
      return
    }

    const healthOk = await api.health()
    if (healthOk) {
      await retryAllOrders()
    }

    notifyStatus()
  }, RETRY_INTERVAL)
}

function stopRetryLoop(): void {
  if (retryTimer) {
    clearInterval(retryTimer)
    retryTimer = null
  }
}

async function notifyStatus(): Promise<void> {
  if (onStatusChange) {
    const count = await getPendingCount()
    onStatusChange(count, retryTimer !== null)
  }
}

export function getQueueStatus(): { isRunning: boolean } {
  return { isRunning: retryTimer !== null }
}

export { getPendingCount }

export async function triggerManualSync(): Promise<{ sent: number; failed: number }> {
  return retryAllOrders()
}
