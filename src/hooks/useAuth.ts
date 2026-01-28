// Hook de autenticación
import { useState } from 'react'
import { useAppStore } from '@/store/appStore'
import deviceService from '@/services/deviceService'
import supabaseService from '@/services/supabaseService'
import auditService from '@/services/auditService'
import { generateAccessToken, setAuthToken } from '@/services/jwtService'
import { setAuthToken as setSupabaseAuthToken } from '@/config/supabase'
import { User, Device } from '@/types/index'
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

      // Buscar usuario por PIN en Supabase
      const users = await supabaseService.getAllUsers()
      
      // Buscar usuario con PIN coincidente
      const user = users.find(u => u.pin === pin)

      if (!user) {
        setError('PIN incorrecto')
        return false
      }

      if (!user.active) {
        setError('Usuario inactivo')
        return false
      }

      logger.info('auth', 'Usuario autenticado', { name: user.name })
      
      // Buscar dispositivo por MAC address (no por userId, porque puede no estar asignado)
      const allDevices = await supabaseService.getAllDevices()
      
      let device: Device | null = allDevices.find(d => d.macAddress === deviceInfo.macAddress) || null

      if (!device) {
        // Registrar nuevo dispositivo
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

        const deviceId = await supabaseService.registerDevice(deviceData as any)
        device = { id: deviceId, ...deviceData } as Device
        
        // Auto-aprobar si es admin
        if (user.role === 'admin') {
          try {
            await supabaseService.approveDevice(deviceId)
            device.isApproved = true
            device.isRejected = false
          } catch (e) {
            logger.warn('auth', 'No se pudo auto-aprobar dispositivo admin', e as any)
          }
        }
      } else {
        // Dispositivo existe - actualizar user_id y último acceso
        if (device.userId !== user.id) {
          await supabaseService.updateDevice(device.id, { userId: user.id })
          device.userId = user.id
        }
        await supabaseService.updateDevice(device.id, { lastAccess: new Date() })
      }

      // Verificar aprobación del dispositivo (mapear status de Supabase)
      const isDeviceApproved = (device as any).status === 'approved' || device.isApproved
      const isDeviceRejected = (device as any).status === 'rejected' || device.isRejected

      // Si no está aprobado, intentar auto-aprobar si es admin
      if (!isDeviceApproved) {
        if (user.role === 'admin' && device.id) {
          try {
            await supabaseService.approveDevice(device.id)
            device.isApproved = true
            device.isRejected = false
          } catch (e) {
            logger.warn('auth', 'No se pudo auto-aprobar dispositivo admin', e as any)
          }
        }

        // Si aún no está aprobado, guardar estado y mostrar pantalla de verificación
        if (!isDeviceApproved && !isDeviceRejected) {
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
      await supabaseService.updateDevice(device.id, {
        lastAccess: new Date(),
      })

      // ✅ GENERAR JWT PERSONALIZADO
      try {
        const tokenResponse = await generateAccessToken({
          pin,
          deviceId: device.id
        })
        // Actualizar cliente Supabase con el token
        await setSupabaseAuthToken(tokenResponse.accessToken)
        logger.info('auth', 'JWT generado exitosamente', { userId: user.id })
      } catch (tokenError) {
        logger.warn('auth', 'Error generando JWT (continuando con sesión local)', tokenError as any)
        // Continuar aunque falle JWT - fallback a sesión local
      }

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
        supabaseService.getAllProducts(),
        supabaseService.getAllUsers(),
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

      const deviceId = await supabaseService.registerDevice(deviceData as any)

      // Registrar en auditoría
      await auditService.logAction(
        userId,
        'DEVICE_REGISTERED',
        'DEVICE',
        deviceId,
        undefined,
        deviceData
      )

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
      const userDevices = await supabaseService.getDevicesByUser(userId)

      const authorizedDevice = userDevices.find(d => {
        const isApproved = (d as any).status === 'approved' || d.isApproved
        return d.macAddress === deviceInfo.macAddress && isApproved
      })

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
      return await supabaseService.getDevicesByUser(currentUser.id)
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
