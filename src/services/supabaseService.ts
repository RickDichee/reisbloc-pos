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
        .eq('username', username)
        .single()

      if (error) throw error
      return data as User
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
      return data as User
    } catch (error) {
      logger.error('supabase', 'Error getting user by ID', error as any)
      return null
    }
  }

  async getAllUsers(): Promise<User[]> {
    return this.withRetry(async () => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('active', true)
        .order('name', { ascending: true })

      if (error) throw error
      return (data || []) as User[]
    }).catch(error => {
      logger.error('supabase', 'Error getting all users', error as any)
      return []
    })
  }

  async createUser(user: Omit<User, 'id'>): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('users')
        .insert([user])
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
      const { error } = await supabase
        .from('users')
        .update(updates)
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

  async registerDevice(device: Omit<Device, 'id'>): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('devices')
        .insert([{
          ...device,
          last_seen: new Date().toISOString()
        }])
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
      return (data || []) as Device[]
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

  async getAllDevices(): Promise<Device[]> {
    try {
      const { data, error } = await supabase
        .from('devices')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return (data || []) as Device[]
    } catch (error) {
      logger.error('supabase', 'Error getting all devices', error as any)
      return []
    }
  }

  async updateDevice(deviceId: string, updates: Partial<Device>): Promise<void> {
    try {
      const { error } = await supabase
        .from('devices')
        .update({
          ...updates,
          last_seen: new Date().toISOString()
        })
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
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('available', true)
        .order('category', { ascending: true })
        .order('name', { ascending: true })

      if (error) throw error
      return (data || []) as Product[]
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
      const { data, error } = await supabase
        .from('products')
        .insert([product])
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
      const { error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', productId)

      if (error) throw error
    } catch (error) {
      logger.error('supabase', 'Error updating product', error as any)
      throw error
    }
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

  async getActiveOrders(): Promise<Order[]> {
    return this.withRetry(async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .in('status', ['pending', 'preparing', 'ready', 'served'])
        .order('created_at', { ascending: true })

      if (error) throw error
      return (data || []) as Order[]
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
      const { data, error } = await supabase
        .from('orders')
        .insert([order])
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
      const { error } = await supabase
        .from('orders')
        .update(updates)
        .eq('id', orderId)

      if (error) throw error
    } catch (error) {
      logger.error('supabase', 'Error updating order', error as any)
      throw error
    }
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
      const { data, error } = await supabase
        .from('sales')
        .insert([sale])
        .select('id')
        .single()

      if (error) throw error
      return data.id
    } catch (error) {
      logger.error('supabase', 'Error creating sale', error as any)
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
    const channel = supabase
      .channel('orders_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders'
        },
        () => {
          // Cuando hay cambios, recargar todas las órdenes activas
          this.getActiveOrders().then(callback)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
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
