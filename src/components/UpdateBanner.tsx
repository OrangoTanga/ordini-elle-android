import React from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import type { AppVersionInfo } from '../services/updateService'

interface UpdateBannerProps {
  info: AppVersionInfo
  currentVersion: string
  downloading: boolean
  error: string
  onUpdateNow: () => void
  onDismiss: () => void
}

export const UpdateBanner: React.FC<UpdateBannerProps> = ({
  info, currentVersion, downloading, error, onUpdateNow, onDismiss,
}) => {
  return (
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: '#F59E0B',
      paddingVertical: 10,
      paddingHorizontal: 14,
    }}>
      <View style={{
        width: 22, height: 22, borderRadius: 11,
        backgroundColor: 'rgba(255,255,255,0.3)',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <Text style={{ color: '#fff', fontWeight: '900', fontSize: 13, lineHeight: 16 }}>!</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>
          Nuova versione {info.version} disponibile
          {currentVersion ? ` (hai la v${currentVersion})` : ''}
        </Text>
        {info.notes ? (
          <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 11 }} numberOfLines={1}>
            {info.notes}
          </Text>
        ) : null}
        {error ? (
          <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>{error}</Text>
        ) : null}
      </View>
      <TouchableOpacity
        onPress={onUpdateNow}
        disabled={downloading}
        style={{
          backgroundColor: 'rgba(255,255,255,0.25)',
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.5)',
          borderRadius: 8,
          paddingVertical: 6,
          paddingHorizontal: 12,
        }}
      >
        <Text style={{ color: '#fff', fontWeight: '700', fontSize: 12 }}>
          {downloading ? 'Attendi...' : 'Aggiorna'}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={onDismiss} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <View style={{ width: 20, height: 20 }}>
          <Text style={{ color: 'rgba(255,255,255,0.9)', fontWeight: '700', fontSize: 16, lineHeight: 20, textAlign: 'center' }}>×</Text>
        </View>
      </TouchableOpacity>
    </View>
  )
}