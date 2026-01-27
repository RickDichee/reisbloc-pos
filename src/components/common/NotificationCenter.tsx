import { useState, useEffect, useRef } from 'react'
import { Bell, X, Check, CheckCheck, AlertCircle, Package, Info } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import type { Notification } from '../../services/notificationService'

interface NotificationCenterProps {
  notifications: Notification[]
  unreadCount: number
  onMarkAsRead: (notificationId: string) => void
  onMarkAllAsRead: () => void
}

export default function NotificationCenter({
  notifications,
  unreadCount,
  onMarkAsRead,
  onMarkAllAsRead
}: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [flash, setFlash] = useState<Notification | null>(null)
  const prevCountRef = useRef(0)

  // Mostrar aviso breve cuando llega una nueva notificación
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined

    if (notifications.length > prevCountRef.current) {
      const newest = notifications[0]
      setFlash(newest)
      timer = setTimeout(() => setFlash(null), 4000)
    }

    prevCountRef.current = notifications.length

    return () => {
      if (timer) clearTimeout(timer)
    }
  }, [notifications])

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'order':
        return <Package className="w-5 h-5 text-blue-500" />
      case 'inventory':
        return <AlertCircle className="w-5 h-5 text-orange-500" />
      case 'alert':
        return <AlertCircle className="w-5 h-5 text-red-500" />
      default:
        return <Info className="w-5 h-5 text-gray-500" />
    }
  }

  const getPriorityColor = (priority: Notification['priority']) => {
    switch (priority) {
      case 'high':
        return 'border-l-4 border-red-500 bg-red-50'
      case 'normal':
        return 'border-l-4 border-blue-500 bg-blue-50'
      case 'low':
        return 'border-l-4 border-gray-500 bg-gray-50'
    }
  }

  return (
    <div className="relative">
      {/* Bell Icon with Badge (larger) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative px-3 py-2 rounded-full bg-white/10 hover:bg-white/20 transition-all shadow-md border border-white/20"
        aria-label="Notificaciones"
      >
        <Bell className="w-7 h-7 text-white" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[22px] h-5 px-1 flex items-center justify-center shadow-lg">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Panel */}
          <div className="absolute right-0 mt-3 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 max-h-[80vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Notificaciones
                {unreadCount > 0 && (
                  <span className="ml-2 text-sm text-gray-500">
                    ({unreadCount} nueva{unreadCount !== 1 ? 's' : ''})
                  </span>
                )}
              </h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={onMarkAllAsRead}
                    className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    title="Marcar todas como leídas"
                  >
                    <CheckCheck className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="overflow-y-auto flex-1">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No tienes notificaciones</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                        !notification.read ? getPriorityColor(notification.priority) : 'bg-white'
                      }`}
                      onClick={() => notification.id && !notification.read && onMarkAsRead(notification.id)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-1">
                          {getIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className={`text-sm font-medium ${!notification.read ? 'text-gray-900' : 'text-gray-600'}`}>
                              {notification.title}
                            </p>
                            {!notification.read && (
                              <span className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full mt-1" />
                            )}
                          </div>
                          <p className={`text-sm mt-1 ${!notification.read ? 'text-gray-700' : 'text-gray-500'}`}>
                            {notification.body}
                          </p>
                          <p className="text-xs text-gray-400 mt-2">
                            {formatDistanceToNow(notification.createdAt.toDate(), {
                              addSuffix: true,
                              locale: es
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-3 border-t border-gray-200 text-center">
                <button
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  onClick={() => {
                    setIsOpen(false)
                    // Aquí podrías navegar a una página de notificaciones completa
                  }}
                >
                  Ver todas las notificaciones
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* Aviso flotante rápido cuando llega una nueva notificación */}
      {flash && !isOpen && (
        <div className="absolute right-0 mt-3 w-72 bg-white/95 backdrop-blur rounded-lg shadow-xl border border-blue-200 z-40 animate-slide-in">
          <div className="flex items-start gap-3 p-3">
            <Bell className="w-5 h-5 text-blue-600 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900">{flash.title}</p>
              <p className="text-xs text-gray-600 line-clamp-2">{flash.body}</p>
            </div>
            <button
              onClick={() => setFlash(null)}
              className="text-gray-400 hover:text-gray-600"
              aria-label="Cerrar aviso"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
