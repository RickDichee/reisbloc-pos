/**
 * Reisbloc POS - Sistema POS Profesional
 * Copyright (C) 2026 Reisbloc POS
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 */

// Servicio Supabase para operaciones de base de datos (PostgreSQL)
import { supabase } from '@/config/supabase'
import logger from '@/utils/logger'
import {
  User,
  Device,
  Product,
  Order,
  Sale,
  DailyClose,
  AuditLog,
} from '@/types/index'

class SupabaseService {
  // Reintento simple para operaciones de red propensas a fallos transitorios
  private async withRetry<T>(operation: () => Promise<T>, retries = 2, delayMs = 200): Promise<T> {
    try {
      return await operation()
    } catch (error) {
      if (retries <= 0) throw error
      await new Promise(resolve => setTimeout(resolve, delayMs))
      return this.withRetry(operation, retries - 1, delayMs * 2)
    }
  }

  // ==================== USERS ====================

  async getUserByUsername(username: string): Promise<User | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('name', username) // Supabase uses 'name' column
        .single()

      if (error) throw error
      // Map Supabase fields to TypeScript User type
      const user = data ? { ...data, username: data.name } : null
      return user as User
    } catch (error) {
      logger.error('supabase', 'Error getting user', error as any)
      return null
    }
  }

  async getUserById(userId: string): Promise<User | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) throw error
      // Map Supabase fields to TypeScript User type
      const user = data ? { ...data, username: data.name } : null
      return user as User
    } catch (error) {
      logger.error('supabase', 'Error getting user by ID', error as any)
      return null
    }
  }

  async getAllUsers(): Promise<User[]> {
    return this.withRetry(async () => {
      console.log('🔍 [Supabase] Obteniendo usuarios...')
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        // .eq('active', true) // Temporalmente comentado para debug
        .order('name', { ascending: true })

      console.log('🔍 [Supabase] Data:', data)
      console.log('🔍 [Supabase] Error:', error)
      
      if (error) throw error
      // Map Supabase fields to TypeScript User type
      return (data || []).map(user => ({ ...user, username: user.name })) as User[]
    }).catch(error => {
      logger.error('supabase', 'Error getting all users', error as any)
      return []
    })
  }

  async createUser(user: Omit<User, 'id'>): Promise<string> {
    try {
      // Map TypeScript User fields to Supabase schema
      const { username, createdAt, ...rest } = user as any
      const supabaseUser = { ...rest, name: username }
      
      const { data, error } = await supabase
        .from('users')
        .insert([supabaseUser])
        .select('id')
        .single()

      if (error) throw error
      return data.id
    } catch (error) {
      logger.error('supabase', 'Error creating user', error as any)
      throw error
    }
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<void> {
    try {
      // Map TypeScript User fields to Supabase schema
      const { username, createdAt, ...rest } = updates as any
      const supabaseUpdates = username ? { ...rest, name: username } : rest
      
      const { error } = await supabase
        .from('users')
        .update(supabaseUpdates)
        .eq('id', userId)

      if (error) throw error
    } catch (error) {
      logger.error('supabase', 'Error updating user', error as any)
      throw error
    }
  }

  async deleteUser(userId: string): Promise<void> {
    try {
      // Soft delete - marcar como inactivo
      const { error } = await supabase
        .from('users')
        .update({ active: false })
        .eq('id', userId)

      if (error) throw error
    } catch (error) {
      logger.error('supabase', 'Error deleting user', error as any)
      throw error
    }
  }

  // ==================== DEVICES ====================

  async getAllDevices(): Promise<Device[]> {
    try {
      const { data, error } = await supabase
        .from('devices')
        .select('*')

      if (error) throw error
      
      console.log('🔍 [Supabase] Devices raw:', data)
      
      // Mapear snake_case a camelCase
      return (data || []).map((d: any) => ({
        id: d.id,
        userId: d.user_id,
        macAddress: d.mac_address,
        deviceName: d.device_name,
        network: d.network || d.network_type,
        os: d.os,
        browser: d.browser,
        deviceType: d.device_type,
        fingerprint: d.fingerprint,
        registeredAt: new Date(d.registered_at || d.created_at),
        lastAccess: new Date(d.last_access || d.last_seen),
        isApproved: d.status === 'approved',
        isRejected: d.status === 'rejected',
      })) as Device[]
    } catch (error) {
      logger.error('supabase', 'Error getting all devices', error as any)
      return []
    }
  }

  async registerDevice(device: Omit<Device, 'id'>): Promise<string> {
    try {
      // Mapear camelCase a snake_case para PostgreSQL
      const deviceData = {
        user_id: device.userId,
        mac_address: device.macAddress,
        device_name: device.deviceName,
        device_type: device.deviceType,
        network: device.network,
        network_type: device.network,
        os: device.os,
        browser: device.browser,
        fingerprint: device.fingerprint,
        status: 'pending',
        registered_at: device.registeredAt?.toISOString() || new Date().toISOString(),
        last_access: device.lastAccess?.toISOString() || new Date().toISOString(),
        last_seen: new Date().toISOString()
      }

      // Usar UPSERT para evitar errores de duplicado
      const { data, error } = await supabase
        .from('devices')
        .upsert([deviceData], { onConflict: 'mac_address' })
        .select('id')
        .single()

      if (error) throw error
      return data.id
    } catch (error) {
      logger.error('supabase', 'Error registering device', error as any)
      throw error
    }
  }

  async getDevicesByUser(userId: string): Promise<Device[]> {
    try {
      const { data, error } = await supabase
        .from('devices')
        .select('*')
        .eq('user_id', userId)

      if (error) throw error
      
      // Mapear snake_case a camelCase
      return (data || []).map((d: any) => ({
        id: d.id,
        userId: d.user_id,
        macAddress: d.mac_address,
        deviceName: d.device_name,
        network: d.network || d.network_type,
        os: d.os,
        browser: d.browser,
        deviceType: d.device_type,
        fingerprint: d.fingerprint,
        registeredAt: new Date(d.registered_at || d.created_at),
        lastAccess: new Date(d.last_access || d.last_seen),
        isApproved: d.status === 'approved',
        isRejected: d.status === 'rejected',
      })) as Device[]
    } catch (error) {
      logger.error('supabase', 'Error getting devices', error as any)
      return []
    }
  }

  async getDeviceById(deviceId: string): Promise<Device | null> {
    try {
      const { data, error } = await supabase
        .from('devices')
        .select('*')
        .eq('id', deviceId)
        .single()

      if (error) throw error
      return data as Device
    } catch (error) {
      logger.error('supabase', 'Error getting device', error as any)
      return null
    }
  }

  async updateDevice(deviceId: string, updates: Partial<Device>): Promise<void> {
    try {
      // Mapear camelCase a snake_case
      const updateData: any = {}
      if (updates.userId) updateData.user_id = updates.userId
      if (updates.macAddress) updateData.mac_address = updates.macAddress
      if (updates.deviceName) updateData.device_name = updates.deviceName
      if (updates.network) updateData.network = updates.network
      if (updates.os) updateData.os = updates.os
      if (updates.browser) updateData.browser = updates.browser
      if (updates.deviceType) updateData.device_type = updates.deviceType
      if (updates.fingerprint) updateData.fingerprint = updates.fingerprint
      if (updates.lastAccess) updateData.last_access = updates.lastAccess.toISOString()
      
      updateData.last_seen = new Date().toISOString()

      const { error } = await supabase
        .from('devices')
        .update(updateData)
        .eq('id', deviceId)

      if (error) throw error
    } catch (error) {
      logger.error('supabase', 'Error updating device', error as any)
      throw error
    }
  }

  async approveDevice(deviceId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('devices')
        .update({
          status: 'approved',
          approved_at: new Date().toISOString()
        })
        .eq('id', deviceId)

      if (error) throw error
    } catch (error) {
      logger.error('supabase', 'Error approving device', error as any)
      throw error
    }
  }

  async revokeDevice(deviceId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('devices')
        .update({
          status: 'rejected'
        })
        .eq('id', deviceId)

      if (error) throw error
    } catch (error) {
      logger.error('supabase', 'Error revoking device', error as any)
      throw error
    }
  }

  // ==================== PRODUCTS ====================

  async getAllProducts(): Promise<Product[]> {
    return this.withRetry(async () => {
      console.log('🔍 [Supabase] Obteniendo productos...')
      const { data, error } = await supabase
        .from('products')
        .select('*')
        // Temporarily remove .eq('available', true) to see all products
        .order('category', { ascending: true })
        .order('name', { ascending: true })

      console.log('🔍 [Supabase] Productos data:', data)
      console.log('🔍 [Supabase] Productos error:', error)
      
      if (error) throw error
      // Filter in memory to show active/available products
      const products = (data || []) as Product[]
      console.log('🔍 [Supabase] Total productos:', products.length)
      console.log('🔍 [Supabase] Productos por estado:', products.map(p => ({ name: p.name, available: (p as any).available, active: (p as any).active })))
      return products
    }).catch(error => {
      logger.error('supabase', 'Error getting products', error as any)
      return []
    })
  }

  async getProductById(productId: string): Promise<Product | null> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single()

      if (error) throw error
      return data as Product
    } catch (error) {
      logger.error('supabase', 'Error getting product', error as any)
      return null
    }
  }

  async createProduct(product: Omit<Product, 'id'>): Promise<string> {
    try {
      const payload: any = { ...product }
      // Map active to available for Supabase schema
      if ('active' in product) {
        payload.available = product.active
        delete payload.active
      }
      // Remove inventory fields not present in Supabase schema
      if ('currentStock' in payload) delete payload.currentStock
      if ('hasInventory' in payload) delete payload.hasInventory
      if ('minimumStock' in payload) delete payload.minimumStock
      // Remove timestamp fields (Supabase handles with triggers)
      if ('createdAt' in payload) delete payload.createdAt
      if ('updatedAt' in payload) delete payload.updatedAt
      
      const { data, error } = await supabase
        .from('products')
        .insert([payload])
        .select('id')
        .single()

      if (error) throw error
      return data.id
    } catch (error) {
      logger.error('supabase', 'Error creating product', error as any)
      throw error
    }
  }

  async updateProduct(productId: string, updates: Partial<Product>): Promise<void> {
    try {
      const payload: any = { ...updates }
      // Map active to available for Supabase schema
      if ('active' in updates) {
        payload.available = updates.active
        delete payload.active
      }
      // Remove inventory fields not present in Supabase schema
      if ('currentStock' in payload) delete payload.currentStock
      if ('hasInventory' in payload) delete payload.hasInventory
      if ('minimumStock' in payload) delete payload.minimumStock
      // Remove timestamp fields (Supabase handles with triggers)
      if ('createdAt' in payload) delete payload.createdAt
      if ('updatedAt' in payload) delete payload.updatedAt
      
      const { error } = await supabase
        .from('products')
        .update(payload)
        .eq('id', productId)

      if (error) throw error
    } catch (error) {
      logger.error('supabase', 'Error updating product', error as any)
      throw error
    }
  }

  async updateProductStockBatch(updates: { productId: string; quantity: number }[]): Promise<void> {
    // Inventory columns (currentStock, hasInventory) no existen en Supabase schema actual
    // No-op temporal para evitar errores hasta definir esquema de inventario en Supabase
    if (!updates.length) return
    logger.warn('supabase', 'updateProductStockBatch omitido: inventario no habilitado en Supabase schema')
    return
  }

  async deleteProduct(productId: string): Promise<void> {
    try {
      // Soft delete - marcar como no disponible
      const { error } = await supabase
        .from('products')
        .update({ available: false })
        .eq('id', productId)

      if (error) throw error
    } catch (error) {
      logger.error('supabase', 'Error deleting product', error as any)
      throw error
    }
  }

  // ==================== ORDERS ====================

  private normalizeOrderStatus(status: any): string | undefined {
    if (!status) return undefined
    const allowed = ['pending', 'sent', 'preparing', 'ready', 'served', 'completed', 'cancelled', 'paid', 'open']
    return allowed.includes(status) ? status : 'pending'
  }

  private normalizeOrderItems(items: any[]): any[] {
    if (!Array.isArray(items)) return []
    return items.map(item => ({
      ...item,
      addedAt: item.addedAt instanceof Date ? item.addedAt.toISOString() : item.addedAt,
      deletedAt: item.deletedAt instanceof Date ? item.deletedAt.toISOString() : item.deletedAt,
    }))
  }

  private buildOrderPayload(order: Partial<Order> & Record<string, any>) {
    const payload: any = { ...order }

    // Validar tableNumber si está presente (debe ser > 0)
    if ('tableNumber' in order) {
      const tableNum = order.tableNumber
      if (tableNum === null || tableNum === undefined || tableNum <= 0) {
        throw new Error(`Invalid table number: ${tableNum}. Must be greater than 0.`)
      }
      payload.table_number = tableNum
    }
    if ('waiterId' in order) payload.waiter_id = (order as any).waiterId
    if ('createdBy' in order) payload.created_by = (order as any).createdBy
    if ('status' in order) payload.status = this.normalizeOrderStatus((order as any).status)

    if ('createdAt' in order) {
      payload.created_at = order.createdAt instanceof Date
        ? order.createdAt.toISOString()
        : order.createdAt
    }

    if ('sentToKitchenAt' in order) {
      payload.sent_to_kitchen_at = order.sentToKitchenAt instanceof Date
        ? order.sentToKitchenAt.toISOString()
        : order.sentToKitchenAt
    }

    if ('items' in order) {
      payload.items = this.normalizeOrderItems(order.items as any[])
    }

    if ('tipAmount' in order) payload.tip_amount = (order as any).tipAmount ?? 0
    if ('tipPercentage' in order) payload.tip_percentage = (order as any).tipPercentage ?? 0
    if ('paymentMethod' in order) payload.payment_method = (order as any).paymentMethod

    const calculatedSubtotal = Array.isArray(payload.items)
      ? payload.items.reduce((sum: number, item: any) => sum + (item.unitPrice || 0) * (item.quantity || 0), 0)
      : 0

    if (!('subtotal' in payload)) payload.subtotal = (order as any).subtotal ?? calculatedSubtotal
    if (!('total' in payload)) payload.total = (order as any).total ?? (payload.subtotal ?? calculatedSubtotal) + ((order as any).tipAmount ?? 0)

    delete payload.tableNumber
    delete payload.waiterId
    delete payload.createdBy
    delete payload.createdAt
    delete payload.sentToKitchenAt
    delete payload.tipAmount
    delete payload.tipPercentage
    delete payload.paymentMethod
    delete payload.isCourtesy
    delete payload.authorizedBy
    delete payload.closedAt
    delete payload.closedBy
    delete payload.lastEditedAt
    delete payload.lastEditedBy
    delete payload.cancelledAt
    delete payload.cancelledBy
    delete payload.cancelReason

    return payload
  }

  async getOrdersByStatus(status: Order['status']): Promise<Order[]> {
    return this.withRetry(async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('status', status)
        .order('created_at', { ascending: false })

      if (error) throw error
      return (data || []) as Order[]
    }).catch(error => {
      logger.error('supabase', 'Error getting orders by status', error as any)
      return []
    })
  }

  async getActiveOrders(): Promise<Order[]> {
    return this.withRetry(async () => {
      logger.info('supabase', '🔍 Getting active orders...')
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .in('status', ['sent', 'preparing', 'ready', 'served'])
        .order('created_at', { ascending: true })

      if (error) {
        logger.error('supabase', 'Error in getActiveOrders query', error)
        throw error
      }
      
      const normalized = (data || []).map((o: any) => ({
        ...o,
        tableNumber: o.table_number ?? o.tableNumber ?? 0,
      }))

      logger.info('supabase', `✅ Found ${normalized.length} active orders`)
     // Log table_number para cada orden
     if (normalized.length > 0) {
       const tableNumbers = normalized.map((o: any) => ({ id: o.id, table_number: o.tableNumber }))
       logger.info('supabase', `📊 Order table numbers:`, tableNumbers)
     }
      return normalized as Order[]
    }).catch(error => {
      logger.error('supabase', 'Error getting active orders', error as any)
      return []
    })
  }

  async getOrderById(orderId: string): Promise<Order | null> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single()

      if (error) throw error
      return data as Order
    } catch (error) {
      logger.error('supabase', 'Error getting order', error as any)
      return null
    }
  }

  async createOrder(order: Omit<Order, 'id'>): Promise<string> {
    try {
      const payload = this.buildOrderPayload({ ...order, createdAt: (order as any).createdAt || new Date() })

      const { data, error } = await supabase
        .from('orders')
        .insert([payload])
        .select('id')
        .single()

      if (error) throw error
      return data.id
    } catch (error) {
      logger.error('supabase', 'Error creating order', error as any)
      throw error
    }
  }

  async updateOrder(orderId: string, updates: Partial<Order>): Promise<void> {
    try {
      const payload = this.buildOrderPayload(updates)

      const { error } = await supabase.from('orders').update(payload).eq('id', orderId)

      if (error) throw error
    } catch (error) {
      logger.error('supabase', 'Error updating order', error as any)
      throw error
    }
  }

  async updateOrderStatus(orderId: string, status: Order['status']): Promise<void> {
    logger.info('supabase', `📝 Updating order ${orderId} status to: ${status}`)
    return this.updateOrder(orderId, { status })
  }

  async deleteOrder(orderId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId)

      if (error) throw error
    } catch (error) {
      logger.error('supabase', 'Error deleting order', error as any)
      throw error
    }
  }

  // ==================== SALES ====================

  async getTodaySales(): Promise<Sale[]> {
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const { data, error } = await supabase
        .from('sales')
        .select('*')
        .gte('created_at', today.toISOString())
        .order('created_at', { ascending: false })

      if (error) throw error
      return (data || []) as Sale[]
    } catch (error) {
      logger.error('supabase', 'Error getting today sales', error as any)
      return []
    }
  }

  async getSalesByDateRange(startDate: Date, endDate: Date): Promise<Sale[]> {
    try {
      const { data, error } = await supabase
        .from('sales')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: false })

      if (error) throw error
      return (data || []) as Sale[]
    } catch (error) {
      logger.error('supabase', 'Error getting sales by date range', error as any)
      return []
    }
  }

  async createSale(sale: Omit<Sale, 'id'>): Promise<string> {
    try {
      // Validar tableNumber
      if (!sale.tableNumber || sale.tableNumber <= 0) {
        throw new Error('Table number must be greater than 0')
      }

      // Map TypeScript Sale to Supabase schema with type validation
      const payload: any = {
        order_id: (sale as any).orderIds?.[0] || null,
        waiter_id: (sale as any).saleBy || null,
        table_number: Number(sale.tableNumber),
        items: sale.items || [],
        subtotal: parseFloat(String(sale.subtotal)) || 0,
        tip_amount: parseFloat(String(sale.tip || 0)) || 0,
        tip_percentage: 0,
        total: parseFloat(String(sale.total)) || 0,
        payment_method: String(sale.paymentMethod) || 'cash',
        device_id: null,
      }
      
      logger.info('supabase', '💰 Creating sale with payload:', payload)
      logger.info('supabase', '   - order_id:', payload.order_id)
      logger.info('supabase', '   - waiter_id:', payload.waiter_id)
      logger.info('supabase', '   - table_number:', payload.table_number, typeof payload.table_number)
      logger.info('supabase', '   - subtotal:', payload.subtotal, typeof payload.subtotal)
      logger.info('supabase', '   - total:', payload.total, typeof payload.total)
      logger.info('supabase', '   - payment_method:', payload.payment_method)
      logger.info('supabase', '   - items count:', payload.items?.length || 0)
      
      // Use returning: 'minimal' to avoid SELECT and bypass RLS on select
      const { error } = await supabase
        .from('sales')
        .insert([payload], { returning: 'minimal' })

      if (error) {
        logger.error('supabase', '❌ Supabase insert error:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
          statusCode: (error as any).statusCode
        })
        throw new Error(`Supabase error: ${error.message} ${error.details ? '- ' + error.details : ''} ${error.hint ? '- ' + error.hint : ''}`)
      }
      
      logger.info('supabase', '✅ Sale created successfully (no returning id)')
      return payload.order_id || ''
    } catch (error: any) {
      logger.error('supabase', '❌ Error creating sale:', error?.message || String(error))
      throw error
    }
  }

  // ==================== AUDIT LOGS ====================

  async createAuditLog(log: Omit<AuditLog, 'id' | 'created_at'>): Promise<void> {
    try {
      const { error } = await supabase
        .from('audit_logs')
        .insert([log])

      if (error) throw error
    } catch (error) {
      logger.error('supabase', 'Error creating audit log', error as any)
    }
  }

  async getAuditLogs(limit = 100): Promise<AuditLog[]> {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      return (data || []) as AuditLog[]
    } catch (error) {
      logger.error('supabase', 'Error getting audit logs', error as any)
      return []
    }
  }

  // ==================== REAL-TIME SUBSCRIPTIONS ====================

  subscribeToOrders(callback: (orders: Order[]) => void) {
    // Initial load
    this.getActiveOrders().then(callback).catch(err => {
      logger.error('supabase', 'Error loading initial orders', err)
    })

    const channel = supabase
      .channel('orders_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders'
        },
        (payload) => {
          logger.info('supabase', '🔔 Realtime event received:', payload.eventType)
          // Cuando hay cambios, recargar todas las órdenes activas
          this.getActiveOrders().then(callback)
        }
      )
      .subscribe((status) => {
        logger.info('supabase', `📡 Subscription status: ${status}`)
      })

    return () => {
      logger.info('supabase', '🔌 Unsubscribing from orders')
      supabase.removeChannel(channel)
    }
  }

  /**
   * Alias para compatibilidad con Kitchen.tsx y Bar.tsx
   * Permite callbacks para success y error
   */
  subscribeToActiveOrders(
    onSuccess: (orders: Order[]) => void,
    onError?: (message: string) => void
  ): (() => void) | undefined {
    try {
      return this.subscribeToOrders(onSuccess)
    } catch (error) {
      onError?.(error instanceof Error ? error.message : 'Unknown error')
      return undefined
    }
  }

  subscribeToOrdersByStatus(
    status: Order['status'],
    onData: (orders: Order[]) => void,
    onError?: (message: string) => void
  ) {
    try {
      // Primera carga
      this.getOrdersByStatus(status).then(onData).catch(err => onError?.(err?.message || 'Error loading orders'))

      const channel = supabase
        .channel(`orders_${status}_changes`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'orders',
            filter: `status=eq.${status}`
          },
          () => {
            this.getOrdersByStatus(status).then(onData)
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    } catch (error: any) {
      const message = error?.message || 'Error creando suscripción de órdenes'
      logger.error('supabase', 'Error subscribing to orders by status', message)
      onError?.(message)
      return () => {}
    }
  }

  subscribeToProducts(callback: (products: Product[]) => void) {
    const channel = supabase
      .channel('products_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'products'
        },
        () => {
          this.getAllProducts().then(callback)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }
}

// Singleton export
const supabaseService = new SupabaseService()
export default supabaseService
