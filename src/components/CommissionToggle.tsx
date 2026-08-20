import React from 'react'
import { View, Text, TouchableOpacity } from 'react-native'

interface CommissionToggleProps {
  visible: boolean
  onToggle: (show: boolean) => void
}

export const CommissionToggle: React.FC<CommissionToggleProps> = ({ visible, onToggle }) => (
  <TouchableOpacity
    onPress={() => onToggle(!visible)}
    activeOpacity={0.6}
    style={{
      alignSelf: 'flex-start',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: 5,
      paddingHorizontal: 10,
      borderRadius: 8,
      backgroundColor: visible ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.04)',
      borderWidth: 1,
      borderColor: visible ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.06)',
    }}
  >
    <Text style={{ fontSize: 11 }}>{visible ? '👁' : '🔒'}</Text>
    <Text style={{
      fontSize: 11,
      fontWeight: '600',
      color: visible ? '#10B981' : 'rgba(255,255,255,0.35)',
    }}>
      {visible ? 'Provvigioni visibili' : 'Provvigioni'}
    </Text>
  </TouchableOpacity>
)
