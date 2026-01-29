/**
 * Reisbloc POS - Sistema POS Profesional
 * Copyright (C) 2026 Reisbloc POS
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

// Servicio de autenticación solo Supabase
import { supabase } from '@/config/supabase'

import logger from '@/utils/logger'
import { User } from '@/types/index'

const useSupabaseAuth = import.meta.env.VITE_SUPABASE_AUTH_ENABLED === 'true'

interface LoginResult {
  success: boolean
  user?: User
  token?: string
  error?: string
}

export async function authLogin(pin: string): Promise<LoginResult> {
  try {
    logger.info('auth', '🔐 Iniciando autenticación')
    
    if (useSupabaseAuth) {
      // Modo Supabase: Comparar PIN directamente con service_role key (bypassa RLS)
      logger.info('auth', '🔍 Buscando usuario en Supabase...')
      
      // Usar el cliente normal. El PIN debe ser accesible vía RLS para anon o el rol actual.
      const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .eq('pin', pin)
        .eq('active', true)
        .limit(1)

      if (error) {
        logger.error('auth', '❌ Error consultando Supabase', { error: error.message })
        return { success: false, error: 'Error de conexión a base de datos' }
      }

      if (!users || users.length === 0) {
        logger.error('auth', '❌ PIN incorrecto o usuario no encontrado')
        return { success: false, error: 'PIN incorrecto' }
      }

      const userData = users[0]
      const user: User = {
        id: userData.id,
        username: userData.name,
        role: userData.role,
        pin: '',
        active: userData.active,
        createdAt: new Date(userData.created_at),
        devices: [],
      }

      logger.info('auth', '✅ Autenticación exitosa con Supabase', { username: user.username })
      return { success: true, user }
    } else {
      logger.error('auth', '❌ Modo de autenticación no soportado')
      return { success: false, error: 'Configuración de autenticación inválida' }
    }
  } catch (error: any) {
    logger.error('auth', '❌ Error en login', error)
    return { success: false, error: error.message }
  }
}

export async function authLogout(): Promise<void> {
  try {
    if (useSupabaseAuth) {
      await supabase.auth.signOut()
    } else {
      logger.warn('auth', 'Logout intentado en modo no-Supabase')
    }
    logger.info('auth', 'Logout exitoso')
  } catch (error: any) {
    logger.error('auth', 'Error en logout', error)
  }
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    if (useSupabaseAuth) {
      const { data, error } = await supabase.auth.getUser()
      if (error || !data.user) return null
      return null // useAuth maneja el estado
    }
  } catch (error) {
    logger.error('auth', 'Error getting user', error)
  }
  return null
}
