import React, { useEffect, useRef } from 'react'
import { Animated } from 'react-native'

interface FadeInViewProps {
  children: React.ReactNode
  delay?: number
  duration?: number
  style?: any
}

export const FadeInView: React.FC<FadeInViewProps> = ({ children, delay = 0, duration = 400, style }) => {
  const opacity = useRef(new Animated.Value(0)).current
  const translateY = useRef(new Animated.Value(12)).current

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration,
        delay,
        useNativeDriver: true,
      }),
    ]).start()
  }, [])

  return (
    <Animated.View style={[{ opacity, transform: [{ translateY }] }, style]}>
      {children}
    </Animated.View>
  )
}
