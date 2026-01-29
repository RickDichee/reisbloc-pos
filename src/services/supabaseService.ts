/**
 * 🛑 ¡ATENCIÓN! CAPA DE DATOS CRÍTICA 🛑
 * ---------------------------------------------------------
 * ESTE SERVICIO MANEJA TODAS LAS OPERACIONES DE POSTGRESQL.
 * LAS POLÍTICAS RLS DEPENDEN DE LA ESTRUCTURA DE ESTAS CONSULTAS.
 * 
 * ESTADO: MIGRACIÓN A SUPABASE VALIDADA (FEBRERO 2026)
 * PUNTO DE RESTAURACIÓN: v3.0.0-stable-auth
 * ---------------------------------------------------------
 */

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
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('name', username)
      .single()

    if (error) return null
    return {
      id: data.id,
      username: data.name,
      role: data.role,
      pin: data.pin,
      active: data.active,
      createdAt: new Date(data.created_at),
      devices: []
    }
  }

  async getUserById(userId: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) return null
    return {
      id: data.id,
      username: data.name,
      role: data.role,
      pin: data.pin,
      active: data.active,
      createdAt: new Date(data.created_at),
      devices: []
    }
  }

  async getAllUsers(): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('active', true)
      .order('name')

    if (error) throw error
    return (data || []).map(u => ({
      id: u.id,
      username: u.name,
      role: u.role,
      pin: '',
      active: u.active,
      createdAt: new Date(u.created_at),
      devices: []
    }))
  }

  async createUser(user: Omit<User, 'id'>): Promise<string> {
    try {
      const supabaseUser = {
        name: user.username,
        role: user.role || 'mesero',
        pin: user.pin,
        active: user.active ?? true,
      };
      const { data, error } = await supabase.from('users').insert([supabaseUser]).select('id').single();
      if (error) throw error;
      return data.id;
    } catch (error: any) {
      if (error.code === '42501') logger.error('supabase', '❌ Error RLS: Solo Admin crea usuarios');
      throw error;
    }
  }

  // ==================== DEVICES ====================

  async registerDevice(device: Omit<Device, 'id'>): Promise<string> {
    const payload = {
      user_id: device.userId,
      mac_address: device.macAddress,
      device_name: device.deviceName,
      device_type: device.deviceType,
      os: device.os,
      browser: device.browser,
      fingerprint: device.fingerprint,
      status: 'pending'
    }
    const { data, error } = await supabase.from('devices').insert([payload]).select('id').single()
    if (error) throw error
    return data.id
  }

  async approveDevice(deviceId: string): Promise<void> {
    const { error } = await supabase.from('devices').update({ status: 'approved' }).eq('id', deviceId)
    if (error) throw error
  }

  // ==================== PRODUCTS ====================

  async getAllProducts(): Promise<Product[]> {
    const { data, error } = await supabase.from('products').select('*').eq('available', true).order('category')
    if (error) throw error
    return (data || []).map(p => ({
      ...p,
      currentStock: p.current_stock,
      hasInventory: p.has_inventory,
      minimumStock: p.minimum_stock
    }))
  }

  // ==================== ORDERS ====================

  async getActiveOrders(): Promise<Order[]> {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .neq('status', 'completed')
      .neq('status', 'cancelled')
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data || []).map(o => ({
      id: o.id,
      tableNumber: o.table_number,
      items: o.items,
      status: o.status,
      createdBy: o.waiter_id,
      createdAt: new Date(o.created_at)
    }))
  }

  async getOrderById(orderId: string): Promise<Order | null> {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single()

    if (error) return null
    return {
      id: data.id,
      tableNumber: data.table_number,
      items: data.items,
      status: data.status,
      createdBy: data.waiter_id,
      createdAt: new Date(data.created_at)
    }
  }

  async createOrder(order: Omit<Order, 'id'>): Promise<string> {
    const payload = {
      table_number: order.tableNumber,
      items: order.items,
      status: order.status || 'open',
      waiter_id: order.createdBy
    }
    const { data, error } = await supabase.from('orders').insert([payload]).select('id').single()
    if (error) throw error
    return data.id
  }

  async updateOrder(orderId: string, updates: Partial<Order>): Promise<void> {
    const payload: any = {}
    if (updates.tableNumber !== undefined) payload.table_number = updates.tableNumber
    if (updates.items !== undefined) payload.items = updates.items
    if (updates.status !== undefined) payload.status = updates.status

    const { error } = await supabase.from('orders').update(payload).eq('id', orderId)
    if (error) throw error
  }

  async deleteOrder(orderId: string): Promise<void> {
    const { error } = await supabase.from('orders').delete().eq('id', orderId)
    if (error) throw error
  }

  // ==================== SALES ====================

  async getTodaySales(): Promise<Sale[]> {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    return this.getSalesByDateRange(today, tomorrow)
  }

  async getSalesByDateRange(startDate: Date, endDate: Date): Promise<Sale[]> {
    const { data, error } = await supabase
      .from('sales')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data || []).map(s => ({
      id: s.id,
      tableNumber: s.table_number,
      items: s.items,
      subtotal: s.subtotal,
      tip: s.tip_amount,
      total: s.total,
      paymentMethod: s.payment_method,
      saleBy: s.waiter_id,
      createdAt: new Date(s.created_at)
    }))
  }

  async createSale(sale: Omit<Sale, 'id'>): Promise<string> {
    try {
      const payload = {
        order_id: (sale as any).orderIds?.[0] || null,
        waiter_id: (sale as any).saleBy || null,
        table_number: Number(sale.tableNumber),
        items: sale.items || [],
        subtotal: parseFloat(String(sale.subtotal)) || 0,
        tip_amount: parseFloat(String(sale.tip || 0)) || 0,
        total: parseFloat(String(sale.total)) || 0,
        payment_method: String(sale.paymentMethod) || 'cash',
        device_id: (sale as any).deviceId || null,
      }
      const { error } = await supabase.from('sales').insert([payload])
      if (error) throw error
      return payload.order_id || 'success'
    } catch (error: any) {
      logger.error('supabase', '❌ Error en createSale:', error?.message)
      throw error
    }
  }

  // ==================== AUDIT ====================

  async getAuditLogs(limit = 100): Promise<AuditLog[]> {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data as any[]
  }

  async createAuditLog(log: Omit<AuditLog, 'id' | 'created_at'>): Promise<void> {
    const payload = {
      user_id: log.userId,
      action: log.action,
      table_name: log.entityType,
      record_id: log.entityId,
      changes: { old: log.oldValue, new: log.newValue },
      ip_address: log.ipAddress
    }
    await supabase.from('audit_logs').insert([payload])
  }

  // ==================== REAL-TIME ====================

  subscribeToOrders(callback: (orders: Order[]) => void) {
    const channel = supabase
      .channel('orders-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, async () => {
        const orders = await this.getActiveOrders()
        callback(orders)
      })
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }

  subscribeToProducts(callback: (products: Product[]) => void) {
    const channel = supabase
      .channel('products-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, async () => {
        const products = await this.getAllProducts()
        callback(products)
      })
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }
}

export default new SupabaseService()
