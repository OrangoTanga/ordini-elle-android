import React from 'react'
import { View, TouchableOpacity } from 'react-native'

interface GlassCardProps {
  children: React.ReactNode
  style?: any
  onPress?: () => void
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, style, onPress }) => {
  const Wrapper = onPress ? TouchableOpacity : View

  return (
    <Wrapper
      onPress={onPress}
      activeOpacity={0.85}
      style={[{
        backgroundColor: '#192734',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
        borderRadius: 16,
        padding: 16,
      }, style]}
    >
      {children}
    </Wrapper>
  )
}
