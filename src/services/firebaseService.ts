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

// Servicio Firebase para operaciones de base de datos
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  Timestamp,
  writeBatch,
  Query,
  onSnapshot,
  orderBy,
} from 'firebase/firestore'
import { db } from '@/config/firebase'
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

class FirebaseService {
  private db = db

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
      const q = query(collection(this.db, 'users'), where('username', '==', username))
      const querySnapshot = await getDocs(q)
      if (querySnapshot.empty) return null
      return { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() } as User
    } catch (error) {
      logger.error('firebase', 'Error getting user', error as any)
      return null
    }
  }

  async getUserById(userId: string): Promise<User | null> {
    try {
      const docSnap = await getDoc(doc(this.db, 'users', userId))
      if (!docSnap.exists()) return null
      return { id: docSnap.id, ...docSnap.data() } as User
    } catch (error) {
      logger.error('firebase', 'Error getting user by ID', error as any)
      return null
    }
  }

  async getAllUsers(): Promise<User[]> {
    return this.withRetry(async () => {
      const querySnapshot = await getDocs(collection(this.db, 'users'))
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as User[]
    }).catch(error => {
      logger.error('firebase', 'Error getting all users', error as any)
      return []
    })
  }

  async createUser(user: Omit<User, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(this.db, 'users'), {
        ...user,
        createdAt: Timestamp.now(),
      })
      return docRef.id
    } catch (error) {
      logger.error('firebase', 'Error creating user', error as any)
      throw error
    }
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<void> {
    try {
      await updateDoc(doc(this.db, 'users', userId), updates)
    } catch (error) {
      logger.error('firebase', 'Error updating user', error as any)
      throw error
    }
  }

  async deleteUser(userId: string): Promise<void> {
    try {
      await deleteDoc(doc(this.db, 'users', userId))
    } catch (error) {
      logger.error('firebase', 'Error deleting user', error as any)
      throw error
    }
  }

  // ==================== DEVICES ====================

  async registerDevice(device: Omit<Device, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(this.db, 'devices'), {
        ...device,
        registeredAt: Timestamp.now(),
        lastAccess: Timestamp.now(),
      })
      return docRef.id
    } catch (error) {
      logger.error('firebase', 'Error registering device', error as any)
      throw error
    }
  }

  async getDevicesByUser(userId: string): Promise<Device[]> {
    try {
      const q = query(collection(this.db, 'devices'), where('userId', '==', userId))
      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Device[]
    } catch (error) {
      logger.error('firebase', 'Error getting devices', error as any)
      return []
    }
  }

  async getDeviceById(deviceId: string): Promise<Device | null> {
    try {
      const docSnap = await getDoc(doc(this.db, 'devices', deviceId))
      if (!docSnap.exists()) return null
      return { id: docSnap.id, ...docSnap.data() } as Device
    } catch (error) {
      logger.error('firebase', 'Error getting device', error as any)
      return null
    }
  }

  async getAllDevices(): Promise<Device[]> {
    try {
      const querySnapshot = await getDocs(collection(this.db, 'devices'))
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Device[]
    } catch (error) {
      logger.error('firebase', 'Error getting all devices', error as any)
      return []
    }
  }


  async updateDevice(deviceId: string, updates: Partial<Device>): Promise<void> {
    try {
      await updateDoc(doc(this.db, 'devices', deviceId), {
        ...updates,
        lastAccess: Timestamp.now(),
      })
    } catch (error) {
      logger.error('firebase', 'Error updating device', error as any)
      throw error
    }
  }

  async approveDevice(deviceId: string): Promise<void> {
    try {
      await updateDoc(doc(this.db, 'devices', deviceId), {
        isApproved: true,
        isRejected: false, // Clear rejected status when approved
      })
    } catch (error) {
      logger.error('firebase', 'Error approving device', error as any)
      throw error
    }
  }

  async revokeDevice(deviceId: string): Promise<void> {
    try {
      await updateDoc(doc(this.db, 'devices', deviceId), {
        isApproved: false,
        isRejected: true, // Mark as rejected when revoked
      })
    } catch (error) {
      logger.error('firebase', 'Error revoking device', error as any)
      throw error
    }
  }

  // ==================== PRODUCTS ====================

  async getAllProducts(): Promise<Product[]> {
    return this.withRetry(async () => {
      const q = query(collection(this.db, 'products'), where('isActive', '==', true))
      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Product[]
    }).catch(error => {
      logger.error('firebase', 'Error getting products', error as any)
      return []
    })
  }

  async getProductById(productId: string): Promise<Product | null> {
    try {
      const docSnap = await getDoc(doc(this.db, 'products', productId))
      if (!docSnap.exists()) return null
      return { id: docSnap.id, ...docSnap.data() } as Product
    } catch (error) {
      logger.error('firebase', 'Error getting product', error as any)
      return null
    }
  }

  async createProduct(product: Omit<Product, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(this.db, 'products'), {
        ...product,
        createdAt: Timestamp.now(),
      })
      return docRef.id
    } catch (error) {
      logger.error('firebase', 'Error creating product', error as any)
      throw error
    }
  }

  async updateProduct(productId: string, updates: Partial<Product>): Promise<void> {
    try {
      await updateDoc(doc(this.db, 'products', productId), updates)
    } catch (error) {
      logger.error('firebase', 'Error updating product', error as any)
      throw error
    }
  }

  async updateProductStock(productId: string, quantity: number): Promise<void> {
    try {
      const product = await this.getProductById(productId)
      if (!product || !product.hasInventory) return

      const newStock = Math.max(0, (product.currentStock || 0) + quantity)
      await updateDoc(doc(this.db, 'products', productId), {
        currentStock: newStock,
      })
    } catch (error) {
      logger.error('firebase', 'Error updating product stock', error as any)
      throw error
    }
  }

  async deactivateProduct(productId: string): Promise<void> {
    try {
      await updateDoc(doc(this.db, 'products', productId), {
        active: false,
      })
    } catch (error) {
      logger.error('firebase', 'Error deactivating product', error as any)
      throw error
    }
  }

  async deleteProduct(productId: string): Promise<void> {
    try {
      await deleteDoc(doc(this.db, 'products', productId))
    } catch (error) {
      logger.error('firebase', 'Error deleting product', error as any)
      throw error
    }
  }

  // ==================== ORDERS ====================

  async createOrder(order: Omit<Order, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(this.db, 'orders'), {
        ...order,
        createdAt: Timestamp.now(),
      })
      return docRef.id
    } catch (error) {
      logger.error('firebase', 'Error creating order', error as any)
      throw error
    }
  }

  async getOrderById(orderId: string): Promise<Order | null> {
    try {
      const docSnap = await getDoc(doc(this.db, 'orders', orderId))
      if (!docSnap.exists()) return null
      return { id: docSnap.id, ...docSnap.data() } as Order
    } catch (error) {
      logger.error('firebase', 'Error getting order', error as any)
      return null
    }
  }

  async getOrdersByTable(tableNumber: number): Promise<Order[]> {
    try {
      const q = query(
        collection(this.db, 'orders'),
        where('tableNumber', '==', tableNumber),
        where('status', '!=', 'completed')
      )
      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Order[]
    } catch (error) {
      logger.error('firebase', 'Error getting orders by table', error as any)
      return []
    }
  }

  async getOrdersByStatus(status: Order['status']): Promise<Order[]> {
    try {
      const q = query(
        collection(this.db, 'orders'),
        where('status', '==', status)
      )
      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Order[]
    } catch (error) {
      logger.error('firebase', 'Error getting orders by status', error as any)
      return []
    }
  }

  async getAllOrders(): Promise<Order[]> {
    try {
      const querySnapshot = await getDocs(collection(this.db, 'orders'))
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Order[]
    } catch (error) {
      logger.error('firebase', 'Error getting all orders', error as any)
      return []
    }
  }

  async updateOrder(orderId: string, updates: Partial<Order>): Promise<void> {
    try {
      await updateDoc(doc(this.db, 'orders', orderId), updates)
    } catch (error) {
      logger.error('firebase', 'Error updating order', error as any)
      throw error
    }
  }

  async updateOrderStatus(orderId: string, status: Order['status']): Promise<void> {
    try {
      await updateDoc(doc(this.db, 'orders', orderId), {
        status,
        ...(status === 'sent' && { sentToKitchenAt: Timestamp.now() }),
      })
    } catch (error) {
      logger.error('firebase', 'Error updating order status', error as any)
      throw error
    }
  }

  subscribeToActiveOrders(
    onData: (orders: Order[]) => void,
    onError?: (message: string) => void
  ) {
    try {
      const activeStatuses: Order['status'][] = ['open', 'sent', 'ready', 'served']
      const q = query(
        collection(this.db, 'orders'),
        where('status', 'in', activeStatuses),
        orderBy('createdAt', 'desc')
      )

      return onSnapshot(
        q,
        snapshot => {
          const data = snapshot.docs.map(docSnap => ({
            id: docSnap.id,
            ...docSnap.data(),
          })) as Order[]
          onData(data)
        },
        error => {
          logger.error('firebase', 'Error subscribing to active orders', error as any)
          onError?.(error.message)
        }
      )
    } catch (error: any) {
      const message = error?.message || 'Error creando suscripción de órdenes'
      logger.error('firebase', 'Error subscribing to active orders', message)
      onError?.(message)
      return () => {}
    }
  }

  subscribeToOrdersByStatus(
    status: Order['status'],
    onData: (orders: Order[]) => void,
    onError?: (message: string) => void
  ) {
    try {
      const q = query(
        collection(this.db, 'orders'),
        where('status', '==', status),
        orderBy('createdAt', 'desc')
      )

      return onSnapshot(
        q,
        snapshot => {
          const data = snapshot.docs.map(docSnap => ({
            id: docSnap.id,
            ...docSnap.data(),
          })) as Order[]
          onData(data)
        },
        error => {
          logger.error('firebase', 'Error subscribing to orders by status', error as any)
          onError?.(error.message)
        }
      )
    } catch (error: any) {
      const message = error?.message || 'Error creando suscripción de órdenes'
      logger.error('firebase', 'Error subscribing to orders by status', message)
      onError?.(message)
      return () => {}
    }
  }

  async transferOrderTable(orderId: string, targetTableNumber: number): Promise<void> {
    try {
      await updateDoc(doc(this.db, 'orders', orderId), {
        tableNumber: targetTableNumber,
      })
    } catch (error) {
      logger.error('firebase', 'Error transferring order', error as any)
      throw error
    }
  }

  async closeOrder(orderId: string, closedBy: string): Promise<void> {
    try {
      await updateDoc(doc(this.db, 'orders', orderId), {
        status: 'completed',
        closedAt: Timestamp.now(),
        closedBy,
      })
    } catch (error) {
      logger.error('firebase', 'Error closing order', error as any)
      throw error
    }
  }

  // ==================== SALES ====================

  async createSale(sale: Omit<Sale, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(this.db, 'sales'), {
        ...sale,
        createdAt: Timestamp.now(),
      })
      return docRef.id
    } catch (error) {
      logger.error('firebase', 'Error creating sale', error as any)
      throw error
    }
  }

  async getSaleById(saleId: string): Promise<Sale | null> {
    try {
      const docSnap = await getDoc(doc(this.db, 'sales', saleId))
      if (!docSnap.exists()) return null
      return { id: docSnap.id, ...docSnap.data() } as Sale
    } catch (error) {
      logger.error('firebase', 'Error getting sale', error as any)
      return null
    }
  }

  async getSalesByDate(date: Date): Promise<Sale[]> {
    try {
      const startOfDay = new Date(date)
      startOfDay.setHours(0, 0, 0, 0)

      const endOfDay = new Date(date)
      endOfDay.setHours(23, 59, 59, 999)

      const q = query(
        collection(this.db, 'sales'),
        where('createdAt', '>=', Timestamp.fromDate(startOfDay)),
        where('createdAt', '<=', Timestamp.fromDate(endOfDay))
      )

      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Sale[]
    } catch (error) {
      logger.error('firebase', 'Error getting sales by date', error as any)
      return []
    }
  }

  async getSalesByUser(userId: string, dateFrom?: Date, dateTo?: Date): Promise<Sale[]> {
    try {
      let q: Query = query(collection(this.db, 'sales'), where('saleBy', '==', userId))

      if (dateFrom && dateTo) {
        q = query(
          collection(this.db, 'sales'),
          where('saleBy', '==', userId),
          where('createdAt', '>=', Timestamp.fromDate(dateFrom)),
          where('createdAt', '<=', Timestamp.fromDate(dateTo))
        )
      }

      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Sale[]
    } catch (error) {
      logger.error('firebase', 'Error getting sales by user', error as any)
      return []
    }
  }

  // ==================== DAILY CLOSES ====================

  async createDailyClose(close: Omit<DailyClose, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(this.db, 'daily_closes'), {
        ...close,
        closedAt: Timestamp.now(),
      })
      return docRef.id
    } catch (error) {
      logger.error('firebase', 'Error creating daily close', error as any)
      throw error
    }
  }

  async getDailyCloseByDate(date: Date): Promise<DailyClose | null> {
    try {
      const startOfDay = new Date(date)
      startOfDay.setHours(0, 0, 0, 0)

      const endOfDay = new Date(date)
      endOfDay.setHours(23, 59, 59, 999)

      const q = query(
        collection(this.db, 'daily_closes'),
        where('date', '>=', Timestamp.fromDate(startOfDay)),
        where('date', '<=', Timestamp.fromDate(endOfDay))
      )

      const querySnapshot = await getDocs(q)
      if (querySnapshot.empty) return null

      const doc = querySnapshot.docs[0]
      return { id: doc.id, ...doc.data() } as DailyClose
    } catch (error) {
      logger.error('firebase', 'Error getting daily close', error as any)
      return null
    }
  }

  async getDailyCloses(limit: number = 30): Promise<DailyClose[]> {
    try {
      const q = query(collection(this.db, 'daily_closes'))
      const querySnapshot = await getDocs(q)
      return querySnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }) as DailyClose)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, limit)
    } catch (error) {
      logger.error('firebase', 'Error getting daily closes', error as any)
      return []
    }
  }

  // ==================== AUDIT LOGS ====================

  async createAuditLog(log: Omit<AuditLog, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(this.db, 'audit_logs'), {
        ...log,
        timestamp: Timestamp.now(),
      })
      return docRef.id
    } catch (error) {
      logger.error('firebase', 'Error creating audit log', error as any)
      throw error
    }
  }

  async getAuditLogs(
    filters: {
      userId?: string
      action?: string
      entityType?: string
      dateFrom?: Date
      dateTo?: Date
      limit?: number
    } = {}
  ): Promise<AuditLog[]> {
    try {
      let queryConstraints: any[] = []

      if (filters.userId) {
        queryConstraints.push(where('userId', '==', filters.userId))
      }

      if (filters.action) {
        queryConstraints.push(where('action', '==', filters.action))
      }

      if (filters.entityType) {
        queryConstraints.push(where('entityType', '==', filters.entityType))
      }

      if (filters.dateFrom) {
        queryConstraints.push(where('timestamp', '>=', Timestamp.fromDate(filters.dateFrom)))
      }

      if (filters.dateTo) {
        queryConstraints.push(where('timestamp', '<=', Timestamp.fromDate(filters.dateTo)))
      }

      const q = queryConstraints.length > 0
        ? query(collection(this.db, 'audit_logs'), ...queryConstraints)
        : query(collection(this.db, 'audit_logs'))

      const querySnapshot = await getDocs(q)
      const logs = querySnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }) as AuditLog)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

      return logs.slice(0, filters.limit || 100)
    } catch (error) {
      logger.error('firebase', 'Error getting audit logs', error as any)
      return []
    }
  }

  // ==================== BATCH OPERATIONS ====================

  async updateProductStockBatch(updates: { productId: string; quantity: number }[]): Promise<void> {
    try {
      const batch = writeBatch(this.db)

      for (const update of updates) {
        const productRef = doc(this.db, 'products', update.productId)
        const product = await getDoc(productRef)

        if (product.exists()) {
          const currentStock = product.data().currentStock || 0
          batch.update(productRef, {
            currentStock: Math.max(0, currentStock + update.quantity),
          })
        }
      }

      await batch.commit()
    } catch (error) {
      logger.error('firebase', 'Error batch updating stock', error as any)
      throw error
    }
  }

  async completeOrders(orderIds: string[]): Promise<void> {
    try {
      const batch = writeBatch(this.db)

      for (const orderId of orderIds) {
        const orderRef = doc(this.db, 'orders', orderId)
        batch.update(orderRef, { status: 'completed' })
      }

      await batch.commit()
    } catch (error) {
      logger.error('firebase', 'Error completing orders', error as any)
      throw error
    }
  }

  // ==================== REPORTS ====================

  async getSalesByDateRange(startDate: Date, endDate: Date): Promise<any> {
    try {
      const q = query(
        collection(this.db, 'sales'),
        where('createdAt', '>=', Timestamp.fromDate(startDate)),
        where('createdAt', '<=', Timestamp.fromDate(endDate))
      )
      const snapshot = await getDocs(q)
      const sales = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[]
      
      // Agrupar por día
      const byDay: { [key: string]: any[] } = {}
      sales.forEach(sale => {
        const date = sale.createdAt?.toDate?.() || new Date(sale.createdAt)
        const dayKey = date.toISOString().split('T')[0]
        if (!byDay[dayKey]) byDay[dayKey] = []
        byDay[dayKey].push(sale)
      })

      return { sales, byDay }
    } catch (error) {
      logger.error('firebase', 'Error getting sales by date range', error as any)
      return { sales: [], byDay: {} }
    }
  }

  async getTopProducts(startDate: Date, endDate: Date, limit: number = 5): Promise<any[]> {
    try {
      const { sales } = await this.getSalesByDateRange(startDate, endDate)
      
      // Agrupar items por producto
      const productMap: { [key: string]: { name: string; qty: number; total: number } } = {}
      sales.forEach((sale: any) => {
        sale.items?.forEach((item: any) => {
          if (!productMap[item.productId]) {
            productMap[item.productId] = { name: item.productName, qty: 0, total: 0 }
          }
          productMap[item.productId].qty += item.quantity
          productMap[item.productId].total += item.unitPrice * item.quantity
        })
      })

      // Convertir a array y ordenar por cantidad
      const topProducts = Object.values(productMap)
        .sort((a, b) => b.qty - a.qty)
        .slice(0, limit)
        .map((p, i) => ({ id: i, ...p }))

      return topProducts
    } catch (error) {
      logger.error('firebase', 'Error getting top products', error as any)
      return []
    }
  }

  async getEmployeeMetrics(startDate: Date, endDate: Date): Promise<any[]> {
    try {
      const { sales } = await this.getSalesByDateRange(startDate, endDate)
      const users = await this.getAllUsers()
      
      // Agrupar ventas por empleado
      const metricsMap: { [key: string]: any } = {}
      users.forEach(user => {
        metricsMap[user.id] = {
          userId: user.id,
          userName: user.username,
          role: user.role,
          salesCount: 0,
          totalSales: 0,
          totalTips: 0,
          averageTicket: 0,
          averageTip: 0,
        }
      })

      sales.forEach((sale: any) => {
        if (metricsMap[sale.saleBy]) {
          metricsMap[sale.saleBy].salesCount += 1
          metricsMap[sale.saleBy].totalSales += sale.total
          metricsMap[sale.saleBy].totalTips += sale.tip || 0
        }
      })

      // Calcular promedios
      return Object.values(metricsMap)
        .filter((m: any) => m.salesCount > 0)
        .map((m: any) => ({
          ...m,
          averageTicket: m.totalSales / m.salesCount,
          averageTip: m.totalTips / m.salesCount,
        }))
        .sort((a: any, b: any) => b.totalSales - a.totalSales)
    } catch (error) {
      logger.error('firebase', 'Error getting employee metrics', error as any)
      return []
    }
  }

  async getSalesMetrics(startDate: Date, endDate: Date): Promise<any> {
    try {
      const { sales } = await this.getSalesByDateRange(startDate, endDate)
      
      const metrics = {
        totalSales: 0,
        totalCash: 0,
        totalDigital: 0,
        totalClip: 0,
        totalTips: 0,
        totalDiscounts: 0,
        transactionCount: 0,
        averageTicket: 0,
      }

      sales.forEach((sale: any) => {
        metrics.totalSales += sale.total
        metrics.totalTips += sale.tip || 0
        metrics.totalDiscounts += sale.discounts || 0
        metrics.transactionCount += 1

        if (sale.paymentMethod === 'cash') {
          metrics.totalCash += sale.total
        } else if (sale.paymentMethod === 'digital') {
          metrics.totalDigital += sale.total
        } else if (sale.paymentMethod === 'clip') {
          metrics.totalClip += sale.total
        }
      })

      metrics.averageTicket = metrics.transactionCount > 0 ? metrics.totalSales / metrics.transactionCount : 0

      return metrics
    } catch (error) {
      logger.error('firebase', 'Error getting sales metrics', error as any)
      return {}
    }
  }

  // ==================== CLOSING ====================

  async saveClosing(closingRecord: any): Promise<string> {
    try {
      const docRef = await addDoc(collection(this.db, 'closings'), {
        ...closingRecord,
        createdAt: Timestamp.now(),
      })
      return docRef.id
    } catch (error) {
      logger.error('firebase', 'Error saving closing', error as any)
      throw error
    }
  }

  async getClosings(startDate: Date, endDate: Date): Promise<any[]> {
    try {
      const q = query(
        collection(this.db, 'closings'),
        where('date', '>=', Timestamp.fromDate(startDate)),
        where('date', '<=', Timestamp.fromDate(endDate)),
        orderBy('date', 'desc')
      )
      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    } catch (error) {
      logger.error('firebase', 'Error getting closings', error as any)
      return []
    }
  }

  // ==================== SPLIT BILL ====================

  async splitBill(orderId: string, splits: any[], userId: string): Promise<string[]> {
    try {
      const saleIds: string[] = []
      const USD_TO_MXN = 17

      const orderRef = doc(this.db, 'orders', orderId)
      const orderSnap = await getDoc(orderRef)

      if (!orderSnap.exists()) {
        throw new Error('Orden no encontrada')
      }

      const orderData = orderSnap.data() as any
      const tableNumber = orderData.tableNumber || 0

      const mapPaymentMethod = (method: string) => {
        if (method === 'card') return 'clip'
        return method
      }

      // Crear una venta por cada split
      for (const split of splits) {
        // Calcular total de pago recibido
        let totalPaid = 0
        let primaryPaymentMethod = 'cash'
        let primaryCurrency: 'MXN' | 'USD' = 'MXN'

        if (split.paymentMethods && split.paymentMethods.length > 0) {
          // Usar el primer método como primario para registros
          primaryPaymentMethod = split.paymentMethods[0].method
          primaryCurrency = split.paymentMethods[0].currency

          split.paymentMethods.forEach((m: any) => {
            const amount = m.currency === 'USD' ? m.amount * USD_TO_MXN : m.amount
            totalPaid += amount
          })
        }

        // Monto adeudado (manual o automático + propina)
        const amount = split.manualAmount || split.subtotal
        const tipAmount = split.tipAmount || 0
        const totalDue = amount + tipAmount

        const saleData = {
          orderIds: [orderId],
          tableNumber,
          items: split.items.map((i: any) => ({
            productId: i.item.productId,
            productName: i.item.productName,
            quantity: i.quantity,
            unitPrice: i.item.unitPrice,
          })),
          subtotal: amount,
          discounts: 0,
          tax: 0,
          total: totalDue,
          paymentMethod: mapPaymentMethod(primaryPaymentMethod) as any,
          currency: primaryCurrency,
          tip: tipAmount,
          tipCurrency: split.tipCurrency || 'MXN',
          tipSource: tipAmount > 0 ? (primaryPaymentMethod === 'cash' ? 'cash' : 'digital') : 'none',
          paymentBreakdown: split.paymentMethods,
          saleBy: userId,
          createdAt: Timestamp.now(),
          splitPayment: true,
          splitPersonNumber: split.personNumber,
        }

        const docRef = await addDoc(collection(this.db, 'sales'), saleData)
        saleIds.push(docRef.id)
      }

      // Actualizar orden como completada y con split
      await updateDoc(orderRef, {
        status: 'completed',
        splitBill: true,
        saleIds,
        completedAt: Timestamp.now(),
        closedAt: Timestamp.now(),
        closedBy: userId,
      })

      return saleIds
    } catch (error) {
      logger.error('firebase', 'Error splitting bill', error as any)
      throw error
    }
  }

  // ==================== EDIT/CANCEL ORDERS ====================

  async updateOrderItems(
    orderId: string,
    updatedItems: any[],
    notes: string,
    userId: string
  ): Promise<void> {
    try {
      const orderRef = doc(this.db, 'orders', orderId)
      const orderSnap = await getDoc(orderRef)

      if (!orderSnap.exists()) {
        throw new Error('Orden no encontrada')
      }

      const currentOrder = orderSnap.data()
      
      // Solo permitir edición si está en estado abierto o enviado
      if (currentOrder.status !== 'open' && currentOrder.status !== 'sent') {
        throw new Error('No se puede editar una orden que ya fue procesada')
      }

      // Actualizar items y notas
      await updateDoc(orderRef, {
        items: updatedItems.map(item => ({
          ...item,
          addedAt: item.addedAt || Timestamp.now(),
        })),
        notes: notes || '',
        lastEditedAt: Timestamp.now(),
        lastEditedBy: userId,
      })

      // Log de auditoría
      await addDoc(collection(this.db, 'auditLogs'), {
        action: 'update_order',
        userId,
        orderId,
        details: `Orden actualizada - Mesa ${currentOrder.tableNumber}`,
        timestamp: Timestamp.now(),
      })
    } catch (error) {
      logger.error('firebase', 'Error updating order items', error as any)
      throw error
    }
  }

  async cancelOrder(orderId: string, reason: string, userId: string): Promise<void> {
    try {
      const orderRef = doc(this.db, 'orders', orderId)
      const orderSnap = await getDoc(orderRef)

      if (!orderSnap.exists()) {
        throw new Error('Orden no encontrada')
      }

      const currentOrder = orderSnap.data()

      // Solo permitir cancelación si no está completada
      if (currentOrder.status === 'completed') {
        throw new Error('No se puede cancelar una orden completada')
      }

      // Marcar orden como cancelada
      await updateDoc(orderRef, {
        status: 'cancelled',
        cancelledAt: Timestamp.now(),
        cancelledBy: userId,
        cancelReason: reason,
      })

      // Restaurar inventario si los productos lo requieren
      for (const item of currentOrder.items) {
        if (!item.deletedAt) {
          const productRef = doc(this.db, 'products', item.productId)
          const productSnap = await getDoc(productRef)
          
          if (productSnap.exists()) {
            const product = productSnap.data()
            if (product.hasInventory && product.currentStock !== undefined) {
              await updateDoc(productRef, {
                currentStock: product.currentStock + item.quantity,
              })
            }
          }
        }
      }

      // Log de auditoría
      await addDoc(collection(this.db, 'auditLogs'), {
        action: 'cancel_order',
        userId,
        orderId,
        details: `Orden cancelada - Mesa ${currentOrder.tableNumber}. Razón: ${reason}`,
        timestamp: Timestamp.now(),
      })
    } catch (error) {
      logger.error('firebase', 'Error cancelling order', error as any)
      throw error
    }
  }
}

export default new FirebaseService()
