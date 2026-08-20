import React, { useState, useEffect } from 'react'
import { View, Text } from 'react-native'
import { api } from '../services/api'
import { getPendingCount } from '../services/offlineQueue'

export const ConnectionIndicator: React.FC = () => {
  const [connected, setConnected] = useState(false)
  const [pending, setPending] = useState(0)

  useEffect(() => {
    checkConnection()
    const interval = setInterval(checkConnection, 30000)
    return () => clearInterval(interval)
  }, [])

  const checkConnection = async () => {
    const ok = await api.health()
    setConnected(ok)
    const count = await getPendingCount()
    setPending(count)
  }

  const dotColor = connected ? '#10B981' : '#EF4444'
  const bgColor = connected ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)'
  const label = connected ? 'Connesso' : 'Offline'

  return (
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: 5,
      paddingHorizontal: 10,
      borderRadius: 20,
      backgroundColor: bgColor,
      borderWidth: 1,
      borderColor: dotColor + '15',
    }}>
      <View style={{
        width: 7, height: 7, borderRadius: 3.5,
        backgroundColor: dotColor,
      }} />
      <Text style={{
        fontSize: 11, fontWeight: '600',
        color: dotColor,
      }}>
        {label}
      </Text>
      {pending > 0 && (
        <Text style={{
          fontSize: 11, fontWeight: '600', color: '#F59E0B',
        }}>
          · {pending} in coda
        </Text>
      )}
    </View>
  )
}
