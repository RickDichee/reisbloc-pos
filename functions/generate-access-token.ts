
const PRIVATE_KEY_PEM = Deno.env.get('JWT_PRIVATE_KEY')
const JWT_KID = Deno.env.get('JWT_KID')
const JWT_EXPIRY = 24 * 60 * 60

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7?target=deno'
if (!PRIVATE_KEY_PEM || !JWT_KID) {
  throw new Error('JWT_PRIVATE_KEY or JWT_KID is not set in Edge Function environment')
}

async function importPrivateKey(pem: string): Promise<CryptoKey> {
  const pemHeader = "-----BEGIN PRIVATE KEY-----"
  const pemFooter = "-----END PRIVATE KEY-----"
  const pemContents = pem.replace(pemHeader, "").replace(pemFooter, "").replace(/\s/g, "")
  const binaryDer = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0))
  return await crypto.subtle.importKey(
    "pkcs8",
    binaryDer.buffer,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"]
  )
}

function base64url(input: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(input)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

function base64url(input: Uint8Array): string {
  return btoa(String.fromCharCode(...input))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
    alg: "ES256",
    typ: "JWT",
    kid: JWT_KID
  }
  const payload = {
    sub: userId,
    role,
    deviceId,
    iat: now,
    exp: now + JWT_EXPIRY
  }
  const enc = (obj: object) => base64url(new TextEncoder().encode(JSON.stringify(obj)))
  const unsignedToken = `${enc(header)}.${enc(payload)}`
  const key = await importPrivateKey(PRIVATE_KEY_PEM)
  const sig = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    key,
    new TextEncoder().encode(unsignedToken)
  )
  const signature = base64url(sig)
  return `${unsignedToken}.${signature}`
}


import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

function parseJwt(token: string) {
  const [header, payload, signature] = token.split('.')
  if (!payload) return null
  try {
    return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))
  } catch {
    return null
  }
}

serve(async (req) => {
serve(async (req: Request) => {

  try {
    // Validar JWT recibido en el header Authorization
    const authHeader = req.headers.get('authorization') || req.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Missing or invalid Authorization header' }), { status: 401, headers: { 'Content-Type': 'application/json' } })
    }
    const token = authHeader.replace('Bearer ', '')
    const claims = parseJwt(token)
    if (!claims || !claims.userId || !claims.role) {
      return new Response(JSON.stringify({ error: 'Invalid JWT claims' }), { status: 401, headers: { 'Content-Type': 'application/json' } })
    }

    // Verificar en la base de datos que el usuario existe y tiene rol admin
    const { data: user, error } = await supabase
      .from('users')
      .select('id, role')
      .eq('id', claims.userId)
      .single()

    if (error || !user || user.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Unauthorized: user is not admin' }), { status: 403, headers: { 'Content-Type': 'application/json' } })
    }

    // Obtener datos del body para el nuevo token
    const { userId, role, deviceId } = await req.json()
    if (!userId || !role || !deviceId) return new Response(JSON.stringify({ error: 'Missing fields' }), { status: 400, headers: { 'Content-Type': 'application/json' } })

    const accessToken = await generateAccessToken(userId, role, deviceId)
    return new Response(JSON.stringify({ accessToken, expiresIn: JWT_EXPIRY, tokenType: 'Bearer' }), { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } })
  } catch (error) {
    console.error('Error:', error)
    return new Response(JSON.stringify({ error: 'Internal error' }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
})