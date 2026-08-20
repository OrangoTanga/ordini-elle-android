import React from 'react'
import { View, Text } from 'react-native'

interface StatusBadgeProps {
  status: 'pending' | 'approved' | 'rejected' | 'connected' | 'disconnected'
  size?: 'sm' | 'md'
}

const config: Record<string, { label: string; color: string }> = {
  pending: { label: 'In attesa', color: '#F59E0B' },
  approved: { label: 'Approvato', color: '#10B981' },
  rejected: { label: 'Rifiutato', color: '#EF4444' },
  connected: { label: 'Connesso', color: '#10B981' },
  disconnected: { label: 'Offline', color: '#EF4444' },
}

const sizes: Record<string, any> = {
  sm: { paddingVertical: 3, paddingHorizontal: 8, fontSize: 10, dotSize: 5 },
  md: { paddingVertical: 4, paddingHorizontal: 12, fontSize: 12, dotSize: 7 },
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const cfg = config[status] || config.pending
  const s = sizes[size]

  return (
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingVertical: s.paddingVertical,
      paddingHorizontal: s.paddingHorizontal,
      borderRadius: 20,
      backgroundColor: cfg.color + '18',
      borderWidth: 1,
      borderColor: cfg.color + '25',
    }}>
      <View style={{
        width: s.dotSize,
        height: s.dotSize,
        borderRadius: s.dotSize / 2,
        backgroundColor: cfg.color,
      }} />
      <Text style={{
        fontSize: s.fontSize,
        fontWeight: '600',
        color: cfg.color,
      }}>
        {cfg.label}
      </Text>
    </View>
  )
}
