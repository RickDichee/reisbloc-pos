// Hook de autenticación
import { useState, useEffect } from 'react'
import { useStore } from '@/store/appStore'
import deviceService from '@/services/deviceService'
import firebaseService from '@/services/firebaseService'
import auditService from '@/services/auditService'
import { User, Device } from '@/types/index'
import { APP_CONFIG } from '@/config/constants'

export function useAuth() {
  const {
    currentUser,
    currentDevice,
    isAuthenticated,
    setCurrentUser,
    setCurrentDevice,
    logout: logoutStore,
  } = useStore()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Login con PIN
   */
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

      // TODO: Buscar usuario por PIN (implementar en Cloud Function)
      // Por ahora, simulamos con busca de username
      // En producción, usar PIN hasheado desde Cloud Function

      // Buscar dispositivos registrados del usuario
      let user: User | null = null
      let device: Device | null = null

      // TODO: Reemplazar con búsqueda por PIN desde backend
      // Simulación temporal:
      console.log('PIN ingresado:', pin)
      console.log('Device info:', deviceInfo)

      // Validar que el dispositivo esté aprobado
      if (!device?.isApproved) {
        setError(APP_CONFIG.MESSAGES.DEVICE_NOT_APPROVED)
        await auditService.logAction(
          user?.id || 'unknown',
          'LOGIN_DEVICE_NOT_APPROVED',
          'AUTH',
          'login_attempt'
        )
        return false
      }

      // Actualizar último acceso del dispositivo
      if (device?.id) {
        await firebaseService.updateDevice(device.id, {
          lastAccess: new Date(),
        })
      }

      // Registrar login exitoso
      if (user?.id && device?.id) {
        await auditService.logAction(
          user.id,
          'LOGIN_SUCCESS',
          'AUTH',
          'login',
          undefined,
          { deviceId: device.id },
          device.id
        )

        // Guardar en store
        setCurrentUser(user)
        setCurrentDevice(device)

        return true
      }

      setError('Usuario no encontrado')
      return false
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error en login'
      setError(message)
      console.error('Login error:', err)
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

      return !!authorizedDevice
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
