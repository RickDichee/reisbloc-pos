/**
 * Reisbloc POS - Edge Function: Generate Access Token
 * Genera un JWT firmado para que el frontend pueda autenticarse con RLS.
 * 
 * Despliegue:
 * supabase functions deploy generate-access-token --project-ref nmovxyaibnixvxtepbod
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const JWT_SECRET = Deno.env.get('JWT_SECRET') || 'dev-secret-change-in-production';
const JWT_EXPIRY = 24 * 60 * 60;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-application',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function encodeBase64Url(input: string | Uint8Array): string {
  const binary = typeof input === 'string' ? new TextEncoder().encode(input) : input;
  const base64 = btoa(String.fromCharCode(...binary));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

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
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(JWT_SECRET), {
    name: 'HMAC',
    hash: 'SHA-256'
  }, false, ['sign']);

  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
  const signature = encodeBase64Url(new Uint8Array(sig));
  return `${message}.${signature}`;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders, status: 200 });
  }

  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const body = await req.json().catch(() => null);
    if (!body) {
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const userId = body.userId || body.user_id;
    const role = body.role;
    const deviceId = body.deviceId || body.device_id;

    if (!userId || !role || !deviceId) {
      return new Response(JSON.stringify({ error: 'Missing fields', received: body }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`[AUTH] Solicitud de token para usuario: ${userId}, rol: ${role}`);

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