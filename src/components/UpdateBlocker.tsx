import React from 'react'
import { Modal, View, Text } from 'react-native'
import { GlassButton } from './GlassButton'
import type { AppVersionInfo } from '../services/updateService'

interface UpdateBlockerProps {
  visible: boolean
  info: AppVersionInfo
  currentVersion: string
  downloading: boolean
  error: string
  onUpdateNow: () => void
}

export const UpdateBlocker: React.FC<UpdateBlockerProps> = ({
  visible, info, currentVersion, downloading, error, onUpdateNow,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => {}}
    >
      <View style={{
        flex: 1,
        backgroundColor: 'rgba(11,17,32,0.97)',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}>
        <View style={{
          width: '100%',
          maxWidth: 420,
          backgroundColor: '#192734',
          borderWidth: 1,
          borderColor: '#F59E0B',
          borderRadius: 20,
          padding: 24,
        }}>
          <View style={{
            width: 56, height: 56, borderRadius: 28,
            backgroundColor: 'rgba(245,158,11,0.15)',
            borderWidth: 2, borderColor: '#F59E0B',
            alignItems: 'center', justifyContent: 'center',
            marginBottom: 16,
          }}>
            <Text style={{ color: '#F59E0B', fontWeight: '900', fontSize: 32, lineHeight: 38 }}>!</Text>
          </View>
          <Text style={{
            color: '#fff',
            fontSize: 20,
            fontWeight: '800',
            textAlign: 'center',
            marginBottom: 8,
          }}>
            Aggiornamento richiesto
          </Text>
          <Text style={{
            color: 'rgba(255,255,255,0.7)',
            fontSize: 14,
            textAlign: 'center',
            lineHeight: 20,
            marginBottom: 16,
          }}>
            È disponibile la versione <Text style={{ color: '#fff', fontWeight: '700' }}>{info.version}</Text>
            {currentVersion ? ` (stai usando la v${currentVersion})` : ''}. Questo aggiornamento è
            obbligatorio per continuare a usare l&apos;app.
          </Text>
          {info.notes ? (
            <View style={{
              backgroundColor: 'rgba(255,255,255,0.05)',
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.1)',
              borderRadius: 10,
              padding: 12,
              marginBottom: 16,
            }}>
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, textAlign: 'center' }}>
                {info.notes}
              </Text>
            </View>
          ) : null}
          {error ? (
            <Text style={{ color: '#F87171', fontSize: 12, fontWeight: '700', textAlign: 'center', marginBottom: 12 }}>
              {error}
            </Text>
          ) : null}
          <GlassButton
            title={downloading ? 'Avvio download...' : 'Aggiorna ora'}
            onPress={onUpdateNow}
            disabled={downloading}
            size="lg"
          />
          <Text style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, textAlign: 'center', marginTop: 12 }}>
            Verrai portato al browser per scaricare e installare l&apos;aggiornamento.
          </Text>
        </View>
      </View>
    </Modal>
  )
}