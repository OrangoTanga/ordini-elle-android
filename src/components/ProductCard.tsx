import React, { useRef } from 'react'
import { View, Text, TouchableOpacity, Image, Animated } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Product } from '../types'

interface ProductCardProps {
  product: Product
  onAdd: () => void
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onAdd }) => {
  const scale = useRef(new Animated.Value(1)).current

  const handlePressIn = () => {
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true }).start()
  }

  const handlePressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start()
  }

  return (
    <Animated.View style={{
      transform: [{ scale }],
      backgroundColor: '#192734',
      borderRadius: 16,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.06)',
      overflow: 'hidden',
    }}>
      {product.image_path ? (
        <Image
          source={{ uri: product.image_path }}
          style={{ width: '100%', aspectRatio: 1, backgroundColor: '#ffffff' }}
          resizeMode="contain"
        />
      ) : (
        <View style={{
          width: '100%', aspectRatio: 1,
          backgroundColor: '#192734',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <Text style={{ fontSize: 36, opacity: 0.3 }}>📦</Text>
        </View>
      )}

      <View style={{ padding: 10, gap: 2 }}>
        <Text style={{
          color: 'rgba(255,255,255,0.92)', fontSize: 13, fontWeight: '600',
          lineHeight: 18,
        }} numberOfLines={2}>
          {product.name}
        </Text>
        <Text style={{
          color: '#00B4D8', fontSize: 15, fontWeight: '700',
          marginBottom: 8,
        }}>
          €{product.price?.toFixed(2)}
        </Text>

        <TouchableOpacity
          onPress={onAdd}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={['#00B4D8', '#0096b7']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              borderRadius: 10,
              paddingVertical: 8,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: 'white', fontSize: 12, fontWeight: '700' }}>+ Aggiungi</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </Animated.View>
  )
}
