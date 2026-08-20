import React, { useRef, useState } from 'react'
import { TextInput, Text, View, Animated } from 'react-native'

interface GlassInputProps {
  placeholder?: string
  value: string
  onChangeText: (text: string) => void
  label?: string
  multiline?: boolean
  keyboardType?: 'default' | 'numeric' | 'email-address' | 'phone-pad'
  secureTextEntry?: boolean
  editable?: boolean
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters'
}

export const GlassInput: React.FC<GlassInputProps> = ({
  placeholder, value, onChangeText, label, multiline, keyboardType, secureTextEntry, editable, autoCapitalize,
}) => {
  const [focused, setFocused] = useState(false)
  const borderAnim = useRef(new Animated.Value(0)).current

  const handleFocus = () => {
    setFocused(true)
    Animated.timing(borderAnim, { toValue: 1, duration: 200, useNativeDriver: false }).start()
  }

  const handleBlur = () => {
    setFocused(false)
    Animated.timing(borderAnim, { toValue: 0, duration: 200, useNativeDriver: false }).start()
  }

  const borderColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(255,255,255,0.08)', '#00B4D8'],
  })

  return (
    <View style={{ marginBottom: 14 }}>
      {label && (
        <Text style={{
          fontSize: 11,
          color: focused ? '#00B4D8' : 'rgba(255,255,255,0.45)',
          marginBottom: 6,
          fontWeight: '600',
          letterSpacing: 0.8,
        }}>
          {label.toUpperCase()}
        </Text>
      )}
      <Animated.View style={{
        borderWidth: 1,
        borderColor,
        borderRadius: 12,
        overflow: 'hidden',
      }}>
        <TextInput
          placeholder={placeholder}
          placeholderTextColor="rgba(255,255,255,0.25)"
          value={value}
          onChangeText={onChangeText}
          multiline={multiline}
          keyboardType={keyboardType}
          secureTextEntry={secureTextEntry}
          editable={editable}
          autoCapitalize={autoCapitalize}
          onFocus={handleFocus}
          onBlur={handleBlur}
          style={{
            backgroundColor: 'rgba(255,255,255,0.03)',
            padding: 14,
            color: 'rgba(255,255,255,0.92)',
            fontSize: 15,
            minHeight: multiline ? 80 : undefined,
            opacity: editable === false ? 0.5 : 1,
          }}
        />
      </Animated.View>
    </View>
  )
}
