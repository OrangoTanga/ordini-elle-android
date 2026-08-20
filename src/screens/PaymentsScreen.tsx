import React, { useState, useEffect, useCallback } from 'react'
import { View, Text, FlatList, ScrollView, TouchableOpacity, Animated, RefreshControl } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { FadeInView } from '../components/FadeInView'
import { GlassCard } from '../components/GlassCard'
import { authStore } from '../store/authStore'
import { api } from '../services/api'

const FILTERS = [
  { key: '', label: 'Tutti' },
  { key: 'pending', label: 'In sospeso' },
  { key: 'overdue', label: 'Scaduti' },
  { key: 'paid', label: 'Pagati' },
]

export const PaymentsScreen: React.FC = () => {
  const [summary, setSummary] = useState<any>(null)
  const [payments, setPayments] = useState<any[]>([])
  const [filter, setFilter] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const { user } = authStore.getState()

  const fetchSummary = useCallback(async () => {
    if (!user?.id) return
    const res = await api.payments.summary({ user_id: String(user.id) })
    if (res.success) setSummary(res.data)
  }, [user?.id])

  const fetchPayments = useCallback(async () => {
    if (!user?.id) return
    const filters: Record<string, string> = { user_id: String(user.id) }
    if (filter) filters.status = filter
    const res = await api.payments.list(filters)
    if (res.success) setPayments(res.data || [])
  }, [user?.id, filter])

  useEffect(() => { fetchSummary() }, [fetchSummary])
  useEffect(() => { fetchPayments() }, [fetchPayments])

  const onRefresh = async () => {
    setRefreshing(true)
    await Promise.all([fetchSummary(), fetchPayments()])
    setRefreshing(false)
  }

  const summaryCards = summary ? [
    { label: 'In sospeso', value: summary.pending_total, color: '#FFC107', bg: 'rgba(255,193,7,0.1)', icon: '💰' },
    { label: 'Scaduti', value: summary.overdue_total, color: '#EF4444', bg: 'rgba(239,68,68,0.1)', icon: '🔴' },
    { label: 'Pagati', value: summary.paid_total, color: '#10B981', bg: 'rgba(16,185,129,0.1)', icon: '✅' },
  ] : []

  const renderPaymentItem = ({ item }: { item: any }) => {
    const statusColor = item.status === 'paid' ? '#10B981' :
      item.status === 'overdue' ? '#EF4444' : '#FFC107'
    const statusDot = item.status === 'paid' ? '🟢' :
      item.status === 'overdue' ? '🔴' : '⏳'
    const typeLabel = item.type === 'acconto' ? 'Acconto' :
      item.type === 'saldo' ? 'Saldo' : 'Pagamento'

    return (
      <GlassCard style={{ marginBottom: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Text style={{ fontSize: 18 }}>{statusDot}</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ color: 'rgba(255,255,255,0.92)', fontSize: 14, fontWeight: '600' }}>
              {item.order_business_name || '—'}
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.40)', fontSize: 12 }}>
              {typeLabel} · Scad. {item.due_date || '—'}
            </Text>
            {item.order_total != null && (
              <Text style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11 }}>
                Ordine: €{item.order_total?.toFixed(2)}
              </Text>
            )}
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ color: 'rgba(255,255,255,0.90)', fontSize: 15, fontWeight: '700' }}>
              €{item.amount?.toFixed(2)}
            </Text>
            <View style={{
              backgroundColor: statusColor + '20',
              borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2, marginTop: 4,
            }}>
              <Text style={{ color: statusColor, fontSize: 10, fontWeight: '600' }}>
                {item.status === 'paid' ? 'Pagato' :
                  item.status === 'overdue' ? 'Scaduto' :
                  item.status === 'partial' ? 'Parziale' : 'In sospeso'}
              </Text>
            </View>
          </View>
        </View>
      </GlassCard>
    )
  }

  return (
    <LinearGradient colors={['#0B1120', '#192734']} style={{ flex: 1 }}>
      <View style={{ paddingHorizontal: 16, paddingTop: 60, paddingBottom: 8 }}>
        <Text style={{ color: 'rgba(255,255,255,0.95)', fontSize: 22, fontWeight: '800' }}>
          Pagamenti
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0, paddingLeft: 16, marginBottom: 16 }}
        contentContainerStyle={{ gap: 10, paddingRight: 16 }}
      >
        {summaryCards.map((card, i) => (
          <FadeInView key={i} delay={i * 80} duration={300}>
            <View style={{
              backgroundColor: card.bg,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: card.color + '20',
              padding: 16,
              minWidth: 150,
            }}>
              <Text style={{ fontSize: 20, marginBottom: 6 }}>{card.icon}</Text>
              <Text style={{ color: card.color, fontSize: 22, fontWeight: '800' }}>
                €{(card.value ?? 0).toFixed(2)}
              </Text>
              <Text style={{ color: 'rgba(255,255,255,0.50)', fontSize: 12, marginTop: 2 }}>
                {card.label}
              </Text>
            </View>
          </FadeInView>
        ))}
        {!summary && (
          <View style={{ paddingVertical: 20 }}>
            <Text style={{ color: 'rgba(255,255,255,0.25)', fontSize: 13 }}>Caricamento...</Text>
          </View>
        )}
      </ScrollView>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0, paddingLeft: 16, marginBottom: 12 }}
        contentContainerStyle={{ gap: 8, paddingRight: 16 }}
      >
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f.key}
            onPress={() => setFilter(f.key)}
            style={{
              paddingHorizontal: 16, paddingVertical: 8,
              borderRadius: 20,
              backgroundColor: filter === f.key ? 'rgba(0,180,216,0.15)' : 'rgba(255,255,255,0.04)',
              borderWidth: 1,
              borderColor: filter === f.key ? 'rgba(0,180,216,0.3)' : 'rgba(255,255,255,0.06)',
            }}
          >
            <Text style={{
              color: filter === f.key ? '#00B4D8' : 'rgba(255,255,255,0.45)',
              fontSize: 13, fontWeight: filter === f.key ? '700' : '500',
            }}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={payments}
        renderItem={renderPaymentItem}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#00B4D8"
            colors={['#00B4D8']}
          />
        }
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingVertical: 60 }}>
            <Text style={{ fontSize: 48, marginBottom: 12 }}>💳</Text>
            <Text style={{ color: 'rgba(255,255,255,0.30)', fontSize: 14 }}>
              Nessun pagamento
            </Text>
          </View>
        }
      />
    </LinearGradient>
  )
}
