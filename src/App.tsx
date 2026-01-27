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

import { Suspense, lazy, useEffect, useState } from 'react'
import logger from '@/utils/logger'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAppStore } from '@/store/appStore'
import DeviceVerification from '@/components/auth/DeviceVerification'
import NavBar from '@/components/layout/NavBar'
import OfflineIndicator from '@/components/common/OfflineIndicator'
import { useNotifications } from '@/hooks/useNotifications'
import { Bell } from 'lucide-react'

const Login = lazy(() => import('@/pages/Login'))
const POS = lazy(() => import('@/pages/POS'))
const Admin = lazy(() => import('@/pages/Admin'))
const Reports = lazy(() => import('@/pages/Reports'))
const Kitchen = lazy(() => import('@/pages/Kitchen'))
const Bar = lazy(() => import('@/pages/Bar'))
const TableMonitor = lazy(() => import('@/pages/TableMonitor'))
const OrdersToServe = lazy(() => import('@/pages/OrdersToServe'))
const KitchenDashboard = lazy(() => import('@/pages/KitchenDashboard'))
const Closing = lazy(() => import('@/pages/Closing'))
const NotFound = lazy(() => import('@/pages/NotFound'))

function App() {
  const { isAuthenticated, currentUser } = useAppStore()
  const { currentDevice } = useAppStore.getState()
  const [showPermissionPrompt, setShowPermissionPrompt] = useState(false)

  // Hook de notificaciones (solo para prompt de permisos)
  const { permission, requestPermission } = useNotifications(currentUser?.id || null)

  const needsDeviceApproval = isAuthenticated && currentDevice && currentDevice.isApproved === false

  logger.info('app', 'Auth state', { isAuthenticated, device: currentDevice, needsApproval: needsDeviceApproval })

  // Solicitar permiso de notificaciones al usuario autenticado
  useEffect(() => {
    if (isAuthenticated && permission === 'default' && !showPermissionPrompt) {
      // Mostrar prompt después de 3 segundos de estar autenticado
      const timer = setTimeout(() => {
        setShowPermissionPrompt(true)
      }, 3000)
      
      return () => clearTimeout(timer)
    }
  }, [isAuthenticated, permission, showPermissionPrompt])

  const handleAcceptNotifications = async () => {
    await requestPermission()
    setShowPermissionPrompt(false)
  }

  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
      <div className="relative">
        <NavBar />
        

        {/* OfflineIndicator - mostrar siempre cuando está offline */}
        <OfflineIndicator />

        {/* Prompt para solicitar permiso de notificaciones */}
        {showPermissionPrompt && permission === 'default' && (
          <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-xl border border-gray-200 p-4 max-w-sm z-50">
            <div className="flex items-start gap-3">
              <Bell className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-1">
                  Activar notificaciones
                </h4>
                <p className="text-sm text-gray-600 mb-3">
                  Recibe alertas de nuevas órdenes, platillos listos e inventario bajo.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleAcceptNotifications}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                  >
                    Activar
                  </button>
                  <button
                    onClick={() => setShowPermissionPrompt(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300"
                  >
                    Ahora no
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <Suspense fallback={<div className="p-6 text-center text-gray-600">Cargando...</div>}>
          <Routes>
            {!isAuthenticated ? (
              <>
                <Route path="/login" element={<Login />} />
                <Route path="*" element={<Navigate to="/login" replace />} />
              </>
            ) : needsDeviceApproval ? (
              <>
                <Route path="*" element={<DeviceVerification />} />
              </>
            ) : (
              <>
                <Route path="/" element={<Navigate to="/pos" replace />} />
                <Route path="/pos" element={<POS />} />
                <Route path="/mesas" element={['admin', 'capitan', 'supervisor'].includes(currentUser?.role || '') ? <TableMonitor /> : <Navigate to="/pos" />} />
                <Route path="/ready" element={<OrdersToServe />} />
                <Route path="/kitchen" element={<Kitchen />} />
                <Route path="/bar" element={<Bar />} />
                <Route path="/kitchen-dashboard" element={['admin', 'capitan', 'cocina', 'bar'].includes(currentUser?.role || '') ? <KitchenDashboard /> : <Navigate to="/pos" />} />
                <Route path="/admin" element={currentUser?.role === 'admin' ? <Admin /> : <Navigate to="/pos" />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/closing" element={currentUser?.role === 'admin' ? <Closing /> : <Navigate to="/pos" />} />
                <Route path="*" element={<NotFound />} />
              </>
            )}
          </Routes>
        </Suspense>
      </div>
    </Router>
  )
}

export default App
