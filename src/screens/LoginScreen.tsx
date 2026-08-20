import React, { useState } from 'react'
import { View, Text, KeyboardAvoidingView, Platform, Animated } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { GlassInput } from '../components/GlassInput'
import { GlassButton } from '../components/GlassButton'
import { authStore } from '../store/authStore'

export const LoginScreen: React.FC = () => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const fadeAnim = React.useRef(new Animated.Value(0)).current

  React.useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start()
  }, [])

  const handleLogin = async () => {
    if (!username?.trim()) { setError('Inserisci username'); return }
    if (!password) { setError('Inserisci password'); return }
    if (username.trim().length < 2 || username.trim().length > 50) { setError('Username non valido'); return }
    if (password.length < 6) { setError('Password: almeno 6 caratteri'); return }

    setLoading(true)
    setError('')
    const result = await authStore.login(username.trim(), password)
    setLoading(false)

    if (!result.success) {
      setError(result.error || 'Login fallito')
    }
  }

  return (
    <LinearGradient
      colors={['#0B1120', '#192734', '#0B1120']}
      style={{ flex: 1 }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 24 }}
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }}>
          <View style={{ alignItems: 'center', marginBottom: 48 }}>
            <View style={{
              width: 80, height: 80, borderRadius: 24,
              backgroundColor: '#192734',
              borderWidth: 1, borderColor: 'rgba(0,180,216,0.2)',
              alignItems: 'center', justifyContent: 'center',
              marginBottom: 16,
            }}>
              <Text style={{ fontSize: 36 }}>📋</Text>
            </View>
            <Text style={{
              fontSize: 32, fontWeight: '800',
              color: 'rgba(255,255,255,0.95)',
              letterSpacing: -0.5,
            }}>
              Ordini
            </Text>
            <Text style={{
              fontSize: 14,
              color: '#00B4D8',
              letterSpacing: 6,
              textTransform: 'uppercase',
              fontWeight: '600',
              marginBottom: 8,
              marginTop: 4,
            }}>
              Elly Edition
            </Text>
            <Text style={{
              fontSize: 13,
              color: 'rgba(255,255,255,0.30)',
            }}>
              Gestione ordini rappresentanti
            </Text>
          </View>

          <View style={{
            backgroundColor: '#192734',
            borderRadius: 20,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.06)',
            padding: 24,
          }}>
            <Text style={{
              color: 'rgba(255,255,255,0.95)',
              fontSize: 18,
              fontWeight: '700',
              marginBottom: 20,
              textAlign: 'center',
            }}>
              Accedi
            </Text>

            <GlassInput
              label="Username"
              placeholder="Il tuo username"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />

            <GlassInput
              label="Password"
              placeholder="La tua password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            {error ? (
              <View style={{
                backgroundColor: 'rgba(239,68,68,0.1)',
                borderRadius: 10,
                padding: 10,
                marginBottom: 12,
                borderWidth: 1,
                borderColor: 'rgba(239,68,68,0.15)',
              }}>
                <Text style={{ color: '#EF4444', fontSize: 13, textAlign: 'center', fontWeight: '500' }}>
                  {error}
                </Text>
              </View>
            ) : null}

            <GlassButton
              title={loading ? 'Accesso in corso...' : 'Accedi'}
              onPress={handleLogin}
              disabled={loading}
              style={{ marginTop: 4 }}
            />
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </LinearGradient>
  )
}
