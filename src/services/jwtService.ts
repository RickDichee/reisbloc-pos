import { supabase } from '@/config/supabase'
import logger from '@/utils/logger'

interface LoginPayload {
  userId: string
  pin: string
  deviceId: string
}

interface TokenResponse {
  accessToken: string
  userId: string
  userRole: string
  username: string
  expiresAt?: number
  expiresIn?: number
}

/**
 * Generar JWT personalizado después de validar PIN
 * Se apoya en la Edge Function `generate-access-token` (firma con JWT_SECRET)
 */
export async function generateAccessToken(payload: LoginPayload): Promise<TokenResponse> {
  try {
    // 1) Validar PIN contra Supabase
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, name, role, pin')
      .eq('id', payload.userId)
      .eq('pin', payload.pin)
      .single()

    if (userError || !user) {
      logger.error('auth', 'Invalid PIN', userError)
      throw new Error('PIN inválido')
    }

    // 2) Llamar a la Edge Function para obtener JWT firmado
    const { data, error } = await supabase.functions.invoke('generate-access-token', {
      body: {
        userId: user.id,
        role: user.role,
        deviceId: payload.deviceId
      }
    })

    if (error || !data?.accessToken) {
      logger.error('auth', 'Error generating token', error)
      throw new Error('No se pudo generar token de acceso')
    }

    // 3) Guardar token en localStorage
    const expiresAt = Date.now() + (data.expiresIn ? data.expiresIn * 1000 : 24 * 60 * 60 * 1000)

    const tokenData: TokenResponse = {
      accessToken: data.accessToken,
      userId: user.id,
      userRole: user.role,
      username: user.name,
      expiresIn: data.expiresIn,
      expiresAt
    }

    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('reisbloc_auth_token', JSON.stringify(tokenData))
    }

    logger.info('auth', 'Token generado exitosamente', { userId: user.id, role: user.role })
    return tokenData
  } catch (error) {
    logger.error('auth', 'Error en generateAccessToken', error)
    throw error
  }
}

/**
 * Obtener token actual del localStorage
 */
export function getStoredToken(): TokenResponse | null {
  try {
    if (typeof localStorage === 'undefined') return null
    
    const stored = localStorage.getItem('reisbloc_auth_token')
    if (!stored) return null

    const token = JSON.parse(stored)
    
    // Verificar que no esté expirado
    if (token.expiresAt && token.expiresAt < Date.now()) {
      localStorage.removeItem('reisbloc_auth_token')
      return null
    }

    return token
  } catch (error) {
    logger.error('auth', 'Error leyendo token almacenado', error)
    return null
  }
}

/**
 * Limpiar token al logout
 */
export function clearAuthToken(): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem('reisbloc_auth_token')
  }
}

/**
 * Verificar si el token es válido y está en la sesión
 */
export function isTokenValid(): boolean {
  const token = getStoredToken()
  return !!(token && token.accessToken && token.expiresAt > Date.now())
}
