import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { View, Text } from 'react-native'
import { BlurView } from 'expo-blur'
import { CatalogScreen } from '../screens/CatalogScreen'
import { NewOrderScreen } from '../screens/NewOrderScreen'
import { OrderHistoryScreen } from '../screens/OrderHistoryScreen'
import { OrderDetailScreen } from '../screens/OrderDetailScreen'
import { ProfileScreen } from '../screens/ProfileScreen'
import { PaymentsScreen } from '../screens/PaymentsScreen'

const Stack = createNativeStackNavigator()
const Tab = createBottomTabNavigator()

const TabIcon: React.FC<{ icon: string; focused: boolean }> = ({ icon, focused }) => (
  <View style={{ alignItems: 'center', justifyContent: 'center', width: 52, height: 52 }}>
    {focused && (
      <>
        <View style={{
          position: 'absolute', left: -9, top: -7,
          width: 70, height: 70, borderRadius: 35,
          backgroundColor: 'rgba(0,180,216,0.03)',
        }} />
        <View style={{
          position: 'absolute', left: -1, top: 1,
          width: 54, height: 54, borderRadius: 27,
          backgroundColor: 'rgba(0,180,216,0.05)',
        }} />
        <View style={{
          position: 'absolute', left: 7, top: 9,
          width: 38, height: 38, borderRadius: 19,
          backgroundColor: 'rgba(0,180,216,0.08)',
        }} />
      </>
    )}
    <Text style={{
      fontSize: 22,
      opacity: focused ? 1 : 0.30,
      transform: focused ? [{ scale: 1.12 }] : [{ scale: 1 }],
    }}>
      {icon}
    </Text>
  </View>
)

function CatalogStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Catalog" component={CatalogScreen} />
      <Stack.Screen
        name="NewOrder"
        component={NewOrderScreen}
        options={{ animation: 'slide_from_bottom' }}
      />
    </Stack.Navigator>
  )
}

function OrdersStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="OrderList" component={OrderHistoryScreen} />
      <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
    </Stack.Navigator>
  )
}

export const AppNavigator: React.FC = () => (
  <NavigationContainer>
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          left: 16,
          right: 16,
          bottom: 16,
          borderTopWidth: 0,
          paddingTop: 6,
          paddingBottom: 6,
          height: 64,
          backgroundColor: 'transparent',
          elevation: 0,
          borderRadius: 32,
          overflow: 'hidden',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.5,
          shadowRadius: 28,
        },
        tabBarBackground: () => (
          <BlurView
            intensity={100}
            tint="dark"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(11,17,32,0.6)',
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.05)',
            }}
          />
        ),
        tabBarActiveTintColor: '#00B4D8',
        tabBarInactiveTintColor: 'rgba(255,255,255,0.25)',
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          marginTop: 1,
        },
      }}
    >
      <Tab.Screen
        name="CatalogTab"
        component={CatalogStack}
        options={{
          tabBarLabel: 'Catalogo',
          tabBarIcon: ({ focused }) => <TabIcon icon="📋" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="OrdersTab"
        component={OrdersStack}
        options={{
          tabBarLabel: 'Ordini',
          tabBarIcon: ({ focused }) => <TabIcon icon="🛒" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="PaymentsTab"
        component={PaymentsScreen}
        options={{
          tabBarLabel: 'Pagamenti',
          tabBarIcon: ({ focused }) => <TabIcon icon="💳" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profilo',
          tabBarIcon: ({ focused }) => <TabIcon icon="👤" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  </NavigationContainer>
)
