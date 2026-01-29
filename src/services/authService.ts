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

/**
 * 🔐 AUTENTICACIÓN PARA ADMINISTRADORES (Email/Password)
 * Ideal para gestión remota y uso de gestores de contraseñas.
 */
export async function adminLoginWithEmail(email: string, password: string): Promise<LoginResult> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    
    const user = await mapSupabaseUser(data.user)
    if (!user) return { success: false, error: 'Usuario no vinculado en base de datos' }
    
    if (user.role !== 'admin') {
      await supabase.auth.signOut()
      return { success: false, error: 'Acceso restringido a Administradores' }
    }

    return { success: true, user, token: data.session?.access_token }
  } catch (error: any) {
    logger.error('auth', '❌ Error en login de admin', error)
    return { success: false, error: error.message }
  }
}

/**
 * 🌐 AUTENTICACIÓN OAUTH (Google / Apple)
 * Inicia el flujo de redirección. El resultado se procesa en el callback.
 */
export async function adminLoginWithOAuth(provider: 'google' | 'apple') {
  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
      queryParams: {
        access_type: 'offline',
        prompt: 'select_account',
      },
    }
  })
  if (error) throw error
}

/**
 * 🚀 BOOTSTRAP: Crea el primer administrador del sistema (Staging/Prod)
 * Solo funcionará si la tabla de usuarios está vacía.
 */
export async function setupInitialAdmin(email: string, pin: string, name: string): Promise<LoginResult> {
  try {
    // 1. Verificar si ya existen usuarios para evitar duplicidad
    const { count } = await supabase.from('users').select('*', { count: 'exact', head: true })
    if (count && count > 0) throw new Error('El sistema ya tiene usuarios configurados.')

    // 2. Crear usuario en Supabase Auth
    const { data, error } = await supabase.auth.signUp({ 
      email, 
      password: pin,
      options: { data: { full_name: name } }
    })
    if (error) throw error
    if (!data.user) throw new Error('Error al crear cuenta de autenticación')

    // 3. Crear perfil en la tabla pública
    const { error: dbError } = await supabase.from('users').insert([{
      id: data.user.id,
      name,
      role: 'admin',
      pin, // El admin también puede usar el PIN Pad si está en el local
      active: true
    }])
    if (dbError) throw dbError

    return { success: true, token: data.session?.access_token }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Helper para mapear el usuario de Auth a nuestro modelo de dominio
 */
async function mapSupabaseUser(supabaseUser: any): Promise<User | null> {
  if (!supabaseUser) return null
  
  const { data, error } = await supabase.from('users').select('*').eq('id', supabaseUser.id).single()
  if (error || !data) return null
  return {
    id: data.id,
    username: data.name,
    role: data.role,
    pin: data.pin || '',
    active: data.active,
    createdAt: data.created_at ? new Date(data.created_at) : new Date(),
    devices: []
  }
}

export async function authLogin(pin: string): Promise<LoginResult> {
  try {
    logger.info('auth', '🔐 Iniciando autenticación')
    
    if (useSupabaseAuth) {
      // Opción 1: Supabase Auth + JWT Nativo
      logger.info('auth', '🔍 Autenticando con Supabase Auth...')
      
      // 1. Identificar al usuario por su PIN para obtener su nombre real
      const { data: users, error: searchError } = await supabase
        .from('users')
        .select('*')
        .eq('pin', pin)
        .eq('active', true)
        .limit(1)

      if (searchError || !users || users.length === 0) {
        logger.error('auth', '❌ PIN incorrecto o usuario no encontrado')
        return { success: false, error: 'PIN incorrecto o usuario no activo' }
      }

      const userData = users[0]
      
      // 2. Login real en Supabase Auth (Email generado + PIN como password)
      const authEmail = `${userData.name.toLowerCase().replace(/\s+/g, '')}@reisbloc.pos`
      
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: authEmail,
        password: pin
      })

      if (authError) {
        logger.error('auth', '❌ Error en Supabase Auth', { error: authError.message })
        return { success: false, error: 'Error de sesión oficial' }
      }

      const user = await mapSupabaseUser(authData.user)
      if (!user) return { success: false, error: 'Perfil de usuario no encontrado en la base de datos' }

      logger.info('auth', '✅ Login exitoso con Supabase Auth', { username: user.username })
      return { success: true, user, token: authData.session?.access_token }
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
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error || !session?.user) return null
      return await mapSupabaseUser(session.user)
    }
  } catch (error) {
    logger.error('auth', 'Error getting user', error)
  }
  return null
}

/**
 * Obtiene la sesión actual de forma asíncrona
 */
export async function getSession() {
  const { data, error } = await supabase.auth.getSession()
  if (error) throw error
  return data.session
}
