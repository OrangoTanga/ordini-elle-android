import React, { useState } from 'react'
import { View, Text, TouchableOpacity, FlatList, TextInput, Modal } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { cartStore } from '../store/cartStore'
import { GlassButton } from './GlassButton'
import { CommissionToggle } from './CommissionToggle'
import type { CartItem } from '../types'

interface CartSheetProps {
  onClose: () => void
  onCheckout: () => void
}

function getListinoReference(item: CartItem): { label: string; color: string; price: number } | null {
  const prices = item.product.listino_prices
  if (!prices || prices.length === 0) return null
  const sorted = [...prices].sort((a, b) => a.sort_order - b.sort_order)
  const effectivePrice = item.customPrice ?? item.product.price

  for (let i = 0; i < sorted.length; i++) {
    const threshold = sorted[i].price - 0.005
    if (effectivePrice >= threshold) {
      const colors = ['#10B981', '#F59E0B', '#EF4444']
      return { label: sorted[i].listino_name, color: colors[i] || '#6B7280', price: sorted[i].price }
    }
  }
  return { label: 'Sotto minimo', color: '#EF4444', price: sorted[sorted.length - 1].price }
}

function getMinPrice(item: CartItem): number {
  const prices = item.product.listino_prices
  if (!prices || prices.length === 0) return 0
  return Math.min(...prices.map(p => p.price))
}

const PriceEditor: React.FC<{ item: CartItem; onClose: () => void; showCommissions: boolean }> = ({ item, onClose, showCommissions }) => {
  const effectivePrice = item.customPrice ?? item.product.price
  const [unitPrice, setUnitPrice] = useState(String(effectivePrice))
  const [totalPrice, setTotalPrice] = useState(String((effectivePrice * item.quantity).toFixed(2)))
  const [editingUnit, setEditingUnit] = useState(true)
  const [error, setError] = useState('')
  const minPrice = getMinPrice(item)
  const range = getListinoReference(item)
  const prices = item.product.listino_prices?.sort((a, b) => a.sort_order - b.sort_order) || []

  React.useEffect(() => {
    if (editingUnit) {
      const unit = parseFloat(unitPrice)
      if (!isNaN(unit) && unit > 0) {
        setTotalPrice((unit * item.quantity).toFixed(2))
      }
    }
  }, [unitPrice, item.quantity, editingUnit])

  React.useEffect(() => {
    if (!editingUnit) {
      const total = parseFloat(totalPrice)
      if (!isNaN(total) && total > 0) {
        setUnitPrice((total / item.quantity).toFixed(2))
      }
    }
  }, [totalPrice, item.quantity, editingUnit])

  const handleApply = () => {
    const val = parseFloat(unitPrice)
    if (isNaN(val) || val <= 0) {
      setError('Inserisci un prezzo valido')
      return
    }
    if (minPrice > 0 && val < minPrice - 0.005) {
      setError(`Prezzo minimo: €${minPrice.toFixed(2)} (Listino 3)`)
      return
    }
    cartStore.updateItemPrice(item.product.id, val)
    onClose()
  }

  const currentTotal = parseFloat(unitPrice) * item.quantity
  const commissionEstimate = isNaN(currentTotal) ? 0 : currentTotal * 0.15

  return (
    <LinearGradient colors={['#0B1120', '#192734']} style={{ flex: 1, padding: 24, paddingTop: 60 }}>
      <View style={{
        width: 40, height: 4, borderRadius: 2,
        backgroundColor: 'rgba(255,255,255,0.15)',
        alignSelf: 'center', marginBottom: 20,
      }} />

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <TouchableOpacity onPress={onClose}>
          <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 18 }}>←</Text>
        </TouchableOpacity>
        <Text style={{ color: 'rgba(255,255,255,0.92)', fontSize: 18, fontWeight: '700' }}>
          Prezzo personalizzato
        </Text>
      </View>

      <View style={{
        backgroundColor: '#192734', borderRadius: 16, padding: 20, marginBottom: 16,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
      }}>
        <Text style={{ color: 'rgba(255,255,255,0.92)', fontSize: 17, fontWeight: '700', marginBottom: 4 }}>
          {item.product.name}
        </Text>
        <Text style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13 }}>
          Quantità: {item.quantity}
        </Text>
      </View>

      {range && (
        <View style={{
          flexDirection: 'row', alignItems: 'center', gap: 8,
          backgroundColor: `${range.color}15`,
          borderRadius: 12, padding: 14, marginBottom: 16,
          borderWidth: 1, borderColor: `${range.color}25`,
        }}>
          <Text style={{ fontSize: 16 }}>📊</Text>
          <Text style={{ color: range.color, fontSize: 14, fontWeight: '700', flex: 1 }}>
            Range: {range.label}
          </Text>
        </View>
      )}

      {prices.length > 0 && (
        <View style={{
          flexDirection: 'row', justifyContent: 'space-around',
          backgroundColor: '#192734', borderRadius: 12,
          padding: 12, marginBottom: 16,
          borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
        }}>
          {prices.map((p, i) => (
            <View key={p.listino_id} style={{ alignItems: 'center' }}>
              <Text style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, fontWeight: '600', marginBottom: 2 }}>
                {p.listino_name}
              </Text>
              <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13, fontWeight: '600' }}>
                €{p.price.toFixed(2)}
              </Text>
            </View>
          ))}
        </View>
      )}

      <View style={{
        backgroundColor: '#192734', borderRadius: 16, padding: 20, marginBottom: 16,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
      }}>
        <Text style={{
          color: 'rgba(255,255,255,0.45)', fontSize: 11, fontWeight: '600', letterSpacing: 0.5, marginBottom: 8,
        }}>
          PREZZO UNITARIO
        </Text>
        <TouchableOpacity onPress={() => setEditingUnit(true)} activeOpacity={0.7}>
          <View style={{
            flexDirection: 'row', alignItems: 'center',
            backgroundColor: editingUnit ? 'rgba(0,180,216,0.08)' : 'rgba(255,255,255,0.03)',
            borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
            borderWidth: 1.5,
            borderColor: editingUnit ? 'rgba(0,180,216,0.4)' : 'rgba(255,255,255,0.06)',
          }}>
            <TextInput
              value={unitPrice}
              onChangeText={t => { setEditingUnit(true); setUnitPrice(t); setError('') }}
              keyboardType="decimal-pad"
              selectTextOnFocus
              style={{
                flex: 1, color: 'white', fontSize: 22, fontWeight: '700', padding: 0,
              }}
            />
            <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 16, fontWeight: '600' }}>€</Text>
          </View>
        </TouchableOpacity>

        <Text style={{
          color: 'rgba(255,255,255,0.45)', fontSize: 11, fontWeight: '600', letterSpacing: 0.5,
          marginTop: 16, marginBottom: 8,
        }}>
          OPPURE TOTALE RIGA
        </Text>
        <TouchableOpacity onPress={() => setEditingUnit(false)} activeOpacity={0.7}>
          <View style={{
            flexDirection: 'row', alignItems: 'center',
            backgroundColor: !editingUnit ? 'rgba(0,180,216,0.08)' : 'rgba(255,255,255,0.03)',
            borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
            borderWidth: 1.5,
            borderColor: !editingUnit ? 'rgba(0,180,216,0.4)' : 'rgba(255,255,255,0.06)',
          }}>
            <TextInput
              value={totalPrice}
              onChangeText={t => { setEditingUnit(false); setTotalPrice(t); setError('') }}
              keyboardType="decimal-pad"
              selectTextOnFocus
              style={{
                flex: 1, color: 'white', fontSize: 22, fontWeight: '700', padding: 0,
              }}
            />
            <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 16, fontWeight: '600' }}>€</Text>
          </View>
        </TouchableOpacity>
      </View>

      {error ? (
        <View style={{
          backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: 10, padding: 12, marginBottom: 12,
          borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)',
        }}>
          <Text style={{ color: '#EF4444', fontSize: 13, fontWeight: '500' }}>⚠ {error}</Text>
        </View>
      ) : null}

      {showCommissions && (
        <View style={{
          backgroundColor: 'rgba(16,185,129,0.06)', borderRadius: 12, padding: 14, marginBottom: 24,
          borderWidth: 1, borderColor: 'rgba(16,185,129,0.12)',
          flexDirection: 'row', alignItems: 'center', gap: 8,
        }}>
          <Text style={{ fontSize: 14 }}>💰</Text>
          <View>
            <Text style={{ color: 'rgba(255,255,255,0.40)', fontSize: 11 }}>Provvigione stimata</Text>
            <Text style={{ color: '#10B981', fontSize: 16, fontWeight: '700' }}>
              €{isNaN(commissionEstimate) ? '0.00' : commissionEstimate.toFixed(2)}
            </Text>
          </View>
        </View>
      )}

      <View style={{ flexDirection: 'row', gap: 10, marginTop: 'auto', paddingBottom: 20 }}>
        <GlassButton title="Annulla" variant="outline" onPress={onClose} style={{ flex: 1 }} />
        <GlassButton title="Applica" variant="primary" onPress={handleApply} style={{ flex: 1 }} />
      </View>
    </LinearGradient>
  )
}

export const CartSheet: React.FC<CartSheetProps> = ({ onClose, onCheckout }) => {
  const { items, businessName, selectedListinoId, showCommissions } = cartStore.getState()
  const total = cartStore.getTotal()
  const [, setState] = React.useState(0)
  const [editingItem, setEditingItem] = useState<CartItem | null>(null)

  React.useEffect(() => {
    const unsub = cartStore.subscribe(() => setState(s => s + 1))
    return unsub
  }, [])

  const handleQtyInput = (productId: number, text: string) => {
    const n = parseInt(text, 10)
    if (!isNaN(n) && n > 0) {
      cartStore.updateQuantity(productId, n)
    }
  }

  return (
    <View style={{ flex: 1, padding: 20, paddingTop: 12 }}>
      <View style={{
        width: 40, height: 4, borderRadius: 2,
        backgroundColor: 'rgba(255,255,255,0.15)',
        alignSelf: 'center', marginBottom: 16,
      }} />

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Text style={{ color: 'rgba(255,255,255,0.92)', fontSize: 20, fontWeight: '700' }}>
          🛒 Carrello
        </Text>
        <TouchableOpacity onPress={onClose}>
          <View style={{
            width: 28, height: 28, borderRadius: 14,
            backgroundColor: 'rgba(255,255,255,0.08)',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>✕</Text>
          </View>
        </TouchableOpacity>
      </View>

      {businessName ? (
        <View style={{
          backgroundColor: 'rgba(16,185,129,0.1)',
          borderRadius: 10, padding: 10, marginBottom: 16,
          flexDirection: 'row', alignItems: 'center', gap: 8,
          borderWidth: 1, borderColor: 'rgba(16,185,129,0.15)',
        }}>
          <Text style={{ fontSize: 14 }}>🏪</Text>
          <Text style={{ color: '#10B981', fontSize: 13, fontWeight: '500' }}>{businessName}</Text>
        </View>
      ) : null}

      <FlatList
        data={items}
        keyExtractor={item => String(item.product.id)}
        style={{ flex: 1 }}
        renderItem={({ item }) => {
          const effPrice = cartStore.getItemEffectivePrice(item)
          const effTotal = effPrice * item.quantity
          const isCustom = item.customPrice != null
          const range = getListinoReference(item)

          return (
            <View style={{
              flexDirection: 'row', alignItems: 'center',
              paddingVertical: 12,
              borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)',
            }}>
              <View style={{
                width: 40, height: 40, borderRadius: 10,
                backgroundColor: '#192734', alignItems: 'center', justifyContent: 'center',
                borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
              }}>
                <Text style={{ fontSize: 16 }}>📦</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={{ color: 'rgba(255,255,255,0.92)', fontSize: 13, fontWeight: '500' }} numberOfLines={1}>
                  {item.product.name}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 1 }}>
                  <Text style={{
                    color: isCustom ? '#F59E0B' : '#00B4D8',
                    fontSize: 11, fontWeight: '600',
                  }}>
                    €{effPrice.toFixed(2)}
                    {isCustom ? ' ✎' : ''}
                  </Text>
                  {range && (
                    <Text style={{
                      fontSize: 9, fontWeight: '700', color: range.color,
                      backgroundColor: `${range.color}15`,
                      paddingHorizontal: 5, paddingVertical: 1,
                      borderRadius: 4, overflow: 'hidden',
                    }}>
                      {range.label}
                    </Text>
                  )}
                </View>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                <TouchableOpacity
                  onPress={() => cartStore.updateQuantity(item.product.id, item.quantity - 1)}
                  style={{
                    width: 26, height: 26, borderRadius: 7,
                    backgroundColor: 'rgba(255,255,255,0.06)',
                    alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <Text style={{ color: 'white', fontSize: 14, fontWeight: '700' }}>−</Text>
                </TouchableOpacity>
                <TextInput
                  value={String(item.quantity)}
                  onChangeText={text => handleQtyInput(item.product.id, text)}
                  keyboardType="number-pad"
                  selectTextOnFocus
                  style={{
                    width: 32, height: 28, borderRadius: 7,
                    backgroundColor: 'rgba(0,180,216,0.08)',
                    color: 'white', fontSize: 13, fontWeight: '600',
                    textAlign: 'center', padding: 0,
                  }}
                />
                <TouchableOpacity
                  onPress={() => cartStore.updateQuantity(item.product.id, item.quantity + 1)}
                  style={{
                    width: 26, height: 26, borderRadius: 7,
                    backgroundColor: 'rgba(255,255,255,0.06)',
                    alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <Text style={{ color: 'white', fontSize: 14, fontWeight: '700' }}>+</Text>
                </TouchableOpacity>
              </View>
              <Text style={{
                color: 'rgba(255,255,255,0.92)', fontSize: 12, fontWeight: '600',
                minWidth: 48, textAlign: 'right', marginLeft: 6,
              }}>
                €{effTotal.toFixed(2)}
              </Text>
              <TouchableOpacity
                onPress={() => setEditingItem(item)}
                style={{
                  marginLeft: 4, width: 28, height: 28, borderRadius: 7,
                  backgroundColor: 'rgba(0,180,216,0.08)',
                  alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Text style={{ fontSize: 13 }}>✏️</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => cartStore.removeItem(item.product.id)}
                style={{ marginLeft: 2, padding: 4 }}
              >
                <Text style={{ fontSize: 13, opacity: 0.4 }}>🗑️</Text>
              </TouchableOpacity>
            </View>
          )
        }}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingVertical: 40 }}>
            <Text style={{ fontSize: 40, marginBottom: 12, opacity: 0.3 }}>🛒</Text>
            <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14 }}>Carrello vuoto</Text>
          </View>
        }
      />

      <View style={{
        borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)',
        paddingTop: 16, marginTop: 8,
      }}>
        <View style={{
          flexDirection: 'row', justifyContent: 'space-between',
          alignItems: 'center', marginBottom: 16,
        }}>
          <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 14 }}>Totale</Text>
          <Text style={{ color: '#00B4D8', fontSize: 22, fontWeight: '800' }}>€{total.toFixed(2)}</Text>
        </View>

        <View style={{ marginBottom: 12, alignItems: 'flex-end' }}>
          <CommissionToggle
            visible={showCommissions}
            onToggle={show => cartStore.setShowCommissions(show)}
          />
        </View>

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <GlassButton title="Aggiungi altri" variant="outline" size="md" onPress={onClose} style={{ flex: 1 }} />
          <GlassButton
            title="Procedi all'ordine"
            variant="primary"
            size="md"
            onPress={onCheckout}
            style={{ flex: 1 }}
            disabled={items.length === 0}
          />
        </View>
      </View>

      <Modal
        visible={editingItem != null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setEditingItem(null)}
      >
        {editingItem && (
          <PriceEditor item={editingItem} onClose={() => setEditingItem(null)} showCommissions={showCommissions} />
        )}
      </Modal>
    </View>
  )
}
