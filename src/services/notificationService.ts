// import { messaging } from '../config/firebase'
import logger from '@/utils/logger'
// import { getToken, onMessage } from 'firebase/messaging'
// Firestore imports commented out - using Supabase instead
// import { doc, updateDoc, collection, addDoc, query, where, onSnapshot, orderBy, limit, Timestamp } from 'firebase/firestore'
// import { db } from '../config/firebase'
import type { UserRole } from '../types'

// Toggle to re-enable once Supabase-based notifications exist
export const NOTIFICATIONS_ENABLED = false

export interface Notification {
  id?: string
  userId: string
  title: string
  body: string
  type: 'order' | 'inventory' | 'alert' | 'info'
  priority: 'low' | 'normal' | 'high'
  read: boolean
  createdAt: string
  data?: Record<string, any>
}

// Clave VAPID pública para FCM (debes generarla en Firebase Console)
// Settings > Cloud Messaging > Web Push certificates
const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY || 'BExampleVAPIDKey'

/**
 * Solicitar permiso para notificaciones y obtener token FCM
 * @deprecated Firebase messaging disabled, needs migration to Supabase
 */
export async function requestNotificationPermission(userId: string): Promise<string | null> {
  if (!NOTIFICATIONS_ENABLED) return null
  return null
}

/**
 * Escuchar notificaciones en foreground
 * @deprecated Firebase messaging disabled
 */
export function listenToForegroundMessages(callback: (payload: any) => void) {
  if (!NOTIFICATIONS_ENABLED) return () => {}
  return () => {}
}

/**
 * Crear notificación in-app en Firestore
 * @deprecated Firebase disabled - needs Supabase migration
 */
export async function createNotification(
  userId: string,
  title: string,
  body: string,
  type: Notification['type'] = 'info',
  priority: Notification['priority'] = 'normal',
  data?: Record<string, any>
): Promise<void> {
  if (!NOTIFICATIONS_ENABLED) return
}

/**
 * Crear notificaciones para múltiples usuarios (por rol)
 * @deprecated Firebase disabled
 */
export async function notifyUsersByRole(
  role: UserRole | UserRole[],
  title: string,
  body: string,
  type: Notification['type'] = 'info',
  priority: Notification['priority'] = 'normal',
  data?: Record<string, any>
): Promise<void> {
  if (!NOTIFICATIONS_ENABLED) return
}

/**
 * Escuchar notificaciones del usuario en tiempo real
 * @deprecated Firebase disabled - needs Supabase migration
 */
export function subscribeToNotifications(
  userId: string,
  callback: (notifications: Notification[]) => void,
  maxNotifications: number = 50
) {
  // Return empty unsubscribe function
  if (!NOTIFICATIONS_ENABLED) {
    callback([])
    return () => {}
  }
  callback([])
  return () => {}
}

/**
 * Marcar notificación como leída
 * @deprecated Firebase disabled
 */
export async function markNotificationAsRead(notificationId: string): Promise<void> {
  if (!NOTIFICATIONS_ENABLED) return
}

/**
 * Marcar todas las notificaciones del usuario como leídas
 * @deprecated Firebase disabled
 */
export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  if (!NOTIFICATIONS_ENABLED) return
}
