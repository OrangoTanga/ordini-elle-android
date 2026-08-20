import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'

const NOTIF_IDS_KEY = 'payment_notification_ids'
const CHANNEL_ID = 'payment-reminders'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldSetBadge: false,
  }),
})

export async function requestPermissions(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync()
  let finalStatus = existing
  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync()
    finalStatus = status
  }
  if (finalStatus !== 'granted') return false

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Promemoria Pagamenti',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#00B4D8',
    })
  }
  return true
}

function parseDueDate(due_date: string): Date {
  const d = new Date(due_date)
  d.setHours(9, 0, 0, 0)
  return d
}

export async function schedulePaymentReminders(
  payments: { id: number; due_date: string; amount: number; order_business_name?: string }[]
): Promise<void> {
  const granted = await requestPermissions()
  if (!granted) return

  const existing = JSON.parse((await AsyncStorage.getItem(NOTIF_IDS_KEY)) || '{}')

  for (const payment of payments) {
    const dueDate = parseDueDate(payment.due_date)
    if (dueDate.getTime() < Date.now()) continue

    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Pagamento in scadenza',
        body: `${payment.order_business_name || 'Ordine'}: €${payment.amount.toFixed(2)} entro il ${dueDate.toLocaleDateString('it-IT')}`,
        data: { paymentId: payment.id, type: 'payment_reminder' },
        sound: true,
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: dueDate },
    })
    existing[payment.id] = identifier
  }

  await AsyncStorage.setItem(NOTIF_IDS_KEY, JSON.stringify(existing))
}

export async function cancelPaymentReminder(paymentId: number): Promise<void> {
  const existing = JSON.parse((await AsyncStorage.getItem(NOTIF_IDS_KEY)) || '{}')
  const identifier = existing[paymentId]
  if (identifier) {
    await Notifications.cancelScheduledNotificationAsync(identifier)
    delete existing[paymentId]
    await AsyncStorage.setItem(NOTIF_IDS_KEY, JSON.stringify(existing))
  }
}

export async function syncPendingPayments(): Promise<void> {
  const { api } = await import('./api')
  const res = await api.payments.list({ status: 'pending,overdue' })
  if (res.success && res.data) {
    await schedulePaymentReminders(
      res.data.map((p: any) => ({
        id: p.id,
        due_date: p.due_date,
        amount: p.amount,
        order_business_name: p.order_business_name,
      }))
    )
  }
}
