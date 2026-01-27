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
 * Generar JWT personalizado directamente en el cliente (para desarrollo)
 * En producción, esto debería venir de una Cloud Function segura
 */
function generateJWTToken(userId: string, role: string, deviceId: string): string {
  // Header
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))

  // Payload con expiración en 24 horas
  const now = Math.floor(Date.now() / 1000)
  const payload = btoa(
    JSON.stringify({
      sub: userId,
      role: role,
      deviceId: deviceId,
      iat: now,
      exp: now + 24 * 60 * 60, // 24 horas
      iss: 'reisbloc-pos'
    })
  )

  // Signature (simplificada para desarrollo - en producción usar HMAC-SHA256)
  const signature = btoa('dev-signature-' + userId + '-' + deviceId)

  return `${header}.${payload}.${signature}`
}

/**
 * Generar JWT personalizado después de validar PIN
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

    // 2. Generar JWT en el cliente (para desarrollo)
    const token = generateJWTToken(user.id, user.role, payload.deviceId)

    // 3. Guardar token en localStorage
    const tokenData = {
      accessToken: token,
      userId: user.id,
      userRole: user.role,
      username: user.name,
      expiresAt: Date.now() + 24 * 60 * 60 * 1000
    }

    // Store token
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('reisbloc_auth_token', JSON.stringify(tokenData))
    }

    logger.info('auth', 'JWT generado exitosamente', { userId: user.id, role: user.role })

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

