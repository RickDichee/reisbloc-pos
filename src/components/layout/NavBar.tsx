import { Link, useLocation } from 'react-router-dom'
import { useAppStore } from '@/store/appStore'
import { useAuth } from '@/hooks/useAuth'
import { usePermissions } from '@/hooks/usePermissions'
import { useNotifications } from '@/hooks/useNotifications'
import NotificationCenter from '@/components/common/NotificationCenter'
import { useState } from 'react'
import {
  ShoppingCart,
  ChefHat,
  Wine,
  BarChart3,
  ShieldCheck,
  LayoutDashboard,
  LogOut,
  User,
  Eye,
  DollarSign,
  Utensils,
  Bell
} from 'lucide-react'

export default function NavBar() {
  const location = useLocation()
  const { currentUser } = useAppStore()
  const { logout } = useAuth()
  const { isReadOnly, currentRole } = usePermissions()
  const [showNotifications, setShowNotifications] = useState(false)
  
  const {
    notifications,
    unreadCount,
    permission,
    requestPermission,
    markAsRead,
    markAllAsRead
  } = useNotifications(currentUser?.id || null)

  // Solo mostrar en rutas autenticadas (excepto login)
  if (location.pathname === '/login' || !currentUser) {
    return null
  }

  const handleLogout = async () => {
    if (confirm('¿Seguro que deseas cerrar sesión?')) {
      await logout()
    }
  }

  const navItems = [
    { path: '/pos', label: 'POS', icon: ShoppingCart, roles: ['admin', 'capitan', 'bar', 'mesero', 'cocina', 'supervisor'] },
    { path: '/ready', label: 'Listas', icon: Utensils, roles: ['admin', 'capitan', 'bar', 'mesero', 'cocina', 'supervisor'] },
    { path: '/mesas', label: 'Mesas', icon: LayoutDashboard, roles: ['admin', 'capitan', 'supervisor'] },
    { path: '/kitchen', label: 'Cocina', icon: ChefHat, roles: ['admin', 'cocina'] },
    { path: '/bar', label: 'Bar', icon: Wine, roles: ['admin', 'bar'] },
    { path: '/reports', label: 'Reportes', icon: BarChart3, roles: ['admin', 'supervisor'] },
    { path: '/closing', label: 'Cierre', icon: DollarSign, roles: ['admin'] },
    { path: '/admin', label: 'Admin', icon: ShieldCheck, roles: ['admin'] },
  ]

  const visibleItems = navItems.filter(item => 
    item.roles.includes(currentUser?.role || '')
  )

  return (
    <nav className="bg-gradient-to-r from-gray-900 to-gray-800 text-white shadow-2xl sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo / Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center font-bold text-xl">
              C
            </div>
            <div>
              <div className="font-bold text-lg">Cevicheria Mexa</div>
              <div className="text-xs text-gray-400">v2.0</div>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center gap-2">
            {visibleItems.map(item => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${
                    isActive
                      ? 'bg-white text-gray-900'
                      : 'text-gray-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon size={20} />
                  <span className="hidden md:inline">{item.label}</span>
                </Link>
              )
            })}
          </div>

          {/* User Info & Logout */}
          <div className="flex items-center gap-4">
            {/* User Badge */}
            <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg">
              <User size={18} />
              <div className="text-sm">
                <div className="font-semibold">{currentUser?.username || 'Usuario'}</div>
                <div className="text-xs text-gray-400 capitalize flex items-center gap-1">
                  {isReadOnly && <Eye size={12} />}
                  {currentRole}
                </div>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-semibold transition-all"
            >
              <LogOut size={18} />
              <span className="hidden md:inline">Salir</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}
