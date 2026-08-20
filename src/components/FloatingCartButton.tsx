import React, { useEffect, useRef } from 'react'
import { View, Text, TouchableOpacity, Animated } from 'react-native'
import { cartStore } from '../store/cartStore'

interface FloatingCartButtonProps {
  onPress: () => void
}

export const FloatingCartButton: React.FC<FloatingCartButtonProps> = ({ onPress }) => {
  const [count, setCount] = React.useState(0)
  const [total, setTotal] = React.useState(0)
  const scaleAnim = useRef(new Animated.Value(0)).current
  const bounceAnim = useRef(new Animated.Value(1)).current
  const prevCount = useRef(0)
  const pulseAnim = useRef(new Animated.Value(1)).current

  useEffect(() => {
    const unsub = cartStore.subscribe(() => {
      const newCount = cartStore.getItemCount()
      const newTotal = cartStore.getTotal()
      setCount(newCount)
      setTotal(newTotal)

      if (newCount > prevCount.current) {
        bounceAnim.setValue(1)
        Animated.sequence([
          Animated.spring(bounceAnim, { toValue: 1.25, friction: 3, useNativeDriver: true }),
          Animated.spring(bounceAnim, { toValue: 1, friction: 4, useNativeDriver: true }),
        ]).start()

        pulseAnim.setValue(1)
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        ]).start()
      }
      prevCount.current = newCount
    })
    return unsub
  }, [])

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: count > 0 ? 1 : 0,
      friction: 6,
      tension: 80,
      useNativeDriver: true,
    }).start()
  }, [count])

  return (
    <Animated.View style={{
      position: 'absolute',
      right: 20,
      bottom: 96,
      transform: [{ scale: scaleAnim }],
      zIndex: 999,
    }}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        <Animated.View style={{
          width: 62, height: 62, borderRadius: 31,
          backgroundColor: '#FFFFFF',
          alignItems: 'center', justifyContent: 'center',
          shadowColor: '#FFFFFF',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.45,
          shadowRadius: 16,
          elevation: 10,
          transform: [{ scale: bounceAnim }],
        }}>
          <Animated.Text style={{
            fontSize: 26,
            opacity: pulseAnim,
          }}>
            🛒
          </Animated.Text>

          {count > 0 && (
            <View style={{
              position: 'absolute', top: -3, right: -3,
              minWidth: 24, height: 24, borderRadius: 12,
              backgroundColor: '#FF4757',
              alignItems: 'center', justifyContent: 'center',
              paddingHorizontal: 5,
              borderWidth: 2.5, borderColor: '#0B1120',
            }}>
              <Text style={{
                color: 'white', fontSize: 11, fontWeight: '800',
              }}>
                {count > 99 ? '99+' : count}
              </Text>
            </View>
          )}
        </Animated.View>
      </TouchableOpacity>

      <Animated.View style={{
        position: 'absolute',
        right: 76,
        top: 12,
        backgroundColor: 'rgba(11,17,32,0.85)',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'rgba(0,180,216,0.2)',
        transform: [{ scale: bounceAnim }],
        opacity: pulseAnim,
      }}>
        <Text style={{ color: '#00B4D8', fontSize: 12, fontWeight: '700' }}>
          €{total.toFixed(2)}
        </Text>
      </Animated.View>
    </Animated.View>
  )
}
