import * as SQLite from 'expo-sqlite'
import { Order, PendingOrder } from '../types'

let db: SQLite.SQLiteDatabase

export async function initLocalDb(): Promise<void> {
  db = await SQLite.openDatabaseAsync('ordini_local.db')

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS pending_orders (
      id TEXT PRIMARY KEY,
      order_data TEXT NOT NULL,
      retry_count INTEGER DEFAULT 0,
      last_attempt TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `)
}

export async function savePendingOrder(order: PendingOrder): Promise<void> {
  await db.runAsync(
    'INSERT OR REPLACE INTO pending_orders (id, order_data, retry_count, last_attempt, created_at) VALUES (?, ?, ?, ?, ?)',
    [order.id, JSON.stringify(order.order), order.retry_count, order.last_attempt, order.created_at]
  )
}

export async function getPendingOrders(): Promise<PendingOrder[]> {
  const rows = await db.getAllAsync('SELECT * FROM pending_orders ORDER BY created_at ASC')
  return rows.map((row: any) => ({
    ...row,
    order: JSON.parse(row.order_data),
  }))
}

export async function updatePendingOrder(id: string, retryCount: number): Promise<void> {
  await db.runAsync(
    'UPDATE pending_orders SET retry_count = ?, last_attempt = datetime("now") WHERE id = ?',
    [retryCount, id]
  )
}

export async function removePendingOrder(id: string): Promise<void> {
  await db.runAsync('DELETE FROM pending_orders WHERE id = ?', [id])
}

export async function getPendingCount(): Promise<number> {
  const result = await db.getFirstAsync('SELECT COUNT(*) as count FROM pending_orders') as { count: number }
  return result?.count || 0
}

export async function clearPendingOrders(): Promise<void> {
  await db.execAsync('DELETE FROM pending_orders')
}
