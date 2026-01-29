/**
 * 🛑 ¡ATENCIÓN! ARCHIVO CRÍTICO DE CONFIGURACIÓN 🛑
 * ---------------------------------------------------------
 * ESTE ARCHIVO ES FUNDAMENTAL PARA LA CONEXIÓN CON SUPABASE.
 * NO MODIFICAR SIN PRUEBAS EXHAUSTIVAS EN STAGING.
 * 
 * ESTADO: FUNCIONAL Y VALIDADO (FEBRERO 2026)
 * PUNTO DE RESTAURACIÓN: v3.0.0-stable-auth
 * ---------------------------------------------------------
 */
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

// Configuración de Supabase
const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || 'https://missing-project.supabase.co').trim()
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || 'missing-key').trim()

// Detectamos staging si estamos en una URL de preview de Vercel o si la variable está explícita
const getEnvironment = () => {
  if (import.meta.env.VITE_ENVIRONMENT) return import.meta.env.VITE_ENVIRONMENT.toLowerCase();
  if (typeof window !== 'undefined' && window.location.hostname.includes('-preview')) return 'staging';
  if (typeof window !== 'undefined' && (window.location.hostname.includes('vercel.app') || window.location.hostname.includes('staging'))) return 'staging';
  return import.meta.env.MODE;
};

const environment = getEnvironment();

// Verificar que las variables estén configuradas
if (supabaseUrl.includes('missing') || supabaseAnonKey.includes('missing')) {
  const missing = supabaseUrl.includes('missing') ? 'VITE_SUPABASE_URL' : 'VITE_SUPABASE_ANON_KEY'
  console.error(`❌ CRÍTICO [${environment.toUpperCase()}]: Falta la variable ${missing}. Revisa Vercel Settings.`)
  console.info(`💡 Tip: Revisa tu archivo .env.${environment === 'development' ? 'local' : environment} o las variables en Vercel.`)
} else {
  // Verificación de seguridad de la llave
  const isServiceKey = supabaseAnonKey.includes('service_role');
  const statusEmoji = isServiceKey ? '⚠️ PELIGRO: USANDO SERVICE_ROLE' : '✅';
  
  // Log informativo premium con estilo para la consola
  console.log(`%c🌐 Reisbloc POS %c ${statusEmoji} ${environment.toUpperCase()} %c ${supabaseUrl.substring(0, 25)}...`, 'background: #4f46e5; color: white; padding: 2px 5px; border-radius: 3px;', 'color: #4f46e5; font-weight: bold;', 'color: #666; font-style: italic;')
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

// Inicializar el estado de autenticación si existe un token guardado
const initialToken = getStoredToken()?.accessToken;
if (initialToken && initialToken.split('.').length === 3) {
  // Solo aplicamos el token si parece un JWT válido (3 partes separadas por puntos)
  supabase.functions.setAuth(initialToken);
  // Establecemos la sesión inicial para que las políticas RLS funcionen desde el primer render
  void supabase.auth.setSession({
    access_token: initialToken,
    refresh_token: initialToken
  });
}

// Actualizar token cuando cambie
export async function setAuthToken(token: string | null) {
  try {
    if (!token) {
      await supabase.auth.signOut()
      return
    }

    // Aplicar token a las llamadas de Edge Functions
    supabase.functions.setAuth(token)

    // Establecer sesión para que todas las llamadas HTTP usen el JWT
    // Esto actualiza automáticamente los encabezados de autorización
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
