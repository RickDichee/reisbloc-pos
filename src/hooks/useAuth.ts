// Hook de autenticación
import { useState } from 'react'
import { httpsCallable } from 'firebase/functions'
import { signInWithCustomToken, signOut } from 'firebase/auth'
import { useAppStore } from '@/store/appStore'
import deviceService from '@/services/deviceService'
import firebaseService from '@/services/firebaseService'
import auditService from '@/services/auditService'
import { User, Device } from '@/types/index'
import { functions, auth } from '@/config/firebase'
import logger from '@/utils/logger'

export function useAuth() {
  const {
    currentUser,
    currentDevice,
    isAuthenticated,
    setCurrentUser,
    setCurrentDevice,
    setAuthenticated,
    setProducts,
    setUsers,
    logout: logoutStore,
  } = useAppStore()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const login = async (pin: string): Promise<boolean> => {
    try {
      setLoading(true)
      setError(null)

      // Validar formato del PIN
      if (pin.length !== 4 || !/^\d+$/.test(pin)) {
        setError('PIN debe ser 4 dígitos')
        return false
      }

      // Obtener información del dispositivo
      const deviceInfo = await deviceService.getDeviceInfo()
      const fingerprint = deviceService.storeDeviceFingerprint()

      // Llamar a Cloud Function para verificar PIN (sin loguear el PIN)
      const loginFunction = httpsCallable(functions, 'loginWithPin')
      const result = await loginFunction({ pin })
      const data = result.data as any

      if (!data.success || !data.user || !data.token) {
        setError('Error en autenticación')
        return false
      }

      const user: User = {
        id: data.user.id,
        username: data.user.username,
        role: data.user.role,
        pin: '', // No exponer el hash
        active: data.user.active,
        createdAt: new Date(),
        devices: data.user.devices || [],
      }

      logger.info('auth', 'Usuario autenticado', { username: user.username })

      // Autenticar con Firebase Auth usando custom token
      await signInWithCustomToken(auth, data.token)

      // Obtener o registrar dispositivo
      const userDevices = await firebaseService.getDevicesByUser(user.id)
      let device: Device | null =
        userDevices.find(d => d.macAddress === deviceInfo.macAddress) || null

      if (!device) {
        const deviceData = {
          userId: user.id,
          macAddress: deviceInfo.macAddress || 'unknown',
          deviceName: deviceInfo.deviceName || 'Unknown Device',
          network: deviceInfo.network || 'wifi',
          os: deviceInfo.os || 'Unknown',
          browser: deviceInfo.browser || 'Unknown',
          deviceType: deviceInfo.deviceType || 'unknown',
          fingerprint,
          registeredAt: new Date(),
          lastAccess: new Date(),
          isApproved: false,
          isRejected: false,
        }

        const deviceId = await firebaseService.registerDevice(deviceData as any)
        device = { id: deviceId, ...deviceData } as Device
        
        // Auto-aprobar si es admin
        if (user.role === 'admin') {
          try {
            await firebaseService.approveDevice(deviceId)
            device.isApproved = true
            device.isRejected = false
          } catch (e) {
            console.warn('No se pudo auto-aprobar dispositivo (admin):', e)
          }
        }
      }

      // Si no está aprobado, intentar auto-aprobar si es admin
      if (!device.isApproved) {
        if (user.role === 'admin' && device.id) {
          try {
            await firebaseService.approveDevice(device.id)
            device.isApproved = true
            device.isRejected = false
          } catch (e) {
            console.warn('No se pudo auto-aprobar dispositivo existente (admin):', e)
          }
        }

        // Si aún no está aprobado, guardar estado y mostrar pantalla de verificación
        if (!device.isApproved) {
          setCurrentUser(user)
          setCurrentDevice(device)
          setAuthenticated(true)

          await auditService.logAction(
            user.id,
            'LOGIN_DEVICE_NOT_APPROVED',
            'AUTH',
            'login_attempt',
            undefined,
            { deviceId: device.id },
            device.id
          )

          return true
        }
      }

      // Dispositivo aprobado: actualizar último acceso
      await firebaseService.updateDevice(device.id, {
        lastAccess: new Date(),
      })

      // Registrar login exitoso
      await auditService.logAction(
        user.id,
        'LOGIN_SUCCESS',
        'AUTH',
        'login',
        undefined,
        { deviceId: device.id },
        device.id
      )

      // Cargar datos iniciales
      const [products, usersList] = await Promise.all([
        firebaseService.getAllProducts(),
        firebaseService.getAllUsers(),
      ])

      setCurrentUser(user)
      setCurrentDevice(device)
      setProducts(products)
      setUsers(usersList)
      setAuthenticated(true)

      return true
    } catch (err: any) {
      console.error('❌ Login error:', err)
      const message = err?.message || err?.details?.message || 'Error en login'
      setError(message)
      return false
    } finally {
      setLoading(false)
    }
  }

  /**
   * Logout
   */
  const logout = async (): Promise<void> => {
    try {
      if (currentUser?.id && currentDevice?.id) {
        await auditService.logAction(
          currentUser.id,
          'LOGOUT',
          'AUTH',
          'logout',
          undefined,
          { timestamp: new Date() },
          currentDevice.id
        )
      }

      try {
        await signOut(auth)
      } catch (e) {
        // ignore signOut errors to avoid blocking logout
      }

      setAuthenticated(false)
      setCurrentUser(null)
      setCurrentDevice(null)
      setProducts([])
      setUsers([])
      logoutStore()
    } catch (err) {
      console.error('Logout error:', err)
      logoutStore()
    }
  }

  /**
   * Registrar nuevo dispositivo
   */
  const registerDevice = async (userId: string): Promise<boolean> => {
    try {
      setLoading(true)
      setError(null)

      await ensureAuthSession()

      const deviceInfo = await deviceService.getDeviceInfo()

      const deviceData = {
        userId,
        macAddress: deviceInfo.macAddress || 'unknown',
        deviceName: deviceInfo.deviceName || 'Unknown Device',
        network: deviceInfo.network || 'wifi',
        os: deviceInfo.os || 'Unknown',
        browser: deviceInfo.browser || 'Unknown',
        registeredAt: new Date(),
        lastAccess: new Date(),
        isApproved: false, // Requiere aprobación de admin
      }

      const deviceId = await firebaseService.registerDevice(deviceData as any)

      // Registrar en auditoría
      await auditService.logAction(
        userId,
        'DEVICE_REGISTERED',
        'DEVICE',
        deviceId,
        undefined,
        deviceData
      )

      // Actualizar dispositivo del usuario
      const user = await firebaseService.getUserById(userId)
      if (user) {
        await firebaseService.updateUser(userId, {
          devices: [...(user.devices || []), deviceId],
        } as any)
      }

      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error registrando dispositivo'
      setError(message)
      console.error('Register device error:', err)
      return false
    } finally {
      setLoading(false)
    }
  }

  /**
   * Verificar si dispositivo está autorizado
   */
  const verifyDevice = async (userId: string): Promise<boolean> => {
    try {
      const deviceInfo = await deviceService.getDeviceInfo()
      const userDevices = await firebaseService.getDevicesByUser(userId)

      const authorizedDevice = userDevices.find(d => 
        d.macAddress === deviceInfo.macAddress &&
        d.isApproved
      )

      if (authorizedDevice) {
        setCurrentDevice(authorizedDevice)
        return true
      }

      return false
    } catch (err) {
      console.error('Device verification error:', err)
      return false
    }
  }

  /**
   * Obtener dispositivos del usuario actual
   */
  const getUserDevices = async (): Promise<Device[]> => {
    try {
      if (!currentUser?.id) return []
      return await firebaseService.getDevicesByUser(currentUser.id)
    } catch (err) {
      console.error('Get user devices error:', err)
      return []
    }
  }

  return {
    // State
    currentUser,
    currentDevice,
    isAuthenticated,
    loading,
    error,

    // Methods
    login,
    logout,
    registerDevice,
    verifyDevice,
    getUserDevices,
  }
}
