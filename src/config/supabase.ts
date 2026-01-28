/**
 * Reisbloc POS - Sistema POS Profesional
 * Copyright (C) 2026 Reisbloc Lab
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import { createClient } from '@supabase/supabase-js'
import { getStoredToken } from '@/services/jwtService'

// Supabase configuration

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim()
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim()

// Verificar que las variables estén configuradas
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ CRÍTICO: Supabase no está configurado. Verifica VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en tu .env.local o Vercel.')
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'x-application': 'reisbloc-pos'
    }
  }
})

// Interceptor para agregar JWT personalizado a cada request
// Esto permite que RLS valide el token
supabase.realtime.setAuth(getStoredToken()?.accessToken || null)

// Actualizar token cuando cambie
export async function setAuthToken(token: string | null) {
  try {
    if (!token) {
      supabase.realtime.setAuth(null)
      await supabase.auth.signOut()
      return
    }

    // Aplicar token en Realtime y Functions
    supabase.realtime.setAuth(token)
    supabase.functions.setAuth?.(token)

    // Establecer sesión para que todas las llamadas HTTP usen el JWT
    await supabase.auth.setSession({
      access_token: token,
      refresh_token: token
    })
  } catch (error) {
    console.error('⚠️ Error setting Supabase auth token', error)
  }
}

// Feature flags para migración gradual
export const SUPABASE_FEATURES = {
  AUTH_ENABLED: true,
  DATABASE_ENABLED: true,
  STORAGE_ENABLED: true
}

// Helper para verificar si Supabase está disponible
export const isSupabaseAvailable = (): boolean => {
  return !!(supabaseUrl && supabaseAnonKey)
}

export default supabase
