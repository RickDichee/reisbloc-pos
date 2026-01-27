import { useEffect, useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAppStore } from '@/store/appStore'
import { usePermissions } from '@/hooks/usePermissions'
import supabaseService from '@/services/supabaseService'
import printService from '@/services/printService'
import { Order, OrderItem } from '@/types'
import { LayoutDashboard, ArrowLeftRight, XCircle, Timer, Users, Edit, CheckCircle, CreditCard } from 'lucide-react'
import SplitBillModal from '@/components/pos/SplitBillModal'
import EditOrderModal from '@/components/admin/EditOrderModal'
import PaymentPanel, { PaymentResult } from '@/components/pos/PaymentPanel'

interface TransferState {
  [orderId: string]: number
}

type SplitPayment = {
  personNumber: number
  items: { item: OrderItem; quantity: number }[]
  subtotal: number
  manualAmount?: number
  paymentMethods: { method: 'cash' | 'digital' | 'clip'; currency: 'MXN' | 'USD'; amount: number }[]
  tipAmount?: number
  tipCurrency?: 'MXN' | 'USD'
  paid?: boolean
}

const normalizeDate = (value: any): Date => {
  if (!value) return new Date()
  if (value instanceof Date) return value
  if (typeof value.toDate === 'function') return value.toDate()
  return new Date(value)
}

const humanizeDuration = (date: Date) => {
  const diffMs = Date.now() - date.getTime()
  const minutes = Math.max(0, Math.floor(diffMs / 60000))
  if (minutes < 1) return 'Hace un momento'
  if (minutes === 1) return 'Hace 1 minuto'
  if (minutes < 60) return `Hace ${minutes} min`
  const hours = Math.floor(minutes / 60)
  const remaining = minutes % 60
  return `Hace ${hours}h ${remaining}m`
}

export default function TableMonitor() {
  const { currentUser, tables } = useAppStore()
  const { canAccessTableMonitor, canManageTables, canModifyOrders } = usePermissions()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [transferTargets, setTransferTargets] = useState<TransferState>({})
  const [busyOrders, setBusyOrders] = useState<Record<string, boolean>>({})
  const [splitBillOrder, setSplitBillOrder] = useState<Order | null>(null)
  const [editOrder, setEditOrder] = useState<Order | null>(null)
  const [paymentOrder, setPaymentOrder] = useState<{ ids: string[]; total: number; tableNumber: number } | null>(null)

  const buildTicketHTML = (ordersList: Order[], tableNumber: number, title = 'Cuenta'): string => {
    const allItems = ordersList.flatMap(o => o.items || [])
    const subtotal = allItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
    const tax = 0
    const total = subtotal
    const date = new Date().toLocaleString('es-MX')

    const lines = allItems
      .map(item => `
        <div style="display:flex;justify-content:space-between;margin:2px 0;">
          <span>${item.quantity}x ${item.productName}</span>
          <span>$${(item.unitPrice * item.quantity).toFixed(2)}</span>
        </div>
      `)
      .join('')

    return `
      <div style="width:58mm;padding:8px;font-family:'Courier New', monospace;font-size:11px;line-height:1.2;color:#000;">
        <div style="text-align:center;margin-bottom:8px;border-bottom:1px solid #000;">
          <div style="font-weight:bold;font-size:12px;">CEVICHERIA MEXA</div>
          <div style="font-size:9px;">Restaurante y Marisquería</div>
          <div style="font-size:9px;">Mesa ${tableNumber}</div>
          <div style="font-size:9px;">${title}</div>
        </div>
        <div style="margin-bottom:6px;font-size:9px;">
          <div>Fecha: ${date}</div>
        </div>
        <div style="margin-bottom:8px;border-bottom:1px solid #000;padding-bottom:8px;">
          ${lines || '<div style="text-align:center;">(Sin items)</div>'}
        </div>
        <div style="margin-bottom:8px;border-bottom:1px solid #000;padding-bottom:8px;">
          <div style="display:flex;justify-content:space-between;margin:2px 0;">
            <span>Subtotal:</span>
            <span>$${subtotal.toFixed(2)}</span>
          </div>
          <div style="display:flex;justify-content:space-between;margin:2px 0;">
            <span>Impuesto:</span>
            <span>$${tax.toFixed(2)}</span>
          </div>
          <div style="font-weight:bold;display:flex;justify-content:space-between;font-size:12px;">
            <span>TOTAL:</span>
            <span>$${total.toFixed(2)}</span>
          </div>
        </div>
        <div style="text-align:center;font-size:9px;margin-top:8px;">
          <div>Este no es comprobante fiscal.</div>
          <div style="margin-top:4px;font-size:8px;">Gracias por su preferencia</div>
        </div>
      </div>
    `
  }

  const formatCurrency = (amount: number, currency: 'MXN' | 'USD' = 'MXN') => {
    const symbol = currency === 'USD' ? 'US$' : '$'
    return `${symbol}${amount.toFixed(2)}`
  }

  const buildSplitTicketHTML = (split: SplitPayment, tableNumber: number, title: string) => {
    const date = new Date().toLocaleString('es-MX')
    const baseAmount = typeof split.manualAmount === 'number' ? split.manualAmount : split.subtotal
    const tip = split.tipAmount || 0
    const total = baseAmount + tip

    const items = split.items
      .map(({ item, quantity }) => `
        <div style="display:flex;justify-content:space-between;margin:2px 0;">
          <span>${quantity}x ${item.productName}</span>
          <span>${formatCurrency(item.unitPrice * quantity)}</span>
        </div>
      `)
      .join('') || '<div style="text-align:center;">(Sin items)</div>'

    const payments = split.paymentMethods?.length
      ? split.paymentMethods
          .map((method, idx) => `
            <div style="display:flex;justify-content:space-between;margin:2px 0;font-size:9px;">
              <span>${idx + 1}. ${method.method.toUpperCase()} (${method.currency})</span>
              <span>${formatCurrency(method.amount, method.currency)}</span>
            </div>
          `)
          .join('')
      : '<div style="font-size:9px;text-align:center;">Sin pagos registrados</div>'

    return `
      <div style="width:58mm;padding:8px;font-family:'Courier New', monospace;font-size:11px;line-height:1.2;color:#000;">
        <div style="text-align:center;margin-bottom:8px;border-bottom:1px solid #000;">
          <div style="font-weight:bold;font-size:12px;">CEVICHERIA MEXA</div>
          <div style="font-size:9px;">Mesa ${tableNumber} · Persona ${split.personNumber}</div>
          <div style="font-size:9px;">${title}</div>
        </div>
        <div style="margin-bottom:6px;font-size:9px;">
          <div>Fecha: ${date}</div>
        </div>
        <div style="margin-bottom:8px;border-bottom:1px solid #000;padding-bottom:8px;">
          ${items}
        </div>
        <div style="margin-bottom:8px;border-bottom:1px solid #000;padding-bottom:8px;">
          <div style="display:flex;justify-content:space-between;margin:2px 0;">
            <span>Subtotal:</span>
            <span>${formatCurrency(baseAmount)}</span>
          </div>
          <div style="display:flex;justify-content:space-between;margin:2px 0;">
            <span>Propina (${split.tipCurrency || 'MXN'}):</span>
            <span>${formatCurrency(tip, split.tipCurrency || 'MXN')}</span>
          </div>
          <div style="font-weight:bold;display:flex;justify-content:space-between;font-size:12px;">
            <span>TOTAL:</span>
            <span>${formatCurrency(total)}</span>
          </div>
        </div>
        <div style="margin-bottom:8px;padding-bottom:8px;border-bottom:1px solid #000;">
          <div style="font-size:9px;margin-bottom:4px;font-weight:bold;">Pagos</div>
          ${payments}
        </div>
        <div style="text-align:center;font-size:9px;margin-top:8px;">
          <div>Este ticket es informativo y no afecta el cierre.</div>
        </div>
      </div>
    `
  }

  const handlePrintTable = async (ordersList: Order[], tableNumber: number, title = 'Cuenta') => {
    try {
      const html = buildTicketHTML(ordersList, tableNumber, title)
      await printService.printReceipt(html, { title, width: 58 })
    } catch (err) {
      // printService already logs errors
    }
  }

  const printSplitTickets = async (splitData: SplitPayment[], tableNumber: number) => {
    for (const split of splitData) {
      const personaLabel = `Persona ${split.personNumber}`

      try {
        const customerHTML = buildSplitTicketHTML(split, tableNumber, `Cuenta · ${personaLabel}`)
        await printService.printReceipt(customerHTML, { title: `Cuenta ${personaLabel}`, width: 58 })
      } catch (err) {
        // printService already logs errors
      }

      try {
        const kitchenHTML = buildSplitTicketHTML(split, tableNumber, `Cocina · ${personaLabel}`)
        await printService.printKitchenTicket(kitchenHTML, { title: `Cocina Mesa ${tableNumber}`, width: 58 })
      } catch (err) {
        // printService already logs errors
      }

      try {
        const barHTML = buildSplitTicketHTML(split, tableNumber, `Bar · ${personaLabel}`)
        await printService.printKitchenTicket(barHTML, { title: `Bar Mesa ${tableNumber}`, width: 58 })
      } catch (err) {
        // printService already logs errors
      }
    }
  }

  const calculateOrderTotal = (order?: Order | null) => {
    if (!order?.items?.length) return 0
    return order.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
  }

  const consolidateOrdersForPayment = (tableOrders: Order[]): { regular: Order[]; consolidated: { orders: Order[]; total: number } | null } => {
    const servedOrders = tableOrders.filter(o => o.status === 'served')
    
    // If multiple served orders, consolidate them
    if (servedOrders.length > 1) {
      const consolidatedTotal = servedOrders.reduce((sum, o) => sum + calculateOrderTotal(o), 0)
      return {
        regular: tableOrders.filter(o => o.status !== 'served'),
        consolidated: {
          orders: servedOrders,
          total: consolidatedTotal,
        }
      }
    }
    
    // Otherwise, show all individually
    return {
      regular: tableOrders,
      consolidated: null,
    }
  }

  useEffect(() => {
    if (!canAccessTableMonitor) return

    const unsubscribe = supabaseService.subscribeToActiveOrders(
      data => {
        const normalized = (data || []).map(order => ({
          ...order,
          createdAt: normalizeDate((order as any).createdAt),
          sentToKitchenAt: normalizeDate((order as any).sentToKitchenAt),
          closedAt: normalizeDate((order as any).closedAt),
        }))
        setOrders(normalized)
        setLoading(false)
        setError(null)
      },
      message => {
        setError(message)
        setLoading(false)
      }
    )

    return () => {
      unsubscribe?.()
    }
  }, [canAccessTableMonitor])

  const groupedByTable = useMemo(() => {
    const map = new Map<number, Order[]>()
    orders.forEach(order => {
      const table = order.tableNumber
      const list = map.get(table) || []
      map.set(table, [...list, order])
    })

    return Array.from(map.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([tableNumber, list]) => ({
        tableNumber,
        orders: list.sort((a, b) => {
          const aTime = a.createdAt ? a.createdAt.getTime() : 0
          const bTime = b.createdAt ? b.createdAt.getTime() : 0
          return bTime - aTime
        }),
      }))
  }, [orders])

  const handleTransfer = async (orderId: string) => {
    const target = transferTargets[orderId]
    if (!target) return

    setBusyOrders(prev => ({ ...prev, [orderId]: true }))
    try {
      await supabaseService.updateOrder(orderId, { tableNumber: target })
    } catch (err: any) {
      setError(err?.message || 'No se pudo transferir la mesa')
    } finally {
      setBusyOrders(prev => ({ ...prev, [orderId]: false }))
    }
  }

  const handleClose = async (orderId: string) => {
    if (!currentUser) return

    setBusyOrders(prev => ({ ...prev, [orderId]: true }))
    try {
      await supabaseService.updateOrder(orderId, { status: 'completed', closedBy: currentUser.id, closedAt: new Date() })
    } catch (err: any) {
      setError(err?.message || 'No se pudo cerrar la mesa')
    } finally {
      setBusyOrders(prev => ({ ...prev, [orderId]: false }))
    }
  }

  const handleMarkServed = async (orderId: string) => {
    if (!currentUser) return

    setBusyOrders(prev => ({ ...prev, [orderId]: true }))
    try {
      await supabaseService.updateOrderStatus(orderId, 'served')
    } catch (err: any) {
      setError(err?.message || 'No se pudo marcar como servida')
    } finally {
      setBusyOrders(prev => ({ ...prev, [orderId]: false }))
    }
  }

  const handleSplitBill = async (splits: SplitPayment[]) => {
    if (!currentUser || !splitBillOrder) return

    setBusyOrders(prev => ({ ...prev, [splitBillOrder.id]: true }))
    try {
      // TODO: Implement proper split bill logic in Supabase
      await supabaseService.updateOrderStatus(splitBillOrder.id, 'paid')
      await printSplitTickets(splits, splitBillOrder.tableNumber)
      setSplitBillOrder(null)
      alert('✅ Cuenta dividida exitosamente')
    } catch (err: any) {
      setError(err?.message || 'No se pudo dividir la cuenta')
    } finally {
      setBusyOrders(prev => ({ ...prev, [splitBillOrder.id]: false }))
    }
  }

  const handleEditOrder = async (updatedItems: any[], notes: string) => {
    if (!currentUser || !editOrder) return

    setBusyOrders(prev => ({ ...prev, [editOrder.id]: true }))
    try {
      await supabaseService.updateOrder(editOrder.id, { items: updatedItems, notes })
      setEditOrder(null)
      alert('✅ Orden actualizada exitosamente')
    } catch (err: any) {
      setError(err?.message || 'No se pudo actualizar la orden')
      throw err
    } finally {
      setBusyOrders(prev => ({ ...prev, [editOrder.id]: false }))
    }
  }

  const handlePaymentComplete = async (result: PaymentResult) => {
    if (!currentUser || !paymentOrder) return

    // Si se solicita dividir cuenta
    if (result.splitRequested) {
      const orderToSplit = orders.find(o => paymentOrder.ids.includes(o.id))
      if (orderToSplit) {
        setSplitBillOrder(orderToSplit)
        setPaymentOrder(null)
      }
      return
    }

    const orderIds = paymentOrder.ids
    const allOrdersToClose = orderIds.map(id => ({ id, busy: true })).reduce((acc, o) => ({ ...acc, [o.id]: o.busy }), {})
    setBusyOrders(prev => ({ ...prev, ...allOrdersToClose }))
    
    try {
      // Consolidate all orders for the table
      const ordersToProcess = orders.filter(o => orderIds.includes(o.id))
      const allItems = ordersToProcess.flatMap(o => o.items || [])
      const subtotal = allItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
      
      const mappedMethod = result.paymentMethod === 'card' ? 'clip' : result.paymentMethod
      
      // Create a single sale for all orders
      await supabaseService.createSale({
        orderIds,
        tableNumber: paymentOrder.tableNumber,
        items: allItems,
        subtotal,
        discounts: 0,
        tax: 0,
        total: result.total,
        paymentMethod: mappedMethod as any,
        currency: result.currency || 'MXN',
        tip: result.tip,
        tipCurrency: result.tipCurrency || 'MXN',
        tipSource: result.tip > 0 ? (mappedMethod === 'cash' ? 'cash' : 'digital') : 'none',
        saleBy: currentUser.id,
        createdAt: new Date(),
      } as any)

      await handlePrintTable(ordersToProcess, paymentOrder.tableNumber, 'Ticket de Pago')

      // Close all orders
      for (const orderId of orderIds) {
        await supabaseService.updateOrderStatus(orderId, 'completed')
      }
      
      setPaymentOrder(null)
      alert('✅ Pago registrado y mesa cerrada')
    } catch (err: any) {
      setError(err?.message || 'No se pudo registrar el pago')
    } finally {
      setBusyOrders(prev => {
        const updated = { ...prev }
        orderIds.forEach(id => delete updated[id])
        return updated
      })
    }
  }

  const handleCancelOrder = async (reason: string) => {
    if (!currentUser || !editOrder) return

    setBusyOrders(prev => ({ ...prev, [editOrder.id]: true }))
    try {
      await supabaseService.updateOrder(editOrder.id, { status: 'cancelled', cancelReason: reason, cancelledBy: currentUser.id, cancelledAt: new Date() })
      setEditOrder(null)
      alert('✅ Orden cancelada exitosamente')
    } catch (err: any) {
      setError(err?.message || 'No se pudo cancelar la orden')
      throw err
    } finally {
      setBusyOrders(prev => ({ ...prev, [editOrder.id]: false }))
    }
  }

  if (!canAccessTableMonitor) {
    return <Navigate to="/pos" replace />
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center text-gray-600">Cargando monitor de mesas...</div>
      </div>
    )
  }

  const availableTables = tables.length ? tables : Array.from({ length: 12 }, (_, i) => i + 1)
  const activeTables = groupedByTable.length
  const activeOrders = orders.length

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-3xl shadow-2xl overflow-hidden">
          <div className="px-6 py-8 sm:px-10 sm:py-10 flex flex-col gap-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/10 rounded-2xl">
                <LayoutDashboard size={32} />
              </div>
              <div>
                <p className="text-sm text-slate-300 uppercase tracking-wide">Monitor en vivo</p>
                <h1 className="text-3xl sm:text-4xl font-bold">Mesas activas</h1>
                <p className="text-slate-200 mt-1">Visibilidad para admin, capitán y supervisor</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
              <div className="bg-white/10 rounded-2xl px-4 py-3">
                <p className="text-slate-300">Mesas activas</p>
                <p className="text-3xl font-bold">{activeTables}</p>
              </div>
              <div className="bg-white/10 rounded-2xl px-4 py-3">
                <p className="text-slate-300">Órdenes abiertas</p>
                <p className="text-3xl font-bold">{activeOrders}</p>
              </div>
              <div className="bg-white/10 rounded-2xl px-4 py-3">
                <p className="text-slate-300">Mesas totales</p>
                <p className="text-3xl font-bold">{availableTables.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        {/* Tables */}
        {groupedByTable.length === 0 ? (
          <div className="bg-white border border-gray-100 rounded-2xl p-8 text-center text-gray-600 shadow-sm">
            No hay mesas activas ahora.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {groupedByTable.map(group => (
              <div
                key={group.tableNumber}
                className="bg-white border border-gray-100 rounded-2xl shadow-lg p-5 flex flex-col gap-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Mesa</p>
                    <p className="text-2xl font-bold text-gray-900">{group.tableNumber}</p>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Timer size={16} />
                    <span>{humanizeDuration(group.orders[0]?.createdAt || new Date())}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  {(() => {
                    const { regular, consolidated } = consolidateOrdersForPayment(group.orders)
                    const ordersToDisplay = consolidated ? regular : group.orders

                    return (
                      <>
                        {/* Consolidated Payment Card (if multiple served orders) */}
                        {consolidated && (
                          <div key="consolidated" className="border-2 border-amber-300 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 space-y-3">
                            <div className="flex items-center justify-between gap-2">
                              <div>
                                <p className="text-xs text-amber-600 font-semibold">CONSOLIDADO</p>
                                <p className="text-lg font-bold text-amber-900">{consolidated.orders.length} órdenes</p>
                              </div>
                              <div className="text-right">
                                <p className="text-xs text-amber-600">Total Mesa</p>
                                <p className="text-2xl font-bold text-amber-900">${consolidated.total.toFixed(2)}</p>
                              </div>
                            </div>

                            <div className="bg-white/70 rounded-lg p-3 text-sm space-y-2 max-h-24 overflow-y-auto">
                              {consolidated.orders.map(o => (
                                <div key={o.id} className="flex justify-between items-center text-gray-700">
                                  <span className="text-xs">{o.id.slice(0, 8)}... ({o.items?.length || 0} items)</span>
                                  <span className="font-semibold">${calculateOrderTotal(o).toFixed(2)}</span>
                                </div>
                              ))}
                            </div>

                            {canModifyOrders && (
                              <div className="grid grid-cols-2 gap-2">
                                <button
                                  onClick={() => handlePrintTable(consolidated.orders, group.tableNumber, 'Cuenta Mesa')}
                                  className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-gray-900 text-white font-bold hover:bg-black transition-all"
                                >
                                  Imprimir Cuenta
                                </button>
                                <button
                                  onClick={() => setPaymentOrder({
                                    ids: consolidated.orders.map(o => o.id),
                                    total: consolidated.total,
                                    tableNumber: group.tableNumber
                                  })}
                                  disabled={consolidated.orders.some(o => busyOrders[o.id])}
                                  className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-gradient-to-r from-amber-600 to-orange-600 text-white font-bold disabled:opacity-60 hover:shadow-lg transition-all"
                                >
                                  <CreditCard size={18} /> Cobrar Mesa Completa
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Individual Orders */}
                        {ordersToDisplay.map(order => {
                          const total = calculateOrderTotal(order)
                          const status = order.status || 'open'
                          const targetTable = transferTargets[order.id] ?? group.tableNumber

                          return (
                            <div
                              key={order.id}
                              className="border border-gray-200 rounded-xl p-4 space-y-3"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div>
                                  <p className="text-xs text-gray-500">Orden</p>
                                  <p className="font-semibold text-gray-900">{order.id.slice(0, 8)}...</p>
                                </div>
                                <div
                                  className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                                    status === 'sent'
                                      ? 'bg-blue-100 text-blue-700'
                                      : status === 'ready'
                                      ? 'bg-amber-100 text-amber-700'
                                      : status === 'served'
                                      ? 'bg-emerald-100 text-emerald-700'
                                      : 'bg-slate-100 text-slate-700'
                                  }`}
                                >
                                  {status}
                                </div>
                              </div>

                              <div className="space-y-2 text-sm text-gray-700">
                                <div className="flex justify-between">
                                  <span>Items</span>
                                  <span className="font-semibold">{order.items?.length || 0}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Total estimado</span>
                                  <span className="font-semibold">${total.toFixed(2)}</span>
                                </div>
                                {order.notes && (
                                  <p className="text-xs text-gray-500">Nota: {order.notes}</p>
                                )}
                              </div>

                              <div className="bg-gray-50 rounded-lg p-2 text-xs text-gray-600 space-y-1">
                                {order.items?.slice(0, 3).map((item, idx) => (
                                  <div key={`${order.id}-item-${idx}`} className="flex justify-between">
                                    <span className="truncate">{item.productName}</span>
                                    <span className="font-semibold">x{item.quantity}</span>
                                  </div>
                                ))}
                                {order.items && order.items.length > 3 && (
                                  <p className="text-[11px] text-gray-500">y {order.items.length - 3} más...</p>
                                )}
                              </div>

                              {canModifyOrders && (
                                <div className="flex flex-wrap gap-2">
                                  {status === 'ready' && (
                                    <button
                                      onClick={() => handleMarkServed(order.id)}
                                      disabled={busyOrders[order.id]}
                                      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold disabled:opacity-60"
                                    >
                                      <CheckCircle size={16} /> Marcar servida
                                    </button>
                                  )}

                                  {status === 'served' && !consolidated && (
                                    <div className="flex flex-wrap gap-2 w-full">
                                      <button
                                        onClick={() => handlePrintTable([order], order.tableNumber, 'Cuenta Mesa')}
                                        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-900 text-white text-sm font-semibold"
                                      >
                                        Imprimir Cuenta
                                      </button>
                                      <button
                                        onClick={() => setPaymentOrder({
                                          ids: [order.id],
                                          total,
                                          tableNumber: order.tableNumber
                                        })}
                                        disabled={busyOrders[order.id]}
                                        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-600 text-white text-sm font-semibold disabled:opacity-60"
                                      >
                                        <CreditCard size={16} /> Cobrar
                                      </button>
                                    </div>
                                  )}
                                </div>
                              )}

                              {canManageTables && (
                                <div className="flex flex-col gap-2">
                                  <button
                                    onClick={() => setEditOrder(order)}
                                    disabled={busyOrders[order.id]}
                                    className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold disabled:opacity-60 hover:bg-indigo-700 transition-colors"
                                  >
                                    <Edit size={16} /> Editar Orden
                                  </button>

                                  <div className="flex items-center gap-2">
                                    <select
                                      value={targetTable}
                                      onChange={e =>
                                        setTransferTargets(prev => ({
                                          ...prev,
                                          [order.id]: Number(e.target.value),
                                        }))
                                      }
                                      className="flex-1 rounded-lg border-gray-200 text-sm"
                                    >
                                      {availableTables.map(num => (
                                        <option key={num} value={num}>
                                          Mesa {num}
                                        </option>
                                      ))}
                                    </select>
                                    <button
                                      onClick={() => handleTransfer(order.id)}
                                      disabled={busyOrders[order.id] || targetTable === group.tableNumber}
                                      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold disabled:opacity-60"
                                    >
                                      <ArrowLeftRight size={16} /> Transferir
                                    </button>
                                  </div>
                                  <button
                                    onClick={() => setSplitBillOrder(order)}
                                    disabled={busyOrders[order.id]}
                                    className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-purple-600 text-white text-sm font-semibold disabled:opacity-60"
                                  >
                                    <Users size={16} /> Dividir Cuenta
                                  </button>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </>
                    )
                  })()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {splitBillOrder && (
        <SplitBillModal
          order={splitBillOrder}
          onClose={() => setSplitBillOrder(null)}
          onConfirmSplit={handleSplitBill}
        />
      )}

      {editOrder && (
        <EditOrderModal
          order={editOrder}
          onClose={() => setEditOrder(null)}
          onSave={handleEditOrder}
          onCancel={handleCancelOrder}
        />
      )}

      {paymentOrder && (
        <PaymentPanel
          orderIds={paymentOrder.ids}
          orderTotal={paymentOrder.total}
          tableNumber={paymentOrder.tableNumber}
          onPaymentComplete={handlePaymentComplete}
          onCancel={() => setPaymentOrder(null)}
        />
      )}
    </div>
  )
}
