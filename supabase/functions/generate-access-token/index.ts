import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const JWT_SECRET = Deno.env.get('JWT_SECRET') || 'dev-secret-change-in-production';
const JWT_EXPIRY = 24 * 60 * 60;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { userId, role, deviceId } = await req.json();

    if (!userId || !role || !deviceId) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const accessToken = await generateAccessToken(userId, role, deviceId);
    console.log(`Token generado exitosamente para: ${userId}`);

    return new Response(
      JSON.stringify({ accessToken, tokenType: 'Bearer' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
