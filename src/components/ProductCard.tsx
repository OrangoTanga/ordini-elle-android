import React, { useRef, useState } from 'react'
import { View, Text, TouchableOpacity, Image, Animated, Modal, TextInput, Keyboard } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Product } from '../types'

interface ProductCardProps {
  product: Product
  onAdd: (cartoni?: number) => void
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onAdd }) => {
  const scale = useRef(new Animated.Value(1)).current
  const [showCartoniModal, setShowCartoniModal] = useState(false)
  const [cartoniInput, setCartoniInput] = useState('')
  const piecesPerCase = product.pieces_per_case || 1

  const handlePressIn = () => {
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true }).start()
  }

  const handlePressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start()
  }

  const handleAddCartoni = () => {
    const cartoni = parseInt(cartoniInput) || 0
    if (cartoni > 0) {
      onAdd(cartoni)
      setShowCartoniModal(false)
      setCartoniInput('')
      Keyboard.dismiss()
    }
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

        {piecesPerCase > 1 && (
          <Text style={{
            color: 'rgba(255,255,255,0.45)', fontSize: 11,
            marginBottom: 4,
          }}>
            📦 {piecesPerCase} pz/cartone
          </Text>
        )}

        <View style={{ flexDirection: 'row', gap: 6, marginTop: 4 }}>
          <TouchableOpacity
            onPress={() => onAdd()}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            activeOpacity={0.9}
            style={{ flex: 1 }}
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
              <Text style={{ color: 'white', fontSize: 12, fontWeight: '700' }}>+ 1 pz</Text>
            </LinearGradient>
          </TouchableOpacity>

          {piecesPerCase > 1 && (
            <TouchableOpacity
              onPress={() => setShowCartoniModal(true)}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              activeOpacity={0.9}
              style={{ flex: 1 }}
            >
              <LinearGradient
                colors={['#10B981', '#059669']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  borderRadius: 10,
                  paddingVertical: 8,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: 'white', fontSize: 12, fontWeight: '700' }}>📦 Cartoni</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Animated.View>

    <>
      <Modal
        visible={showCartoniModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCartoniModal(false)}
      >
      <View style={{
        flex: 1,
        backgroundColor: '#0B1120',
        justifyContent: 'flex-end',
      }}>
        <View style={{
          backgroundColor: '#192734',
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          padding: 24,
          paddingBottom: 40,
        }}>
          <View style={{
            width: 40, height: 4, borderRadius: 2,
            backgroundColor: 'rgba(255,255,255,0.15)',
            alignSelf: 'center', marginBottom: 16,
          }} />
          <Text style={{
            color: 'rgba(255,255,255,0.95)', fontSize: 20, fontWeight: '700',
            textAlign: 'center', marginBottom: 8,
          }}>
            Aggiungi cartoni
          </Text>
          <Text style={{
            color: 'rgba(255,255,255,0.45)', fontSize: 13,
            textAlign: 'center', marginBottom: 16,
          }}>
            1 cartone = {piecesPerCase} bottiglie
          </Text>
          <TextInput
            placeholder="Numero cartoni"
            placeholderTextColor="rgba(255,255,255,0.2)"
            value={cartoniInput}
            onChangeText={setCartoniInput}
            keyboardType="numeric"
            autoFocus
            style={{
              backgroundColor: '#192734',
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.08)',
              borderRadius: 12,
              padding: 16,
              color: 'rgba(255,255,255,0.95)',
              fontSize: 24,
              fontWeight: '700',
              textAlign: 'center',
              marginBottom: 16,
            }}
          />
          <Text style={{
            color: 'rgba(255,255,255,0.35)', fontSize: 12,
            textAlign: 'center', marginBottom: 20,
          }}>
            Aggiungerà {cartoniInput ? parseInt(cartoniInput) * piecesPerCase : 0} bottiglie al carrello
          </Text>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity
              onPress={() => { setShowCartoniModal(false); setCartoniInput(''); Keyboard.dismiss(); }}
              style={{
                flex: 1,
                backgroundColor: 'rgba(255,255,255,0.06)',
                borderRadius: 12,
                paddingVertical: 14,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.08)',
              }}
            >
              <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 15, fontWeight: '600' }}>Annulla</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleAddCartoni}
              style={{
                flex: 1,
                borderRadius: 12,
                paddingVertical: 14,
                alignItems: 'center',
              }}
            >
              <LinearGradient
                colors={['#10B981', '#059669']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ flex: 1, paddingVertical: 14, alignItems: 'center' }}
              >
                <Text style={{ color: 'white', fontSize: 15, fontWeight: '700' }}>Conferma</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
    </>
  )
}
