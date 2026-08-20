import React, { useRef } from 'react'
import { TouchableOpacity, Text, Animated, ViewStyle } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'

interface GlassButtonProps {
  title: string
  onPress: () => void
  variant?: 'primary' | 'secondary' | 'danger' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  style?: ViewStyle
  disabled?: boolean
}

const gradients: Record<string, readonly [string, string]> = {
  primary: ['#00B4D8', '#0096b7'],
  secondary: ['#38BDF8', '#0284C7'],
  danger: ['#EF4444', '#DC2626'],
}

const sizes: Record<string, any> = {
  sm: { paddingVertical: 8, paddingHorizontal: 16, fontSize: 12, borderRadius: 10 },
  md: { paddingVertical: 12, paddingHorizontal: 24, fontSize: 14, borderRadius: 12 },
  lg: { paddingVertical: 16, paddingHorizontal: 32, fontSize: 16, borderRadius: 14 },
}

export const GlassButton: React.FC<GlassButtonProps> = ({
  title, onPress, variant = 'primary', size = 'md', style, disabled,
}) => {
  const scale = useRef(new Animated.Value(1)).current

  const handlePressIn = () => {
    Animated.spring(scale, { toValue: 0.96, useNativeDriver: true }).start()
  }

  const handlePressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start()
  }

  const s = sizes[size]

  if (variant === 'outline') {
    return (
      <Animated.View style={[{ transform: [{ scale }] }, style]}>
        <TouchableOpacity
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={disabled}
          activeOpacity={0.8}
          style={{
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.15)',
            borderRadius: s.borderRadius,
            paddingVertical: s.paddingVertical,
            paddingHorizontal: s.paddingHorizontal,
            opacity: disabled ? 0.4 : 1,
          }}
        >
          <Text style={{
            color: 'rgba(255,255,255,0.85)',
            fontSize: s.fontSize,
            fontWeight: '600',
            textAlign: 'center',
          }}>
            {title}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    )
  }

  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={gradients[variant]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            borderRadius: s.borderRadius,
            paddingVertical: s.paddingVertical,
            paddingHorizontal: s.paddingHorizontal,
            opacity: disabled ? 0.4 : 1,
          }}
        >
          <Text style={{
            color: 'white',
            fontSize: s.fontSize,
            fontWeight: '700',
            textAlign: 'center',
            letterSpacing: 0.3,
          }}>
            {title}
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  )
}
