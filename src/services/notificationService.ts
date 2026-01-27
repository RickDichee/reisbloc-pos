import { messaging } from '../config/firebase'
import logger from '@/utils/logger'
import { getToken, onMessage } from 'firebase/messaging'
import { doc, updateDoc, collection, addDoc, query, where, onSnapshot, orderBy, limit, Timestamp } from 'firebase/firestore'
import { db } from '../config/firebase'
import type { UserRole } from '../types'

export interface Notification {
  id?: string
  userId: string
  title: string
  body: string
  type: 'order' | 'inventory' | 'alert' | 'info'
  priority: 'low' | 'normal' | 'high'
  read: boolean
  createdAt: Timestamp
  data?: Record<string, any>
}

// Clave VAPID pública para FCM (debes generarla en Firebase Console)
// Settings > Cloud Messaging > Web Push certificates
const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY || 'BExampleVAPIDKey'

/**
 * Solicitar permiso para notificaciones y obtener token FCM
 */
export async function requestNotificationPermission(userId: string): Promise<string | null> {
  if (!messaging || typeof Notification === 'undefined') {
    logger.warn('notification', 'Firebase Messaging o Notification API no disponible')
    return null
  }

  try {
    // Solicitar permiso al usuario
    const permission = await Notification.requestPermission()
    
    if (permission === 'granted') {
      logger.info('notification', 'Permiso de notificaciones concedido')
      
      // Obtener token FCM
      const token = await getToken(messaging, { vapidKey: VAPID_KEY })
      
      if (token) {
        logger.info('notification', 'Token FCM obtenido', token)
        
        // Guardar token en Firestore asociado al usuario
        await updateDoc(doc(db, 'users', userId), {
          fcmToken: token,
          fcmTokenUpdatedAt: Timestamp.now()
        })
        
        return token
      }
    } else {
      logger.warn('notification', 'Permiso de notificaciones denegado')
    }
  } catch (error) {
    logger.error('notification', 'Error al solicitar permiso de notificaciones', error as any)
  }
  
  return null
}

/**
 * Escuchar notificaciones en foreground
 */
export function listenToForegroundMessages(callback: (payload: any) => void) {
  if (!messaging || typeof Notification === 'undefined') return () => {}
  
  return onMessage(messaging, (payload) => {
    logger.info('notification', 'Notificación recibida en foreground', payload)
    
    // Mostrar notificación del navegador si la app está visible
    if (document.visibilityState === 'visible' && typeof Notification !== 'undefined') {
      new Notification(payload.notification?.title || 'Nueva notificación', {
        body: payload.notification?.body || '',
        icon: '/icon-192x192.png',
        tag: payload.data?.type || 'default'
      })
    }
    
    callback(payload)
  })
}

/**
 * Crear notificación in-app en Firestore
 */
export async function createNotification(
  userId: string,
  title: string,
  body: string,
  type: Notification['type'] = 'info',
  priority: Notification['priority'] = 'normal',
  data?: Record<string, any>
): Promise<void> {
  try {
    await addDoc(collection(db, 'notifications'), {
      userId,
      title,
      body,
      type,
      priority,
      read: false,
      createdAt: Timestamp.now(),
      data: data || {}
    })
    
    logger.info('notification', 'Notificación creada para usuario', userId)
  } catch (error) {
    logger.error('notification', 'Error al crear notificación', error as any)
  }
}

/**
 * Crear notificaciones para múltiples usuarios (por rol)
 */
export async function notifyUsersByRole(
  role: UserRole | UserRole[],
  title: string,
  body: string,
  type: Notification['type'] = 'info',
  priority: Notification['priority'] = 'normal',
  data?: Record<string, any>
): Promise<void> {
  try {
    const roles = Array.isArray(role) ? role : [role]
    
    // Obtener usuarios con ese rol
    const usersSnapshot = await getDocs(
      query(collection(db, 'users'), where('role', 'in', roles))
    )
    
    // Crear notificación para cada usuario
    const promises = usersSnapshot.docs.map(userDoc => 
      createNotification(userDoc.id, title, body, type, priority, data)
    )
    
    await Promise.all(promises)
    logger.info('notification', `Notificaciones enviadas a ${promises.length} usuarios con rol(es): ${roles.join(', ')}`)
  } catch (error) {
    logger.error('notification', 'Error al notificar usuarios por rol', error as any)
  }
}

/**
 * Escuchar notificaciones del usuario en tiempo real
 */
export function subscribeToNotifications(
  userId: string,
  callback: (notifications: Notification[]) => void,
  maxNotifications: number = 50
) {
  const notificationsQuery = query(
    collection(db, 'notifications'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(maxNotifications)
  )
  
  return onSnapshot(notificationsQuery, (snapshot) => {
    const notifications: Notification[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Notification))
    
    callback(notifications)
  })
}

/**
 * Marcar notificación como leída
 */
export async function markNotificationAsRead(notificationId: string): Promise<void> {
  try {
    await updateDoc(doc(db, 'notifications', notificationId), {
      read: true
    })
  } catch (error) {
    logger.error('notification', 'Error al marcar notificación como leída', error as any)
  }
}

/**
 * Marcar todas las notificaciones del usuario como leídas
 */
export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  try {
    const notificationsSnapshot = await getDocs(
      query(collection(db, 'notifications'), where('userId', '==', userId), where('read', '==', false))
    )
    
    const promises = notificationsSnapshot.docs.map(doc => 
      updateDoc(doc.ref, { read: true })
    )
    
    await Promise.all(promises)
    logger.info('notification', `${promises.length} notificaciones marcadas como leídas`)
  } catch (error) {
    logger.error('notification', 'Error al marcar todas las notificaciones como leídas', error as any)
  }
}

// Import faltante
import { getDocs } from 'firebase/firestore'
