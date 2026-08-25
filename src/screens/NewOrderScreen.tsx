import React, { useState, useEffect, useCallback } from 'react'
import { View, Text, ScrollView, TouchableOpacity, Animated, Modal, Platform, TextInput, Alert } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { GlassInput } from '../components/GlassInput'
import { GlassButton } from '../components/GlassButton'
import { GlassCard } from '../components/GlassCard'
import { CommissionToggle } from '../components/CommissionToggle'
import { cartStore } from '../store/cartStore'
import { authStore } from '../store/authStore'
import { queueOrder } from '../services/offlineQueue'
import { api } from '../services/api'
import { FadeInView } from '../components/FadeInView'
import type { Customer, User, PaymentType, DocumentType } from '../types'

const DocumentTypeBtn: React.FC<{ value: DocumentType; label: string; selected: DocumentType; onSelect: (v: DocumentType) => void }> = ({ value, label, selected, onSelect }) => (
  <TouchableOpacity
    onPress={() => onSelect(value)}
    style={{
      flex: 1,
      paddingVertical: 10,
      borderRadius: 10,
      backgroundColor: selected === value ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.03)',
      borderWidth: 1,
      borderColor: selected === value ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.06)',
      alignItems: 'center',
    }}
  >
    <Text style={{
      fontSize: 13,
      fontWeight: selected === value ? '700' : '500',
      color: selected === value ? '#10B981' : 'rgba(255,255,255,0.45)',
    }}>
      {label}
    </Text>
  </TouchableOpacity>
)

const PaymentTypeBtn: React.FC<{ value: PaymentType; label: string; selected: PaymentType; onSelect: (v: PaymentType) => void }> = ({ value, label, selected, onSelect }) => (
  <TouchableOpacity
    onPress={() => onSelect(value)}
    style={{
      flex: 1,
      paddingVertical: 10,
      borderRadius: 10,
      backgroundColor: selected === value ? 'rgba(0,180,216,0.1)' : 'rgba(255,255,255,0.03)',
      borderWidth: 1,
      borderColor: selected === value ? 'rgba(0,180,216,0.3)' : 'rgba(255,255,255,0.06)',
      alignItems: 'center',
    }}
  >
    <Text style={{
      fontSize: 13,
      fontWeight: selected === value ? '700' : '500',
      color: selected === value ? '#00B4D8' : 'rgba(255,255,255,0.45)',
    }}>
      {label}
    </Text>
  </TouchableOpacity>
)

export const NewOrderScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [step, setStep] = useState(1)
  const [businessName, setBusinessName] = useState('')
  const [vat, setVat] = useState('')
  const [iban, setIban] = useState('')
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0])
  const [documentType, setDocumentType] = useState<DocumentType>('scontrino')
  const [paymentType, setPaymentType] = useState<PaymentType>('dilazionato')
  const [paymentDays, setPaymentDays] = useState<number>(30)
  const [depositPercent, setDepositPercent] = useState<string>('30')
  const [balanceDays, setBalanceDays] = useState<number>(30)
  const [listini, setListini] = useState<any[]>([])
  const [selectedListino, setSelectedListino] = useState<any>(null)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)
  const [stepAnim] = useState(new Animated.Value(1))
  const [customers, setCustomers] = useState<Customer[]>([])
  const [showCustomerPicker, setShowCustomerPicker] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [sharedUserIds, setSharedUserIds] = useState<number[]>([])
  const [showUserPicker, setShowUserPicker] = useState(false)
  const [unpaidAlert, setUnpaidAlert] = useState<{ show: boolean; businessName: string }>({ show: false, businessName: '' })
  const [, setCartTick] = useState(0)

  const { items } = cartStore.getState()
  const { user } = authStore.getState()
  const total = cartStore.getTotal()
  const showCommissions = cartStore.getState().showCommissions
  const accontoAmount = parseFloat(depositPercent) > 0 ? total * parseFloat(depositPercent) / 100 : 0
  const saldoAmount = total - accontoAmount

  const getCommissionRateByPrice = useCallback((product: any, price: number): { rate: number; tierName: string } => {
    if (!listini.length) return { rate: 0, tierName: '' }
    const priceMap: Record<number, number> = {}
    if (product.listino_prices) {
      for (const lp of product.listino_prices) {
        priceMap[lp.listino_id] = lp.price
      }
    }
    const sorted = [...listini].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    const sp = Number(price)
    for (const l of sorted) {
      const tierPrice = l.sort_order === 1 ? (Number(priceMap[l.id]) || Number(product.price)) : priceMap[l.id]
      if (Number(tierPrice) > 0 && sp >= Number(tierPrice)) {
        return { rate: l.commission_percent ?? 0, tierName: l.name }
      }
    }
    return { rate: 0, tierName: 'Sotto minimo' }
  }, [listini])

  useEffect(() => {
    const unsub = cartStore.subscribe(() => setCartTick(t => t + 1))
    return unsub
  }, [])

  useEffect(() => {
    api.customers.list().then(res => {
      if (res.success) setCustomers(res.data || [])
    })
    api.listini.list().then(res => {
      if (res.success && res.data?.length) {
        setListini(res.data)
        const storedId = cartStore.getState().selectedListinoId
        const found = storedId
          ? res.data.find((l: any) => l.id === storedId)
          : res.data[0]
        if (found) {
          setSelectedListino(found)
          cartStore.setSelectedListino(found.id)
        }
      }
    })
    api.users.list().then(res => {
      if (res.success) setUsers(res.data || [])
    })
  }, [])

  useEffect(() => {
    if (businessName.length > 2) {
      api.payments.list({ customer_business_name: businessName, status: 'pending,overdue' }).then(res => {
        if (res.success && res.data && res.data.length > 0) {
          setUnpaidAlert({ show: true, businessName })
        }
      })
    }
  }, [businessName])

  const selectCustomer = (c: Customer) => {
    setBusinessName(c.business_name)
    setVat(c.vat || '')
    setIban(c.iban || '')
    setShowCustomerPicker(false)
  }

  const handleSaveAsCustomer = async () => {
    if (!businessName?.trim()) { Alert.alert('Errore', 'Inserisci il nome attività'); return }
    if (businessName.trim().length > 100) { Alert.alert('Errore', 'Nome troppo lungo'); return }
    await api.customers.create({ business_name: businessName.trim(), vat, iban })
    api.customers.list().then(res => {
      if (res.success) setCustomers(res.data || [])
    })
  }

  const handleNext = () => {
    if (step === 1) {
      if (!businessName?.trim()) { Alert.alert('Errore', 'Inserisci il nome attività'); return }
      if (businessName.trim().length > 100) { Alert.alert('Errore', 'Nome attività troppo lungo'); return }
      if (vat && vat.length > 20) { Alert.alert('Errore', 'Partita IVA non valida'); return }
      if (iban && iban.length > 34) { Alert.alert('Errore', 'IBAN non valido'); return }
      const dp = parseFloat(depositPercent)
      if (paymentType === 'acconto_saldo' && (isNaN(dp) || dp < 0 || dp > 100)) {
        Alert.alert('Errore', 'Percentuale acconto: 0-100%'); return
      }
      cartStore.setBusinessInfo({
        businessName: businessName.trim(), vat, iban, invoiceDate,
        document_type: documentType,
        payment_type: paymentType, payment_days: paymentDays,
        deposit_percent: dp, balance_days: balanceDays,
        shared_user_ids: sharedUserIds,
      })
    }
    goToStep(step + 1)
  }

  const goToStep = (s: number) => {
    Animated.sequence([
      Animated.timing(stepAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
      Animated.timing(stepAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
    ]).start()
    setStep(s)
  }

  const handleSubmit = async () => {
    if (!selectedListino) { Alert.alert('Errore', 'Seleziona un listino'); return }
    if (!businessName?.trim()) { Alert.alert('Errore', 'Inserisci il nome attività'); return }
    if (items.length === 0) { Alert.alert('Errore', 'Carrello vuoto'); return }
    if (paymentType === 'acconto_saldo') {
      const dp = parseFloat(depositPercent)
      if (isNaN(dp) || dp < 0 || dp > 100) { Alert.alert('Errore', 'Percentuale acconto: 0-100%'); return }
    }

    setSubmitting(true)
    const order: any = {
      business_name: businessName,
      vat,
      iban,
      invoice_date: invoiceDate,
      payment_terms: paymentType === 'immediato' ? 'immediato' : String(paymentDays),
      document_type: documentType,
      payment_type: paymentType,
      payment_days: paymentType === 'dilazionato' ? paymentDays : undefined,
      deposit_percent: paymentType === 'acconto_saldo' ? parseFloat(depositPercent) : undefined,
      balance_days: paymentType === 'acconto_saldo' ? balanceDays : undefined,
      shared_user_ids: sharedUserIds.length > 0 ? sharedUserIds : undefined,
      total,
      notes: '',
      listino_id: selectedListino.id,
      listino_name: selectedListino.name,
      items: items.map(i => ({
        product_id: i.product.id,
        product_name: i.product.name,
        price: cartStore.getItemEffectivePrice(i),
        quantity: i.quantity,
        subtotal: cartStore.getItemEffectiveTotal(i),
        pieces_per_case: i.pieces_per_case,
      })),
    }

    const healthOk = await api.health()
    if (healthOk) {
      const res = await api.orders.create(order)
      if (res.success) {
        if (res.data?.payments?.length) {
          const { schedulePaymentReminders } = await import('../services/notifications')
          schedulePaymentReminders(res.data.payments)
        }
        setResult({ success: true, message: 'Ordine inviato con successo!' })
        cartStore.clearCart()
      } else {
        await queueOrder(order)
        setResult({ success: true, message: 'Ordine salvato in coda offline. Verrà inviato automaticamente.' })
        cartStore.clearCart()
      }
    } else {
      await queueOrder(order)
      setResult({ success: true, message: 'Ordine salvato in coda offline.' })
      cartStore.clearCart()
    }

    setSubmitting(false)
    setTimeout(() => {
      navigation.goBack()
    }, 2000)
  }

  const renderStepIndicator = () => (
    <View style={{ flexDirection: 'row', gap: 8, marginBottom: 24 }}>
      {[1, 2, 3].map(s => (
        <View key={s} style={{
          flex: 1, height: 3, borderRadius: 1.5,
          backgroundColor: s <= step ? '#00B4D8' : 'rgba(255,255,255,0.06)',
        }} />
      ))}
    </View>
  )

  return (
    <LinearGradient colors={['#0B1120', '#192734']} style={{ flex: 1 }}>
      <View style={{ paddingHorizontal: 16, paddingTop: 60, paddingBottom: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <View style={{
              width: 32, height: 32, borderRadius: 16,
              backgroundColor: 'rgba(255,255,255,0.06)',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 16 }}>←</Text>
            </View>
          </TouchableOpacity>
          <Text style={{ color: 'rgba(255,255,255,0.95)', fontSize: 22, fontWeight: '800' }}>
            Nuovo Ordine
          </Text>
        </View>
        {renderStepIndicator()}
      </View>

      <ScrollView style={{ flex: 1, paddingHorizontal: 16 }} contentContainerStyle={{ paddingBottom: Platform.OS === 'android' ? 80 : 20 }}>
        {result ? (
          <FadeInView style={{ alignItems: 'center', paddingVertical: 60 }}>
            <View style={{
              width: 80, height: 80, borderRadius: 40,
              backgroundColor: result.success ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
              alignItems: 'center', justifyContent: 'center',
              marginBottom: 16,
            }}>
              <Text style={{ fontSize: 36 }}>{result.success ? '✅' : '⚠️'}</Text>
            </View>
            <Text style={{
              color: 'rgba(255,255,255,0.92)', fontSize: 16, fontWeight: '600',
              textAlign: 'center', paddingHorizontal: 20,
            }}>
              {result.message}
            </Text>
          </FadeInView>
        ) : (
          <Animated.View style={{ opacity: stepAnim }}>
            {step === 1 && (
              <GlassCard>
                <View style={{
                  flexDirection: 'row', justifyContent: 'space-between',
                  alignItems: 'center', marginBottom: 12,
                }}>
                  <Text style={{ color: '#00B4D8', fontSize: 12, fontWeight: '600', letterSpacing: 1 }}>
                    LISTINO
                  </Text>
                  <CommissionToggle
                    visible={showCommissions}
                    onToggle={show => cartStore.setShowCommissions(show)}
                  />
                </View>
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
                  {listini.map(l => (
                    <TouchableOpacity
                      key={l.id}
                      onPress={() => {
                        setSelectedListino(l)
                        cartStore.setSelectedListino(l.id)
                      }}
                      style={{
                        flex: 1,
                        paddingVertical: 12,
                        borderRadius: 12,
                        backgroundColor: selectedListino?.id === l.id
                          ? 'rgba(0,180,216,0.1)'
                          : 'rgba(255,255,255,0.03)',
                        borderWidth: 1,
                        borderColor: selectedListino?.id === l.id
                          ? 'rgba(0,180,216,0.3)'
                          : 'rgba(255,255,255,0.06)',
                        alignItems: 'center',
                      }}
                    >
                      <Text style={{
                        fontSize: 13,
                        fontWeight: selectedListino?.id === l.id ? '700' : '500',
                        color: selectedListino?.id === l.id ? '#00B4D8' : 'rgba(255,255,255,0.45)',
                      }}>
                        {l.name}
                      </Text>
                      {showCommissions && (
                        <Text style={{
                          fontSize: 10, marginTop: 2,
                          color: selectedListino?.id === l.id ? 'rgba(0,180,216,0.5)' : 'rgba(255,255,255,0.25)',
                        }}>
                          {l.commission_percent}%
                        </Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
                {selectedListino?.payment_terms ? (
                  <View style={{
                    backgroundColor: 'rgba(0,180,216,0.06)',
                    borderRadius: 10, padding: 10, marginBottom: 16,
                    borderWidth: 1, borderColor: 'rgba(0,180,216,0.1)',
                  }}>
                    <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 10, marginBottom: 4 }}>
                      CONDIZIONI DI PAGAMENTO
                    </Text>
                    <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12, lineHeight: 18 }}>
                      {selectedListino.payment_terms}
                    </Text>
                  </View>
                ) : null}

                <Text style={{ color: '#00B4D8', fontSize: 12, fontWeight: '600', letterSpacing: 1, marginBottom: 12 }}>
                  PAGAMENTO
                </Text>
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                  <PaymentTypeBtn value="immediato" label="Immediato" selected={paymentType} onSelect={setPaymentType} />
                  <PaymentTypeBtn value="anticipato" label="Anticipato" selected={paymentType} onSelect={setPaymentType} />
                  <PaymentTypeBtn value="dilazionato" label="Rateale" selected={paymentType} onSelect={setPaymentType} />
                  <PaymentTypeBtn value="acconto_saldo" label="Acconto+Saldo" selected={paymentType} onSelect={setPaymentType} />
                </View>

                {paymentType === 'dilazionato' && (
                  <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                    {[30, 60, 90].map(d => (
                      <TouchableOpacity
                        key={d}
                        onPress={() => setPaymentDays(d)}
                        style={{
                          flex: 1,
                          paddingVertical: 10,
                          borderRadius: 10,
                          backgroundColor: paymentDays === d ? 'rgba(0,180,216,0.1)' : 'rgba(255,255,255,0.03)',
                          borderWidth: 1,
                          borderColor: paymentDays === d ? 'rgba(0,180,216,0.3)' : 'rgba(255,255,255,0.06)',
                          alignItems: 'center',
                        }}
                      >
                        <Text style={{
                          fontSize: 13,
                          fontWeight: paymentDays === d ? '700' : '500',
                          color: paymentDays === d ? '#00B4D8' : 'rgba(255,255,255,0.45)',
                        }}>
                          {d} gg
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {paymentType === 'acconto_saldo' && (
                  <View style={{ marginBottom: 12 }}>
                    <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginBottom: 6, fontWeight: '600' }}>
                      Percentuale acconto (%)
                    </Text>
                    <TextInput
                      placeholder="30"
                      placeholderTextColor="rgba(255,255,255,0.2)"
                      keyboardType="numeric"
                      value={depositPercent}
                      onChangeText={setDepositPercent}
                      style={{
                        backgroundColor: 'rgba(255,255,255,0.04)',
                        borderWidth: 1,
                        borderColor: 'rgba(255,255,255,0.08)',
                        borderRadius: 10,
                        padding: 12,
                        color: 'rgba(255,255,255,0.85)',
                        fontSize: 14,
                        marginBottom: 10,
                      }}
                    />
                    <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginBottom: 6, fontWeight: '600' }}>
                      Saldo a
                    </Text>
                    <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
                      {[30, 60, 90].map(d => (
                        <TouchableOpacity
                          key={d}
                          onPress={() => setBalanceDays(d)}
                          style={{
                            flex: 1,
                            paddingVertical: 10,
                            borderRadius: 10,
                            backgroundColor: balanceDays === d ? 'rgba(0,180,216,0.1)' : 'rgba(255,255,255,0.03)',
                            borderWidth: 1,
                            borderColor: balanceDays === d ? 'rgba(0,180,216,0.3)' : 'rgba(255,255,255,0.06)',
                            alignItems: 'center',
                          }}
                        >
                          <Text style={{
                            fontSize: 13,
                            fontWeight: balanceDays === d ? '700' : '500',
                            color: balanceDays === d ? '#00B4D8' : 'rgba(255,255,255,0.45)',
                          }}>
                            {d} gg
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    {total > 0 && (
                      <Text style={{ color: 'rgba(255,255,255,0.50)', fontSize: 12, textAlign: 'center' }}>
                        Anteprima: €{accontoAmount.toFixed(2)} acconto + €{saldoAmount.toFixed(2)} saldo a {balanceDays}gg
                      </Text>
                    )}
                  </View>
                )}

                <Text style={{ color: '#00B4D8', fontSize: 12, fontWeight: '600', letterSpacing: 1, marginBottom: 12 }}>
                  RAPPRESENTANTI CONDIVISI
                </Text>

                {sharedUserIds.length > 0 && (
                  <View style={{ marginBottom: 10 }}>
                    {sharedUserIds.map(uid => {
                      const u = users.find(x => x.id === uid)
                      return (
                        <View key={uid} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <Text style={{ color: 'rgba(255,255,255,0.70)', fontSize: 13 }}>{u?.name}</Text>
                          <TouchableOpacity onPress={() => setSharedUserIds(sharedUserIds.filter(id => id !== uid))}>
                            <Text style={{ color: '#EF4444', fontSize: 14 }}>✕</Text>
                          </TouchableOpacity>
                        </View>
                      )
                    })}
                    {showCommissions && sharedUserIds.length > 0 && (
                      <>
                        <Text style={{ fontSize: 11, color: '#10B981' }}>
                          Provvigione divisa per {1 + sharedUserIds.length} reps
                        </Text>
                      </>
                    )}
                  </View>
                )}

                <TouchableOpacity
                  onPress={() => setShowUserPicker(true)}
                  activeOpacity={0.8}
                  style={{
                    flexDirection: 'row', alignItems: 'center', gap: 6,
                    paddingVertical: 8, paddingHorizontal: 12,
                    borderRadius: 10, marginBottom: 16,
                    backgroundColor: 'rgba(0,180,216,0.06)',
                    borderWidth: 1, borderColor: 'rgba(0,180,216,0.15)',
                  }}
                >
                  <Text style={{ color: '#00B4D8', fontSize: 13 }}>+ Aggiungi rappresentante</Text>
                </TouchableOpacity>

                <Text style={{ color: '#00B4D8', fontSize: 12, fontWeight: '600', letterSpacing: 1, marginBottom: 12 }}>
                  DATI ATTIVITÀ
                </Text>

                <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginBottom: 6, fontWeight: '600' }}>
                  Tipo documento
                </Text>
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
                  <DocumentTypeBtn value="scontrino" label="🧾 Scontrino" selected={documentType} onSelect={setDocumentType} />
                  <DocumentTypeBtn value="fattura" label="📄 Fattura" selected={documentType} onSelect={setDocumentType} />
                </View>

                {customers.length > 0 && (
                  <TouchableOpacity
                    onPress={() => setShowCustomerPicker(true)}
                    activeOpacity={0.8}
                    style={{
                      flexDirection: 'row', alignItems: 'center', gap: 8,
                      paddingVertical: 10, paddingHorizontal: 12,
                      borderRadius: 12, marginBottom: 14,
                      backgroundColor: 'rgba(0,180,216,0.06)',
                      borderWidth: 1, borderColor: 'rgba(0,180,216,0.15)',
                    }}
                  >
                    <Text style={{ fontSize: 16 }}>📋</Text>
                    <Text style={{ color: '#00B4D8', fontSize: 13, fontWeight: '600', flex: 1 }}>
                      Seleziona cliente salvato
                    </Text>
                    <Text style={{ color: '#00B4D8', fontSize: 14 }}>→</Text>
                  </TouchableOpacity>
                )}

                <GlassInput
                  label="Intestazione Attività"
                  placeholder="Es. Bar Central Snc"
                  value={businessName}
                  onChangeText={setBusinessName}
                />
                <GlassInput
                  label="Partita IVA"
                  placeholder="01234567890"
                  value={vat}
                  onChangeText={setVat}
                  keyboardType="numeric"
                />
                <GlassInput
                  label="IBAN / Codice Univoco"
                  placeholder="IT12A1234567890"
                  value={iban}
                  onChangeText={setIban}
                />
                <GlassInput
                  label="Data fattura"
                  placeholder="AAAA-MM-GG"
                  value={invoiceDate}
                  onChangeText={setInvoiceDate}
                />

                {businessName && (
                  <TouchableOpacity
                    onPress={handleSaveAsCustomer}
                    activeOpacity={0.8}
                    style={{
                      flexDirection: 'row', alignItems: 'center', gap: 6,
                      paddingVertical: 8, paddingHorizontal: 12,
                      borderRadius: 10, marginTop: 4,
                      backgroundColor: 'rgba(16,185,129,0.06)',
                      borderWidth: 1, borderColor: 'rgba(16,185,129,0.15)',
                    }}
                  >
                    <Text style={{ fontSize: 14 }}>💾</Text>
                    <Text style={{ color: '#10B981', fontSize: 12, fontWeight: '600' }}>
                      Salva "{businessName}" come nuovo cliente
                    </Text>
                  </TouchableOpacity>
                )}
              </GlassCard>
            )}

            {step === 2 && (
              <GlassCard>
                <View style={{
                  flexDirection: 'row', justifyContent: 'space-between',
                  alignItems: 'center', marginBottom: 16,
                }}>
                  <Text style={{ color: '#00B4D8', fontSize: 12, fontWeight: '600', letterSpacing: 1 }}>
                    RIEPILOGO CARRELLO
                  </Text>
                  <CommissionToggle
                    visible={showCommissions}
                    onToggle={show => cartStore.setShowCommissions(show)}
                  />
                </View>
                {items.map(item => {
                  const effPrice = cartStore.getItemEffectivePrice(item)
                  const effTotal = effPrice * item.quantity
                  const isCustom = item.customPrice != null

                  return (
                    <View key={item.product.id} style={{
                      flexDirection: 'row', alignItems: 'center',
                      paddingVertical: 10, paddingHorizontal: 4,
                      borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)',
                    }}>
                      <Text style={{
                        flex: 1, color: 'rgba(255,255,255,0.92)', fontSize: 14,
                      }}>
                        {item.product.name}
                      </Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <TouchableOpacity
                          onPress={() => cartStore.updateQuantity(item.product.id, item.quantity - 1)}
                          style={{
                            width: 28, height: 28, borderRadius: 8,
                            backgroundColor: 'rgba(255,255,255,0.08)',
                            alignItems: 'center', justifyContent: 'center',
                          }}
                        >
                          <Text style={{ color: 'white', fontWeight: '700' }}>−</Text>
                        </TouchableOpacity>
                        <Text style={{
                          color: 'white', fontSize: 15, fontWeight: '600',
                          minWidth: 20, textAlign: 'center',
                        }}>
                          {item.quantity}
                        </Text>
                        <TouchableOpacity
                          onPress={() => cartStore.updateQuantity(item.product.id, item.quantity + 1)}
                          style={{
                            width: 28, height: 28, borderRadius: 8,
                            backgroundColor: 'rgba(255,255,255,0.08)',
                            alignItems: 'center', justifyContent: 'center',
                          }}
                        >
                          <Text style={{ color: 'white', fontWeight: '700' }}>+</Text>
                        </TouchableOpacity>
                      </View>
                      <View style={{ alignItems: 'flex-end', minWidth: 65, marginLeft: 12 }}>
                        <Text style={{
                          color: isCustom ? '#F59E0B' : '#00B4D8',
                          fontSize: 14, fontWeight: '700',
                        }}>
                          €{effTotal.toFixed(2)}
                        </Text>
                        {isCustom && (
                          <Text style={{
                            color: 'rgba(245,158,11,0.5)', fontSize: 9,
                          }}>
                            €{effPrice.toFixed(2)}/pz
                          </Text>
                        )}
                        {showCommissions && (
                        <Text style={{
                          color: '#10B981', fontSize: 10, fontWeight: '600',
                          marginTop: -4, marginBottom: 4, textAlign: 'right',
                        }}>
                          💰 Provv. {(() => {
                            const { rate, tierName } = getCommissionRateByPrice(item.product, effPrice)
                            if (rate === 0) return `0% (sotto minimo) → €0.00`
                            return `${tierName}: ${rate}% → €${(effTotal * rate / 100).toFixed(2)}`
                          })()}
                        </Text>
                      )}
                      </View>
                    </View>
                  )
                })}
              </GlassCard>
            )}

            {step === 3 && (
              <GlassCard>
                <View style={{
                  flexDirection: 'row', justifyContent: 'space-between',
                  alignItems: 'center', marginBottom: 16,
                }}>
                  <Text style={{ color: '#00B4D8', fontSize: 12, fontWeight: '600', letterSpacing: 1 }}>
                    CONFERMA ORDINE
                  </Text>
                  <CommissionToggle
                    visible={showCommissions}
                    onToggle={show => cartStore.setShowCommissions(show)}
                  />
                </View>

                {selectedListino && (
                  <View style={{
                    backgroundColor: 'rgba(0,180,216,0.06)',
                    borderRadius: 10, padding: 10, marginBottom: 12,
                    borderWidth: 1, borderColor: 'rgba(0,180,216,0.1)',
                    flexDirection: 'row', alignItems: 'center', gap: 8,
                  }}>
                    <Text style={{ fontSize: 14 }}>📋</Text>
                    <Text style={{ color: '#00B4D8', fontSize: 13, fontWeight: '600' }}>
                      {showCommissions
                        ? `${selectedListino.name} — Provvigione: ${selectedListino.commission_percent}%`
                        : selectedListino.name}
                    </Text>
                  </View>
                )}

                <View style={{
                  backgroundColor: 'rgba(0,180,216,0.06)',
                  borderRadius: 12, padding: 14, marginBottom: 16,
                  borderWidth: 1, borderColor: 'rgba(0,180,216,0.1)',
                }}>
                  <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 6, letterSpacing: 0.5 }}>
                    ATTIVITÀ
                  </Text>
                  <Text style={{ color: 'rgba(255,255,255,0.95)', fontSize: 15, fontWeight: '600' }}>{businessName}</Text>
                  <Text style={{ color: 'rgba(255,255,255,0.50)', fontSize: 13, marginTop: 2 }}>
                    P.IVA: {vat} · IBAN: {iban}
                  </Text>
                  <Text style={{ color: 'rgba(255,255,255,0.50)', fontSize: 13, marginTop: 2 }}>
                    Documento: {documentType === 'fattura' ? '📄 Fattura' : '🧾 Scontrino'} · Data: {invoiceDate} · Pagamento: {paymentType === 'immediato' ? 'Immediato' :
                      paymentType === 'anticipato' ? 'Anticipato' :
                      paymentType === 'acconto_saldo' ? `Acc. ${depositPercent}% + Saldo ${balanceDays}gg` :
                      `${paymentDays} giorni`}
                  </Text>
                </View>

                <View style={{ marginBottom: 16 }}>
                  <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 8, letterSpacing: 0.5 }}>
                    PRODOTTI
                  </Text>
                  {items.map(item => {
                    const effPrice = cartStore.getItemEffectivePrice(item)
                    const effTotal = effPrice * item.quantity
                    return (
                      <View key={item.product.id} style={{
                        flexDirection: 'row', justifyContent: 'space-between',
                        paddingVertical: 6, borderBottomWidth: 1,
                        borderBottomColor: 'rgba(255,255,255,0.03)',
                      }}>
                        <Text style={{ color: 'rgba(255,255,255,0.70)', fontSize: 13 }}>
                          {item.product.name} x{item.quantity}
                        </Text>
                        <Text style={{ color: 'rgba(255,255,255,0.92)', fontSize: 13, fontWeight: '600' }}>
                          €{effTotal.toFixed(2)}
                        </Text>
                      </View>
                    )
                  })}
                </View>

                <View style={{
                  flexDirection: 'row', justifyContent: 'space-between',
                  borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)',
                  paddingTop: 12, marginBottom: 8,
                }}>
                  <Text style={{ color: 'rgba(255,255,255,0.92)', fontSize: 16, fontWeight: '700' }}>TOTALE</Text>
                  <Text style={{ color: '#00B4D8', fontSize: 20, fontWeight: '800' }}>€{total.toFixed(2)}</Text>
                </View>

                {showCommissions && selectedListino && (
                  <GlassCard style={{ marginBottom: 8 }}>
                    <Text style={{ color: '#00B4D8', fontSize: 12, fontWeight: '600', letterSpacing: 1, marginBottom: 10 }}>
                      💰 PROVVIGIONI
                    </Text>
                    {items.map(item => {
                      const effPrice = cartStore.getItemEffectivePrice(item)
                      const effTotal = effPrice * item.quantity
                      const { rate, tierName } = getCommissionRateByPrice(item.product, effPrice)
                      const comm = rate > 0 ? effTotal * rate / 100 : 0
                      return (
                        <View key={item.product.id} style={{
                          flexDirection: 'row', justifyContent: 'space-between',
                          paddingVertical: 4, borderBottomWidth: 1,
                          borderBottomColor: 'rgba(255,255,255,0.03)',
                        }}>
                          <View style={{ flex: 1 }}>
                            <Text style={{ color: 'rgba(255,255,255,0.70)', fontSize: 12 }}>
                              {item.product.name}
                            </Text>
                            <Text style={{ color: 'rgba(255,255,255,0.30)', fontSize: 10 }}>
                              €{effPrice.toFixed(2)} x {item.quantity}
                            </Text>
                          </View>
                          <Text style={{ color: rate > 0 ? '#10B981' : '#EF4444', fontSize: 13, fontWeight: '600', textAlign: 'right' }}>
                            {rate > 0 ? `${tierName} ${rate}% · €${comm.toFixed(2)}` : `Sotto minimo · 0%`}
                          </Text>
                        </View>
                      )
                    })}
                    <View style={{
                      flexDirection: 'row', justifyContent: 'space-between',
                      borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)',
                      paddingTop: 10, marginTop: 6,
                    }}>
                      <Text style={{ color: 'rgba(255,255,255,0.80)', fontSize: 14, fontWeight: '700' }}>
                        TOTALE PROVVIGIONE
                      </Text>
                      <Text style={{ color: '#10B981', fontSize: 16, fontWeight: '800' }}>
                        €{(items.reduce((sum, i) => {
                          const p = cartStore.getItemEffectivePrice(i)
                          const { rate } = getCommissionRateByPrice(i.product, p)
                          return sum + (rate > 0 ? p * i.quantity * rate / 100 : 0)
                        }, 0)).toFixed(2)}
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => Alert.alert(
                      'Calcolo Provvigioni',
                      `La provvigione dipende dal PREZZO di vendita:\n\n` +
                      `💰 Prezzo ≥ soglia Listino 1 → provvigione Listino 1\n` +
                      `💰 Prezzo ≥ soglia Listino 2 → provvigione Listino 2\n` +
                      `💰 Prezzo ≥ soglia Listino 3 → provvigione Listino 3\n` +
                      `⚠ Prezzo sotto Listino 3 → provvigione 0% (contatta Fabio)\n\n` +
                      `A ogni listino si applicano: override manuali per prodotto → eccezioni per categoria → percentuale base listino.\n\n` +
                      `Ordini condivisi: provvigione divisa per N rappresentanti.`
                    )}>
                      <Text style={{ color: '#00B4D8', fontSize: 12, textAlign: 'center', marginTop: 8, fontWeight: '600' }}>
                        ? Info provvigioni
                      </Text>
                    </TouchableOpacity>
                  </GlassCard>
                )}

                {showCommissions && sharedUserIds.length > 0 && selectedListino && (
                  <View style={{
                    backgroundColor: 'rgba(16,185,129,0.04)',
                    borderRadius: 10, padding: 10, marginBottom: 8,
                    borderWidth: 1, borderColor: 'rgba(16,185,129,0.08)',
                  }}>
                    <Text style={{ color: 'rgba(255,255,255,0.40)', fontSize: 11, marginBottom: 4 }}>
                      Provvigione divisa con:
                    </Text>
                    {sharedUserIds.map(uid => {
                      const u = users.find(x => x.id === uid)
                      return (
                        <Text key={uid} style={{ color: '#10B981', fontSize: 13, fontWeight: '600' }}>
                          {u?.name}
                        </Text>
                      )
                    })}
                    <Text style={{ color: '#10B981', fontSize: 11, marginTop: 4 }}>
                      Provvigione divisa per {1 + sharedUserIds.length} reps
                      (€{(items.reduce((sum, i) => {
                        const p = cartStore.getItemEffectivePrice(i)
                        const { rate } = getCommissionRateByPrice(i.product, p)
                        return sum + (rate > 0 ? p * i.quantity * rate / 100 : 0)
                      }, 0) / (1 + sharedUserIds.length)).toFixed(2)}/cad)
                    </Text>
                  </View>
                )}

                <Text style={{
                  fontSize: 11, color: 'rgba(255,255,255,0.25)',
                  marginTop: 8, textAlign: 'center',
                }}>
                  Rappresentante: {user?.name || '—'}
                </Text>
              </GlassCard>
            )}
          </Animated.View>
        )}
      </ScrollView>

      {!result && (
        <View style={{
          padding: 16,
          paddingBottom: Platform.OS === 'android' ? 90 : 16,
          borderTopWidth: 1,
          borderTopColor: 'rgba(255,255,255,0.04)',
          flexDirection: 'row',
          gap: 10,
          backgroundColor: '#0B1120',
        }}>
          {step > 1 && (
            <GlassButton
              title="← Indietro"
              variant="outline"
              onPress={() => goToStep(step - 1)}
              style={{ flex: 1 }}
            />
          )}
          {step < 3 ? (
            <GlassButton
              title="Continua →"
              variant="primary"
              onPress={handleNext}
              style={{ flex: 1 }}
            />
          ) : (
            <GlassButton
              title={submitting ? 'Invio...' : 'Conferma Ordine'}
              variant="primary"
              onPress={handleSubmit}
              disabled={submitting}
              style={{ flex: 1 }}
            />
          )}
        </View>
      )}

      {unpaidAlert.show && (
        <View style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)',
          justifyContent: 'center', alignItems: 'center',
          padding: 30, zIndex: 100,
        }}>
          <View style={{
            backgroundColor: '#192734',
            borderRadius: 20,
            borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)',
            padding: 24, width: '100%', maxWidth: 340,
          }}>
            <Text style={{ color: '#EF4444', fontWeight: '700', fontSize: 16, marginBottom: 10 }}>
              ⚠ Pagamenti in sospeso
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.70)', fontSize: 13, lineHeight: 20, marginBottom: 20 }}>
              Il cliente "{unpaidAlert.businessName}" ha pagamenti non saldati. Procedere comunque?
            </Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <GlassButton
                title="Annulla"
                variant="outline"
                onPress={() => { setUnpaidAlert({ show: false, businessName: '' }); setBusinessName('') }}
                style={{ flex: 1 }}
              />
              <GlassButton
                title="Procedi"
                variant="primary"
                onPress={() => setUnpaidAlert({ show: false, businessName: '' })}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      )}

      <Modal
        visible={showCustomerPicker}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCustomerPicker(false)}
      >
        <LinearGradient colors={['#0B1120', '#192734']} style={{ flex: 1 }}>
          <View style={{ padding: 20, paddingTop: 12 }}>
            <View style={{
              width: 40, height: 4, borderRadius: 2,
              backgroundColor: 'rgba(255,255,255,0.15)',
              alignSelf: 'center', marginBottom: 16,
            }} />
            <View style={{
              flexDirection: 'row', justifyContent: 'space-between',
              alignItems: 'center', marginBottom: 16,
            }}>
              <Text style={{ color: 'rgba(255,255,255,0.92)', fontSize: 20, fontWeight: '700' }}>
                I tuoi clienti
              </Text>
              <TouchableOpacity onPress={() => setShowCustomerPicker(false)}>
                <View style={{
                  width: 28, height: 28, borderRadius: 14,
                  backgroundColor: 'rgba(255,255,255,0.08)',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>✕</Text>
                </View>
              </TouchableOpacity>
            </View>

            <ScrollView>
              {customers.map(c => (
                <TouchableOpacity
                  key={c.id}
                  onPress={() => selectCustomer(c)}
                  activeOpacity={0.8}
                  style={{
                    backgroundColor: '#192734',
                    borderRadius: 12,
                    borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
                    padding: 14, marginBottom: 8,
                  }}
                >
                  <Text style={{ color: 'rgba(255,255,255,0.92)', fontSize: 15, fontWeight: '600' }}>
                    {c.business_name}
                  </Text>
                  <Text style={{ color: 'rgba(255,255,255,0.40)', fontSize: 12, marginTop: 2 }}>
                    {c.vat ? `P.IVA: ${c.vat}` : ''}{c.phone ? ` · ${c.phone}` : ''}
                  </Text>
                </TouchableOpacity>
              ))}
              {customers.length === 0 && (
                <Text style={{ color: 'rgba(255,255,255,0.30)', fontSize: 13, textAlign: 'center', paddingVertical: 40 }}>
                  Nessun cliente salvato
                </Text>
              )}
            </ScrollView>
          </View>
        </LinearGradient>
      </Modal>

      <Modal
        visible={showUserPicker}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowUserPicker(false)}
      >
        <LinearGradient colors={['#0B1120', '#192734']} style={{ flex: 1 }}>
          <View style={{ padding: 20, paddingTop: 12 }}>
            <View style={{
              width: 40, height: 4, borderRadius: 2,
              backgroundColor: 'rgba(255,255,255,0.15)',
              alignSelf: 'center', marginBottom: 16,
            }} />
            <View style={{
              flexDirection: 'row', justifyContent: 'space-between',
              alignItems: 'center', marginBottom: 16,
            }}>
              <Text style={{ color: 'rgba(255,255,255,0.92)', fontSize: 20, fontWeight: '700' }}>
                Scegli rappresentante
              </Text>
              <TouchableOpacity onPress={() => setShowUserPicker(false)}>
                <View style={{
                  width: 28, height: 28, borderRadius: 14,
                  backgroundColor: 'rgba(255,255,255,0.08)',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>✕</Text>
                </View>
              </TouchableOpacity>
            </View>

            <ScrollView>
              {users.filter(u => u.id !== user?.id).map(u => {
                const isSelected = sharedUserIds.includes(u.id)
                return (
                  <TouchableOpacity
                    key={u.id}
                    onPress={() => {
                      if (isSelected) {
                        setSharedUserIds(sharedUserIds.filter(id => id !== u.id))
                      } else {
                        setSharedUserIds([...sharedUserIds, u.id])
                      }
                    }}
                    activeOpacity={0.8}
                    style={{
                      backgroundColor: isSelected ? 'rgba(0,180,216,0.08)' : '#192734',
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: isSelected ? 'rgba(0,180,216,0.3)' : 'rgba(255,255,255,0.05)',
                      padding: 14, marginBottom: 8,
                      flexDirection: 'row', alignItems: 'center', gap: 10,
                    }}
                  >
                    <View style={{
                      width: 24, height: 24, borderRadius: 12,
                      borderWidth: 2,
                      borderColor: isSelected ? '#00B4D8' : 'rgba(255,255,255,0.15)',
                      alignItems: 'center', justifyContent: 'center',
                      backgroundColor: isSelected ? '#00B4D8' : 'transparent',
                    }}>
                      {isSelected && <Text style={{ color: 'white', fontSize: 12, fontWeight: '700' }}>✓</Text>}
                    </View>
                    <View>
                      <Text style={{ color: 'rgba(255,255,255,0.92)', fontSize: 15, fontWeight: '600' }}>
                        {u.name}
                      </Text>
                      <Text style={{ color: 'rgba(255,255,255,0.40)', fontSize: 12 }}>
                        @{u.username}
                      </Text>
                    </View>
                  </TouchableOpacity>
                )
              })}
              {users.filter(u => u.id !== user?.id).length === 0 && (
                <Text style={{ color: 'rgba(255,255,255,0.30)', fontSize: 13, textAlign: 'center', paddingVertical: 40 }}>
                  Nessun altro rappresentante
                </Text>
              )}
            </ScrollView>

            <GlassButton
              title="Conferma"
              variant="primary"
              onPress={() => setShowUserPicker(false)}
              style={{ marginTop: 12 }}
            />
          </View>
        </LinearGradient>
      </Modal>
    </LinearGradient>
  )
}
