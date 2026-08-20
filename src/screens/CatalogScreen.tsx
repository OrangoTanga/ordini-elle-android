import React, { useEffect, useState, useMemo, useRef } from 'react'
import { View, Text, ScrollView, TextInput, Modal, RefreshControl, Platform, LayoutAnimation, UIManager, Dimensions } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { LinearGradient } from 'expo-linear-gradient'
import { Product, CATEGORIES, ProductCategory } from '../types'
import { api } from '../services/api'
import { cartStore } from '../store/cartStore'
import { ProductCard } from '../components/ProductCard'
import { CategoryChip } from '../components/CategoryChip'
import { FloatingCartButton } from '../components/FloatingCartButton'
import { CartSheet } from '../components/CartSheet'
import { ConnectionIndicator } from '../components/ConnectionIndicator'
import { ProductCardShimmer } from '../components/ShimmerLoader'
import { FadeInView } from '../components/FadeInView'

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true)
}

const GRID_KEY = 'grid_columns'

const CATEGORY_ICONS: Partial<Record<ProductCategory, string>> = {
  'vino bianco': '🥂',
  'vino rosso': '🍷',
  'prosecco': '🍾',
  'birre': '🍺',
  'distillati': '🥃',
  'extra': '✨',
}

interface CatalogScreenProps {
  navigation: any
}

export const CatalogScreen: React.FC<CatalogScreenProps> = ({ navigation }) => {
  const [products, setProducts] = useState<Product[]>([])
  const [search, setSearch] = useState('')
  const [selectedCat, setSelectedCat] = useState('Tutti')
  const [showCart, setShowCart] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [gridCols, setGridCols] = useState(2)

  useEffect(() => {
    loadProducts()
    AsyncStorage.getItem(GRID_KEY).then(v => {
      if (v === '4' || v === '3' || v === '2') {
        const n = parseInt(v)
        setGridCols(n)
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
      }
    })
  }, [])

  const loadProducts = async () => {
    setRefreshing(true)
    const result = await api.products.list()
    if (result.success) {
      setProducts(result.data || [])
    }
    setLoading(false)
    setRefreshing(false)
  }

  const filtered = useMemo(() => {
    return products.filter(p => {
      const matchSearch = p.name?.toLowerCase().includes(search.toLowerCase())
      return matchSearch && p.active
    })
  }, [products, search])

  const categories = ['Tutti', ...CATEGORIES]

  const sections = useMemo(() => {
    const filteredByCat = selectedCat === 'Tutti'
      ? filtered
      : filtered.filter(p => p.category === selectedCat)
    return CATEGORIES
      .map(cat => ({
        category: cat,
        icon: CATEGORY_ICONS[cat] || '',
        products: filteredByCat.filter(p => p.category === cat),
      }))
      .filter(s => s.products.length > 0)
  }, [filtered, selectedCat])

  const renderProductGrid = (productsSlice: Product[], sectionIndex: number) => {
    const cols = gridCols
    const gap = 8
    const screenWidth = Dimensions.get('window').width
    const paddingH = 12
    const itemWidth = Math.floor((screenWidth - paddingH * 2 - (cols - 1) * gap) / cols)

    const padded = [...productsSlice]
    while (padded.length % cols !== 0) padded.push(null as any)

    return (
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap }}>
        {padded.map((item, idx) => {
          if (!item) return <View key={`spacer-${idx}`} style={{ width: itemWidth }} />
          return (
            <FadeInView
              key={item.id}
              delay={(idx % cols) * 30 + sectionIndex * 60}
              duration={300}
              style={{ width: itemWidth, marginBottom: 0 }}
            >
              <ProductCard
                product={item}
                onAdd={() => cartStore.addItem(item)}
              />
            </FadeInView>
          )
        })}
      </View>
    )
  }

  return (
    <LinearGradient colors={['#0B1120', '#192734']} style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
        <View style={{ paddingHorizontal: 16, paddingTop: 60, paddingBottom: 8 }}>
          <View style={{
            flexDirection: 'row', justifyContent: 'space-between',
            alignItems: 'center', marginBottom: 16,
          }}>
            <View>
              <Text style={{
                color: 'rgba(255,255,255,0.95)', fontSize: 26, fontWeight: '800',
                letterSpacing: -0.5,
              }}>
                Catalogo
              </Text>
              <Text style={{ color: 'rgba(255,255,255,0.30)', fontSize: 12, marginTop: 2 }}>
                {products.length} prodotti
              </Text>
            </View>
            <ConnectionIndicator />
          </View>

          <View style={{
            flexDirection: 'row', alignItems: 'center',
            backgroundColor: '#192734',
            borderRadius: 14,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.06)',
            paddingHorizontal: 14,
          }}>
            <Text style={{ fontSize: 15, opacity: 0.3, marginRight: 8 }}>🔍</Text>
            <TextInput
              placeholder="Cerca prodotto..."
              placeholderTextColor="rgba(255,255,255,0.20)"
              value={search}
              onChangeText={setSearch}
              style={{
                flex: 1,
                paddingVertical: 14,
                color: 'rgba(255,255,255,0.92)',
                fontSize: 14,
              }}
            />
            {search ? (
              <Text
                onPress={() => setSearch('')}
                style={{ color: 'rgba(255,255,255,0.3)', fontSize: 16, padding: 4 }}
              >
                ✕
              </Text>
            ) : null}
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginTop: 12 }}
          >
            {categories.map(cat => (
              <CategoryChip
                key={cat}
                label={cat || 'Senza categoria'}
                selected={selectedCat === cat}
                onPress={() => setSelectedCat(cat)}
              />
            ))}
          </ScrollView>
        </View>

        {loading ? (
          <View style={{ paddingHorizontal: 12 }}>
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
              <View style={{ flex: 1 }}><ProductCardShimmer /></View>
              <View style={{ flex: 1 }}><ProductCardShimmer /></View>
            </View>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}><ProductCardShimmer /></View>
              <View style={{ flex: 1 }}><ProductCardShimmer /></View>
            </View>
          </View>
        ) : sections.length === 0 ? (
          <FadeInView style={{ alignItems: 'center', paddingVertical: 60 }}>
            <Text style={{ fontSize: 40, marginBottom: 12, opacity: 0.3 }}>📭</Text>
            <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14 }}>
              Nessun prodotto trovato
            </Text>
          </FadeInView>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: Platform.OS === 'android' ? 120 : 20 }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={loadProducts}
                tintColor="rgba(255,255,255,0.5)"
                progressBackgroundColor="#192734"
              />
            }
          >
            <View style={{ paddingHorizontal: 12 }}>
              {sections.map((section, si) => (
                <View key={section.category} style={{ marginBottom: 24 }}>
                  <View style={{
                    flexDirection: 'row', alignItems: 'center',
                    marginBottom: 12, paddingHorizontal: 4,
                  }}>
                    <Text style={{ fontSize: 18, marginRight: 8 }}>{section.icon}</Text>
                    <Text style={{
                      color: 'rgba(255,255,255,0.95)', fontSize: 18,
                      fontWeight: '700', letterSpacing: -0.3,
                      textTransform: 'capitalize',
                    }}>
                      {section.category}
                    </Text>
                    <View style={{
                      flex: 1, height: 1,
                      backgroundColor: 'rgba(255,255,255,0.06)',
                      marginLeft: 12,
                    }} />
                  </View>
                  {renderProductGrid(section.products, si)}
                </View>
              ))}
            </View>
          </ScrollView>
        )}

        <FloatingCartButton onPress={() => setShowCart(true)} />

        <Modal
          visible={showCart}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowCart(false)}
        >
          <LinearGradient colors={['#0B1120', '#192734']} style={{ flex: 1 }}>
            <CartSheet
              onClose={() => setShowCart(false)}
              onCheckout={() => {
                setShowCart(false)
                navigation.navigate('NewOrder')
              }}
            />
          </LinearGradient>
        </Modal>
      </View>
    </LinearGradient>
  )
}
