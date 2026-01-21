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
} from 'firebase/firestore'
import { db } from '@/config/firebase'
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

  // ==================== USERS ====================

  async getUserByUsername(username: string): Promise<User | null> {
    try {
      const q = query(collection(this.db, 'users'), where('username', '==', username))
      const querySnapshot = await getDocs(q)
      if (querySnapshot.empty) return null
      return { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() } as User
    } catch (error) {
      console.error('Error getting user:', error)
      return null
    }
  }

  async getUserById(userId: string): Promise<User | null> {
    try {
      const docSnap = await getDoc(doc(this.db, 'users', userId))
      if (!docSnap.exists()) return null
      return { id: docSnap.id, ...docSnap.data() } as User
    } catch (error) {
      console.error('Error getting user by ID:', error)
      return null
    }
  }

  async getAllUsers(): Promise<User[]> {
    try {
      const querySnapshot = await getDocs(collection(this.db, 'users'))
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as User[]
    } catch (error) {
      console.error('Error getting all users:', error)
      return []
    }
  }

  async createUser(user: Omit<User, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(this.db, 'users'), {
        ...user,
        createdAt: Timestamp.now(),
      })
      return docRef.id
    } catch (error) {
      console.error('Error creating user:', error)
      throw error
    }
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<void> {
    try {
      await updateDoc(doc(this.db, 'users', userId), updates)
    } catch (error) {
      console.error('Error updating user:', error)
      throw error
    }
  }

  async deleteUser(userId: string): Promise<void> {
    try {
      await deleteDoc(doc(this.db, 'users', userId))
    } catch (error) {
      console.error('Error deleting user:', error)
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
      console.error('Error registering device:', error)
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
      console.error('Error getting devices:', error)
      return []
    }
  }

  async getDeviceById(deviceId: string): Promise<Device | null> {
    try {
      const docSnap = await getDoc(doc(this.db, 'devices', deviceId))
      if (!docSnap.exists()) return null
      return { id: docSnap.id, ...docSnap.data() } as Device
    } catch (error) {
      console.error('Error getting device:', error)
      return null
    }
  }

  async updateDevice(deviceId: string, updates: Partial<Device>): Promise<void> {
    try {
      await updateDoc(doc(this.db, 'devices', deviceId), {
        ...updates,
        lastAccess: Timestamp.now(),
      })
    } catch (error) {
      console.error('Error updating device:', error)
      throw error
    }
  }

  async approveDevice(deviceId: string): Promise<void> {
    try {
      await updateDoc(doc(this.db, 'devices', deviceId), {
        isApproved: true,
      })
    } catch (error) {
      console.error('Error approving device:', error)
      throw error
    }
  }

  async revokeDevice(deviceId: string): Promise<void> {
    try {
      await updateDoc(doc(this.db, 'devices', deviceId), {
        isApproved: false,
      })
    } catch (error) {
      console.error('Error revoking device:', error)
      throw error
    }
  }

  // ==================== PRODUCTS ====================

  async getAllProducts(): Promise<Product[]> {
    try {
      const q = query(collection(this.db, 'products'), where('active', '==', true))
      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Product[]
    } catch (error) {
      console.error('Error getting products:', error)
      return []
    }
  }

  async getProductById(productId: string): Promise<Product | null> {
    try {
      const docSnap = await getDoc(doc(this.db, 'products', productId))
      if (!docSnap.exists()) return null
      return { id: docSnap.id, ...docSnap.data() } as Product
    } catch (error) {
      console.error('Error getting product:', error)
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
      console.error('Error creating product:', error)
      throw error
    }
  }

  async updateProduct(productId: string, updates: Partial<Product>): Promise<void> {
    try {
      await updateDoc(doc(this.db, 'products', productId), updates)
    } catch (error) {
      console.error('Error updating product:', error)
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
      console.error('Error updating product stock:', error)
      throw error
    }
  }

  async deactivateProduct(productId: string): Promise<void> {
    try {
      await updateDoc(doc(this.db, 'products', productId), {
        active: false,
      })
    } catch (error) {
      console.error('Error deactivating product:', error)
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
      console.error('Error creating order:', error)
      throw error
    }
  }

  async getOrderById(orderId: string): Promise<Order | null> {
    try {
      const docSnap = await getDoc(doc(this.db, 'orders', orderId))
      if (!docSnap.exists()) return null
      return { id: docSnap.id, ...docSnap.data() } as Order
    } catch (error) {
      console.error('Error getting order:', error)
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
      console.error('Error getting orders by table:', error)
      return []
    }
  }

  async updateOrder(orderId: string, updates: Partial<Order>): Promise<void> {
    try {
      await updateDoc(doc(this.db, 'orders', orderId), updates)
    } catch (error) {
      console.error('Error updating order:', error)
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
      console.error('Error updating order status:', error)
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
      console.error('Error creating sale:', error)
      throw error
    }
  }

  async getSaleById(saleId: string): Promise<Sale | null> {
    try {
      const docSnap = await getDoc(doc(this.db, 'sales', saleId))
      if (!docSnap.exists()) return null
      return { id: docSnap.id, ...docSnap.data() } as Sale
    } catch (error) {
      console.error('Error getting sale:', error)
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
      console.error('Error getting sales by date:', error)
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
      console.error('Error getting sales by user:', error)
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
      console.error('Error creating daily close:', error)
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
      console.error('Error getting daily close:', error)
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
      console.error('Error getting daily closes:', error)
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
      console.error('Error creating audit log:', error)
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
      console.error('Error getting audit logs:', error)
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
      console.error('Error batch updating stock:', error)
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
      console.error('Error completing orders:', error)
      throw error
    }
  }
}

export default new FirebaseService()
