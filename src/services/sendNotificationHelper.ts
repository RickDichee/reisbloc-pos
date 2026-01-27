import { httpsCallable } from 'firebase/functions'
import { functions } from '../config/firebase'
import logger from '@/utils/logger'
import type { UserRole } from '../types'

interface SendNotificationParams {
  userIds?: string[]
  roles?: UserRole[]
  title: string
  body: string
  type?: 'order' | 'inventory' | 'alert' | 'info'
  priority?: 'low' | 'normal' | 'high'
  data?: Record<string, any>
}

/**
 * Enviar notificación mediante Cloud Function
 */
export async function sendNotificationToUsers(params: SendNotificationParams): Promise<void> {
  try {
    const sendNotification = httpsCallable(functions, 'sendNotification')
    await sendNotification(params)
    logger.info('notification', 'Notificación enviada')
  } catch (error) {
    // Silently fail during Supabase migration - notifications will be re-enabled later
    logger.warn('notification', '⚠️ Notificaciones deshabilitadas temporalmente (migrando a Supabase)')
    return
  }
}
