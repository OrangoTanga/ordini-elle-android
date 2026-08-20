import React from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { cartStore } from '../store/cartStore'

interface CartBarProps {
  onPress: () => void
}

export const CartBar: React.FC<CartBarProps> = ({ onPress }) => {
  const [state, setState] = React.useState(0)

  React.useEffect(() => {
    const unsub = cartStore.subscribe(() => setState(s => s + 1))
    return unsub
  }, [])

  const count = cartStore.getItemCount()
  const total = cartStore.getTotal()

  if (count === 0) return null

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
      <LinearGradient
        colors={['#1E2D3D', '#192734']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 20,
          paddingVertical: 14,
          borderTopWidth: 1,
          borderTopColor: 'rgba(0,180,216,0.2)',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={{
            width: 32, height: 32, borderRadius: 16,
            backgroundColor: 'rgba(0,180,216,0.15)',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Text style={{ fontSize: 14, color: '#00B4D8' }}>🛒</Text>
          </View>
          <View>
            <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '500' }}>
              {count} articolo{count !== 1 ? 'i' : ''}
            </Text>
            <Text style={{ color: 'white', fontSize: 15, fontWeight: '700' }}>
              €{total.toFixed(2)}
            </Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={{ color: '#00B4D8', fontSize: 13, fontWeight: '600' }}>Vedi carrello</Text>
          <Text style={{ color: '#00B4D8', fontSize: 14 }}>→</Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  )
}
