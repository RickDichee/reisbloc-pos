/**
 * 🛑 ¡ATENCIÓN! ARCHIVO CRÍTICO DE SEGURIDAD 🛑
 * ---------------------------------------------------------
 * ESTA FUNCIÓN GENERA LOS TOKENS DE ACCESO PARA EL SISTEMA.
 * CUALQUIER CAMBIO AQUÍ PUEDE BLOQUEAR EL ACCESO A TODO EL POS.
 * * ESTADO: FUNCIONAL Y VALIDADO (FEBRERO 2026)
 * PUNTO DE RESTAURACIÓN: v3.0.0-stable-auth
 * ---------------------------------------------------------
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const JWT_SECRET = Deno.env.get('JWT_SECRET') || 'dev-secret-change-in-production';
const JWT_EXPIRY = 24 * 60 * 60; // 24 horas

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-application',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

/**
 * Utilidad para codificar en Base64Url (estándar JWT)
 */
function encodeBase64Url(input: string | Uint8Array): string {
  const binary = typeof input === 'string' ? new TextEncoder().encode(input) : input;
  const base64 = btoa(String.fromCharCode(...binary));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

/**
 * Genera un token firmado manualmente usando Web Crypto API
 */
async function generateAccessToken(userId: string, role: string, deviceId: string) {
  const header = encodeBase64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const now = Math.floor(Date.now() / 1000);
  
  const claims = encodeBase64Url(JSON.stringify({
    sub: userId,
    role,
    deviceId,
    iat: now,
    exp: now + JWT_EXPIRY
  }));

  const message = `${header}.${claims}`;
  const key = await crypto.subtle.importKey(
    'raw', 
    new TextEncoder().encode(JWT_SECRET), 
    { name: 'HMAC', hash: 'SHA-256' }, 
    false, 
    ['sign']
  );

  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
  const signature = encodeBase64Url(new Uint8Array(sig));
  
  return `${message}.${signature}`;
}

serve(async (req: Request) => {
  // 1. Manejo de CORS (Preflight)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders, status: 200 });
  }

  try {
    // 2. Extracción y validación del Body
    const body = req.method === 'POST' 
      ? await req.json().catch((e) => ({ _error: e.message })) 
      : null;
    
    if (!body || body._error) {
      return new Response(JSON.stringify({ 
        error: 'Invalid JSON body', 
        details: body?._error 
      }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }



    // 3. Mapeo de campos con fallback para el arranque
    const userId = body.userId || body.user_id;
    const role = body.role;
    // Si deviceId es null, undefined o vacío, usa 'system-init'
    const deviceId = body.deviceId || body.device_id || 'system-init';

    // 4. Validación de campos críticos
    if (!userId || !role) {
      console.error(`[AUTH] Error: Faltan campos. User: ${!!userId}, Role: ${!!role}`);
      return new Response(JSON.stringify({ 
        error: 'Missing required fields',
        received: { userId: !!userId, role: !!role }
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`[AUTH] Generando token: Usuario=${userId}, Rol=${role}`);

    // 5. Generación del Token
    const accessToken = await generateAccessToken(userId, role, deviceId);
    
    return new Response(JSON.stringify({
      accessToken,
      expiresIn: JWT_EXPIRY,
      tokenType: 'Bearer'
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Edge Function Error:', error);
    return new Response(JSON.stringify({
      error: 'Internal error',
      details: error instanceof Error ? error.message : String(error)
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});