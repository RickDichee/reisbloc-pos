/**
 * 🛑 ¡ATENCIÓN! SERVICIO CRÍTICO DE AUTENTICACIÓN 🛑
 * ---------------------------------------------------------
 * ESTE SERVICIO GESTIONA LA GENERACIÓN Y ALMACENAMIENTO DE TOKENS.
 * NO MODIFICAR SIN PRUEBAS EXHAUSTIVAS EN STAGING.
 * 
 * ESTADO: FUNCIONAL Y VALIDADO (FEBRERO 2026)
 * PUNTO DE RESTAURACIÓN: v3.0.0-stable-auth
 * ---------------------------------------------------------
 */
import { supabase } from '@/config/supabase'
import logger from '@/utils/logger'

export interface TokenData {
  accessToken: string
  tokenType: string
  expiresIn?: number
}

export const getStoredToken = (): TokenData | null => {
  const token = localStorage.getItem('reisbloc_auth_token')
  if (!token) return null
  try {
    return JSON.parse(token)
  } catch {
    return null
  }
}

export const storeToken = (tokenData: TokenData) => {
  localStorage.setItem('reisbloc_auth_token', JSON.stringify(tokenData))
}

export const clearToken = () => {
  localStorage.removeItem('reisbloc_auth_token')
}

export const generateAccessToken = async (userId: string, role: string, deviceId: string): Promise<TokenData> => {
  try {
    // Usamos la anon key para invocar la función de generación de tokens.
    // La función permite llamadas anónimas para el proceso de login por PIN.
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
    supabase.functions.setAuth(anonKey);

    const { data, error } = await supabase.functions.invoke('generate-access-token', {
      body: { userId, role, deviceId }
    })

    if (error) {
      logger.error('auth', 'Error invocando Edge Function', error)
      throw error
    }
    
    if (!data?.accessToken) throw new Error('No access token received')

    return data as TokenData
  } catch (error) {
    logger.error('auth', 'Error en generateAccessToken', error as any)
    throw error
  }
}