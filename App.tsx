import React, { useEffect, useState } from 'react'
import { View, Image, ActivityIndicator, StatusBar, Animated } from 'react-native'
import { authStore } from './src/store/authStore'
import { initLocalDb } from './src/database/localDb'
import { AppNavigator } from './src/navigation/AppNavigator'
import { LoginScreen } from './src/screens/LoginScreen'
import { updateStore } from './src/services/updateService'
import { UpdateBanner } from './src/components/UpdateBanner'
import { UpdateBlocker } from './src/components/UpdateBlocker'

export default function App() {
  const [ready, setReady] = useState(false)
  const [state, setState] = useState(0)
  const splashFade = React.useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.timing(splashFade, { toValue: 1, duration: 600, useNativeDriver: true }).start()
    initApp()
  }, [])

  useEffect(() => {
    const unsub = authStore.subscribe(() => setState(s => s + 1))
    const unsubUpd = updateStore.subscribe(() => setState(s => s + 1))
    return () => { unsub(); unsubUpd() }
  }, [])

  const initApp = async () => {
    try {
      await initLocalDb()
      await authStore.init()
      await updateStore.init()
      const { syncPendingPayments } = await import('./src/services/notifications')
      if (authStore.getState().isLoggedIn) syncPendingPayments()
    } catch {}

    setReady(true)
  }

  if (!ready) {
    return (
      <View style={{
        flex: 1, alignItems: 'center', justifyContent: 'center',
        backgroundColor: '#0B1120',
      }}>
        <StatusBar barStyle="light-content" backgroundColor="#0B1120" />
        <Animated.View style={{ opacity: splashFade, alignItems: 'center' }}>
          <Image
            source={require('./assets/splash.png')}
            style={{ width: 180, height: 180, marginBottom: 24 }}
            resizeMode="contain"
          />
          <ActivityIndicator size="small" color="#00B4D8" />
        </Animated.View>
      </View>
    )
  }

  const upd = updateStore.getState()

  return (
    <View style={{ flex: 1 }}>
      <StatusBar barStyle="light-content" backgroundColor="#0B1120" />
      {upd.info && !upd.dismissed && !upd.info.mandatory && (
        <UpdateBanner
          info={upd.info}
          currentVersion={upd.currentVersion}
          downloading={upd.downloading}
          error={upd.error}
          onUpdateNow={() => updateStore.updateNow()}
          onDismiss={() => updateStore.dismiss()}
        />
      )}
      {authStore.getState().isLoggedIn ? <AppNavigator /> : <LoginScreen />}
      <UpdateBlocker
        visible={!!upd.info?.mandatory}
        info={upd.info || { version: null, url: null, mandatory: true, notes: '' }}
        currentVersion={upd.currentVersion}
        downloading={upd.downloading}
        error={upd.error}
        onUpdateNow={() => updateStore.updateNow()}
      />
    </View>
  )
}
