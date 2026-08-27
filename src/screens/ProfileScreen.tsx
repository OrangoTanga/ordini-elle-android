import React, { useState, useEffect, useCallback } from 'react'
import { View, Text, TouchableOpacity, FlatList, Alert } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { LinearGradient } from 'expo-linear-gradient'
import { GlassCard } from '../components/GlassCard'
import { GlassButton } from '../components/GlassButton'
import { GlassInput } from '../components/GlassInput'
import { ConnectionIndicator } from '../components/ConnectionIndicator'
import { authStore } from '../store/authStore'
import { api } from '../services/api'
import { updateStore } from '../services/updateService'
import { FadeInView } from '../components/FadeInView'
import type { Customer } from '../types'

const GRID_KEY = 'grid_columns'

export const ProfileScreen: React.FC = () => {
  const { user } = authStore.getState()
  const [pendingCount, setPendingCount] = useState(0)
  const [syncing, setSyncing] = useState(false)
  const [checkingUpdate, setCheckingUpdate] = useState(false)
  const [updateInfo, setUpdateInfo] = useState<{ version: string; url: string } | null>(null)
  const [gridCols, setGridCols] = useState(2)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [showCustomerForm, setShowCustomerForm] = useState(false)
  const [cf, setCf] = useState({ business_name: '', vat: '', iban: '', phone: '', email: '' })

  useEffect(() => {
    loadPending()
    loadCustomers()
    AsyncStorage.getItem(GRID_KEY).then(v => {
      if (v === '4' || v === '3' || v === '2') setGridCols(parseInt(v))
    })
    const interval = setInterval(loadPending, 10000)
    return () => clearInterval(interval)
  }, [])

  const loadPending = async () => {
    const count = await getPendingCount()
    setPendingCount(count)
  }

  const loadCustomers = async () => {
    const res = await api.customers.list()
    if (res.success) setCustomers(res.data || [])
  }

  const handleSync = async () => {
    setSyncing(true)
    await triggerManualSync()
    await loadPending()
    setSyncing(false)
  }

  const setGrid = (n: number) => {
    setGridCols(n)
    AsyncStorage.setItem(GRID_KEY, String(n))
  }

  const checkForUpdates = async () => {
    setCheckingUpdate(true)
    setUpdateInfo(null)
    await updateStore.checkNow()
    setTimeout(() => {
      const state = updateStore.getState()
      if (state.info && state.info.version) {
        setUpdateInfo({ version: state.info.version, url: state.info.url || '' })
      }
      setCheckingUpdate(false)
    }, 500)
  }

  const handleAddCustomer = async () => {
    if (!cf.business_name) return
    await api.customers.create(cf)
    setCf({ business_name: '', vat: '', iban: '', phone: '', email: '' })
    setShowCustomerForm(false)
    loadCustomers()
  }

  const handleDeleteCustomer = (c: Customer) => {
    Alert.alert(
      'Elimina cliente',
      `Rimuovere "${c.business_name}"?`,
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Elimina',
          style: 'destructive',
          onPress: async () => {
            await api.customers.delete(c.id)
            loadCustomers()
          },
        },
      ]
    )
  }

  return (
    <LinearGradient colors={['#0B1120', '#192734']} style={{ flex: 1 }}>
      <FlatList
        data={customers}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
        ListHeaderComponent={
          <View>
            <View style={{ paddingTop: 60, paddingBottom: 8 }}>
              <View style={{
                flexDirection: 'row', justifyContent: 'space-between',
                alignItems: 'center', marginBottom: 16,
              }}>
                <Text style={{
                  color: 'rgba(255,255,255,0.95)', fontSize: 26, fontWeight: '800',
                  letterSpacing: -0.5,
                }}>
                  Profilo
                </Text>
                <ConnectionIndicator />
              </View>
            </View>

            <FadeInView>
              <GlassCard style={{ alignItems: 'center', paddingVertical: 24, marginBottom: 16 }}>
                <LinearGradient
                  colors={['#00B4D8', '#0096b7']}
                  style={{
                    width: 72, height: 72, borderRadius: 36,
                    alignItems: 'center', justifyContent: 'center',
                    marginBottom: 12,
                  }}
                >
                  <Text style={{ fontSize: 28, fontWeight: '800', color: 'white' }}>
                    {user?.name?.charAt(0).toUpperCase() || '?'}
                  </Text>
                </LinearGradient>
                <Text style={{ color: 'rgba(255,255,255,0.95)', fontSize: 18, fontWeight: '700' }}>
                  {user?.name || 'Rappresentante'}
                </Text>
                <Text style={{ color: 'rgba(255,255,255,0.40)', fontSize: 13, marginTop: 2 }}>
                  @{user?.username}
                </Text>
              </GlassCard>
            </FadeInView>

            <FadeInView delay={80}>
              <GlassCard style={{ marginBottom: 16 }}>
                <Text style={{
                  fontSize: 11, color: '#00B4D8', marginBottom: 12,
                  letterSpacing: 1, fontWeight: '600',
                }}>
                  IMPOSTAZIONI CATALOGO
                </Text>
                <Text style={{ color: 'rgba(255,255,255,0.40)', fontSize: 13, marginBottom: 10 }}>
                  Colonne griglia prodotti:
                </Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {[2, 3, 4].map(n => (
                    <TouchableOpacity
                      key={n}
                      onPress={() => setGrid(n)}
                      activeOpacity={0.8}
                      style={{
                        flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center',
                        backgroundColor: gridCols === n
                          ? 'rgba(0,180,216,0.1)'
                          : 'rgba(255,255,255,0.03)',
                        borderWidth: 1,
                        borderColor: gridCols === n
                          ? 'rgba(0,180,216,0.3)'
                          : 'rgba(255,255,255,0.06)',
                      }}
                    >
                      <Text style={{
                        fontSize: 14, fontWeight: '700',
                        color: gridCols === n ? '#00B4D8' : 'rgba(255,255,255,0.45)',
                      }}>
                        {n} colonne
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </GlassCard>
            </FadeInView>

            <FadeInView delay={160}>
              <GlassCard style={{ marginBottom: 16 }}>
                <View style={{
                  flexDirection: 'row', justifyContent: 'space-between',
                  alignItems: 'center', marginBottom: 12,
                }}>
                  <Text style={{
                    fontSize: 11, color: '#00B4D8', letterSpacing: 1, fontWeight: '600',
                  }}>
                    I MIEI CLIENTI
                  </Text>
                  <TouchableOpacity
                    onPress={() => setShowCustomerForm(!showCustomerForm)}
                    activeOpacity={0.8}
                    style={{
                      paddingHorizontal: 12, paddingVertical: 4,
                      borderRadius: 12,
                      backgroundColor: 'rgba(0,180,216,0.1)',
                      borderWidth: 1, borderColor: 'rgba(0,180,216,0.2)',
                    }}
                  >
                    <Text style={{ color: '#00B4D8', fontSize: 12, fontWeight: '600' }}>
                      {showCustomerForm ? 'Chiudi' : '+ Nuovo'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {showCustomerForm && (
                  <View style={{ marginBottom: 12 }}>
                    <GlassInput
                      label="Nome Attività"
                      placeholder="Es. Bar Central Snc"
                      value={cf.business_name}
                      onChangeText={t => setCf({ ...cf, business_name: t })}
                    />
                    <GlassInput
                      label="Partita IVA"
                      placeholder="01234567890"
                      value={cf.vat}
                      onChangeText={t => setCf({ ...cf, vat: t })}
                      keyboardType="numeric"
                    />
                    <GlassInput
                      label="IBAN"
                      placeholder="IT12A1234567890"
                      value={cf.iban}
                      onChangeText={t => setCf({ ...cf, iban: t })}
                    />
                    <GlassInput
                      label="Telefono"
                      placeholder="+39 123 456 7890"
                      value={cf.phone}
                      onChangeText={t => setCf({ ...cf, phone: t })}
                      keyboardType="phone-pad"
                    />
                    <GlassInput
                      label="Email"
                      placeholder="info@esempio.it"
                      value={cf.email}
                      onChangeText={t => setCf({ ...cf, email: t })}
                    />
                    <GlassButton
                      title="Salva Cliente"
                      onPress={handleAddCustomer}
                      disabled={!cf.business_name}
                      size="sm"
                    />
                  </View>
                )}

                {customers.length === 0 && !showCustomerForm && (
                  <Text style={{ color: 'rgba(255,255,255,0.30)', fontSize: 13, textAlign: 'center', paddingVertical: 16 }}>
                    Nessun cliente salvato
                  </Text>
                )}
              </GlassCard>
            </FadeInView>

            <FadeInView delay={200}>
              <GlassCard style={{ marginBottom: 16 }}>
                <Text style={{
                  fontSize: 11, color: '#00B4D8', marginBottom: 12,
                  letterSpacing: 1, fontWeight: '600',
                }}>
                  STATO CONNESSIONE
                </Text>
                <InfoRow label="Ordini in coda" value={String(pendingCount)} color={pendingCount > 0 ? '#F59E0B' : '#10B981'} />
                <InfoRow label="Sincronizzazione" value={syncing ? 'In corso...' : 'Automatica'} />
              </GlassCard>
            </FadeInView>

            <FadeInView delay={240}>
              <GlassCard style={{ marginBottom: 16 }}>
                <Text style={{
                  fontSize: 11, color: '#00B4D8', marginBottom: 12,
                  letterSpacing: 1, fontWeight: '600',
                }}>
                  AZIONI
                </Text>
                <View style={{ gap: 10 }}>
                  <GlassButton
                    title={syncing ? 'Sincronizzazione in corso...' : `Sincronizza ora${pendingCount > 0 ? ` (${pendingCount})` : ''}`}
                    variant="primary"
                    onPress={handleSync}
                    disabled={syncing}
                  />
                  <GlassButton
                    title={checkingUpdate ? 'Verifica in corso...' : 'Verifica aggiornamenti'}
                    variant="outline"
                    onPress={checkForUpdates}
                    disabled={checkingUpdate || syncing}
                  />
                  <GlassButton
                    title="Esci"
                    variant="outline"
                    onPress={() => authStore.logout()}
                  />
                </View>
              </GlassCard>
            </FadeInView>
          </View>
        }
        renderItem={({ item }) => (
          <FadeInView delay={60}>
            <View style={{
              backgroundColor: '#192734',
              borderRadius: 12,
              borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
              padding: 14, marginBottom: 8,
              flexDirection: 'row', alignItems: 'center',
            }}>
              <View style={{
                width: 36, height: 36, borderRadius: 10,
                backgroundColor: 'rgba(0,180,216,0.1)',
                alignItems: 'center', justifyContent: 'center',
                marginRight: 12,
              }}>
                <Text style={{ fontSize: 16 }}>🏪</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: 'rgba(255,255,255,0.92)', fontSize: 14, fontWeight: '600' }}>
                  {item.business_name}
                </Text>
                <Text style={{ color: 'rgba(255,255,255,0.40)', fontSize: 12, marginTop: 2 }}>
                  {item.vat ? `P.IVA: ${item.vat}` : ''}{item.phone ? ` · ${item.phone}` : ''}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => handleDeleteCustomer(item)}
                style={{ padding: 6 }}
              >
                <Text style={{ fontSize: 14, opacity: 0.4 }}>🗑️</Text>
              </TouchableOpacity>
            </View>
          </FadeInView>
        )}
        ListEmptyComponent={null}
      />
    </LinearGradient>
  )
}

const InfoRow: React.FC<{ label: string; value: string; color?: string }> = ({ label, value, color }) => (
  <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 }}>
    <Text style={{ color: 'rgba(255,255,255,0.40)', fontSize: 13 }}>{label}</Text>
    <Text style={{ color: color || 'rgba(255,255,255,0.70)', fontSize: 13, fontWeight: '500' }}>{value}</Text>
  </View>
)
