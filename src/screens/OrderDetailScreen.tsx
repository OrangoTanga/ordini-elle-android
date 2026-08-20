import React from 'react'
import { View, Text, ScrollView, TouchableOpacity, Platform } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { GlassCard } from '../components/GlassCard'
import { StatusBadge } from '../components/StatusBadge'
import { FadeInView } from '../components/FadeInView'

export const OrderDetailScreen: React.FC<{ route: any; navigation: any }> = ({ route, navigation }) => {
  const { order } = route.params || {}

  if (!order) return null

  const items = order.items || []
  const commissionTotal = order.commission_total ?? items.reduce((sum: number, item: any) => {
    return sum + (item.commission || (item.subtotal * (item.commission_percent || 0) / 100))
  }, 0)

  return (
    <LinearGradient colors={['#0B1120', '#192734']} style={{ flex: 1 }}>
      <View style={{ paddingHorizontal: 16, paddingTop: 60, paddingBottom: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <View style={{
              width: 32, height: 32, borderRadius: 16,
              backgroundColor: 'rgba(255,255,255,0.06)',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 16 }}>←</Text>
            </View>
          </TouchableOpacity>
          <Text style={{ color: 'rgba(255,255,255,0.95)', fontSize: 22, fontWeight: '800' }}>
            Dettaglio Ordine
          </Text>
        </View>
      </View>

      <ScrollView style={{ flex: 1, paddingHorizontal: 16 }} contentContainerStyle={{ paddingBottom: Platform.OS === 'android' ? 100 : 40 }}>
        <FadeInView>
          <View style={{
            flexDirection: 'row', justifyContent: 'space-between',
            alignItems: 'center', marginBottom: 16,
          }}>
            <StatusBadge status={order.status} size="md" />
            <Text style={{ color: 'rgba(255,255,255,0.30)', fontSize: 12 }}>
              #{order.id} · {order.created_at?.split('T')[0]}
            </Text>
          </View>

          <GlassCard style={{ marginBottom: 16 }}>
            <Text style={{
              fontSize: 11, color: '#00B4D8', marginBottom: 8, letterSpacing: 1, fontWeight: '600',
            }}>
              ATTIVITÀ
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.95)', fontSize: 17, fontWeight: '700' }}>
              {order.business_name}
            </Text>
            <View style={{ marginTop: 12, gap: 4 }}>
              <InfoRow label="P.IVA" value={order.vat} />
              <InfoRow label="IBAN" value={order.iban} />
              <InfoRow label="Data fattura" value={order.invoice_date} />
              <InfoRow label="Documento" value={order.document_type === 'fattura' ? 'Fattura' : 'Scontrino'} />
              <InfoRow label="Pagamento" value={order.payment_terms === 'immediato' ? 'Immediato' : `${order.payment_terms} giorni`} />
              <InfoRow label="Rappresentante" value={order.user_name} />
            </View>
          </GlassCard>

          <GlassCard style={{ marginBottom: 16 }}>
            <Text style={{
              fontSize: 11, color: '#00B4D8', marginBottom: 12, letterSpacing: 1, fontWeight: '600',
            }}>
              PRODOTTI
            </Text>
            {items.map((item: any, i: number) => {
              const comm = item.commission || (item.subtotal * (item.commission_percent || 0) / 100)
              return (
                <View key={i} style={{
                  flexDirection: 'row', alignItems: 'center', gap: 12,
                  paddingVertical: 10,
                  borderBottomWidth: i < items.length - 1 ? 1 : 0,
                  borderBottomColor: 'rgba(255,255,255,0.03)',
                }}>
                  <View style={{
                    width: 36, height: 36, borderRadius: 10,
                    backgroundColor: 'rgba(255,255,255,0.04)',
                    alignItems: 'center', justifyContent: 'center',
                    borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)',
                  }}>
                    <Text style={{ fontSize: 14, opacity: 0.5 }}>📦</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: 'rgba(255,255,255,0.92)', fontSize: 14, fontWeight: '500' }}>
                      {item.product_name}
                    </Text>
                    <Text style={{ color: 'rgba(255,255,255,0.40)', fontSize: 12 }}>
                      €{item.price.toFixed(2)} x {item.quantity}
                      {item.commission_percent ? ` · provv. ${item.commission_percent}%` : ''}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ color: '#00B4D8', fontSize: 15, fontWeight: '700' }}>
                      €{item.subtotal?.toFixed(2)}
                    </Text>
                    {comm > 0 && (
                      <Text style={{ color: '#10B981', fontSize: 10, fontWeight: '600' }}>
                        +€{comm.toFixed(2)}
                      </Text>
                    )}
                  </View>
                </View>
              )
            })}

            <View style={{
              flexDirection: 'row', justifyContent: 'space-between',
              borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)',
              paddingTop: 12, marginTop: 8,
            }}>
              <Text style={{ color: 'rgba(255,255,255,0.92)', fontSize: 16, fontWeight: '700' }}>TOTALE</Text>
              <Text style={{ color: '#00B4D8', fontSize: 20, fontWeight: '800' }}>
                €{order.total?.toFixed(2)}
              </Text>
            </View>

            {items.some((item: any) => item.commission_percent) && (
              <View style={{
                marginTop: 10,
              }}>
                <Text style={{
                  fontSize: 11, color: '#00B4D8', marginBottom: 10, letterSpacing: 1, fontWeight: '600',
                }}>
                  💰 PROVVIGIONI
                </Text>
                {items.map((item: any, i: number) => {
                  const comm = item.commission || (item.subtotal * (item.commission_percent || 0) / 100)
                  if (!item.commission_percent) return null
                  return (
                    <View key={i} style={{
                      flexDirection: 'row', justifyContent: 'space-between',
                      paddingVertical: 4, borderBottomWidth: i < items.length - 1 ? 1 : 0,
                      borderBottomColor: 'rgba(255,255,255,0.03)',
                    }}>
                      <Text style={{ color: 'rgba(255,255,255,0.60)', fontSize: 12, flex: 1 }}>
                        {item.product_name}
                      </Text>
                      <Text style={{ color: '#10B981', fontSize: 13, fontWeight: '600' }}>
                        {item.commission_percent}% · €{comm.toFixed(2)}
                      </Text>
                    </View>
                  )
                })}
                <View style={{
                  flexDirection: 'row', justifyContent: 'space-between',
                  borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)',
                  paddingTop: 8, marginTop: 4,
                }}>
                  <Text style={{ color: 'rgba(255,255,255,0.80)', fontSize: 14, fontWeight: '700' }}>
                    TOTALE PROVVIGIONE
                  </Text>
                  <Text style={{ color: '#10B981', fontSize: 16, fontWeight: '800' }}>
                    €{commissionTotal.toFixed(2)}
                  </Text>
                </View>
              </View>
            )}
          </GlassCard>

          {order.payment_status && (
            <GlassCard style={{ marginBottom: 12 }}>
              <Text style={{ color: '#00B4D8', fontSize: 12, fontWeight: '600', letterSpacing: 1, marginBottom: 10 }}>
                💳 PAGAMENTO
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Text style={{
                  fontSize: 13, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, overflow: 'hidden',
                  fontWeight: '600', alignSelf: 'flex-start',
                  backgroundColor: order.payment_status === 'paid' ? 'rgba(16,185,129,0.1)' :
                    order.payment_status === 'overdue' ? 'rgba(239,68,68,0.1)' : 'rgba(255,193,7,0.1)',
                  color: order.payment_status === 'paid' ? '#10B981' :
                    order.payment_status === 'overdue' ? '#EF4444' : '#FFC107',
                }}>
                  {order.payment_status === 'paid' ? '✅ Pagato' :
                   order.payment_status === 'overdue' ? '🔴 Scaduto' :
                   order.payment_status === 'partial' ? '🟡 Parziale' : '⏳ In sospeso'}
                </Text>
              </View>
              {order.payments?.map((p: any, i: number) => (
                <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
                  <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13 }}>
                    {p.type === 'acconto' ? 'Acconto' : p.type === 'saldo' ? 'Saldo' : 'Pagamento'}
                    {p.due_date ? ` (scad. ${p.due_date})` : ''}
                  </Text>
                  <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: '600' }}>
                    €{p.amount?.toFixed(2)}
                    {p.status === 'paid' ? ' ✅' : ''}
                  </Text>
                </View>
              ))}
              <Text style={{ color: 'rgba(255,255,255,0.30)', fontSize: 11, marginTop: 6 }}>
                Tipo: {order.payment_type === 'immediato' ? 'Immediato' :
                  order.payment_type === 'anticipato' ? 'Anticipato' :
                  order.payment_type === 'acconto_saldo' ? `Acc. ${order.deposit_percent}% + Saldo ${order.balance_days}gg` :
                  `${order.payment_days || order.payment_terms} giorni`}
              </Text>
            </GlassCard>
          )}

          {order.shared_reps?.length > 0 && (
            <GlassCard style={{ marginBottom: 12 }}>
              <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, fontWeight: '600', marginBottom: 6 }}>
                RAPPRESENTANTI
              </Text>
              {order.shared_reps.map((r: any) => (
                <Text key={r.user_id} style={{ color: 'rgba(255,255,255,0.70)', fontSize: 13 }}>
                  {r.user_name}
                </Text>
              ))}
              <Text style={{ color: '#10B981', fontSize: 12, marginTop: 4 }}>
                Provvigione: €{order.commission_per_rep?.toFixed(2)}/cad
              </Text>
            </GlassCard>
          )}

          {order.notes ? (
            <GlassCard style={{ marginBottom: 16 }}>
              <Text style={{
                fontSize: 11, color: '#00B4D8', marginBottom: 6, letterSpacing: 1, fontWeight: '600',
              }}>
                NOTE MAGAZZINO
              </Text>
              <Text style={{ color: 'rgba(255,255,255,0.70)', fontSize: 14 }}>{order.notes}</Text>
            </GlassCard>
          ) : null}
        </FadeInView>
      </ScrollView>
    </LinearGradient>
  )
}

const InfoRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 }}>
    <Text style={{ color: 'rgba(255,255,255,0.40)', fontSize: 13 }}>{label}</Text>
    <Text style={{ color: 'rgba(255,255,255,0.70)', fontSize: 13, fontWeight: '500' }}>{value}</Text>
  </View>
)
