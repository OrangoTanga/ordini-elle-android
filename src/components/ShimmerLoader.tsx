import React, { useEffect, useRef } from 'react'
import { Animated, View } from 'react-native'

interface ShimmerLoaderProps {
  width?: number | string
  height?: number
  borderRadius?: number
  style?: any
}

export const ShimmerLoader: React.FC<ShimmerLoaderProps> = ({ width = '100%', height = 16, borderRadius = 8, style }) => {
  const opacity = useRef(new Animated.Value(0.3)).current

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.6, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    )
    animation.start()
    return () => animation.stop()
  }, [])

  return (
    <Animated.View
      style={[{
        width: width as any,
        height,
        borderRadius,
        backgroundColor: '#192734',
        opacity,
      }, style]}
    />
  )
}

export const ProductCardShimmer: React.FC = () => (
  <View style={{
    backgroundColor: '#192734',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
  }}>
    <ShimmerLoader width="100%" height={160} borderRadius={0} />
    <View style={{ padding: 10, gap: 6 }}>
      <ShimmerLoader width="80%" height={14} />
      <ShimmerLoader width="50%" height={14} />
      <ShimmerLoader width="100%" height={32} borderRadius={10} />
    </View>
  </View>
)

export const OrderCardShimmer: React.FC = () => (
  <View style={{
    backgroundColor: '#192734',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  }}>
    <ShimmerLoader width={40} height={40} borderRadius={20} />
    <View style={{ flex: 1, gap: 6 }}>
      <ShimmerLoader width="70%" height={15} />
      <ShimmerLoader width="50%" height={11} />
    </View>
    <ShimmerLoader width={60} height={16} />
  </View>
)
