import { httpsCallable } from 'firebase/functions'
import { functions, db } from '../config/firebase'
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore'
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
    logger.warn('notification', 'Cloud Function no disponible, usando fallback', error as any)

    // Fallback: crear notificaciones in-app directamente en Firestore
    const targetUserIds: string[] = []

    try {
      if (params.userIds && params.userIds.length > 0) {
        targetUserIds.push(...params.userIds)
      } else if (params.roles && params.roles.length > 0) {
        const usersQ = query(collection(db, 'users'), where('role', 'in', params.roles))
        const usersSnap = await getDocs(usersQ)
        usersSnap.forEach(doc => targetUserIds.push(doc.id))
      } else {
        logger.error('notification', 'Debe especificar userIds o roles para fallback')
        return
      }

      if (targetUserIds.length === 0) {
        logger.info('notification', 'No se encontraron usuarios para notificar (fallback)')
        return
      }

      const tasks = targetUserIds.map(userId =>
        addDoc(collection(db, 'notifications'), {
          userId,
          title: params.title,
          body: params.body,
          type: params.type || 'info',
          priority: params.priority || 'normal',
          read: false,
          createdAt: new Date(),
          data: params.data || {},
        })
      )

      await Promise.all(tasks)
      logger.info('notification', `Notificaciones creadas (fallback): ${targetUserIds.length}`)
    } catch (fbErr) {
      logger.error('notification', 'Error en fallback de notificaciones', fbErr as any)
      throw fbErr
    }
  }
}
