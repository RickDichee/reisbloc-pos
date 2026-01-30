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
import { Capacitor } from '@capacitor/core'
import { Preferences } from '@capacitor/preferences'
import { getStoredToken } from '@/services/jwtService'

// Supabase configuration
const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL || '').trim()
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim()

// Detectamos staging si estamos en una URL de preview de Vercel o si la variable está explícita
const getEnvironment = () => {
  // Si Vite ya nos dice que es producción, confiamos en ello
  if (import.meta.env.MODE === 'production') return 'production';

  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
  const envVar = import.meta.env.VITE_ENVIRONMENT?.toLowerCase();

  if (envVar) return envVar;
  if (hostname.includes('-preview') || hostname.includes('staging') || hostname.includes('vercel.app')) return 'staging';
  return import.meta.env.MODE;
};

const environment = getEnvironment();

// Verificar que las variables estén configuradas
if (!supabaseUrl || !supabaseAnonKey) {
  const missing = !supabaseUrl ? 'VITE_SUPABASE_URL' : 'VITE_SUPABASE_ANON_KEY'
  console.error(`❌ CRÍTICO [${environment.toUpperCase()}]: Falta la variable ${missing}.`)
  console.info(`💡 Tip: Revisa tu archivo .env.${environment === 'development' ? 'local' : environment} o las variables en Vercel.`)
} else {
  // Verificación de seguridad de la llave (Solo en desarrollo/staging)
  if (environment !== 'production') {
    const isServiceKey = supabaseAnonKey.includes('service_role');
    const statusEmoji = isServiceKey ? '⚠️ PELIGRO: USANDO SERVICE_ROLE' : '✅';
    
    // Log informativo premium con estilo para la consola
    console.log(
      `%c🌐 Reisbloc POS %c ${statusEmoji} ${environment.toUpperCase()} %c URL: ${supabaseUrl}`,
      'background: #4f46e5; color: white; padding: 2px 5px; border-radius: 3px;',
      'color: #4f46e5; font-weight: bold;',
      'color: #666; font-style: italic;'
    )
  }
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: Capacitor.isNativePlatform() ? {
      getItem: async (key) => {
        const { value } = await Preferences.get({ key });
        return value;
      },
      setItem: async (key, value) => {
        await Preferences.set({ key, value });
      },
      removeItem: async (key) => {
        await Preferences.remove({ key });
      },
    } : undefined
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
    if (!isSupabaseAvailable()) return;

    if (!token) {
      supabase.realtime.setAuth(null);
      await supabase.auth.signOut();
      return
    }

    // Aplicar token en Realtime y Functions
    supabase.realtime.setAuth(token)
    supabase.functions.setAuth?.(token)

    // Establecer sesión para que todas las llamadas HTTP usen el JWT
    // Esto actualiza automáticamente los encabezados de autorización
    // Nota: Si es un JWT externo (Edge Functions), el refresh_token se usa como placeholder
    const { error } = await supabase.auth.setSession({
      access_token: token,
      refresh_token: token
    });

    if (error) console.warn('⚠️ Supabase setSession warning:', error.message)
  } catch (error) {
    console.error('⚠️ Error setting Supabase auth token', error)
  }
}

// Feature flags para migración gradual
export const SUPABASE_FEATURES = {
  AUTH_ENABLED: import.meta.env.VITE_SUPABASE_AUTH_ENABLED !== 'false',
  DATABASE_ENABLED: import.meta.env.VITE_SUPABASE_DB_ENABLED !== 'false',
  STORAGE_ENABLED: import.meta.env.VITE_SUPABASE_STORAGE_ENABLED !== 'false'
}

// Helper para verificar si Supabase está disponible
export const isSupabaseAvailable = (): boolean => {
  return !!(supabaseUrl && supabaseAnonKey)
}

export default supabase
