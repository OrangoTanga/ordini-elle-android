import React from 'react'
import { TouchableOpacity, Text } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'

interface CategoryChipProps {
  label: string
  selected: boolean
  onPress: () => void
}

export const CategoryChip: React.FC<CategoryChipProps> = ({ label, selected, onPress }) => {
  if (selected) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        <LinearGradient
          colors={['#00B4D8', '#0096b7']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            paddingHorizontal: 18,
            paddingVertical: 8,
            borderRadius: 20,
            marginRight: 8,
          }}
        >
          <Text style={{ color: 'white', fontSize: 13, fontWeight: '600' }}>{label}</Text>
        </LinearGradient>
      </TouchableOpacity>
    )
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={{
        paddingHorizontal: 18,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 8,
        backgroundColor: '#192734',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
      }}
    >
      <Text style={{ color: 'rgba(255,255,255,0.50)', fontSize: 13, fontWeight: '500' }}>{label}</Text>
    </TouchableOpacity>
  )
}
