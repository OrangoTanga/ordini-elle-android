import React, { useEffect, useState, useCallback } from 'react'
import { View, Text, FlatList, ScrollView, TouchableOpacity, TextInput } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { orderStore, OrderFilters } from '../store/orderStore'
import { GlassCard } from '../components/GlassCard'
import { StatusBadge } from '../components/StatusBadge'
import { ConnectionIndicator } from '../components/ConnectionIndicator'
import { OrderCardShimmer } from '../components/ShimmerLoader'
import { FadeInView } from '../components/FadeInView'
import { GlassInput } from '../components/GlassInput'
import { GlassButton } from '../components/GlassButton'

export const OrderHistoryScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [refreshing, setRefreshing] = useState(false)
  const [state, setState] = useState(0)
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined)
  const [search, setSearch] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [minTotal, setMinTotal] = useState('')
  const [maxTotal, setMaxTotal] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  const buildFilters = useCallback((): OrderFilters => ({
    status: statusFilter,
    search: search || undefined,
    from: fromDate || undefined,
    to: toDate || undefined,
    minTotal: minTotal ? parseFloat(minTotal) : undefined,
    maxTotal: maxTotal ? parseFloat(maxTotal) : undefined,
  }), [statusFilter, search, fromDate, toDate, minTotal, maxTotal])

  useEffect(() => {
    orderStore.fetchOrders(buildFilters())
    const unsub = orderStore.subscribe(() => setState(s => s + 1))
    return unsub
  }, [buildFilters])

  const { orders, isLoading } = orderStore.getState()

  const statuses = [
    { label: 'Tutti', value: undefined },
    { label: 'In attesa', value: 'pending' },
    { label: 'Approvati', value: 'approved' },
    { label: 'Rifiutati', value: 'rejected' },
  ]

  const renderOrder = useCallback(({ item, index }: { item: any; index: number }) => (
    <FadeInView delay={index * 40} duration={300}>
      <TouchableOpacity
        onPress={() => navigation.navigate('OrderDetail', { order: item })}
        activeOpacity={0.85}
      >
        <GlassCard style={{ marginBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{
            width: 40, height: 40, borderRadius: 12,
            backgroundColor: 'rgba(255,255,255,0.04)',
            alignItems: 'center', justifyContent: 'center',
            borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
          }}>
            <Text style={{ fontSize: 18, opacity: 0.7 }}>🏪</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: 'rgba(255,255,255,0.92)', fontSize: 15, fontWeight: '600' }}>
              {item.business_name}
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, marginTop: 2 }}>
              {item.created_at?.split('T')[0]} · {item.user_name}
            </Text>
          </View>
          <Text style={{ color: '#00B4D8', fontSize: 16, fontWeight: '700' }}>
            €{item.total?.toFixed(2)}
          </Text>
          <StatusBadge status={item.status} size="sm" />
        </GlassCard>
      </TouchableOpacity>
    </FadeInView>
  ), [navigation])

  const hasActiveFilters = search || fromDate || toDate || minTotal || maxTotal

  return (
    <LinearGradient colors={['#0B1120', '#192734']} style={{ flex: 1 }}>
      <View style={{ paddingHorizontal: 16, paddingTop: 60, paddingBottom: 8 }}>
        <View style={{
          flexDirection: 'row', justifyContent: 'space-between',
          alignItems: 'center', marginBottom: 16,
        }}>
          <View>
            <Text style={{
              color: 'rgba(255,255,255,0.95)', fontSize: 26, fontWeight: '800',
              letterSpacing: -0.5,
            }}>
              Ordini
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.30)', fontSize: 12, marginTop: 2 }}>
              {orders.length} ordini
            </Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            <ConnectionIndicator />
            <TouchableOpacity onPress={() => setShowFilters(!showFilters)}>
              <View style={{
                paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20,
                backgroundColor: showFilters || hasActiveFilters
                  ? 'rgba(0,180,216,0.1)' : '#192734',
                borderWidth: 1,
                borderColor: showFilters || hasActiveFilters
                  ? 'rgba(0,180,216,0.3)' : 'rgba(255,255,255,0.06)',
              }}>
                <Text style={{
                  fontSize: 13, fontWeight: '600',
                  color: showFilters || hasActiveFilters ? '#00B4D8' : 'rgba(255,255,255,0.50)',
                }}>
                  🔍 Filtri
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginBottom: 12 }}
        >
          {statuses.map(f => (
            <TouchableOpacity
              key={f.label}
              onPress={() => setStatusFilter(f.value)}
              activeOpacity={0.8}
              style={{
                paddingHorizontal: 18,
                paddingVertical: 8,
                borderRadius: 20,
                marginRight: 8,
                backgroundColor: statusFilter === f.value
                  ? 'rgba(0,180,216,0.1)'
                  : '#192734',
                borderWidth: 1,
                borderColor: statusFilter === f.value
                  ? 'rgba(0,180,216,0.3)'
                  : 'rgba(255,255,255,0.06)',
              }}
            >
              <Text style={{
                fontSize: 13,
                fontWeight: statusFilter === f.value ? '700' : '500',
                color: statusFilter === f.value ? '#00B4D8' : 'rgba(255,255,255,0.50)',
              }}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {showFilters && (
          <FadeInView style={{
            backgroundColor: '#192734', borderRadius: 16,
            padding: 14, marginBottom: 12,
            borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
          }}>
            <Text style={{
              color: '#00B4D8', fontSize: 11, fontWeight: '600',
              letterSpacing: 0.5, marginBottom: 10,
            }}>
              FILTRI AVANZATI
            </Text>

            <View style={{ marginBottom: 10 }}>
              <Text style={{
                fontSize: 10, color: 'rgba(255,255,255,0.40)',
                marginBottom: 4, fontWeight: '600',
              }}>
                ATTIVITÀ
              </Text>
              <TextInput
                placeholder="Cerca per nome attività..."
                placeholderTextColor="rgba(255,255,255,0.20)"
                value={search}
                onChangeText={setSearch}
                style={{
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  borderRadius: 10, padding: 10,
                  color: 'white', fontSize: 13,
                  borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
                }}
              />
            </View>

            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={{
                  fontSize: 10, color: 'rgba(255,255,255,0.40)',
                  marginBottom: 4, fontWeight: '600',
                }}>
                  DA DATA
                </Text>
                <TextInput
                  placeholder="AAAA-MM-GG"
                  placeholderTextColor="rgba(255,255,255,0.20)"
                  value={fromDate}
                  onChangeText={setFromDate}
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    borderRadius: 10, padding: 10,
                    color: 'white', fontSize: 13,
                    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
                  }}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{
                  fontSize: 10, color: 'rgba(255,255,255,0.40)',
                  marginBottom: 4, fontWeight: '600',
                }}>
                  A DATA
                </Text>
                <TextInput
                  placeholder="AAAA-MM-GG"
                  placeholderTextColor="rgba(255,255,255,0.20)"
                  value={toDate}
                  onChangeText={setToDate}
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    borderRadius: 10, padding: 10,
                    color: 'white', fontSize: 13,
                    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
                  }}
                />
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={{
                  fontSize: 10, color: 'rgba(255,255,255,0.40)',
                  marginBottom: 4, fontWeight: '600',
                }}>
                  COSTO MINIMO (€)
                </Text>
                <TextInput
                  placeholder="0"
                  placeholderTextColor="rgba(255,255,255,0.20)"
                  value={minTotal}
                  onChangeText={setMinTotal}
                  keyboardType="numeric"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    borderRadius: 10, padding: 10,
                    color: 'white', fontSize: 13,
                    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
                  }}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{
                  fontSize: 10, color: 'rgba(255,255,255,0.40)',
                  marginBottom: 4, fontWeight: '600',
                }}>
                  COSTO MASSIMO (€)
                </Text>
                <TextInput
                  placeholder="9999"
                  placeholderTextColor="rgba(255,255,255,0.20)"
                  value={maxTotal}
                  onChangeText={setMaxTotal}
                  keyboardType="numeric"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    borderRadius: 10, padding: 10,
                    color: 'white', fontSize: 13,
                    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
                  }}
                />
              </View>
            </View>

            {hasActiveFilters && (
              <TouchableOpacity
                onPress={() => { setSearch(''); setFromDate(''); setToDate(''); setMinTotal(''); setMaxTotal('') }}
                style={{ alignItems: 'center', paddingVertical: 6 }}
              >
                <Text style={{ color: '#EF4444', fontSize: 12, fontWeight: '600' }}>
                  ✕ Cancella filtri
                </Text>
              </TouchableOpacity>
            )}
          </FadeInView>
        )}
      </View>

      {isLoading ? (
        <View style={{ paddingHorizontal: 16 }}>
          {[1, 2, 3, 4].map(i => <OrderCardShimmer key={i} />)}
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
          refreshing={refreshing}
          onRefresh={() => orderStore.fetchOrders(buildFilters())}
          renderItem={renderOrder}
          ListEmptyComponent={
            <FadeInView style={{ alignItems: 'center', paddingVertical: 60 }}>
              <Text style={{ fontSize: 40, marginBottom: 12, opacity: 0.3 }}>📭</Text>
              <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14 }}>
                {isLoading ? 'Caricamento...' : 'Nessun ordine trovato'}
              </Text>
            </FadeInView>
          }
        />
      )}
    </LinearGradient>
  )
}
