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

// Configuración de Supabase con detección de entorno robusta
const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim()
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim()

// Detectamos staging si estamos en una URL de preview de Vercel o si la variable está explícita
const getEnvironment = () => {
  if (import.meta.env.VITE_ENVIRONMENT) return import.meta.env.VITE_ENVIRONMENT;
  if (typeof window !== 'undefined' && window.location.hostname.includes('-preview')) return 'staging-preview';
  if (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')) return 'staging';
  return import.meta.env.MODE;
};

const environment = getEnvironment();

// Verificar que las variables estén configuradas
if (!supabaseUrl || !supabaseAnonKey) {
  const missing = !supabaseUrl ? 'VITE_SUPABASE_URL' : 'VITE_SUPABASE_ANON_KEY'
  console.error(`❌ CRÍTICO [${environment.toUpperCase()}]: Falta la variable ${missing}.`)
  console.info(`💡 Tip: Revisa tu archivo .env.${environment === 'development' ? 'local' : environment} o las variables en Vercel.`)
} else {
  // Log informativo premium con estilo para la consola
  console.log(`%c🌐 Reisbloc POS %c Conectado a: ${environment.toUpperCase()} %c URL: ${supabaseUrl.substring(0, 15)}...`, 'background: #4f46e5; color: white; padding: 2px 5px; border-radius: 3px;', 'color: #4f46e5; font-weight: bold;', 'color: #666; font-style: italic;')
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
  AUTH_ENABLED: import.meta.env.VITE_SUPABASE_AUTH_ENABLED === 'true',
  DATABASE_ENABLED: import.meta.env.VITE_SUPABASE_DB_ENABLED === 'true',
  STORAGE_ENABLED: import.meta.env.VITE_SUPABASE_STORAGE_ENABLED === 'true'
}

// Helper para verificar si Supabase está disponible
export const isSupabaseAvailable = (): boolean => {
  return !!(supabaseUrl && supabaseAnonKey)
}

export default supabase
