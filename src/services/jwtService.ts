import { supabase } from '@/config/supabase'
import logger from '@/utils/logger'

interface LoginPayload {
  pin: string
  deviceId: string
}

interface TokenResponse {
  accessToken: string
  userId: string
  userRole: string
  username: string
}

/**
 * Generar JWT personalizado después de validar PIN
 * Esto asegura que Supabase RLS solo permita acceso a usuarios válidos
 */
export async function generateAccessToken(payload: LoginPayload): Promise<TokenResponse> {
  try {
    // 1. Validar PIN contra Supabase
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, name, role, pin')
      .eq('pin', payload.pin)
      .single()

    if (userError || !user) {
      logger.error('auth', 'Invalid PIN', userError)
      throw new Error('PIN inválido')
    }

    // 2. Llamar a Cloud Function para generar JWT
    const { data, error } = await supabase.functions.invoke('generate-access-token', {
      body: {
        userId: user.id,
        role: user.role,
        deviceId: payload.deviceId
      }
    })

    if (error) {
      logger.error('auth', 'Error generating token', error)
      throw new Error('No se pudo generar token de acceso')
    }

    // 3. Guardar token en localStorage (sessionStorage es más seguro pero menos práctico)
    const tokenData = {
      accessToken: data.accessToken,
      userId: user.id,
      userRole: user.role,
      username: user.name,
      expiresAt: Date.now() + (data.expiresIn || 3600) * 1000
    }

    // Store token (usar sessionStorage en producción)
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('reisbloc_auth_token', JSON.stringify(tokenData))
    }

    logger.info('auth', 'Token generado exitosamente', { userId: user.id, role: user.role })

    return tokenData as TokenResponse
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
