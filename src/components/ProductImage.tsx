import React, { useState } from 'react'
import { Image, View, Text } from 'react-native'

interface ProductImageProps {
  uri?: string
  size?: number
  style?: any
}

export const ProductImage: React.FC<ProductImageProps> = ({ uri, size = 40, style }) => {
  const [failed, setFailed] = useState(false)

  if (!uri || failed) {
    return (
      <View style={[{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: '#192734',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
      }, style]}>
        <Text style={{ fontSize: size * 0.45, opacity: 0.3 }}>📦</Text>
      </View>
    )
  }

  return (
    <Image
      source={{ uri }}
      style={[{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: '#ffffff',
      }, style]}
      onError={() => setFailed(true)}
      resizeMode="cover"
    />
  )
}
